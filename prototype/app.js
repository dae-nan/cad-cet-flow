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
  homeViewMode: "home",
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
  quickView: "needsaction",
  expandedGroups: new Set(),
  expandedCountries: new Set(),
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
  filterButtons: [...document.querySelectorAll(".filter")]
};

const PATH = {
  home: "#/home",
  group: (groupCadId) => `#/cad/${groupCadId}`,
  country: (groupCadId, country, countryCadId) =>
    `#/cad/${groupCadId}/${encodeURIComponent(country.toLowerCase())}/${countryCadId}`,
  detail: (groupCadId, country, countryCadId, childId) =>
    `#/cad/${groupCadId}/${encodeURIComponent(country.toLowerCase())}/${countryCadId}/${childId}`
};

function uniqueValues(rows, key) {
  return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();
}

function applyCommonFilters(rows) {
  const term = state.searchTerm.trim().toLowerCase();
  return rows.filter((row) => {
    const myDocsActive = state.filters.myDocs || state.quickView === "mydocs";
    if (myDocsActive) {
      const p = state.data.userProfile;
      if (row.cluster !== p.cluster && !(p.countries || []).includes(row.country)) return false;
    }
    if (state.quickView === "needsaction" || state.quickView === "inbox") {
      if (!(row.status === "In Flight" || row.status === "Active")) return false;
    }
    if (state.quickView === "governancealerts") {
      const util = Number(row.exposure) / Math.max(1, Number(row.cap || 0));
      if (!Number.isFinite(util) || util < 0.8) return false;
    }
    if (state.filters.product && row.product !== state.filters.product) return false;
    if (state.filters.clientSegment && row.clientSegment !== state.filters.clientSegment) return false;
    if (state.filters.cluster && row.cluster !== state.filters.cluster) return false;
    if (state.filters.country && row.country !== state.filters.country) return false;
    if (!term) return true;

    const haystack = [row.id, row.name, row.country, row.owner, row.product, row.clientSegment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

function parseRoute() {
  const hash = window.location.hash || PATH.home;
  const clean = hash.replace(/^#\/?/, "");
  const parts = clean.split("/");

  if (parts[0] === "home") return { view: "home" };
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
  return row.status === state.homeStatus;
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
              <td>${x.id}</td>
              <td class="key-col"><a href="${PATH.detail(group.id, country.country, country.id, x.id)}">${x.name}</a></td>
              <td>${x.status}</td>
              <td>${x.owner}</td>
              <td>${x.type === "CET" ? `${x.exposure || 0}/${x.cap || 0}` : `Limit ${x.limit || 0}`}</td>
            </tr>`)
            .join("")
        : "";

      countryOutput += `
        <tr class="country-row">
          <td><button class="tree-toggle" data-toggle-country="${countryKey}">${countryExpanded ? "-" : "+"}</button></td>
          <td>Country CAD</td>
          <td>${country.country}</td>
          <td>${country.id}</td>
          <td class="key-col"><a href="${PATH.country(group.id, country.country, country.id)}">${country.name}</a></td>
          <td>${country.status}</td>
          <td>CETs ${counts.cets} | SBX ${counts.sandboxes}</td>
          <td></td>
        </tr>
        ${leafRows}`;
    }

    const groupExpanded = state.expandedGroups.has(group.id);
    out.push(`
      <tr class="group-row">
        <td><button class="tree-toggle" data-toggle-group="${group.id}">${groupExpanded ? "-" : "+"}</button></td>
        <td>Group CAD</td>
        <td>Global</td>
        <td>${group.id}</td>
        <td class="key-col"><a href="${PATH.group(group.id)}">${group.name}</a></td>
        <td>${group.status}</td>
        <td>${group.owner}</td>
        <td></td>
      </tr>
      ${groupExpanded ? countryOutput : ""}`);
  }

  return `
    <section class="card">
      <h3>Hierarchical Tree Grid (Parent -> Child Rows)</h3>
      <table class="data-table hierarchy-table">
        <thead><tr><th></th><th>Type</th><th>Location</th><th>ID</th><th class="key-col">Name (Key)</th><th>Status</th><th>Owner/Counts</th><th>Info</th></tr></thead>
        <tbody>${out.join("") || '<tr><td colspan="8">No matching records</td></tr>'}</tbody>
      </table>
    </section>`;
}

function renderLeftPanel() {
  const r = state.route;
  const allDocs = [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ];
  const inboxCount = allDocs.filter((x) => x.status === "Active" || x.status === "In Flight").length;
  const alertCount = state.data.cets.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const entityTitle = (type) => ({ group: "Group CADs", country: "Country CADs", cet: "CETs", sandbox: "Sandboxes" }[type] || type);
  const rowStatus = (type, status, label) => `
    <button class="side-row ${state.homeType === type && state.homeStatus === status ? "on" : ""}" data-home-type="${type}" data-home-status="${status}">
      <span>${label}</span>
    </button>`;
  const statusRows = (type) => `
    <div class="side-rows">
      ${rowStatus(type, "Active", "Active")}
      ${rowStatus(type, "In Flight", "In Flight")}
      ${rowStatus(type, "Completed", "Completed")}
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
    <h2>Context</h2>
    <div class="context-block">
      <button class="side-link" data-home-view="home">Homepage</button>
      <button class="side-link" data-home-view="hierarchy">Hierarchy Explorer</button>
    </div>
    <div class="context-block">
      <h3>Trace</h3>
      ${group ? `<a class="side-link active" href="${PATH.group(group.id)}">${group.id} - ${group.name}</a>` : ""}
      ${countryCad ? `<a class="side-link active" href="${PATH.country(group.id, countryCad.country, countryCad.id)}">${countryCad.country}</a>` : ""}
      ${countryCad ? `<a class="side-link active" href="${PATH.country(group.id, countryCad.country, countryCad.id)}">${countryCad.name}</a>` : ""}
      ${child ? `<a class="side-link active" href="${PATH.detail(group.id, countryCad.country, countryCad.id, child.id)}">${child.name}</a>` : ""}
    </div>
    <div class="context-block">
      <h3>Sections</h3>
      ${detailSections.map((s) => `<a class="side-link" href="#${s.id}">${s.label}</a>`).join("")}
    </div>
    <div class="context-block">
      <h3>Status</h3>
      <div class="side-rows">
        ${rowStatus(state.homeType, "Active", "Active")}
        ${rowStatus(state.homeType, "In Flight", "In Flight")}
        ${rowStatus(state.homeType, "Completed", "Completed")}
      </div>
    </div>
    <div class="context-block">
      <h3>View Mode</h3>
      <button id="left-toggle" class="btn secondary small">Minimize</button>
    </div>`;

  const expanded = `
    <h2>Context</h2>
    <div class="context-block">
      <button class="side-link ${state.homeViewMode === "home" ? "active" : ""}" data-home-view="home">Homepage</button>
      <button class="side-link ${state.homeViewMode === "hierarchy" ? "active" : ""}" data-home-view="hierarchy">Hierarchy Explorer</button>
    </div>
    <div class="context-block">
      <h3>Document Filters</h3>
      <div class="side-group">
        <p class="side-head">${entityTitle("group")}</p>
        ${statusRows("group")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("country")}</p>
        ${statusRows("country")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("cet")}</p>
        ${statusRows("cet")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("sandbox")}</p>
        ${statusRows("sandbox")}
      </div>
    </div>
    <div class="context-block">
      <h3>Quick Views</h3>
      <button class="side-link ${state.quickView === "none" ? "active" : ""}" data-quick-view="none">All Docs</button>
      <button class="side-link ${state.quickView === "inbox" ? "active" : ""}" data-quick-view="inbox">Inbox <span class="mini-badge">${inboxCount}</span></button>
      <button class="side-link ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs">My Docs</button>
      <button class="side-link ${state.quickView === "needsaction" ? "active" : ""}" data-quick-view="needsaction">Needs Action <span class="mini-badge">${inboxCount}</span></button>
      <button class="side-link ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts">Governance Alerts <span class="mini-badge warn">${alertCount}</span></button>
    </div>
    <div class="context-block">
      <h3>Level</h3>
      <p class="muted">${r.view === "home" ? "Home" : r.view.toUpperCase()}</p>
      ${r.groupCadId ? `<p><strong>Group:</strong> ${r.groupCadId}</p>` : ""}
      ${r.countryCadId ? `<p><strong>Country CAD:</strong> ${r.countryCadId}</p>` : ""}
      ${r.childId ? `<p><strong>Child:</strong> ${r.childId}</p>` : ""}
    </div>
    <div class="context-block">
      <h3>View Mode</h3>
      <button id="left-toggle" class="btn secondary small">Minimize</button>
    </div>`;

  const collapsed = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill" title="Expand">=</button>
      <button class="icon-pill ${state.homeViewMode === "home" ? "active" : ""}" data-home-view="home" title="Home">🏠</button>
      <button class="icon-pill ${state.homeType === "group" ? "active" : ""}" data-home-type="group" data-home-status="Active" title="Group CADs">🗂</button>
      <button class="icon-pill ${state.homeType === "country" ? "active" : ""}" data-home-type="country" data-home-status="Active" title="Country CADs">🌍</button>
      <button class="icon-pill ${state.homeType === "cet" ? "active" : ""}" data-home-type="cet" data-home-status="Active" title="CETs">🧪</button>
      <button class="icon-pill ${state.homeType === "sandbox" ? "active" : ""}" data-home-type="sandbox" data-home-status="Active" title="Sandboxes">🧱</button>
      ${r.view !== "home" ? `<span class="icon-pill active" title="Opened Document">📝</span>` : ""}
    </div>`;

  const isCollapsed = dom.leftPanel.classList.contains("collapsed");
  dom.leftPanel.innerHTML = isCollapsed
    ? collapsed
    : (r.view === "home" ? expanded : detailExpanded);

  const btn = document.getElementById("left-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      dom.leftPanel.classList.toggle("collapsed");
      renderLeftPanel();
    });
  }

  dom.leftPanel.querySelectorAll("[data-home-view]").forEach((el) => {
    el.addEventListener("click", () => {
      state.homeViewMode = el.dataset.homeView;
      if (state.route.view !== "home") window.location.hash = PATH.home;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll("[data-home-type]").forEach((el) => {
    el.addEventListener("click", () => {
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
}

function renderHome() {
  const rows = {
    group: applyCommonFilters(state.data.groupCads),
    country: applyCommonFilters(state.data.countryCads),
    cet: applyCommonFilters(state.data.cets),
    sandbox: applyCommonFilters(state.data.sandboxes)
  };

  const selectedRows = rows[state.homeType]
    .filter((x) => x.status === state.homeStatus);

  const selectedTable = selectedRows.map((r) => `<tr>
    <td>${r.id}</td><td>${r.name}</td><td>${r.country || "Global"}</td><td>${r.product}</td><td>${r.status}</td><td>${r.owner}</td>
  </tr>`).join("");

  const allRows = [...rows.group, ...rows.country, ...rows.cet, ...rows.sandbox];
  const scopedRows = applyCommonFilters(allRows);
  const myScopeCount = scopedRows.length;
  const inFlightCount = scopedRows.filter((x) => x.status === "In Flight").length;
  const governanceCount = rows.cet.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const completedCount = scopedRows.filter((x) => x.status === "Completed").length;
  const statusText = `${state.homeType.toUpperCase()} / ${state.homeStatus}`;

  const selectedTableHtml = `
    <section class="card">
      <h3>Selected View: ${statusText} ${state.quickView !== "none" ? `| ${state.quickView}` : ""}</h3>
      <table class="data-table">
        <thead><tr><th>ID</th><th class="key-col">Name (Key)</th><th>Country</th><th>Product</th><th>Status</th><th>Owner</th></tr></thead>
        <tbody>${selectedTable || '<tr><td colspan="6">No rows</td></tr>'}</tbody>
      </table>
    </section>`;

  if (state.homeViewMode === "home") {
    dom.viewRoot.innerHTML = `
      <section class="card">
        <h2>Homepage</h2>
        <div class="main-search-row">
          <label for="main-search">Search</label>
          <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / Owner / Country" />
          <button class="btn secondary small" data-action="reset-search">Reset</button>
        </div>
        ${state.loadWarning ? `<p class="warning-note">${state.loadWarning}</p>` : ""}
        <div class="metric-grid">
          <div class="metric"><span>My Scope Docs</span><strong>${myScopeCount}</strong></div>
          <div class="metric"><span>In Flight</span><strong>${inFlightCount}</strong></div>
          <div class="metric"><span>Governance Alerts</span><strong>${governanceCount}</strong></div>
          <div class="metric"><span>Completed</span><strong>${completedCount}</strong></div>
        </div>
        <div class="quick-actions">
          <button class="btn secondary small" data-quick-action="mydocs">Show My Docs</button>
          <button class="btn secondary small" data-quick-action="needsaction">Needs Action</button>
          <button class="btn secondary small" data-quick-action="alerts">Governance Alerts</button>
          <button class="btn secondary small" data-quick-action="hierarchy">Open Hierarchy</button>
        </div>
      </section>
      ${selectedTableHtml}
    `;
  } else {
    dom.viewRoot.innerHTML = `
      <section class="card">
        <h2>Hierarchy Explorer</h2>
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
        <p class="muted">Selected view: ${statusText}${state.quickView !== "none" ? ` | ${state.quickView}` : ""}${state.filters.product ? ` | Product ${state.filters.product}` : ""}${state.filters.clientSegment ? ` | Segment ${state.filters.clientSegment}` : ""}${state.filters.cluster ? ` | Cluster ${state.filters.cluster}` : ""}${state.filters.country ? ` | Country ${state.filters.country}` : ""}</p>
      </section>
      ${renderHierarchyTable()}
    `;
  }

  dom.viewRoot.querySelectorAll("[data-quick-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.quickAction === "mydocs") state.quickView = "mydocs";
      if (btn.dataset.quickAction === "needsaction") state.quickView = "needsaction";
      if (btn.dataset.quickAction === "alerts") {
        state.homeType = "cet";
        state.quickView = "governancealerts";
      }
      if (btn.dataset.quickAction === "hierarchy") state.homeViewMode = "hierarchy";
      render();
    });
  });
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
    return `<tr><td>${c.country}</td><td>${c.id}</td><td>${c.status}</td><td>${counts.cets}</td><td>${counts.sandboxes}</td><td><a href="${PATH.country(group.id, c.country, c.id)}">Open</a></td></tr>`;
  }).join("");

  dom.viewRoot.innerHTML = `
    <section class="card" id="cad-overview">
      <h2>Group CAD Detail</h2>
      <p><strong>${group.id}</strong> - ${group.name}</p>
      <p class="muted">Product ${group.product} | Segment ${group.clientSegment} | Status ${group.status}</p>
    </section>
    <section class="card" id="cad-basic">
      <h3>Country CADs</h3>
      <table class="data-table">
        <thead><tr><th>Country</th><th>Country CAD</th><th>Status</th><th>CETs</th><th>Sandboxes</th><th>Action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No country CADs</td></tr>'}</tbody>
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
      <div class="split-two">
        <div>
          <h4>CETs</h4>
          <ul>${cets.map((x) => `<li><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">${x.id}</a> - ${x.status}</li>`).join("") || "<li>None</li>"}</ul>
        </div>
        <div>
          <h4>Sandboxes</h4>
          <ul>${sandboxes.map((x) => `<li><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">${x.id}</a> - ${x.status}</li>`).join("") || "<li>None</li>"}</ul>
        </div>
      </div>
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
  if (state.route.view === "group") state.homeType = "group";
  if (state.route.view === "country") state.homeType = "country";
  if (state.route.view === "cet") state.homeType = "cet";
  if (state.route.view === "sandbox") state.homeType = "sandbox";
  setBreadcrumb();
  renderLeftPanel();

  if (state.route.view === "home") renderHome();
  else if (state.route.view === "group") renderGroupDetail();
  else if (state.route.view === "country") renderCountryDetail();
  else renderCetOrSandbox();

  const showActions = state.route.view !== "home";
  dom.actionBar.style.display = showActions ? "flex" : "none";

  recomputeIssues();
  renderIssuePanel();

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
