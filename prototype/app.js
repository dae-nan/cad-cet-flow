const SAMPLE_DATA = window.SAMPLE_HIERARCHY_DATA || {
  userProfile: { name: "User", cluster: "", countries: [] },
  groupCads: [],
  countryCads: [],
  cets: [],
  sandboxes: []
};

const FALLBACK_DATA = SAMPLE_DATA;
const CAD_SECTIONS = [
  { id: "cad-overview", label: "Overview" },
  { id: "cad-basic", label: "Basic Details" },
  { id: "cad-summary", label: "Summary" },
  { id: "cad-strategy", label: "Strategy" },
  { id: "cad-portfolio", label: "Portfolio Details" },
  { id: "cad-kac", label: "Key Acceptance Criteria" },
  { id: "cad-appendix", label: "Appendix" },
  { id: "cad-attachments", label: "Attachments" }
];
const CET_SECTIONS = [
  { id: "cet-overview", label: "Overview" },
  { id: "cet-parameters", label: "Parameters" },
  { id: "cet-triggers", label: "Triggers & Caps" },
  { id: "cet-risk", label: "Risk / Exceptions" },
  { id: "cet-approvals", label: "Approvals" }
];
const SANDBOX_SECTIONS = [
  { id: "sbx-overview", label: "Overview" },
  { id: "sbx-scope", label: "Scope" },
  { id: "sbx-guardrails", label: "Guardrails" },
  { id: "sbx-evidence", label: "Evidence" }
];

const state = {
  data: null,
  loadWarning: "",
  route: { view: "home" },
  searchTerm: "",
  filters: {
    myDocs: false,
    product: [],
    clientSegment: [],
    cluster: "",
    country: []
  },
  homeType: "group",
  homeStatus: "Active",
  portfolioType: "all",
  quickView: "none",
  inboxScope: "my",
  inboxStatus: "all",
  sorters: {
    home: [],
    inbox: [],
    portfolio: [
      { key: "type", dir: "asc" },
      { key: "country", dir: "asc" },
      { key: "clientSegment", dir: "asc" },
      { key: "product", dir: "asc" },
      { key: "name", dir: "asc" }
    ],
    groupDetail: [],
    countryDetail: []
  },
  visibleColumns: {
    home: { legalEntity: false, id: false },
    inbox: { legalEntity: false, id: false },
    portfolio: { legalEntity: false, id: false, owner: false, type: false },
    groupDetail: { legalEntity: false, id: false },
    countryDetail: { legalEntity: false, id: false }
  },
  portfolioColumnOrder: [],
  openColumnMenu: "",
  openHelpMenu: false,
  expandedGroups: new Set(),
  expandedCountries: new Set(),
  hierarchyInitialized: true,
  activeSectionId: "",
  sectionObserver: null,
  lastRouteView: "home",
  mobileSectionsOpen: false,
  mobileTraceOpen: true,
  issueStore: {
    issues: [],
    summary: { blockers: 0, errors: 0, warnings: 0, total: 0 }
  },
  rightPanel: {
    isOpen: false,
    activeFilter: "all",
    resolvedBannerUntil: 0
  },
  previousIssueCount: 0
};

const dom = {
  breadcrumb: document.getElementById("breadcrumb"),
  leftPanel: document.getElementById("left-panel"),
  viewRoot: document.getElementById("view-root"),
  actionBar: document.getElementById("action-bar"),
  saveBtn: document.getElementById("save-btn"),
  validateBtn: document.getElementById("validate-btn"),
  submitBtn: document.getElementById("submit-btn"),
  issuePanel: document.getElementById("issue-panel"),
  issueList: document.getElementById("issue-list"),
  issueSummary: document.getElementById("issue-summary"),
  closePanel: document.getElementById("close-panel"),
  resolvedBanner: document.getElementById("resolved-banner"),
  backdrop: document.getElementById("drawer-backdrop"),
  filterButtons: [...document.querySelectorAll(".filter")],
  appShell: document.getElementById("app-shell"),
  floatMenu: document.getElementById("create-float-menu"),
  helpMenu: document.getElementById("help-float-menu"),
  createFab: document.getElementById("create-fab"),
  helpFab: document.getElementById("help-fab"),
  backTopFab: document.getElementById("backtop-fab")
};

const PATH = {
  home: "#/home",
  inbox: "#/inbox",
  portfolio: "#/portfolio",
  group: (groupCadId) => `#/cad/${groupCadId}`,
  country: (groupCadId, country, countryCadId) =>
    `#/cad/${groupCadId}/${encodeURIComponent(country.toLowerCase())}/${countryCadId}`,
  detail: (groupCadId, country, countryCadId, childId) =>
    `#/cad/${groupCadId}/${encodeURIComponent(country.toLowerCase())}/${countryCadId}/${childId}`
};

function uniqueValues(rows, key) {
  return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();
}

function filterValues(key) {
  const v = state.filters[key];
  if (Array.isArray(v)) return v;
  if (v === "" || v == null) return [];
  return [v];
}

