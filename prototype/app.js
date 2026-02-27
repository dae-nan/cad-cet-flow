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
    product: "",
    clientSegment: "",
    cluster: "",
    country: ""
  },
  homeType: "group",
  homeStatus: "Active",
  quickView: "none",
  inboxScope: "my",
  inboxStatus: "all",
  expandedGroups: new Set(),
  expandedCountries: new Set(),
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

function applyCommonFilters(rows, opts = {}) {
  const term = state.searchTerm.trim().toLowerCase();
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
    if (state.filters.product && row.product !== state.filters.product) return false;
    if (state.filters.clientSegment && row.clientSegment !== state.filters.clientSegment) return false;
    if (state.filters.cluster && row.cluster !== state.filters.cluster) return false;
    if (state.filters.country && row.country !== state.filters.country) return false;
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
  return uniqueValues(rows, key)
    .map((v) => `<option value="${v}" ${state.filters[key] === v ? "selected" : ""}>${v}</option>`)
    .join("");
}

function statusMatch(type, row) {
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

function openHrefForRow(row, type) {
  if (type === "group") return PATH.group(row.id);
  if (type === "country") return PATH.country(row.groupCadId, row.country, row.id);
  return PATH.detail(row.groupCadId, row.country, row.countryCadId, row.id);
}

function ensureExpandedDefaults() {
  if (state.expandedGroups.size === 0) {
    state.data.groupCads.forEach((g, idx) => {
      if (idx < 2) state.expandedGroups.add(g.id);
    });
  }
}

function renderHierarchyTable() {
  ensureExpandedDefaults();
  const groupRows = applyCommonFilters(state.data.groupCads).filter((g) => statusMatch("group", g));
  const out = [];

  for (const group of groupRows) {
    const countriesAll = applyCommonFilters(
      state.data.countryCads.filter((c) => c.groupCadId === group.id)
    ).filter((c) => statusMatch("country", c));

    let countryOutput = "";
    for (const country of countriesAll) {
      const counts = childCounts(country.id);
      const countryKey = `${group.id}::${country.id}`;
      const countryExpanded = state.expandedCountries.has(countryKey);
      const cets = applyCommonFilters(state.data.cets.filter((x) => x.countryCadId === country.id)).filter((x) => statusMatch("cet", x));
      const sbx = applyCommonFilters(state.data.sandboxes.filter((x) => x.countryCadId === country.id)).filter((x) => statusMatch("sandbox", x));
      const leaves = [
        ...cets.map((x) => ({ type: "CET", ...x })),
        ...sbx.map((x) => ({ type: "Sandbox", ...x }))
      ];

      const leafRows = countryExpanded
        ? leaves.map((x) => `
            <tr class="leaf">
              <td></td>
              <td></td>
              <td>${x.type}</td>              
              <td class="key-col hierarchy-name depth-4"><a href="${PATH.detail(group.id, country.country, country.id, x.id)}">${x.name}</a><div>${idTag(x.id)}</div></td>
              <td>${statusTag(x.status)}</td>
              <td>${countryCell(x.country)}</td>
              <td>${ownerCell(x.owner)}</td>
              <td>${x.exposure || Math.round((x.limit || 10) * 0.65)}</td>
              <td>${x.cap || x.limit || 10}</td>
              <td>${Math.round(((x.exposure || Math.round((x.limit || 10) * 0.65)) / Math.max(1, (x.cap || x.limit || 10))) * 100)}%</td>
            </tr>`)
            .join("")
        : "";

      countryOutput += `
        <tr class="country-row">
          <td><button class="tree-toggle" data-toggle-country="${countryKey}">${countryExpanded ? "-" : "+"}</button></td>
          <td>COUNTRY</td>
          <td class="key-col hierarchy-name depth-3"><a href="${PATH.country(group.id, country.country, country.id)}">${country.name}</a><div>${idTag(country.id)}</div></td>
          <td>${statusTag(country.status)}</td>
          <td>${countryCell(country.country)}</td>
          <td>${ownerCell(country.owner)}</td>
          <td>${country.exposure || Math.round(((country.cetExposure || 0) + (country.sandboxExposure || 0) || 42))}</td>
          <td>${country.cap || country.limit || 100}</td>
          <td>${Math.round(((country.exposure || 42) / Math.max(1, (country.cap || country.limit || 100))) * 100)}%</td>
        </tr>
        ${leafRows}`;
    }

    const groupExpanded = state.expandedGroups.has(group.id);
    out.push(`
      <tr class="group-row">
        <td><button class="tree-toggle" data-toggle-group="${group.id}">${groupExpanded ? "-" : "+"}</button></td>
        <td>GROUP</td>
        <td class="key-col hierarchy-name depth-1"><a href="${PATH.group(group.id)}">${group.name}</a><div>${idTag(group.id)}</div></td>
        <td>${statusTag(group.status)}</td>
        <td>${countryCell("Global")}</td>
        <td>${ownerCell(group.owner)}</td>
        <td>${group.exposure || 180}</td>
        <td>${group.cap || 250}</td>
        <td>${Math.round(((group.exposure || 180) / Math.max(1, (group.cap || 250))) * 100)}%</td>
      </tr>
      ${groupExpanded ? countryOutput : ""}`);
  }

  return `
    <section class="card">
      <h3>Portfolio Exposure Tree</h3>
      <table class="data-table hierarchy-table">
        <thead><tr><th></th><th>Type</th><th class="key-col">Name</th><th>Status</th><th>Country</th><th>Owner</th><th>Exposure</th><th>Limit</th><th>Utilization</th></tr></thead>
        <tbody>${out.join("") || '<tr><td colspan="9">No matching records</td></tr>'}</tbody>
      </table>
    </section>`;
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
  const alertCount = state.data.cets.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const entityTitle = (type) => ({ group: "Group CADs", country: "Country CADs", cet: "CETs", sandbox: "Sandboxes" }[type] || type);
  const rowStatus = (type, status, label) => `
    <button class="side-row ${type === "inbox" ? (state.inboxStatus === status ? "on" : "") : (state.homeType === type && state.homeStatus === status ? "on" : "")}" data-home-type="${type}" data-home-status="${status}">
      <span>${label}</span>
    </button>`;
  const parentType = (type) => `
    <button class="menu-item ${state.homeType === type && state.homeStatus === "all" ? "active" : ""}" data-home-type="${type}" data-home-status="all">${entityTitle(type)}</button>`;
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
      <a class="menu-item" href="${PATH.home}">Homepage</a>
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
      <p class="menu-title">Pages</p>
      <a class="menu-item ${r.view === "home" ? "active" : ""}" href="${PATH.home}">Homepage</a>
      <a class="menu-item ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}">Inbox</a>
      <a class="menu-item ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}">Portfolio Monitoring</a>
    </div>`;

  const homeExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">Document Filters</p>
      <div class="side-group">${parentType("group")}${statusRows("group")}</div>
      <div class="side-group">${parentType("country")}${statusRows("country")}</div>
      <div class="side-group">${parentType("cet")}${statusRows("cet")}</div>
      <div class="side-group">${parentType("sandbox")}${statusRows("sandbox")}</div>
    </div>
    <div class="menu-group">
      <p class="menu-title">Action Filters</p>
      <button class="menu-item ${state.quickView === "none" ? "active" : ""}" data-quick-view="none">All Docs</button>
      <button class="menu-item ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs">My Docs</button>
      <button class="menu-item ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts">Governance Alerts <span class="mini-badge warn">${alertCount}</span></button>
    </div>`;

  const inboxExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">Inbox Filters</p>
      <button class="menu-item ${state.inboxScope === "my" ? "active" : ""}" data-inbox-scope="my">My Inbox <span class="mini-badge">${assignedToMeCount}</span></button>
      <div class="side-rows ${state.inboxScope === "my" ? "open" : "closed"}">
        ${rowStatus("inbox", "Draft", "DRAFT")}
        ${rowStatus("inbox", "In Flight", "IN FLIGHT")}
        ${rowStatus("inbox", "Completed", "COMPLETED")}
      </div>
      <button class="menu-item ${state.inboxScope === "team" ? "active" : ""}" data-inbox-scope="team">Team Inbox <span class="mini-badge">${assignedToTeamCount}</span></button>
      <div class="side-rows ${state.inboxScope === "team" ? "open" : "closed"}">
        ${rowStatus("inbox", "Draft", "DRAFT")}
        ${rowStatus("inbox", "In Flight", "IN FLIGHT")}
        ${rowStatus("inbox", "Completed", "COMPLETED")}
      </div>
      <button class="side-row ${state.inboxStatus === "all" ? "on" : ""}" data-inbox-status="all"><span>ALL</span></button>
      <p class="muted todo-hint">Team inbox is filtered by signed-in profile countries and products.</p>
    </div>`;

  const portfolioExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}`;

  const collapsedHome = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Home" data-tooltip="Home">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("file")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("country")}</a>
      <button class="icon-pill has-tooltip ${state.homeType === "group" ? "active" : ""}" data-home-type="group" data-home-status="Active" aria-label="Group CADs" data-tooltip="Group CADs">${navIcon("group")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "country" ? "active" : ""}" data-home-type="country" data-home-status="Active" aria-label="Country CADs" data-tooltip="Country CADs">${navIcon("country")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "cet" ? "active" : ""}" data-home-type="cet" data-home-status="Active" aria-label="CETs" data-tooltip="CETs">${navIcon("cet")}</button>      
      ${r.view !== "home" ? `<span class="icon-pill has-tooltip active" aria-label="Opened document" data-tooltip="Opened document">${navIcon("file")}</span>` : ""}
    </div>`;
  const collapsedMinimal = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Home" data-tooltip="Home">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("file")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("country")}</a>
    </div>`;

  const isCollapsed = dom.leftPanel.classList.contains("collapsed");
  dom.leftPanel.innerHTML = isCollapsed
    ? (r.view === "home" ? collapsedHome : collapsedMinimal)
    : (r.view === "home" ? homeExpanded : r.view === "inbox" ? inboxExpanded : r.view === "portfolio" ? portfolioExpanded : detailExpanded);

  const btn = document.getElementById("left-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      dom.leftPanel.classList.toggle("collapsed");
      renderLeftPanel();
    });
  }

  dom.leftPanel.querySelectorAll("[data-home-type]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.homeType === "inbox") return;
      state.homeType = el.dataset.homeType;
      state.homeStatus = el.dataset.homeStatus || state.homeStatus;
      if (state.route.view !== "home") window.location.hash = PATH.home;
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

  dom.leftPanel.querySelectorAll("[data-inbox-status]").forEach((el) => {
    el.addEventListener("click", () => {
      state.inboxStatus = el.dataset.inboxStatus;
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
}

function renderHome() {
  const rows = {
    group: applyCommonFilters(state.data.groupCads),
    country: applyCommonFilters(state.data.countryCads),
    cet: applyCommonFilters(state.data.cets),
    sandbox: applyCommonFilters(state.data.sandboxes)
  };

  const selectedRows = rows[state.homeType]
    .filter((x) => state.homeStatus === "all" || x.status === state.homeStatus);

  const selectedTable = selectedRows.map((r) => `<tr>
    <td class="key-col">${r.name}<div>${idTag(r.id)}</div></td><td>${state.homeType.toUpperCase()}</td><td>${countryCell(r.country)}</td><td>${r.product}</td><td>${statusTag(r.status)}</td><td>${ownerCell(r.owner)}</td><td><a href="${openHrefForRow(r, state.homeType)}">Open</a></td>
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
      <h3>Selected View: ${statusText} ${state.quickView !== "none" ? `| ${state.quickView}` : ""}</h3>
      <table class="data-table">
        <thead><tr><th class="key-col">Name</th><th>Type</th><th>Country</th><th>Product</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead>
        <tbody>${selectedTable || '<tr><td colspan="7">No rows</td></tr>'}</tbody>
      </table>
    </section>`;

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Homepage</h2>
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
  const rows = inboxRows().filter((row) => {
    if (!term) return true;
    const haystack = [row.id, row.name, row.owner, row.country, row.product, row.clientSegment].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(term);
  });
  const counts = {
    draft: rows.filter((x) => inboxStatusFor(x) === "Draft").length,
    inflight: rows.filter((x) => inboxStatusFor(x) === "In Flight").length,
    completed: rows.filter((x) => inboxStatusFor(x) === "Completed").length
  };
  const tableRows = rows.map((r) => `<tr>
    <td class="key-col">${r.name}<div>${idTag(r.id)}</div></td><td>${r.type}</td><td>${countryCell(r.country)}</td><td>${r.product}</td><td>${statusTag(inboxStatusFor(r))}</td><td>${ownerCell(r.owner)}</td><td><a href="${openHrefForRow(r, r.type.toLowerCase())}">Open</a></td>
  </tr>`).join("");

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Inbox</h2>
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / Owner / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <p class="muted">${state.inboxScope === "my" ? "My Inbox" : "Team Inbox"} ${state.inboxStatus === "all" ? "| All statuses" : `| ${state.inboxStatus.toUpperCase()}`}</p>
      <div class="metric-grid">
        <div class="metric"><span>Draft</span><strong>${counts.draft}</strong></div>
        <div class="metric"><span>In Flight</span><strong>${counts.inflight}</strong></div>
        <div class="metric"><span>Completed</span><strong>${counts.completed}</strong></div>
        <div class="metric"><span>Total</span><strong>${rows.length}</strong></div>
      </div>
      <table class="data-table">
        <thead><tr><th class="key-col">Name</th><th>Type</th><th>Country</th><th>Product</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead>
        <tbody>${tableRows || '<tr><td colspan="7">No rows</td></tr>'}</tbody>
      </table>
    </section>
  `;
}

function renderPortfolio() {
  const statusText = `${state.homeType.toUpperCase()} / ${state.homeStatus.toUpperCase()}`;
  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Portfolio Monitoring</h2>
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / Owner / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="table-filter-row">
        <select id="table-filter-product"><option value="">Product</option>${optionsFor("product")}</select>
        <select id="table-filter-segment"><option value="">Client Segment</option>${optionsFor("clientSegment")}</select>
        <select id="table-filter-cluster"><option value="">Cluster</option>${optionsFor("cluster")}</select>
        <select id="table-filter-country"><option value="">Country</option>${optionsFor("country")}</select>
        <button class="btn secondary small" data-action="reset-table-filters">Clear Filters</button>
        <button class="btn secondary small" data-action="expand-all">Expand All</button>
        <button class="btn secondary small" data-action="collapse-all">Collapse All</button>
      </div>
      <p class="muted">Selected view: ${statusText}${state.filters.product ? ` | Product ${state.filters.product}` : ""}${state.filters.clientSegment ? ` | Segment ${state.filters.clientSegment}` : ""}${state.filters.cluster ? ` | Cluster ${state.filters.cluster}` : ""}${state.filters.country ? ` | Country ${state.filters.country}` : ""}</p>
    </section>
    ${renderHierarchyTable()}
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

  const rows = countries.map((c) => {
    const counts = childCounts(c.id);
    return `<tr><td class="key-col">${c.name}<div>${idTag(c.id)}</div></td><td>${countryCell(c.country)}</td><td>${statusTag(c.status)}</td><td>${counts.cets}</td><td>${counts.sandboxes}</td><td>${ownerCell(c.owner)}</td><td><a href="${PATH.country(group.id, c.country, c.id)}">Open</a></td></tr>`;
  }).join("");

  dom.viewRoot.innerHTML = `
    <section class="card" id="cad-overview">
      <h2>Group CAD Detail</h2>
      <p><strong>${group.id}</strong> - ${group.name}</p>
      <p class="muted">Product ${group.product} | Segment ${group.clientSegment} | Status ${statusTag(group.status)}</p>
    </section>
    <section class="card" id="cad-basic">
      <h3>Country CADs</h3>
      <table class="data-table">
        <thead><tr><th class="key-col">Name</th><th>Country</th><th>Status</th><th>CETs</th><th>Sandboxes</th><th>Owner</th><th>Action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No country CADs</td></tr>'}</tbody>
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
      <table class="data-table">
        <thead><tr><th class="key-col">Name</th><th>Type</th><th>Status</th><th>Owner</th><th>Action</th></tr></thead>
        <tbody>
          ${[
            ...cets.map((x) => `<tr><td class="key-col">${x.name}<div>${idTag(x.id)}</div></td><td>CET</td><td>${statusTag(x.status)}</td><td>${ownerCell(x.owner)}</td><td><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">Open</a></td></tr>`),
            ...sandboxes.map((x) => `<tr><td class="key-col">${x.name}<div>${idTag(x.id)}</div></td><td>Sandbox</td><td>${statusTag(x.status)}</td><td>${ownerCell(x.owner)}</td><td><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">Open</a></td></tr>`)
          ].join("") || '<tr><td colspan="5">No child tests</td></tr>'}
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
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a>`;
    return;
  }
  if (r.view === "inbox") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a> <span>/</span> <a href="${PATH.inbox}">Inbox</a>`;
    return;
  }
  if (r.view === "portfolio") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a> <span>/</span> <a href="${PATH.portfolio}">Portfolio Monitoring</a>`;
    return;
  }
  const group = r.groupCadId ? getGroupById(r.groupCadId) : null;
  const countryCad = r.countryCadId ? getCountryCadById(r.countryCadId) : null;
  const child = r.childId ? getChildById(r.childId) : null;
  if (r.view === "group") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a>`;
    return;
  }
  if (r.view === "country") {
    dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a> <span>/</span> <a href="${PATH.country(r.groupCadId, r.country, r.countryCadId)}">${countryCad ? countryCad.country : r.country}</a> <span>/</span> <span>${countryCad ? countryCad.name : r.countryCadId}</span>`;
    return;
  }
  dom.breadcrumb.innerHTML = `<a href="${PATH.home}">Home</a> <span>/</span> <a href="${PATH.group(r.groupCadId)}">${group ? group.name : r.groupCadId}</a> <span>/</span> <a href="${PATH.country(r.groupCadId, r.country, r.countryCadId)}">${countryCad ? countryCad.name : r.countryCadId}</a> <span>/</span> <span>${child ? child.name : r.childId}</span>`;
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
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const routeChanged = state.lastRouteView !== state.route.view;
  if (state.route.view === "group") state.homeType = "group";
  if (state.route.view === "country") state.homeType = "country";
  if (state.route.view === "cet") state.homeType = "cet";
  if (state.route.view === "sandbox") state.homeType = "sandbox";
  if (state.route.view === "portfolio") state.homeStatus = "all";
  if (routeChanged) {
    state.mobileSectionsOpen = false;
    state.mobileTraceOpen = state.route.view !== "home";
  }
  if (isMobile) {
    dom.leftPanel.classList.add("collapsed");
  } else if (!dom.leftPanel.classList.contains("collapsed")) {
    dom.leftPanel.classList.remove("collapsed");
  }
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
        state.filters.product = "";
        state.filters.clientSegment = "";
        state.filters.cluster = "";
        state.filters.country = "";
        render();
      }
      if (action === "expand-all") {
        state.expandedGroups = new Set(state.data.groupCads.map((g) => g.id));
        state.expandedCountries = new Set(
          state.data.countryCads.map((c) => `${c.groupCadId}::${c.id}`)
        );
        render();
      }
      if (action === "collapse-all") {
        state.expandedGroups = new Set();
        state.expandedCountries = new Set();
        render();
      }
      return;
    }

    const tg = event.target.closest("[data-toggle-group]");
    if (tg) {
      const id = tg.dataset.toggleGroup;
      if (state.expandedGroups.has(id)) state.expandedGroups.delete(id);
      else state.expandedGroups.add(id);
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

    if (target.id === "table-filter-product") state.filters.product = target.value;
    if (target.id === "table-filter-segment") state.filters.clientSegment = target.value;
    if (target.id === "table-filter-cluster") state.filters.cluster = target.value;
    if (target.id === "table-filter-country") state.filters.country = target.value;
    if (
      target.id === "table-filter-product" ||
      target.id === "table-filter-segment" ||
      target.id === "table-filter-cluster" ||
      target.id === "table-filter-country"
    ) {
      render();
    }
  });

  dom.createFab?.addEventListener("click", () => {
    dom.floatMenu?.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!dom.floatMenu || !dom.createFab) return;
    const inside = event.target.closest(".fab-create-wrap");
    if (!inside) dom.floatMenu.classList.remove("open");
  });

  dom.floatMenu?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-create-type]");
    if (!btn) return;
    dom.floatMenu.classList.remove("open");
    window.alert(`Create ${btn.dataset.createType.toUpperCase()} flow placeholder.`);
  });

  dom.helpFab?.addEventListener("click", () => {
    window.alert("Help center placeholder.");
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
