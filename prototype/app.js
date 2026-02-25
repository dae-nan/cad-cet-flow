const SAMPLE_DATA = window.SAMPLE_HIERARCHY_DATA || {
  userProfile: { name: "User", cluster: "", countries: [] },
  groupCads: [],
  countryCads: [],
  cets: [],
  sandboxes: []
};

const FALLBACK_DATA = SAMPLE_DATA;

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
    country: "",
    status: ""
  },
  homeType: "group",
  homeStatus: "all",
  quickView: "none",
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
  searchInput: document.getElementById("global-search"),
  searchReset: document.getElementById("search-reset"),
  myDocsToggle: document.getElementById("my-docs-toggle"),
  productFilter: document.getElementById("filter-product"),
  segmentFilter: document.getElementById("filter-segment"),
  clusterFilter: document.getElementById("filter-cluster"),
  countryFilter: document.getElementById("filter-country"),
  statusFilter: document.getElementById("filter-status"),
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
    if (state.quickView === "needsaction") {
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
    if (state.filters.status && row.status !== state.filters.status) return false;
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

function renderLeftPanel() {
  const r = state.route;
  const entityTitle = (type) => ({
    group: "Group CADs",
    country: "Country CADs",
    cet: "CETs",
    sandbox: "Sandboxes"
  }[type] || type);

  const statusButtons = (type) => `
    <div class="side-statuses">
      <button class="side-chip ${state.homeType === type && state.homeStatus === "all" ? "on" : ""}" data-home-type="${type}" data-home-status="all">All</button>
      <button class="side-chip ${state.homeType === type && state.homeStatus === "Active" ? "on" : ""}" data-home-type="${type}" data-home-status="Active">Active</button>
      <button class="side-chip ${state.homeType === type && state.homeStatus === "In Flight" ? "on" : ""}" data-home-type="${type}" data-home-status="In Flight">In Flight</button>
      <button class="side-chip ${state.homeType === type && state.homeStatus === "Completed" ? "on" : ""}" data-home-type="${type}" data-home-status="Completed">Completed</button>
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
        ${statusButtons("group")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("country")}</p>
        ${statusButtons("country")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("cet")}</p>
        ${statusButtons("cet")}
      </div>
      <div class="side-group">
        <p class="side-head">${entityTitle("sandbox")}</p>
        ${statusButtons("sandbox")}
      </div>
    </div>
    <div class="context-block">
      <h3>Quick Views</h3>
      <button class="side-link ${state.quickView === "none" ? "active" : ""}" data-quick-view="none">All Docs</button>
      <button class="side-link ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs">My Docs</button>
      <button class="side-link ${state.quickView === "needsaction" ? "active" : ""}" data-quick-view="needsaction">Needs Action</button>
      <button class="side-link ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts">Governance Alerts</button>
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
      <button class="icon-pill ${state.homeType === "group" ? "active" : ""}" data-home-type="group" data-home-status="${state.homeStatus}" title="Group CADs">🗂</button>
      <button class="icon-pill ${state.homeType === "country" ? "active" : ""}" data-home-type="country" data-home-status="${state.homeStatus}" title="Country CADs">🌍</button>
      <button class="icon-pill ${state.homeType === "cet" ? "active" : ""}" data-home-type="cet" data-home-status="${state.homeStatus}" title="CETs">🧪</button>
      <button class="icon-pill ${state.homeType === "sandbox" ? "active" : ""}" data-home-type="sandbox" data-home-status="${state.homeStatus}" title="Sandboxes">🧱</button>
    </div>`;

  const isCollapsed = dom.leftPanel.classList.contains("collapsed");
  dom.leftPanel.innerHTML = isCollapsed ? collapsed : expanded;

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
    .filter((x) => state.homeStatus === "all" || x.status === state.homeStatus);

  const panel = (type, label) => {
    const r = rows[type];
    const counts = {
      active: r.filter((x) => x.status === "Active").length,
      inflight: r.filter((x) => x.status === "In Flight").length,
      completed: r.filter((x) => x.status === "Completed").length
    };
    return `<section class="card compact">
      <h3>${label}</h3>
      <div class="chip-row" data-type="${type}">
        <button class="chip ${state.homeType === type && state.homeStatus === "all" ? "on" : ""}" data-status="all">All ${r.length}</button>
        <button class="chip ${state.homeType === type && state.homeStatus === "Active" ? "on" : ""}" data-status="Active">Active ${counts.active}</button>
        <button class="chip ${state.homeType === type && state.homeStatus === "In Flight" ? "on" : ""}" data-status="In Flight">In Flight ${counts.inflight}</button>
        <button class="chip ${state.homeType === type && state.homeStatus === "Completed" ? "on" : ""}" data-status="Completed">Completed ${counts.completed}</button>
      </div>
    </section>`;
  };

  const treeRows = applyCommonFilters(state.data.groupCads).map((group) => {
    const countries = applyCommonFilters(
      state.data.countryCads.filter((c) => c.groupCadId === group.id)
    );

    const countryRows = countries.map((country) => {
      const counts = childCounts(country.id);
      const cets = applyCommonFilters(state.data.cets.filter((x) => x.countryCadId === country.id));
      const sbx = applyCommonFilters(state.data.sandboxes.filter((x) => x.countryCadId === country.id));

      const cetRows = cets.map((x) => `<tr class="leaf"><td></td><td></td><td>CET</td><td>${x.id}</td><td>${x.name}</td><td>${x.status}</td><td>${x.owner}</td><td><a href="${PATH.detail(group.id, country.country, country.id, x.id)}">Open</a></td></tr>`).join("");
      const sbxRows = sbx.map((x) => `<tr class="leaf"><td></td><td></td><td>Sandbox</td><td>${x.id}</td><td>${x.name}</td><td>${x.status}</td><td>${x.owner}</td><td><a href="${PATH.detail(group.id, country.country, country.id, x.id)}">Open</a></td></tr>`).join("");

      return `
        <tr class="country-row">
          <td></td>
          <td>Country CAD</td>
          <td>${country.country}</td>
          <td>${country.id}</td>
          <td>${country.name}</td>
          <td>${country.status}</td>
          <td>CETs ${counts.cets} | SBX ${counts.sandboxes}</td>
          <td><a href="${PATH.country(group.id, country.country, country.id)}">Open</a></td>
        </tr>
        ${cetRows}${sbxRows}`;
    }).join("");

    return `
      <tr class="group-row">
        <td>+</td>
        <td>Group CAD</td>
        <td>Global</td>
        <td>${group.id}</td>
        <td>${group.name}</td>
        <td>${group.status}</td>
        <td>${group.owner}</td>
        <td><a href="${PATH.group(group.id)}">Open</a></td>
      </tr>${countryRows}`;
  }).join("");

  const selectedTable = selectedRows.map((r) => `<tr>
    <td>${r.id}</td><td>${r.name}</td><td>${r.country || "Global"}</td><td>${r.product}</td><td>${r.status}</td><td>${r.owner}</td>
  </tr>`).join("");

  const allRows = [...rows.group, ...rows.country, ...rows.cet, ...rows.sandbox];
  const scopedRows = applyCommonFilters(allRows);
  const myScopeCount = scopedRows.length;
  const inFlightCount = scopedRows.filter((x) => x.status === "In Flight").length;
  const governanceCount = rows.cet.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const completedCount = scopedRows.filter((x) => x.status === "Completed").length;

  const selectedTableHtml = `
    <section class="card">
      <h3>Selected View: ${state.homeType.toUpperCase()} (${state.homeStatus}) ${state.quickView !== "none" ? `| ${state.quickView}` : ""}</h3>
      <table class="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Country</th><th>Product</th><th>Status</th><th>Owner</th></tr></thead>
        <tbody>${selectedTable || '<tr><td colspan="6">No rows</td></tr>'}</tbody>
      </table>
    </section>`;

  const hierarchyPanel = `
    <section class="card">
      <h3>Hierarchical Tree Grid (Parent -> Child Rows)</h3>
      <table class="data-table">
        <thead><tr><th></th><th>Type</th><th>Location</th><th>ID</th><th>Name</th><th>Status</th><th>Owner/Counts</th><th>Action</th></tr></thead>
        <tbody>${treeRows || '<tr><td colspan="8">No matching records</td></tr>'}</tbody>
      </table>
    </section>`;

  if (state.homeViewMode === "home") {
    dom.viewRoot.innerHTML = `
      <section class="card">
        <h2>Homepage</h2>
        <p class="muted">Search works across CAD/CET/Sandbox IDs, names, country, and owner.</p>
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
        <p class="muted">Parent-child grid view by Group CAD, Country CAD, CET, and Sandbox.</p>
      </section>
      ${selectedTableHtml}
      ${hierarchyPanel}
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
    <section class="card">
      <h2>Group CAD Detail</h2>
      <p><strong>${group.id}</strong> - ${group.name}</p>
      <p class="muted">Product ${group.product} | Segment ${group.clientSegment} | Status ${group.status}</p>
    </section>
    <section class="card">
      <h3>Country CADs</h3>
      <table class="data-table">
        <thead><tr><th>Country</th><th>Country CAD</th><th>Status</th><th>CETs</th><th>Sandboxes</th><th>Action</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No country CADs</td></tr>'}</tbody>
      </table>
    </section>`;
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
    <section class="card" id="section-country">
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
    <section class="card">
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
    </section>`;
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
      <section class="card" id="section-sandbox">
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
      </section>`;
  } else {
    dom.viewRoot.innerHTML = `
      <section class="card" id="section-cet">
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
      </section>`;
  }
}

function setBreadcrumb() {
  const r = state.route;
  if (r.view === "home") {
    dom.breadcrumb.textContent = "Home";
    return;
  }
  if (r.view === "group") {
    dom.breadcrumb.textContent = `Home / ${r.groupCadId}`;
    return;
  }
  if (r.view === "country") {
    dom.breadcrumb.textContent = `Home / ${r.groupCadId} / ${r.country} / ${r.countryCadId}`;
    return;
  }
  dom.breadcrumb.textContent = `Home / ${r.groupCadId} / ${r.country} / ${r.countryCadId} / ${r.childId}`;
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
        sectionId: "section-cet",
        message: "CET exposure exceeds cap.",
        hint: `Current ${exposure}, allowed ${cap}, reduce by ${exposure - cap}.`
      });
    } else if ((exposure / cap) * 100 >= 80 && !ack) {
      issues.push({
        id: "GOV-WARN-ACK-010",
        type: "Warning",
        sectionId: "section-cet",
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

function populateFilters() {
  const allRows = [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ];

  const fill = (el, values) => {
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      el.appendChild(o);
    });
  };

  fill(dom.productFilter, uniqueValues(allRows, "product"));
  fill(dom.segmentFilter, uniqueValues(allRows, "clientSegment"));
  fill(dom.clusterFilter, uniqueValues(allRows, "cluster"));
  fill(dom.countryFilter, uniqueValues(allRows, "country"));
}

function initEvents() {
  window.addEventListener("hashchange", render);

  dom.searchInput.addEventListener("input", () => {
    state.searchTerm = dom.searchInput.value;
    render();
  });

  dom.searchReset.addEventListener("click", () => {
    dom.searchInput.value = "";
    state.searchTerm = "";
    state.filters = { myDocs: false, product: "", clientSegment: "", cluster: "", country: "", status: "" };
    state.quickView = "none";
    dom.myDocsToggle.checked = false;
    dom.productFilter.value = "";
    dom.segmentFilter.value = "";
    dom.clusterFilter.value = "";
    dom.countryFilter.value = "";
    dom.statusFilter.value = "";
    render();
  });

  dom.myDocsToggle.addEventListener("change", () => {
    state.filters.myDocs = dom.myDocsToggle.checked;
    render();
  });
  dom.productFilter.addEventListener("change", () => { state.filters.product = dom.productFilter.value; render(); });
  dom.segmentFilter.addEventListener("change", () => { state.filters.clientSegment = dom.segmentFilter.value; render(); });
  dom.clusterFilter.addEventListener("change", () => { state.filters.cluster = dom.clusterFilter.value; render(); });
  dom.countryFilter.addEventListener("change", () => { state.filters.country = dom.countryFilter.value; render(); });
  dom.statusFilter.addEventListener("change", () => { state.filters.status = dom.statusFilter.value; render(); });

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