function applyCommonFilters(rows, opts = {}) {
  const term = state.searchTerm.trim().toLowerCase();
  const productFilters = filterValues("product");
  const segmentFilters = filterValues("clientSegment");
  const countryFilters = filterValues("country");
  return rows.filter((row) => {
    const myDocsActive = state.filters.myDocs || state.quickView === "mydocs";
    if (myDocsActive) {
      const p = state.data.userProfile;
      if (row.cluster !== p.cluster && !(p.countries || []).includes(row.country)) return false;
    }
    if (state.quickView === "governancealerts") {
      const util = Number(row.exposure) / Math.max(1, Number(row.cap || 0));
      if (!Number.isFinite(util) || util < 0.8) return false;
    }
    if (productFilters.length && !productFilters.includes(row.product)) return false;
    if (segmentFilters.length && !segmentFilters.includes(row.clientSegment)) return false;
    if (state.filters.cluster && row.cluster !== state.filters.cluster) return false;
    if (countryFilters.length && !countryFilters.includes(row.country)) return false;
    if (opts.ignoreSearch || !term) return true;

    const haystack = [row.id, row.name, row.country, row.owner, row.product, row.clientSegment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

function isMyScopeRow(row) {
  const p = state.data.userProfile;
  if (!p) return false;
  return row.cluster === p.cluster || (p.countries || []).includes(row.country);
}

function isAssignedToMeRow(row) {
  return isMyScopeRow(row) || row.status === "In Flight";
}

function teamScopeProducts() {
  const countries = new Set(state.data.userProfile?.countries || []);
  const products = new Set();
  [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ].forEach((row) => {
    if (!countries.size || countries.has(row.country)) products.add(row.product);
  });
  return [...products];
}

function isAssignedToTeamRow(row) {
  const countries = new Set(state.data.userProfile?.countries || []);
  const products = teamScopeProducts();
  const countryMatch = countries.size === 0 || countries.has(row.country);
  const productMatch = products.length === 0 || products.includes(row.product);
  return countryMatch && productMatch;
}

function inboxStatusFor(row) {
  if (row.status === "Active") return "Draft";
  return row.status;
}

function inboxRows() {
  const allDocs = [
    ...state.data.groupCads.map((x) => ({ type: "GROUP", ...x })),
    ...state.data.countryCads.map((x) => ({ type: "COUNTRY", ...x })),
    ...state.data.cets.map((x) => ({ type: "CET", ...x })),
    ...state.data.sandboxes.map((x) => ({ type: "SANDBOX", ...x }))
  ];
  return allDocs
    .filter((row) => (state.inboxScope === "my" ? isAssignedToMeRow(row) : isAssignedToTeamRow(row)))
    .filter((row) => state.inboxStatus === "all" || inboxStatusFor(row) === state.inboxStatus);
}

function navIcon(name) {
  const icons = {
    menu: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M160 288h704v64H160zm0 192h704v64H160zm0 192h704v64H160z"/></svg>',
    home: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 170L106 506h86v348h256V640h128v214h256V506h86z"/></svg>',
    group: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M128 160h320v320H128zm448 0h320v320H576zM128 544h320v320H128zm448 0h320v320H576z"/></svg>',
    country: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 96a416 416 0 100 832 416 416 0 000-832zm-43 78c-42 50-72 128-82 222H220c33-101 124-181 249-222zm-96 300c8 98 37 185 79 244H250c-31-65-48-139-50-218 0-9 0-17 1-26zm139 346c-31-34-56-81-72-138h144c-16 57-41 104-72 138zm87-198H425c-10-60-15-124-15-190 0-65 5-129 15-188h174c10 59 15 123 15 188 0 66-5 130-15 190zm27 198c31-34 56-81 72-138h144c-16 57-41 104-72 138zm93-198c42-59 71-146 79-244h172c1 9 1 17 1 26-2 79-19 153-50 218zm79-304c-10-94-40-172-82-222 125 41 216 121 249 222z"/></svg>',
    cet: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M320 128h384v96H320zm80 128h224v112l168 288a112 112 0 01-97 168H329a112 112 0 01-97-168l168-288z"/></svg>',
    sandbox: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M128 288l384-160 384 160-384 160zm64 96l320 133 320-133v208L512 752 192 592zm0 272l320 133 320-133v80L512 869 192 736z"/></svg>',
    inbox: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M128 224h768v576H128zm112 112v352h544V336zm48 272h448v80H288z"/></svg>',
    portfolio: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M160 832h704v64H160zM192 576h128v224H192zm256-160h128v384H448zm256-192h128v576H704z"/></svg>',
    filter: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M160 224h704v64H160zm128 256h448v64H288zm128 256h192v64H416z"/></svg>',
    all: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M128 128h320v320H128zm448 0h320v320H576zM128 576h320v320H128zm448 0h320v320H576z"/></svg>',
    mine: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 128a192 192 0 110 384 192 192 0 010-384zm-320 704a320 320 0 01640 0H192z"/></svg>',
    alert: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M480 128h64l288 544H192zm32 640a48 48 0 110 96 48 48 0 010-96zm-32-384h64v224h-64z"/></svg>',
    file: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M256 96h384l192 192v640H256zM576 160v192h192"/></svg>'
  };
  return `<span class="ant-icon">${icons[name] || icons.file}</span>`;
}

function getHomepageSearchSuggestions() {
  const q = state.searchTerm.trim().toLowerCase();
  if (!q || state.route.view !== "home") return [];
  const buckets = [
    { type: "group", label: "Group CADs", rows: applyCommonFilters(state.data.groupCads, { ignoreSearch: true }) },
    { type: "country", label: "Country CADs", rows: applyCommonFilters(state.data.countryCads, { ignoreSearch: true }) },
    { type: "cet", label: "CETs", rows: applyCommonFilters(state.data.cets, { ignoreSearch: true }) },
    { type: "sandbox", label: "Sandboxes", rows: applyCommonFilters(state.data.sandboxes, { ignoreSearch: true }) }
  ];

  return buckets
    .map((bucket) => {
      const rows = bucket.rows
        .filter((row) => {
          const haystack = [row.id, row.name, row.owner, row.country, row.product, row.clientSegment]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
        .slice(0, 4)
        .map((row) => ({ ...row, type: bucket.type }));
      return { ...bucket, rows };
    })
    .filter((bucket) => bucket.rows.length > 0);
}

function renderSearchAutocomplete() {
  const groups = getHomepageSearchSuggestions();
  if (!groups.length) return "";
  return `
    <div class="autocomplete-panel" id="search-autocomplete" role="listbox" aria-label="Search Suggestions">
      ${groups.map((group) => `
        <div class="ac-group">
          <p class="ac-title">${group.label}</p>
          ${group.rows.map((row) => `
            <button class="ac-option" data-ac-value="${row.id}">
              <span><strong>${row.id}</strong> ${row.name}</span>
              <span class="muted">${row.country || "Global"}</span>
            </button>
          `).join("")}
        </div>
      `).join("")}
    </div>`;
}

function parseRoute() {
  const hash = window.location.hash || PATH.home;
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/");

  if (parts[0] === "home") return { view: "home" };
  if (parts[0] === "inbox") return { view: "inbox" };
  if (parts[0] === "portfolio") return { view: "portfolio" };
  if (parts[0] === "cad" && parts.length === 2) {
    return { view: "group", groupCadId: parts[1] };
  }
  if (parts[0] === "cad" && parts.length === 4) {
    return {
      view: "country",
      groupCadId: parts[1],
      country: decodeURIComponent(parts[2]),
      countryCadId: parts[3]
    };
  }
  if (parts[0] === "cad" && parts.length === 5) {
    const childId = parts[4];
    return {
      view: childId.startsWith("SBX-") ? "sandbox" : "cet",
      groupCadId: parts[1],
      country: decodeURIComponent(parts[2]),
      countryCadId: parts[3],
      childId
    };
  }
  return { view: "home" };
}

function getRowsByType(type) {
  if (type === "group") return state.data.groupCads;
  if (type === "country") return state.data.countryCads;
  if (type === "cet") return state.data.cets;
  return state.data.sandboxes;
}

function childCounts(countryCadId) {
  return {
    cets: state.data.cets.filter((c) => c.countryCadId === countryCadId).length,
    sandboxes: state.data.sandboxes.filter((s) => s.countryCadId === countryCadId).length
  };
}

function getGroupById(id) {
  return state.data.groupCads.find((x) => x.id === id);
}

function getCountryCadById(id) {
  return state.data.countryCads.find((x) => x.id === id);
}

function getChildById(id) {
  return state.data.cets.find((x) => x.id === id) || state.data.sandboxes.find((x) => x.id === id);
}

function optionsFor(key) {
  const rows = [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ];
  const selected = filterValues(key);
  return uniqueValues(rows, key)
    .map((v) => `<option value="${v}" ${selected.includes(v) ? "selected" : ""}>${v}</option>`)
    .join("");
}

function renderTagMultiSelect(key, label) {
  const rows = [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ];
  const values = uniqueValues(rows, key);
  const selected = filterValues(key);
  const tagText = selected.length ? selected.map((x) => `<span class="tag-token">${x}</span>`).join("") : `<span class="tag-placeholder">${label}</span>`;
  return `<details class="tag-select">
    <summary class="tag-select-trigger"><span class="tag-values">${tagText}</span><span class="tag-caret">▾</span></summary>
    <div class="tag-select-menu">
      ${values.map((v) => `<label><input type="checkbox" data-filter-key="${key}" data-filter-value="${v}" ${selected.includes(v) ? "checked" : ""}/> ${v}</label>`).join("")}
    </div>
  </details>`;
}

function statusMatch(type, row) {
  if (state.route.view === "portfolio") return true;
  if (state.homeType !== type) return true;
  if (state.homeStatus === "all") return true;
  return row.status === state.homeStatus;
}

function statusTag(status) {
  const cls = status === "Active" || status === "Draft" ? "tag-active" : status === "In Flight" ? "tag-flight" : "tag-done";
  return `<span class="status-tag ${cls}"><span class="status-dot" aria-hidden="true"></span><span class="status-text">${status.toUpperCase()}</span></span>`;
}

function ownerInitials(owner) {
  return String(owner || "NA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join("");
}

function ownerCell(owner) {
  return `<span class="owner-cell"><span class="owner-avatar">${ownerInitials(owner)}</span><span class="owner-name">${owner || "Unassigned"}</span></span>`;
}

function ownerAvatarCell(owner) {
  return `<span class="owner-cell" title="${owner || "Unassigned"}"><span class="owner-avatar">${ownerInitials(owner)}</span></span>`;
}

function typeMeta(type) {
  const t = String(type || "").toUpperCase();
  const map = {
    GROUP: { label: "Group CAD", icon: "group" },
    COUNTRY: { label: "Country CAD", icon: "country" },
    CET: { label: "CET", icon: "cet" },
    SANDBOX: { label: "Sandbox", icon: "sandbox" }
  };
  return map[t] || { label: t || "Type", icon: "file" };
}

function typeIconCell(type, cls = "") {
  const m = typeMeta(type);
  return `<span class="type-icon ${cls}" title="${m.label}">${navIcon(m.icon)}</span>`;
}

function productMeta(product) {
  const map = {
    "Credit Cards": "CC",
    "Personal Loans": "PL",
    "SME Loans": "SME",
    "Business Loans": "BL",
    Mortgage: "MTG",
    "Auto Loans": "AL",
    Overdraft: "OD"
  };
  return { code: map[product] || String(product || "-").split(/\s+/).map((x) => x[0]).join("").slice(0, 3).toUpperCase(), label: product || "-" };
}

function productCell(product) {
  const p = productMeta(product);
  return `<span title="${p.label}">${p.code}</span>`;
}

function countryMeta(country) {
  const map = {
    India: { iso3: "IND", flag: "🇮🇳" },
    Bangladesh: { iso3: "BGD", flag: "🇧🇩" },
    Pakistan: { iso3: "PAK", flag: "🇵🇰" },
    UAE: { iso3: "ARE", flag: "🇦🇪" },
    "Hong Kong": { iso3: "HKG", flag: "🇭🇰" },
    Kenya: { iso3: "KEN", flag: "🇰🇪" },
    Singapore: { iso3: "SGP", flag: "🇸🇬" },
    "Sri Lanka": { iso3: "LKA", flag: "🇱🇰" }
  };
  if (!country || country === "Global") return { iso3: "ALL", flag: "🌐" };
  return map[country] || { iso3: country.slice(0, 3).toUpperCase(), flag: "🏳️" };
}

function countryCell(country) {
  const m = countryMeta(country);
  return `<span class="country-cell" title="${country || "Global"}"><span class="country-flag">${m.flag}</span><span class="country-code">${m.iso3}</span></span>`;
}

function idTag(id) {
  return `<span class="id-tag">${id}</span>`;
}

function legalEntityIsPrimary(row) {
  const le = (row.legalEntity || "").trim();
  if (!le) return true;
  if (row.country === "UAE" && le === "DIFC") return false;
  return !/difc/i.test(le);
}

function legalEntityTag(row) {
  if (legalEntityIsPrimary(row)) return "";
  return `<span class="id-tag legal-tag">${row.legalEntity}</span>`;
}

function rowComparable(row, key) {
  if (key === "type") {
    const order = { GROUP: 1, COUNTRY: 2, CET: 3, SANDBOX: 4 };
    return order[String(row.type || "").toUpperCase()] || 99;
  }
  if (key === "country") return row.country || "Global";
  if (key === "status") return row.status || "";
  if (key === "inboxStatus") return inboxStatusFor(row);
  if (key === "utilization") {
    const exp = Number(row.exposure || 0);
    const lim = Number(row.cap || row.limit || 1);
    return Math.round((exp / Math.max(1, lim)) * 100);
  }
  if (key === "cetsCount" || key === "sandboxesCount") return Number(row[key] || 0);
  if (key === "exposure" || key === "cap" || key === "limit") return Number(row[key] || 0);
  return String(row[key] ?? "").toLowerCase();
}

function sortRows(rows, tableKey) {
  const sorters = state.sorters[tableKey] || [];
  if (!sorters.length) return rows;
  return [...rows].sort((a, b) => {
    for (const sorter of sorters) {
      const av = rowComparable(a, sorter.key);
      const bv = rowComparable(b, sorter.key);
      if (av < bv) return sorter.dir === "asc" ? -1 : 1;
      if (av > bv) return sorter.dir === "asc" ? 1 : -1;
    }
    return 0;
  });
}

function sortMeta(tableKey, key) {
  const sorters = state.sorters[tableKey] || [];
  const idx = sorters.findIndex((x) => x.key === key);
  if (idx < 0) return "";
  const s = sorters[idx];
  return `<span class="sort-meta">${s.dir === "asc" ? "↑" : "↓"}${sorters.length > 1 ? ` ${idx + 1}` : ""}</span>`;
}

function sortableTh(tableKey, key, label, cls = "") {
  return `<th class="${cls}"><button class="th-sort" data-sort-table="${tableKey}" data-sort-key="${key}">${label}${sortMeta(tableKey, key)}</button></th>`;
}

function renderColumnsToggle(tableKey) {
  const cols = state.visibleColumns[tableKey] || {};
  if (tableKey === "portfolio") {
    const options = [
      { key: "owner", label: "Owner" },
      { key: "legalEntity", label: "Legal Entity" },
      { key: "id", label: "ID" }
    ];
    return `
      <div class="columns-wrap">
        <button class="btn secondary small icon-only" title="Add columns" data-toggle-columns="${tableKey}">☰</button>
        <div class="columns-menu ${state.openColumnMenu === tableKey ? "open" : ""}">
          ${options.map((opt) => `<label><input type="checkbox" data-column-table="${tableKey}" data-column-key="${opt.key}" ${cols[opt.key] ? "checked" : ""}/> ${opt.label}</label>`).join("")}
        </div>
      </div>`;
  }
  return `
    <div class="columns-wrap">
      <button class="btn secondary small icon-only" title="Add columns" data-toggle-columns="${tableKey}">☰</button>
      <div class="columns-menu ${state.openColumnMenu === tableKey ? "open" : ""}">
        <label><input type="checkbox" data-column-table="${tableKey}" data-column-key="legalEntity" ${cols.legalEntity ? "checked" : ""}/> Legal Entity</label>
        <label><input type="checkbox" data-column-table="${tableKey}" data-column-key="id" ${cols.id ? "checked" : ""}/> ID</label>
      </div>
    </div>`;
}

function sparkline(row) {
  const history = row.usageHistory || [42, 45, 48, 50, 53, 56];
  const max = Math.max(1, ...history);
  const points = history.map((v, i) => `${(i / Math.max(1, history.length - 1)) * 100},${28 - ((v / max) * 24)}`).join(" ");
  return `<svg class="sparkline" viewBox="0 0 100 28" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

function utilizationPct(row) {
  if (row.id === "GC-APAC-001") return 104;
  if (row.id === "GC-MEA-002") return 89;
  const exp = Number(row.exposure || 0);
  const lim = Number(row.cap || row.limit || 1);
  return Math.round((exp / Math.max(1, lim)) * 100);
}

function utilizationClass(pct) {
  if (pct >= 100) return "danger";
  if (pct >= 85) return "warn";
  return "ok";
}

function utilizationCell(row) {
  const pct = utilizationPct(row);
  const cls = utilizationClass(pct);
  const steps = 5;
  const active = Math.max(0, Math.min(steps, Math.round((pct / 100) * steps)));
  return `<div class="util-wrap ${cls}">
    <div class="util-steps">${new Array(steps).fill(0).map((_, i) => `<span class="util-step ${i < active ? "on" : ""}"></span>`).join("")}</div>
    <span class="util-num">${pct}%</span>
  </div>`;
}

function trendCell(row) {
  let history = row.usageHistory || [42, 45, 48, 50, 53, 56];
  if (row.id && row.id === state.data.groupCads?.[0]?.id) {
    history = [72, 80, 87, 104, 91, 86];
  }
  const lim = Math.max(1, Number(row.cap || row.limit || Math.max(...history)));
  const breaches = [];
  const near = [];
  const bars = history.map((v, i) => {
    const pct = Math.round((Number(v) / lim) * 100);
    const h = Math.max(8, Math.min(26, Math.round((Number(v) / lim) * 26)));
    let cls = "ok";
    if (pct >= 100) {
      cls = "danger";
      breaches.push(`M${i + 1}`);
    } else if (pct >= 85) {
      cls = "warn";
      near.push(`M${i + 1}`);
    }
    return `<span class="trend-bar ${cls}" style="height:${h}px"></span>`;
  }).join("");
  const hint = `${breaches.length ? `Breached: ${breaches.join(", ")}` : "No breach"}${near.length ? ` | Near: ${near.join(", ")}` : ""}`;
  return `<div class="trend-mini" title="${hint}">
    <span class="limit-line"></span>
    <div class="trend-bars">${bars}</div>
  </div>`;
}

function formatMoney(row, value) {
  const num = Number(value || 0);
  if (row.type === "GROUP") return `$${(num / 1000).toFixed(2)} B`;
  return `$${num.toFixed(2)} m`;
}

function openHrefForRow(row, type) {
  if (type === "group") return PATH.group(row.id);
  if (type === "country") return PATH.country(row.groupCadId, row.country, row.id);
  return PATH.detail(row.groupCadId, row.country, row.countryCadId, row.id);
}

function ensureExpandedDefaults() {
  if (state.hierarchyInitialized) return;
  if (state.expandedGroups.size === 0) {
    state.data.groupCads.forEach((g, idx) => {
      if (idx < 2) state.expandedGroups.add(g.id);
    });
  }
  state.hierarchyInitialized = true;
}

function renderHierarchyTable() {
  ensureExpandedDefaults();
  const cols = state.visibleColumns.portfolio;
  const selectedType = state.portfolioType || "all";
  const orderedOptional = state.portfolioColumnOrder.filter((k) => cols[k] && k !== "type");
  const optionalLabel = {
    owner: "Owner",
    legalEntity: "Legal Entity",
    id: "ID"
  };
  const depthForType = (type) => {
    if (type === "GROUP") return 1;
    if (type === "COUNTRY") return 2;
    return 3;
  };
  const optionalCell = (row, _depth, key) => {
    if (key === "owner") return `<td>${ownerAvatarCell(row.owner)}</td>`;
    if (key === "legalEntity") return `<td>${row.legalEntity || "-"}</td>`;
    if (key === "id") return `<td>${row.id}</td>`;
    return "<td></td>";
  };
  const expanderCell = (row, groupId, countryId, expanded) => {
    const depth = depthForType(row.type);
    if (row.type === "GROUP") return `<td class="expander-cell depth-${depth}"><button class="tree-toggle" data-toggle-group="${groupId}">${expanded ? "-" : "+"}</button></td>`;
    if (row.type === "COUNTRY") return `<td class="expander-cell depth-${depth}"><button class="tree-toggle" data-toggle-country="${groupId}::${countryId}">${expanded ? "-" : "+"}</button></td>`;
    return `<td class="expander-cell depth-${depth}"><span class="tree-spacer"></span></td>`;
  };
  const countryWithTag = (row) => `<div class="country-with-tag">${countryCell(row.country || "Global")}${legalEntityTag(row)}</div>`;
  const nameCell = (row, href) => {
    return `<td class="key-col"><div class="name-tree"><a href="${href}">${row.name}</a></div><div class="id-row">${idTag(row.id)}</div></td>`;
  };
  const groupRows = sortRows(applyCommonFilters(state.data.groupCads).filter((g) => statusMatch("group", g)).map((g) => ({ type: "GROUP", ...g })), "portfolio");
  const out = [];
  const colCount = 10 + orderedOptional.length;

  for (const group of groupRows) {
    const countriesAll = sortRows(applyCommonFilters(
      state.data.countryCads.filter((c) => c.groupCadId === group.id)
    ).filter((c) => statusMatch("country", c)).map((c) => ({ type: "COUNTRY", ...c })), "portfolio");

    let countryOutput = "";
    let cetOutput = "";
    let sandboxOutput = "";
    for (const country of countriesAll) {
      const countryKey = `${group.id}::${country.id}`;
      const countryExpanded = state.expandedCountries.has(countryKey);
      const cets = sortRows(applyCommonFilters(state.data.cets.filter((x) => x.countryCadId === country.id)).filter((x) => statusMatch("cet", x)), "portfolio");
      const sbx = sortRows(applyCommonFilters(state.data.sandboxes.filter((x) => x.countryCadId === country.id)).filter((x) => statusMatch("sandbox", x)), "portfolio");
      const leafRowsAll = (rows) => rows.map((x) => `
            <tr class="leaf">
              ${expanderCell(x)}
              <td>${typeIconCell(x.type, `tiny depth-${depthForType(x.type)}`)}</td>
              <td>${countryWithTag(x)}</td>
              <td>${x.clientSegment || "-"}</td>
              <td>${productCell(x.product)}</td>
              ${nameCell(x, PATH.detail(group.id, country.country, country.id, x.id))}
              ${orderedOptional.map((k) => optionalCell(x, 3, k)).join("")}
              <td class="num-cell">${formatMoney(x, x.exposure || Math.round((x.limit || 10) * 0.65))}</td>
              <td class="num-cell">${formatMoney(x, x.cap || x.limit || 10)}</td>
              <td>${utilizationCell(x)}</td>
              <td>${trendCell(x)}</td>
            </tr>`).join("");
      const leafRows = (selectedType === "all" && countryExpanded) ? leafRowsAll([
        ...cets.map((x) => ({ type: "CET", ...x })),
        ...sbx.map((x) => ({ type: "SANDBOX", ...x }))
      ]) : "";

      const countryRow = `
        <tr class="country-row">
          ${expanderCell(country, group.id, country.id, countryExpanded)}
          <td>${typeIconCell(country.type || "COUNTRY", `tiny depth-${depthForType(country.type || "COUNTRY")}`)}</td>
          <td>${countryWithTag(country)}</td>
          <td>${country.clientSegment || "-"}</td>
          <td>${productCell(country.product)}</td>
          ${nameCell(country, PATH.country(group.id, country.country, country.id))}
          ${orderedOptional.map((k) => optionalCell(country, 2, k)).join("")}
          <td class="num-cell">${formatMoney(country, country.exposure || Math.round(((country.cetExposure || 0) + (country.sandboxExposure || 0) || 42)))}</td>
          <td class="num-cell">${formatMoney(country, country.cap || country.limit || 100)}</td>
          <td>${utilizationCell(country)}</td>
          <td>${trendCell(country)}</td>
        </tr>
        ${leafRows}`;
      countryOutput += countryRow;
      cetOutput += leafRowsAll(cets.map((x) => ({ type: "CET", ...x })));
      sandboxOutput += leafRowsAll(sbx.map((x) => ({ type: "SANDBOX", ...x })));
    }

    const groupExpanded = state.expandedGroups.has(group.id);
    const groupRow = `
      <tr class="group-row">
        ${expanderCell(group, group.id, "", groupExpanded)}
        <td>${typeIconCell(group.type || "GROUP", `tiny depth-${depthForType(group.type || "GROUP")}`)}</td>
        <td>${countryWithTag({ country: "Global", legalEntity: group.legalEntity })}</td>
        <td>${group.clientSegment || "-"}</td>
        <td>${productCell(group.product)}</td>
        ${nameCell(group, PATH.group(group.id))}
        ${orderedOptional.map((k) => optionalCell(group, 1, k)).join("")}
        <td class="num-cell">${formatMoney(group, group.exposure || 180)}</td>
        <td class="num-cell">${formatMoney(group, group.cap || 250)}</td>
        <td>${utilizationCell(group)}</td>
        <td>${trendCell(group)}</td>
      </tr>`;
    if (selectedType === "all") out.push(`${groupRow}${groupExpanded ? countryOutput : ""}`);
    if (selectedType === "group") out.push(groupRow);
    if (selectedType === "country") out.push(countryOutput);
    if (selectedType === "cet") out.push(cetOutput);
    if (selectedType === "sandbox") out.push(sandboxOutput);
  }

  return `
    <table class="data-table hierarchy-table">
      <thead><tr>
        <th></th>
        ${sortableTh("portfolio", "type", "Type")}
        ${sortableTh("portfolio", "country", "Country")}
        ${sortableTh("portfolio", "clientSegment", "Segment")}
        ${sortableTh("portfolio", "product", "Product")}
        ${sortableTh("portfolio", "name", "Name", "key-col")}
        ${orderedOptional.map((k) => sortableTh("portfolio", k, optionalLabel[k])).join("")}
        ${sortableTh("portfolio", "exposure", "Exposure (USD)")}
        ${sortableTh("portfolio", "cap", "Limit (USD)")}
        ${sortableTh("portfolio", "utilization", "Utilization")}
        <th>Trend</th></tr></thead>
      <tbody>${out.join("") || `<tr><td colspan="${colCount}">No matching records</td></tr>`}</tbody>
    </table>`;
}

function renderLeftPanel() {
  const r = state.route;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const allDocs = [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ];
  const assignedToMeCount = allDocs.filter((x) => isAssignedToMeRow(x)).length;
  const assignedToTeamCount = allDocs.filter((x) => isAssignedToTeamRow(x)).length;
  const myDraftCount = allDocs.filter((x) => isAssignedToMeRow(x) && inboxStatusFor(x) === "Draft").length;
  const myFlightCount = allDocs.filter((x) => isAssignedToMeRow(x) && inboxStatusFor(x) === "In Flight").length;
  const teamDraftCount = allDocs.filter((x) => isAssignedToTeamRow(x) && inboxStatusFor(x) === "Draft").length;
  const teamFlightCount = allDocs.filter((x) => isAssignedToTeamRow(x) && inboxStatusFor(x) === "In Flight").length;
  const alertCount = state.data.cets.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const entityTitle = (type) => ({ group: "Group CADs", country: "Country CADs", cet: "CETs", sandbox: "Sandboxes" }[type] || type);
  const rowStatus = (type, status, label) => `
    <button class="side-row ${type === "inbox" ? (state.inboxStatus === status ? "on" : "") : (state.homeType === type && state.homeStatus === status ? "on" : "")}" data-home-type="${type}" data-home-status="${status}">
      <span>${navIcon("filter")} ${label}</span>
    </button>`;
  const parentType = (type) => `
    <button class="menu-item with-icon ${state.homeType === type && state.homeStatus === "all" ? "active" : ""}" data-home-type="${type}" data-home-status="all">${navIcon("filter")} <span>${entityTitle(type)}</span></button>`;
  const statusRows = (type) => `
    <div class="side-rows ${state.homeType === type ? "open" : "closed"}">
      ${rowStatus(type, "Active", "ACTIVE")}
      ${rowStatus(type, "In Flight", "IN FLIGHT")}
      ${rowStatus(type, "Completed", "COMPLETED")}
    </div>`;

  const detailSections = (() => {
    if (r.view === "group" || r.view === "country") return CAD_SECTIONS;
    if (r.view === "cet") return CET_SECTIONS;
    if (r.view === "sandbox") return SANDBOX_SECTIONS;
    return [];
  })();

  const group = r.groupCadId ? getGroupById(r.groupCadId) : null;
  const countryCad = r.countryCadId ? getCountryCadById(r.countryCadId) : null;
  const child = r.childId ? getChildById(r.childId) : null;

  const detailExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    <div class="menu-group">
      <a class="menu-item" href="${PATH.home}">Credit Approvals</a>
    </div>
    <div class="menu-group">
      <p class="menu-title">Trace</p>
      ${isMobile ? `<button class="menu-item mobile-toggle" data-mobile-toggle="trace">${state.mobileTraceOpen ? "Hide Trace" : "Show Trace"}</button>` : ""}
      ${(!isMobile || state.mobileTraceOpen) ? `
      <div class="tree-dir">
        ${group ? `<a class="menu-item tree-node level-0 ${r.view === "group" ? "active" : ""}" href="${PATH.group(group.id)}">▾ ${group.name}</a>` : ""}
        ${countryCad ? `<a class="menu-item tree-node level-1 ${r.view === "country" ? "active" : ""}" href="${PATH.country(group.id, countryCad.country, countryCad.id)}">▾ ${countryCad.country}</a>` : ""}
        ${countryCad ? `<a class="menu-item tree-node level-2 ${r.view === "country" ? "active" : ""}" href="${PATH.country(group.id, countryCad.country, countryCad.id)}">${countryCad.name}</a>` : ""}
        ${child ? `<a class="menu-item tree-node level-3 ${(r.view === "cet" || r.view === "sandbox") ? "active" : ""}" href="${PATH.detail(group.id, countryCad.country, countryCad.id, child.id)}">${child.name}</a>` : ""}
      </div>` : ""}
    </div>
    <div class="menu-group">
      <p class="menu-title">Sections</p>
      ${isMobile ? `<button class="menu-item mobile-toggle" data-mobile-toggle="sections">${state.mobileSectionsOpen ? "Hide Sections" : "Show Sections"}</button>` : ""}
      ${(!isMobile || state.mobileSectionsOpen) ? detailSections.map((s) => `<a class="menu-item section-link ${state.activeSectionId === s.id ? "active" : ""}" data-section-id="${s.id}" href="#${s.id}">${s.label}</a>`).join("") : ""}
    </div>`;

  const pagesGroup = `
    <div class="menu-group">
      <p class="menu-title">${navIcon("home")} Pages</p>
      <a class="menu-item with-icon ${r.view === "home" ? "active" : ""}" href="${PATH.home}">${navIcon("home")} <span>Credit Approvals</span></a>
      <a class="menu-item with-icon ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}">${navIcon("inbox")} <span>Inbox</span></a>
      <a class="menu-item with-icon ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}">${navIcon("portfolio")} <span>Portfolio Monitoring</span></a>
    </div>`;

  const homeExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">${navIcon("filter")} Document Filters</p>
      <div class="side-group">${parentType("group")}${statusRows("group")}</div>
      <div class="side-group">${parentType("country")}${statusRows("country")}</div>
      <div class="side-group">${parentType("cet")}${statusRows("cet")}</div>
      <div class="side-group">${parentType("sandbox")}${statusRows("sandbox")}</div>
    </div>
    <div class="menu-group">
      <p class="menu-title">${navIcon("filter")} Action Filters</p>
      <button class="menu-item ${state.quickView === "none" ? "active" : ""}" data-quick-view="none">All Docs</button>
      <button class="menu-item ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs">My Docs</button>
      <button class="menu-item ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts">Governance Alerts <span class="mini-badge warn">${alertCount}</span></button>
    </div>`;

  const inboxExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">${navIcon("filter")} Inbox Filters</p>
      <button class="menu-item ${state.inboxScope === "my" ? "active" : ""}" data-inbox-scope="my">My Inbox <span class="mini-badge">${assignedToMeCount}</span></button>
      <div class="side-rows ${state.inboxScope === "my" ? "open" : "closed"}">
        ${rowStatus("inbox", "Draft", `DRAFT <span class="mini-badge">${myDraftCount}</span>`)}
        ${rowStatus("inbox", "In Flight", `IN FLIGHT <span class="mini-badge">${myFlightCount}</span>`)}
        ${rowStatus("inbox", "Completed", "COMPLETED")}
      </div>
      <button class="menu-item ${state.inboxScope === "team" ? "active" : ""}" data-inbox-scope="team">Team Inbox <span class="mini-badge">${assignedToTeamCount}</span></button>
      <div class="side-rows ${state.inboxScope === "team" ? "open" : "closed"}">
        ${rowStatus("inbox", "Draft", `DRAFT <span class="mini-badge">${teamDraftCount}</span>`)}
        ${rowStatus("inbox", "In Flight", `IN FLIGHT <span class="mini-badge">${teamFlightCount}</span>`)}
        ${rowStatus("inbox", "Completed", "COMPLETED")}
      </div>
      <p class="muted todo-hint">Team inbox is filtered by signed-in profile countries and products.</p>
    </div>`;

  const portfolioExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">${navIcon("filter")} Portfolio Filters</p>
      <button class="menu-item with-icon ${state.portfolioType === "all" ? "active" : ""}" data-portfolio-type="all">${navIcon("all")} <span>All</span></button>
      <button class="menu-item with-icon ${state.portfolioType === "group" ? "active" : ""}" data-portfolio-type="group">${navIcon("group")} <span>Group CAD</span></button>
      <button class="menu-item with-icon ${state.portfolioType === "country" ? "active" : ""}" data-portfolio-type="country">${navIcon("country")} <span>Country CAD</span></button>
      <button class="menu-item with-icon ${state.portfolioType === "cet" ? "active" : ""}" data-portfolio-type="cet">${navIcon("cet")} <span>CET</span></button>
      <button class="menu-item with-icon ${state.portfolioType === "sandbox" ? "active" : ""}" data-portfolio-type="sandbox">${navIcon("sandbox")} <span>Sandbox</span></button>
    </div>`;

  const collapsedHome = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Credit Approvals" data-tooltip="Credit Approvals">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("inbox")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("portfolio")}</a>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.homeType === "group" ? "active" : ""}" data-home-type="group" data-home-status="Active" aria-label="Group CADs" data-tooltip="Group CADs">${navIcon("group")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "country" ? "active" : ""}" data-home-type="country" data-home-status="Active" aria-label="Country CADs" data-tooltip="Country CADs">${navIcon("country")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "cet" ? "active" : ""}" data-home-type="cet" data-home-status="Active" aria-label="CETs" data-tooltip="CETs">${navIcon("cet")}</button>      
      <button class="icon-pill has-tooltip ${state.homeType === "sandbox" ? "active" : ""}" data-home-type="sandbox" data-home-status="Active" aria-label="Sandboxes" data-tooltip="Sandboxes">${navIcon("sandbox")}</button>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.quickView === "none" ? "active" : ""}" data-quick-view="none" aria-label="All Docs" data-tooltip="All Docs">${navIcon("all")}</button>
      <button class="icon-pill has-tooltip ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs" aria-label="My Docs" data-tooltip="My Docs">${navIcon("mine")}</button>
      <button class="icon-pill has-tooltip ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts" aria-label="Governance Alerts" data-tooltip="Governance Alerts">${navIcon("alert")}</button>
      ${r.view !== "home" ? `<span class="icon-pill has-tooltip active" aria-label="Opened document" data-tooltip="Opened document">${navIcon("file")}</span>` : ""}
    </div>`;
  const collapsedMinimal = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Credit Approvals" data-tooltip="Credit Approvals">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("inbox")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("portfolio")}</a>
    </div>`;
  const collapsedPortfolio = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Credit Approvals" data-tooltip="Credit Approvals">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("inbox")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("portfolio")}</a>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.portfolioType === "all" ? "active" : ""}" data-portfolio-type="all" aria-label="All" data-tooltip="All">${navIcon("all")}</button>
      <button class="icon-pill has-tooltip ${state.portfolioType === "group" ? "active" : ""}" data-portfolio-type="group" aria-label="Group CAD" data-tooltip="Group CAD">${navIcon("group")}</button>
      <button class="icon-pill has-tooltip ${state.portfolioType === "country" ? "active" : ""}" data-portfolio-type="country" aria-label="Country CAD" data-tooltip="Country CAD">${navIcon("country")}</button>
      <button class="icon-pill has-tooltip ${state.portfolioType === "cet" ? "active" : ""}" data-portfolio-type="cet" aria-label="CET" data-tooltip="CET">${navIcon("cet")}</button>
      <button class="icon-pill has-tooltip ${state.portfolioType === "sandbox" ? "active" : ""}" data-portfolio-type="sandbox" aria-label="Sandbox" data-tooltip="Sandbox">${navIcon("sandbox")}</button>
    </div>`;

  const isCollapsed = dom.leftPanel.classList.contains("collapsed");
  dom.leftPanel.innerHTML = isCollapsed
    ? (r.view === "home" ? collapsedHome : r.view === "portfolio" ? collapsedPortfolio : collapsedMinimal)
    : (r.view === "home" ? homeExpanded : r.view === "inbox" ? inboxExpanded : r.view === "portfolio" ? portfolioExpanded : detailExpanded);

  const btn = document.getElementById("left-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      dom.leftPanel.classList.toggle("collapsed");
      dom.appShell.classList.toggle("left-collapsed", dom.leftPanel.classList.contains("collapsed"));
      renderLeftPanel();
    });
  }

  dom.leftPanel.querySelectorAll("[data-home-type]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.homeType === "inbox") return;
      state.homeType = el.dataset.homeType;
      state.homeStatus = el.dataset.homeStatus || state.homeStatus;
      if (state.route.view !== "home" && state.route.view !== "portfolio") window.location.hash = PATH.home;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll("[data-quick-view]").forEach((el) => {
    el.addEventListener("click", () => {
      state.quickView = el.dataset.quickView;
      if (state.route.view !== "home") window.location.hash = PATH.home;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll("[data-inbox-scope]").forEach((el) => {
    el.addEventListener("click", () => {
      state.inboxScope = el.dataset.inboxScope;
      state.inboxStatus = "all";
      if (state.route.view !== "inbox") window.location.hash = PATH.inbox;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll(".side-row[data-home-type='inbox']").forEach((el) => {
    el.addEventListener("click", () => {
      state.inboxStatus = el.dataset.homeStatus;
      if (state.route.view !== "inbox") window.location.hash = PATH.inbox;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll("[data-mobile-toggle]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.mobileToggle === "sections") state.mobileSectionsOpen = !state.mobileSectionsOpen;
      if (el.dataset.mobileToggle === "trace") state.mobileTraceOpen = !state.mobileTraceOpen;
      renderLeftPanel();
    });
  });

  dom.leftPanel.querySelectorAll("[data-portfolio-type]").forEach((el) => {
    el.addEventListener("click", () => {
      state.portfolioType = el.dataset.portfolioType;
      state.expandedCountries = new Set();
      state.expandedGroups = new Set();
      state.hierarchyInitialized = true;
      if (state.route.view !== "portfolio") window.location.hash = PATH.portfolio;
      else render();
    });
  });
}

function renderHome() {
  const rows = {
    group: applyCommonFilters(state.data.groupCads),
    country: applyCommonFilters(state.data.countryCads),
    cet: applyCommonFilters(state.data.cets),
    sandbox: applyCommonFilters(state.data.sandboxes)
  };

  const selectedRows = sortRows(
    rows[state.homeType].filter((x) => state.homeStatus === "all" || x.status === state.homeStatus),
    "home"
  );
  const cols = state.visibleColumns.home;

  const selectedTable = selectedRows.map((r) => `<tr>
    <td class="key-col">${r.name}<div>${idTag(r.id)}${legalEntityTag(r)}</div></td>
    ${cols.id ? `<td>${r.id}</td>` : ""}
    ${cols.legalEntity ? `<td>${r.legalEntity || "-"}</td>` : ""}
    <td>${countryCell(r.country)}</td><td>${r.product}</td><td>${r.clientSegment || "-"}</td><td>${statusTag(r.status)}</td><td>${ownerCell(r.owner)}</td><td><a href="${openHrefForRow(r, state.homeType)}">Open</a></td>
  </tr>`).join("");

  const allRows = [...rows.group, ...rows.country, ...rows.cet, ...rows.sandbox];
  const scopedRows = applyCommonFilters(allRows);
  const myScopeCount = scopedRows.length;
  const inFlightCount = scopedRows.filter((x) => x.status === "In Flight").length;
  const governanceCount = rows.cet.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const completedCount = scopedRows.filter((x) => x.status === "Completed").length;
  const statusText = `${state.homeType.toUpperCase()} / ${state.homeStatus.toUpperCase()}`;

  const selectedTableHtml = `
    <section class="card">
      <div class="panel-head">
        <h3>Selected View: ${statusText}</h3>
        ${renderColumnsToggle("home")}
      </div>
      <p class="muted">Filters Applied: ${state.quickView !== "none" ? `Action=${state.quickView}` : "Action=All Docs"}${filterValues("product").length ? ` | Product=${filterValues("product").join(", ")}` : ""}${filterValues("clientSegment").length ? ` | Segment=${filterValues("clientSegment").join(", ")}` : ""}${state.searchTerm ? ` | Search=\"${state.searchTerm}\"` : ""}</p>
      <table class="data-table">
        <thead><tr>
          ${sortableTh("home", "name", "Name", "key-col")}
          ${cols.id ? sortableTh("home", "id", "ID") : ""}
          ${cols.legalEntity ? sortableTh("home", "legalEntity", "Legal Entity") : ""}
          ${sortableTh("home", "country", "Country")}
          ${sortableTh("home", "product", "Product")}
          ${sortableTh("home", "clientSegment", "Segment")}
          ${sortableTh("home", "status", "Status")}
          ${sortableTh("home", "owner", "Owner")}
          <th>Action</th></tr></thead>
        <tbody>${selectedTable || `<tr><td colspan="${7 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No rows</td></tr>`}</tbody>
      </table>
    </section>`;

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Credit Approvals</h2>
        <div class="main-search-row">
          <label for="main-search">Search</label>
        <div class="autocomplete-wrap">
          <input id="main-search" value="${state.searchTerm}" autocomplete="off" placeholder="ID / Name / Owner / Country" />
          ${renderSearchAutocomplete()}
        </div>
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      ${state.loadWarning ? `<p class="warning-note">${state.loadWarning}</p>` : ""}
      <div class="metric-grid">
        <div class="metric"><span>My Scope Docs</span><strong>${myScopeCount}</strong></div>
        <div class="metric"><span>In Flight</span><strong>${inFlightCount}</strong></div>
        <div class="metric"><span>Governance Alerts</span><strong>${governanceCount}</strong></div>
        <div class="metric"><span>Completed</span><strong>${completedCount}</strong></div>
      </div>
    </section>
    ${selectedTableHtml}
  `;
}

function renderInbox() {
  const term = state.searchTerm.trim().toLowerCase();
  const cols = state.visibleColumns.inbox;
  const rows = sortRows(inboxRows().filter((row) => {
    if (!term) return true;
    const haystack = [row.id, row.name, row.owner, row.country, row.product, row.clientSegment].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(term);
  }), "inbox");
  const counts = {
    draft: rows.filter((x) => inboxStatusFor(x) === "Draft").length,
    inflight: rows.filter((x) => inboxStatusFor(x) === "In Flight").length,
    completed: rows.filter((x) => inboxStatusFor(x) === "Completed").length
  };
  const tableRows = rows.map((r) => `<tr>
    <td class="key-col">${r.name}<div>${idTag(r.id)}${legalEntityTag(r)}</div></td>
    <td>${r.type}</td>
    ${cols.id ? `<td>${r.id}</td>` : ""}
    ${cols.legalEntity ? `<td>${r.legalEntity || "-"}</td>` : ""}
    <td>${countryCell(r.country)}</td>
    <td>${r.product}</td>
    <td>${r.clientSegment || "-"}</td>
    <td>${statusTag(inboxStatusFor(r))}</td>
    <td>${ownerCell(r.owner)}</td>
    <td><a href="${openHrefForRow(r, r.type.toLowerCase())}">Open</a></td>
  </tr>`).join("");

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Inbox</h2>
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / Owner / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="metric-grid">
        <div class="metric"><span>Draft</span><strong>${counts.draft}</strong></div>
        <div class="metric"><span>In Flight</span><strong>${counts.inflight}</strong></div>
        <div class="metric"><span>Completed</span><strong>${counts.completed}</strong></div>
        <div class="metric"><span>Total</span><strong>${rows.length}</strong></div>
      </div>
    </section>
    <section class="card">
      <div class="panel-head">
        <h3>${state.inboxScope === "my" ? "My Inbox" : "Team Inbox"} | ${state.inboxStatus === "all" ? "ALL" : state.inboxStatus.toUpperCase()}</h3>
        ${renderColumnsToggle("inbox")}
      </div>
      <table class="data-table">
        <thead><tr>
          ${sortableTh("inbox", "name", "Name", "key-col")}
          ${sortableTh("inbox", "type", "Type")}
          ${cols.id ? sortableTh("inbox", "id", "ID") : ""}
          ${cols.legalEntity ? sortableTh("inbox", "legalEntity", "Legal Entity") : ""}
          ${sortableTh("inbox", "country", "Country")}
          ${sortableTh("inbox", "product", "Product")}
          ${sortableTh("inbox", "clientSegment", "Segment")}
          ${sortableTh("inbox", "inboxStatus", "Status")}
          ${sortableTh("inbox", "owner", "Owner")}
          <th>Action</th></tr></thead>
        <tbody>${tableRows || `<tr><td colspan="${9 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No rows</td></tr>`}</tbody>
      </table>
    </section>
  `;
}

function renderPortfolio() {
  const typeMap = { all: "ALL", group: "GROUP", country: "COUNTRY", cet: "CET", sandbox: "SANDBOX" };
  const statusText = `${typeMap[state.portfolioType] || "ALL"} / ${state.homeStatus.toUpperCase()}`;
  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Portfolio Monitoring</h2>
      <p class="warning-note">Portfolio Monitoring is an experimental feature and currently out of scope.</p>
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / Owner / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="table-filter-row portfolio-filter-row">
        ${renderTagMultiSelect("country", "Country")}
        ${renderTagMultiSelect("clientSegment", "Segment")}
        ${renderTagMultiSelect("product", "Product")}
        <button class="btn secondary small portfolio-clear-btn" data-action="reset-table-filters">Clear</button>
      </div>
    </section>
    <section class="card">
      <div class="panel-head">
        <h3>Selected View: ${statusText}</h3>
        <div class="quick-actions">
          <button class="btn secondary small" data-action="expand-all">Expand All</button>
          <button class="btn secondary small" data-action="collapse-all">Collapse All</button>
          ${renderColumnsToggle("portfolio")}
        </div>
      </div>
      <p class="muted">Filters Applied: Type=${state.homeType.toUpperCase()}${state.homeStatus !== "all" ? ` | Status=${state.homeStatus.toUpperCase()}` : ""}${filterValues("country").length ? ` | Country=${filterValues("country").join(", ")}` : ""}${filterValues("clientSegment").length ? ` | Segment=${filterValues("clientSegment").join(", ")}` : ""}${filterValues("product").length ? ` | Product=${filterValues("product").join(", ")}` : ""}${state.searchTerm ? ` | Search=\"${state.searchTerm}\"` : ""}</p>
      ${renderHierarchyTable()}
    </section>
  `;
}

function renderGroupDetail() {
  const group = state.data.groupCads.find((g) => g.id === state.route.groupCadId);
  if (!group) {
    dom.viewRoot.innerHTML = '<section class="card"><h2>Group CAD not found</h2></section>';
    return;
  }
  const countries = applyCommonFilters(
    state.data.countryCads.filter((c) => c.groupCadId === state.route.groupCadId)
  );

  const cols = state.visibleColumns.groupDetail;
  const rowData = countries.map((c) => {
    const counts = childCounts(c.id);
    return { ...c, cetsCount: counts.cets, sandboxesCount: counts.sandboxes };
  });
  const rows = sortRows(rowData, "groupDetail").map((c) =>
    `<tr><td class="key-col">${c.name}<div>${idTag(c.id)}${legalEntityTag(c)}</div></td>${cols.id ? `<td>${c.id}</td>` : ""}${cols.legalEntity ? `<td>${c.legalEntity || "-"}</td>` : ""}<td>${countryCell(c.country)}</td><td>${c.clientSegment || "-"}</td><td>${statusTag(c.status)}</td><td>${c.cetsCount}</td><td>${c.sandboxesCount}</td><td>${ownerCell(c.owner)}</td><td><a href="${PATH.country(group.id, c.country, c.id)}">Open</a></td></tr>`
  ).join("");

  dom.viewRoot.innerHTML = `
    <section class="card" id="cad-overview">
      <h2>Group CAD Detail</h2>
      <p><strong>${group.id}</strong> - ${group.name}</p>
      <p class="muted">Product ${group.product} | Segment ${group.clientSegment} | Status ${statusTag(group.status)}</p>
    </section>
    <section class="card" id="cad-basic">
      <h3>Country CADs</h3>
      <div class="main-search-row">
        ${renderColumnsToggle("groupDetail")}
      </div>
      <table class="data-table">
        <thead><tr>
          ${sortableTh("groupDetail", "name", "Name", "key-col")}
          ${cols.id ? sortableTh("groupDetail", "id", "ID") : ""}
          ${cols.legalEntity ? sortableTh("groupDetail", "legalEntity", "Legal Entity") : ""}
          ${sortableTh("groupDetail", "country", "Country")}
          ${sortableTh("groupDetail", "clientSegment", "Segment")}
          ${sortableTh("groupDetail", "status", "Status")}
          ${sortableTh("groupDetail", "cetsCount", "CETs")}
          ${sortableTh("groupDetail", "sandboxesCount", "Sandboxes")}
          ${sortableTh("groupDetail", "owner", "Owner")}
          <th>Action</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="${9 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No country CADs</td></tr>`}</tbody>
      </table>
    </section>
    <section class="card" id="cad-summary"><h3>Summary</h3><p class="muted">Programme summary and country rollout status.</p></section>
    <section class="card" id="cad-strategy"><h3>Strategy</h3><p class="muted">Portfolio strategy and constraints.</p></section>
    <section class="card" id="cad-portfolio"><h3>Portfolio Details</h3><p class="muted">Portfolio level limits and segmentation.</p></section>
    <section class="card" id="cad-kac"><h3>Key Acceptance Criteria</h3><p class="muted">KAC checklist.</p></section>
    <section class="card" id="cad-appendix"><h3>Appendix</h3><p class="muted">Supporting notes.</p></section>
    <section class="card" id="cad-attachments"><h3>Attachments</h3><p class="muted">Reference documents.</p></section>`;
}

function renderCountryDetail() {
  const countryCad = state.data.countryCads.find((c) => c.id === state.route.countryCadId);
  if (!countryCad) {
    dom.viewRoot.innerHTML = '<section class="card"><h2>Country CAD not found</h2></section>';
    return;
  }
  const cets = applyCommonFilters(state.data.cets.filter((c) => c.countryCadId === countryCad.id));
  const sandboxes = applyCommonFilters(state.data.sandboxes.filter((s) => s.countryCadId === countryCad.id));
  const successful = state.data.cets.filter((c) => c.countryCadId === countryCad.id && c.result === "Successful");

  const cols = state.visibleColumns.countryDetail;
  dom.viewRoot.innerHTML = `
    <section class="card" id="cad-overview">
      <h2>Country CAD Detail</h2>
      <p><strong>${countryCad.id}</strong> - ${countryCad.name}</p>
      <div class="form-grid">
        <label>Country CAD Summary
          <textarea id="field-country-summary" data-required="true" data-label="Country CAD Summary" rows="3"></textarea>
        </label>
        <label>Interim Change Note
          <textarea id="field-interim-note" rows="3"></textarea>
        </label>
      </div>
      <p class="muted">Successful CETs can be referenced as audit trail for interim changes.</p>
      <ul>${successful.map((s) => `<li>${s.id} - ${s.name}</li>`).join("") || "<li>No successful CET yet</li>"}</ul>
    </section>
    <section class="card" id="cad-basic">
      <h3>Child Tests (parallel tracks)</h3>
      <div class="main-search-row">
        ${renderColumnsToggle("countryDetail")}
      </div>
      <table class="data-table">
        <thead><tr>
          ${sortableTh("countryDetail", "name", "Name", "key-col")}
          ${sortableTh("countryDetail", "type", "Type")}
          ${cols.id ? sortableTh("countryDetail", "id", "ID") : ""}
          ${cols.legalEntity ? sortableTh("countryDetail", "legalEntity", "Legal Entity") : ""}
          ${sortableTh("countryDetail", "clientSegment", "Segment")}
          ${sortableTh("countryDetail", "status", "Status")}
          ${sortableTh("countryDetail", "owner", "Owner")}
          <th>Action</th></tr></thead>
        <tbody>
          ${sortRows([
            ...cets.map((x) => ({ type: "CET", ...x })),
            ...sandboxes.map((x) => ({ type: "SANDBOX", ...x }))
          ], "countryDetail").map((x) => `<tr><td class="key-col">${x.name}<div>${idTag(x.id)}${legalEntityTag(x)}</div></td><td>${x.type}</td>${cols.id ? `<td>${x.id}</td>` : ""}${cols.legalEntity ? `<td>${x.legalEntity || "-"}</td>` : ""}<td>${x.clientSegment || "-"}</td><td>${statusTag(x.status)}</td><td>${ownerCell(x.owner)}</td><td><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">Open</a></td></tr>`).join("") || `<tr><td colspan="${7 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No child tests</td></tr>`}
        </tbody>
      </table>
    </section>
    <section class="card" id="cad-summary"><h3>Summary</h3><p class="muted">Country summary for policy and limits.</p></section>
    <section class="card" id="cad-strategy"><h3>Strategy</h3><p class="muted">Country strategy for execution.</p></section>
    <section class="card" id="cad-portfolio"><h3>Portfolio Details</h3><p class="muted">Portfolio controls and metrics.</p></section>
    <section class="card" id="cad-kac"><h3>Key Acceptance Criteria</h3><p class="muted">Acceptance gates.</p></section>
    <section class="card" id="cad-appendix"><h3>Appendix</h3><p class="muted">Appendix narratives.</p></section>
    <section class="card" id="cad-attachments"><h3>Attachments</h3><p class="muted">Upload and references.</p></section>`;
}

function renderCetOrSandbox() {
  const isSandbox = state.route.view === "sandbox";
  const row = isSandbox
    ? state.data.sandboxes.find((s) => s.id === state.route.childId)
    : state.data.cets.find((c) => c.id === state.route.childId);

  if (!row) {
    dom.viewRoot.innerHTML = '<section class="card"><h2>Not found</h2></section>';
    return;
  }

  if (isSandbox) {
    dom.viewRoot.innerHTML = `
      <section class="card" id="sbx-overview">
        <h2>Sandbox Detail</h2>
        <p><strong>${row.id}</strong> - ${row.name}</p>
        <div class="form-grid">
          <label>Sandbox Objective
            <textarea id="field-sbx-objective" data-required="true" data-label="Sandbox Objective" rows="3"></textarea>
          </label>
          <label>Execution Limit
            <input id="field-sbx-limit" type="number" value="${row.limit}" data-required="true" data-label="Execution Limit" />
          </label>
        </div>
      </section>
      <section class="card" id="sbx-scope"><h3>Scope</h3><p class="muted">Sandbox scope and constraints.</p></section>
      <section class="card" id="sbx-guardrails"><h3>Guardrails</h3><p class="muted">Risk and control guardrails.</p></section>
      <section class="card" id="sbx-evidence"><h3>Evidence</h3><p class="muted">Evidence and outcomes.</p></section>`;
  } else {
    dom.viewRoot.innerHTML = `
      <section class="card" id="cet-overview">
        <h2>CET Detail</h2>
        <p><strong>${row.id}</strong> - ${row.name}</p>
        <div class="form-grid">
          <label>CET Rationale
            <textarea id="field-cet-rationale" data-required="true" data-label="CET Rationale" rows="3"></textarea>
          </label>
          <label>CET Exposure
            <input id="field-cet-exposure" type="number" value="${row.exposure}" data-required="true" data-label="CET Exposure" />
          </label>
          <label>CET Cap
            <input id="field-cet-cap" type="number" value="${row.cap}" data-required="true" data-label="CET Cap" />
          </label>
          <label class="checkbox-row">
            <input id="field-cet-ack" type="checkbox" />
            Governance warning acknowledged
          </label>
        </div>
      </section>
      <section class="card" id="cet-parameters"><h3>Parameters</h3><p class="muted">Test parameters and assumptions.</p></section>
      <section class="card" id="cet-triggers"><h3>Triggers & Caps</h3><p class="muted">Trigger and cap settings.</p></section>
      <section class="card" id="cet-risk"><h3>Risk / Exceptions</h3><p class="muted">Risks and deviations.</p></section>
      <section class="card" id="cet-approvals"><h3>Approvals</h3><p class="muted">Approver and sign-off details.</p></section>`;
  }
}

function setBreadcrumb() {
  const r = state.route;
  if (r.view === "home") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a>`;
    return;
  }
  if (r.view === "inbox") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a> <span>/</span> <a href="${PATH.inbox}">Inbox</a>`;
    return;
  }
  if (r.view === "portfolio") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a> <span>/</span> <a href="${PATH.portfolio}">Portfolio Monitoring</a>`;
    return;
  }
  const group = r.groupCadId ? getGroupById(r.groupCadId) : null;
  const countryCad = r.countryCadId ? getCountryCadById(r.countryCadId) : null;
  const child = r.childId ? getChildById(r.childId) : null;
  if (r.view === "group") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a>`;
    return;
  }
  if (r.view === "country") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a> <span>/</span> <a href="${PATH.country(r.groupCadId, r.country, r.countryCadId)}">${countryCad ? countryCad.country : r.country}</a> <span>/</span> <span>${countryCad ? countryCad.name : r.countryCadId}</span>`;
    return;
  }
  dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Credit Approvals</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a> <span>/</span> <a href="${PATH.country(r.groupCadId, r.country, r.countryCadId)}">${countryCad ? countryCad.name : r.countryCadId}</a> <span>/</span> <span>${child ? child.name : r.childId}</span>`;
}

function recomputeIssues() {
  const inputs = [...dom.viewRoot.querySelectorAll("input, textarea")];
  const issues = [];

  inputs.forEach((el) => {
    if (el.dataset.required === "true") {
      const value = el.type === "checkbox" ? el.checked : String(el.value || "").trim();
      if (!value) {
        issues.push({
          id: `FIELD-${el.id}`,
          type: "Field",
          sectionId: el.closest("section")?.id || "view-root",
          fieldId: el.id,
          message: `${el.dataset.label || el.id} is required.`,
          hint: `Provide ${el.dataset.label || "a value"}.`
        });
      }
    }
  });

  if (state.route.view === "cet") {
    const exposure = Number(document.getElementById("field-cet-exposure")?.value || 0);
    const cap = Math.max(1, Number(document.getElementById("field-cet-cap")?.value || 1));
    const ack = document.getElementById("field-cet-ack")?.checked;

    if (exposure > cap) {
      issues.push({
        id: "GOV-AGG-CAP-001",
        type: "Blocker",
        sectionId: "cet-overview",
        message: "CET exposure exceeds cap.",
        hint: `Current ${exposure}, allowed ${cap}, reduce by ${exposure - cap}.`
      });
    } else if ((exposure / cap) * 100 >= 80 && !ack) {
      issues.push({
        id: "GOV-WARN-ACK-010",
        type: "Warning",
        sectionId: "cet-overview",
        fieldId: "field-cet-ack",
        message: "High utilization needs acknowledgement.",
        hint: "Tick governance warning acknowledgement."
      });
    }
  }

  issues.sort((a, b) => ({ Blocker: 0, Field: 1, Warning: 2 }[a.type] - ({ Blocker: 0, Field: 1, Warning: 2 }[b.type])));
  const summary = {
    blockers: issues.filter((x) => x.type === "Blocker").length,
    errors: issues.filter((x) => x.type === "Field").length,
    warnings: issues.filter((x) => x.type === "Warning").length,
    total: issues.length
  };

  const prev = state.previousIssueCount;
  state.issueStore = { issues, summary };
  state.previousIssueCount = summary.total;

  if (summary.total > 0) {
    state.rightPanel.isOpen = true;
    state.rightPanel.resolvedBannerUntil = 0;
  } else if (prev > 0) {
    state.rightPanel.isOpen = true;
    state.rightPanel.resolvedBannerUntil = Date.now() + 1600;
    setTimeout(() => {
      if (Date.now() >= state.rightPanel.resolvedBannerUntil) {
        state.rightPanel.isOpen = false;
        renderIssuePanel();
      }
    }, 1650);
  }
}

function renderIssuePanel() {
  const { blockers, errors, warnings, total } = state.issueStore.summary;
  dom.issueSummary.textContent = `Blockers ${blockers} | Errors ${errors} | Warnings ${warnings}`;
  dom.submitBtn.disabled = total > 0;

  const filtered = state.rightPanel.activeFilter === "all"
    ? state.issueStore.issues
    : state.issueStore.issues.filter((x) => (state.rightPanel.activeFilter === "errors" ? x.type === "Field" : x.type.toLowerCase() === state.rightPanel.activeFilter.slice(0, -1)));

  dom.issueList.innerHTML = filtered.map((x) => `
    <li class="issue-item">
      <div class="issue-top"><span class="badge ${x.type.toLowerCase()}">${x.type}</span><small>${x.sectionId}</small></div>
      <strong>${x.message}</strong>
      <span class="muted">Hint: ${x.hint}</span>
      <div class="issue-actions"><button class="jump-btn" data-issue-id="${x.id}">Go to field/rule</button></div>
    </li>
  `).join("");

  dom.filterButtons.forEach((b) => b.classList.toggle("active", b.dataset.filter === state.rightPanel.activeFilter));

  const show = state.rightPanel.isOpen && (total > 0 || Date.now() < state.rightPanel.resolvedBannerUntil);
  dom.issuePanel.classList.toggle("open", show);
  dom.resolvedBanner.classList.toggle("show", total === 0 && Date.now() < state.rightPanel.resolvedBannerUntil);

  const small = window.matchMedia("(max-width: 1199px)").matches;
  dom.backdrop.classList.toggle("show", show && total > 0 && small);

  [...dom.viewRoot.querySelectorAll("input,textarea")].forEach((el) => el.classList.remove("invalid"));
  state.issueStore.issues.filter((x) => x.type === "Field" && x.fieldId).forEach((x) => {
    const el = document.getElementById(x.fieldId);
    if (el) el.classList.add("invalid");
  });
}

function jumpToIssue(id) {
  const issue = state.issueStore.issues.find((x) => x.id === id);
  if (!issue) return;
  const target = (issue.fieldId && document.getElementById(issue.fieldId)) || document.getElementById(issue.sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target.focus) target.focus({ preventScroll: true });
  }
}

function render() {
  state.route = parseRoute();
  const compactDevice = window.matchMedia("(max-width: 1024px)").matches;
  const routeChanged = state.lastRouteView !== state.route.view;
  if (state.route.view === "group") state.homeType = "group";
  if (state.route.view === "country") state.homeType = "country";
  if (state.route.view === "cet") state.homeType = "cet";
  if (state.route.view === "sandbox") state.homeType = "sandbox";
  if (state.route.view === "portfolio") state.homeStatus = "all";
  if (routeChanged) {
    state.mobileSectionsOpen = false;
    state.mobileTraceOpen = state.route.view !== "home";
    state.openColumnMenu = "";
  }
  if (compactDevice) {
    dom.leftPanel.classList.add("collapsed");
  } else if (dom.leftPanel.classList.contains("collapsed") && state.route.view !== "home" && state.route.view !== "inbox" && state.route.view !== "portfolio") {
    dom.leftPanel.classList.remove("collapsed");
  }
  dom.appShell?.classList.toggle("left-collapsed", dom.leftPanel.classList.contains("collapsed"));
  setBreadcrumb();
  renderLeftPanel();

  if (state.route.view === "home") renderHome();
  else if (state.route.view === "inbox") renderInbox();
  else if (state.route.view === "portfolio") renderPortfolio();
  else if (state.route.view === "group") renderGroupDetail();
  else if (state.route.view === "country") renderCountryDetail();
  else renderCetOrSandbox();

  setupSectionSpy();

  const detailRoute = state.route.view === "group" || state.route.view === "country" || state.route.view === "cet" || state.route.view === "sandbox";
  const showActions = detailRoute;
  dom.actionBar.style.display = showActions ? "flex" : "none";
  const noRightPanel = !detailRoute;
  dom.appShell?.classList.toggle("no-right-panel", noRightPanel);
  if (noRightPanel) state.rightPanel.isOpen = false;
  dom.backTopFab?.classList.toggle("show", detailRoute && window.scrollY > 260);

  recomputeIssues();
  renderIssuePanel();
  state.lastRouteView = state.route.view;

  dom.viewRoot.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      recomputeIssues();
      renderIssuePanel();
    });
    el.addEventListener("blur", () => {
      recomputeIssues();
      renderIssuePanel();
    });
  });
}

function setupSectionSpy() {
  if (state.sectionObserver) {
    state.sectionObserver.disconnect();
    state.sectionObserver = null;
  }

  const ids =
    state.route.view === "group" || state.route.view === "country"
      ? CAD_SECTIONS.map((s) => s.id)
      : state.route.view === "cet"
        ? CET_SECTIONS.map((s) => s.id)
        : state.route.view === "sandbox"
          ? SANDBOX_SECTIONS.map((s) => s.id)
          : [];
  if (!ids.length) return;

  const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  if (!state.activeSectionId) state.activeSectionId = ids[0];

  state.sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    state.activeSectionId = visible.target.id;
    dom.leftPanel.querySelectorAll(".section-link").forEach((el) => {
      el.classList.toggle("active", el.dataset.sectionId === state.activeSectionId);
    });
  }, { rootMargin: "-30% 0px -55% 0px", threshold: 0.01 });

  targets.forEach((t) => state.sectionObserver.observe(t));
}

function populateFilters() {}

function initEvents() {
  window.addEventListener("hashchange", render);

  dom.validateBtn.addEventListener("click", () => {
    recomputeIssues();
    state.rightPanel.isOpen = true;
    renderIssuePanel();
  });
  dom.closePanel.addEventListener("click", () => {
    state.rightPanel.isOpen = false;
    renderIssuePanel();
  });
  dom.backdrop.addEventListener("click", () => {
    state.rightPanel.isOpen = false;
    renderIssuePanel();
  });

  dom.filterButtons.forEach((b) => {
    b.addEventListener("click", () => {
      state.rightPanel.activeFilter = b.dataset.filter;
      renderIssuePanel();
    });
  });

  dom.issueList.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-issue-id]");
    if (!btn) return;
    jumpToIssue(btn.dataset.issueId);
  });

  dom.viewRoot.addEventListener("click", (event) => {
    const sortBtn = event.target.closest("[data-sort-key]");
    if (sortBtn) {
      const table = sortBtn.dataset.sortTable;
      const key = sortBtn.dataset.sortKey;
      const current = [...(state.sorters[table] || [])];
      const idx = current.findIndex((x) => x.key === key);
      let nextDir = "asc";
      if (idx >= 0) {
        nextDir = current[idx].dir === "asc" ? "desc" : current[idx].dir === "desc" ? "none" : "asc";
        current.splice(idx, 1);
      }
      if (nextDir !== "none") {
        if (table === "portfolio" || event.shiftKey) current.push({ key, dir: nextDir });
        else current.splice(0, current.length, { key, dir: nextDir });
      } else if (table !== "portfolio" && !event.shiftKey) {
        current.splice(0, current.length);
      }
      state.sorters[table] = current;
      render();
      return;
    }

    const colToggle = event.target.closest("[data-toggle-columns]");
    if (colToggle) {
      const key = colToggle.dataset.toggleColumns;
      state.openColumnMenu = state.openColumnMenu === key ? "" : key;
      render();
      return;
    }

    const acOption = event.target.closest("[data-ac-value]");
    if (acOption) {
      state.searchTerm = acOption.dataset.acValue || "";
      render();
      return;
    }

    const actionBtn = event.target.closest("[data-action]");
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      if (action === "reset-search") {
        state.searchTerm = "";
        render();
      }
      if (action === "reset-table-filters") {
        state.filters.product = [];
        state.filters.clientSegment = [];
        state.filters.cluster = "";
        state.filters.country = [];
        render();
      }
      if (action === "expand-all") {
        state.expandedGroups = new Set(state.data.groupCads.map((g) => g.id));
        state.expandedCountries = new Set(
          state.data.countryCads.map((c) => `${c.groupCadId}::${c.id}`)
        );
        state.hierarchyInitialized = true;
        render();
      }
      if (action === "collapse-all") {
        state.expandedGroups = new Set();
        state.expandedCountries = new Set();
        state.hierarchyInitialized = true;
        render();
      }
      return;
    }

    const tg = event.target.closest("[data-toggle-group]");
    if (tg) {
      const id = tg.dataset.toggleGroup;
      if (state.expandedGroups.has(id)) {
        state.expandedGroups.delete(id);
        state.expandedCountries = new Set(
          [...state.expandedCountries].filter((x) => !x.startsWith(`${id}::`))
        );
      } else state.expandedGroups.add(id);
      render();
      return;
    }

    const tc = event.target.closest("[data-toggle-country]");
    if (tc) {
      const id = tc.dataset.toggleCountry;
      if (state.expandedCountries.has(id)) state.expandedCountries.delete(id);
      else state.expandedCountries.add(id);
      render();
    }
  });

  dom.viewRoot.addEventListener("input", (event) => {
    const target = event.target;
    if (target.id === "main-search") {
      state.searchTerm = target.value;
      render();
      return;
    }

    if (target.dataset.filterKey && target.dataset.filterValue !== undefined) {
      const key = target.dataset.filterKey;
      const value = target.dataset.filterValue;
      const current = new Set(filterValues(key));
      if (target.checked) current.add(value);
      else current.delete(value);
      state.filters[key] = [...current];
      render();
      return;
    }
    if (target.dataset.columnKey && target.dataset.columnTable) {
      const table = target.dataset.columnTable;
      const key = target.dataset.columnKey;
      state.visibleColumns[table][key] = target.checked;
      if (table === "portfolio") {
        if (target.checked && !state.portfolioColumnOrder.includes(key)) state.portfolioColumnOrder.push(key);
        if (!target.checked) state.portfolioColumnOrder = state.portfolioColumnOrder.filter((x) => x !== key);
      }
      render();
      return;
    }
  });

  dom.createFab?.addEventListener("click", () => {
    state.openHelpMenu = false;
    dom.helpMenu?.classList.remove("open");
    dom.floatMenu?.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!dom.floatMenu || !dom.createFab) return;
    const inside = event.target.closest(".fab-create-wrap");
    const insideHelp = event.target.closest(".fab-help-wrap");
    const insideCols = event.target.closest(".columns-wrap");
    if (!inside) dom.floatMenu.classList.remove("open");
    if (!insideHelp) {
      state.openHelpMenu = false;
      dom.helpMenu?.classList.remove("open");
    }
    if (!insideCols && state.openColumnMenu) {
      state.openColumnMenu = "";
      render();
    }
  });

  dom.floatMenu?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-create-type]");
    if (!btn) return;
    dom.floatMenu.classList.remove("open");
    window.alert(`Create ${btn.dataset.createType.toUpperCase()} flow placeholder.`);
  });

  dom.helpFab?.addEventListener("click", () => {
    dom.floatMenu?.classList.remove("open");
    state.openHelpMenu = !state.openHelpMenu;
    dom.helpMenu?.classList.toggle("open", state.openHelpMenu);
  });

  dom.helpMenu?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-help-type]");
    if (!btn) return;
    const messages = {
      docs: "Documentation center placeholder.",
      approver: "Find your approver flow placeholder.",
      demo: "Demo mode placeholder.",
      chat: "Contact Credit chat placeholder."
    };
    dom.helpMenu.classList.remove("open");
    state.openHelpMenu = false;
    window.alert(messages[btn.dataset.helpType] || "Help option placeholder.");
  });

  dom.backTopFab?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    const detailRoute = state.route.view === "group" || state.route.view === "country" || state.route.view === "cet" || state.route.view === "sandbox";
    dom.backTopFab?.classList.toggle("show", detailRoute && window.scrollY > 260);
  });
}

async function init() {
  state.data = SAMPLE_DATA;
  if (window.location.protocol === "file:") {
    state.data = FALLBACK_DATA;
    state.loadWarning = "Running from local file mode with embedded sample data.";
  } else {
    try {
      const res = await fetch("data/sample-hierarchy.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
    } catch (_err) {
      state.data = FALLBACK_DATA;
      state.loadWarning = "Using embedded fallback sample data because external JSON could not be loaded.";
    }
  }
  populateFilters();
  if (!window.location.hash) window.location.hash = PATH.home;
  initEvents();
  render();
}

init();
