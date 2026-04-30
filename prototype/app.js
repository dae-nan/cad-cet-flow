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
  { id: "cad-summary", label: "Summary" },
  { id: "cad-strategy", label: "Strategy" },
  { id: "cad-basic", label: "Country CADs" },
  { id: "cad-portfolio", label: "Portfolio Details" },
  { id: "cad-kac", label: "Key Acceptance Criteria" },
  { id: "cad-appendix", label: "Appendix" },
  { id: "cad-attachments", label: "Attachments" }
];
const CET_SECTIONS = [
  { id: "cet-overview", label: "A Summary" },
  { id: "cet-objective", label: "B Objective" },
  { id: "cet-testing", label: "C Testing Criteria" },
  { id: "cet-portfolio", label: "D Portfolio Analysis" },
  { id: "cet-financial", label: "E Financial Projection" },
  { id: "cet-customer-impact", label: "F Customer Impact" },
  { id: "cet-risk", label: "G Credit Risk Assessment" },
  { id: "cet-exceptions", label: "H Exceptions" },
  { id: "cet-commentary", label: "I WRB Commentary" },
  { id: "cet-other-risks", label: "J Other Risks" },
  { id: "cet-approvals-1lod", label: "K 1LOD Proposal" },
  { id: "cet-approvals-2lod", label: "L 2LOD Approval" }
];
const SANDBOX_SECTIONS = [
  { id: "sbx-overview", label: "Overview" },
  { id: "sbx-scope", label: "Scope" },
  { id: "sbx-guardrails", label: "Guardrails" },
  { id: "sbx-evidence", label: "Evidence" }
];
const CET_FORM_CONFIG = {
  version: "1.0",
  sections: CET_SECTIONS.map((section) => {
    const ownerRoleDefault = section.id.includes("risk") || section.id.includes("commentary") || section.id.endsWith("2lod")
      ? "2LOD"
      : "1LOD";
    return { id: section.id, label: section.label, enabled: true, ownerRoleDefault };
  }),
  guardrails: {
    mode: "dual-limit",
    rules: [
      { ruleId: "GOV-CAD-UTIL-001", boundaryType: "parentCad", thresholdPct: 85, severity: "Blocker" },
      { ruleId: "GOV-SEG-CONC-004", boundaryType: "segmentCap", thresholdPct: 20, severity: "Warning" }
    ]
  },
  fields: [
    { id: "name", type: "string", required: true, sectionId: "cet-overview" },
    { id: "rationale", type: "text", required: true, sectionId: "cet-overview" },
    { id: "products", type: "string[]", required: true, sectionId: "cet-overview" },
    { id: "clientSegments", type: "string[]", required: true, sectionId: "cet-overview" },
    { id: "startDate", type: "date", required: true, sectionId: "cet-overview" },
    { id: "endDate", type: "date", required: true, sectionId: "cet-overview" },
    { id: "peakExposure", type: "number", required: true, sectionId: "cet-financial" },
    { id: "parentCadThresholdPct", type: "number", required: true, sectionId: "cet-risk" },
    { id: "segmentThresholdPct", type: "number", required: true, sectionId: "cet-risk" }
  ]
};

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
  homeStatus: "ACTIVE",
  portfolioType: "all",
  quickView: "none",
  inboxScope: "my",
  inboxType: "all",
  inboxStatus: "all",
  sorters: {
    home: [{ key: "name", dir: "asc" }],
    inbox: [{ key: "name", dir: "asc" }],
    portfolio: [{ key: "name", dir: "asc" }],
    groupDetail: [{ key: "name", dir: "asc" }],
    countryDetail: [{ key: "name", dir: "asc" }]
  },
  tablePage: {
    home: 1,
    inbox: 1,
    groupDetail: 1,
    countryDetail: 1
  },
  visibleColumns: {
    home: { legalEntity: false, id: false, product: false, clientSegment: false, rm: false, businessProposer: false, approver: false },
    inbox: { legalEntity: false, id: false, product: false, clientSegment: false, rm: false, businessProposer: false, approver: false },
    portfolio: { legalEntity: false, id: false, rm: false, businessProposer: false, approver: false, type: false },
    groupDetail: { legalEntity: false, id: false },
    countryDetail: { legalEntity: false, id: false }
  },
  portfolioColumnOrder: [],
  portfolioFiltersOpen: false,
  openColumnMenu: "",
  openHelpMenu: false,
  compactDefaultsMode: "",
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
    resolvedBannerUntil: 0,
    autoHiddenBySection: false
  },
  createDrawer: {
    open: false,
    step: 1,
    errors: [],
    warnings: [],
    draft: {
      parentCountryCadId: "",
      products: [],
      clientSegments: [],
      name: "",
      rationale: "",
      startDate: "",
      endDate: ""
    }
  },
  governanceModal: {
    open: false,
    issueId: ""
  },
  previousIssueCount: 0,
  lastAppliedDraftKey: "",
  actor: {
    role: "RM",
    name: "Country RM",
    region: "SG",
    country: "Singapore",
    product: "Credit Cards",
    clientSegment: "Retail"
  }
};

const dom = {
  topbar: document.querySelector(".topbar"),
  breadcrumb: document.getElementById("breadcrumb"),
  leftPanel: document.getElementById("left-panel"),
  viewRoot: document.getElementById("view-root"),
  actionBar: document.getElementById("action-bar"),
  saveBtn: document.getElementById("save-btn"),
  validateBtn: document.getElementById("validate-btn"),
  submitBtn: document.getElementById("submit-btn"),
  issuePanel: document.getElementById("issue-panel"),
  openPanelBtn: document.getElementById("open-panel-btn"),
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
  backTopFab: document.getElementById("backtop-fab"),
  createCetDrawer: document.getElementById("create-cet-drawer"),
  governanceModal: document.getElementById("governance-modal"),
  topbarRoleSelect: document.getElementById("topbar-role-select")
};

const TABLE_PAGE_SIZE = {
  home: 6,
  inbox: 6,
  groupDetail: 6,
  countryDetail: 6
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

const ACTOR_ROLES = {
  RM: "RM",
  BUSINESS_PROPOSER: "BUSINESS_PROPOSER",
  EDITOR_2LOD: "EDITOR_2LOD",
  APPROVER_2LOD: "APPROVER_2LOD",
  GOVERNANCE_ADMIN: "GOVERNANCE_ADMIN",
  GLOBAL_HEAD: "GLOBAL_HEAD"
};

const ROLE_DEFAULTS = {
  [ACTOR_ROLES.RM]: { region: "Regional", country: "", product: "", clientSegment: "", countries: [] },
  [ACTOR_ROLES.BUSINESS_PROPOSER]: { region: "Regional", country: "", product: "", clientSegment: "", countries: [] },
  [ACTOR_ROLES.EDITOR_2LOD]: { region: "Regional", country: "", product: "", clientSegment: "", countries: [] },
  [ACTOR_ROLES.APPROVER_2LOD]: { region: "Regional", country: "", product: "", clientSegment: "", countries: [] },
  [ACTOR_ROLES.GOVERNANCE_ADMIN]: { region: "Global", country: "All Countries", product: "All Products", clientSegment: "All Segments", countries: ["*"] },
  [ACTOR_ROLES.GLOBAL_HEAD]: { region: "Global", country: "All Countries", product: "All Products", clientSegment: "All Segments", countries: ["*"] }
};

const WORKFLOW_STAGES = {
  DRAFT_RM: "DRAFT_RM",
  DRAFT_BUSINESS_PROPOSER: "DRAFT_BUSINESS_PROPOSER",
  SUBMITTED_2LOD: "SUBMITTED_2LOD",
  DECISION_ACCEPTED: "DECISION_ACCEPTED",
  DECISION_ACCEPTED_CAVEATS: "DECISION_ACCEPTED_CAVEATS",
  DECISION_REJECTED: "DECISION_REJECTED",
  RETURNED_REWORK_RM: "RETURNED_REWORK_RM",
  RETURNED_REWORK_BUSINESS_PROPOSER: "RETURNED_REWORK_BUSINESS_PROPOSER"
};

const STATUS_ABBR = {
  DRAFT: "DRAF",
  PROPOSING: "PROP",
  APPROVING: "APRV",
  ACTIVE: "ACTV",
  RETIRED: "RETR",
  INFLIGHT: "INFL",
  SUCCESS: "SUCC",
  FAILED: "FAIL",
  "GOVERNANCE ALERTS": "ALRT",
  ALERTS: "ALRT",
  "MY DOCS": "MYDC",
  CLOSED: "CLOS"
};

function viewportMode() {
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

function isCompactViewport() {
  return viewportMode() !== "desktop";
}

function shortCode(text, size = 4) {
  return String(text || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, size) || "-";
}

function attrEscape(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function compactStatusLabel(status) {
  const normalized = String(status || "").toUpperCase().trim();
  return STATUS_ABBR[normalized] || shortCode(normalized, 4);
}

function compactMetricLabel(label) {
  if (!isCompactViewport()) return label;
  const normalized = String(label || "").toUpperCase().trim();
  return STATUS_ABBR[normalized] || shortCode(normalized, 4);
}

function compactHeader(full, short) {
  return isCompactViewport() ? short : full;
}

function truncateWithTitle(text, max = 44) {
  const raw = String(text || "-");
  if (raw.length <= max) return `<span class="ellipsis" title="${attrEscape(raw)}">${raw}</span>`;
  return `<span class="ellipsis" title="${attrEscape(raw)}">${raw.slice(0, max - 1)}…</span>`;
}

function timelineToken(label) {
  const normalized = String(label || "").toUpperCase().trim();
  if (normalized.startsWith("OUTCOME: SUCCESS")) return "SU";
  if (normalized.startsWith("OUTCOME: FAILED")) return "FA";
  const compact = STATUS_ABBR[normalized] || shortCode(normalized, 2);
  return compact.slice(0, 2);
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();
}

function filterValues(key) {
  const v = state.filters[key];
  if (Array.isArray(v)) return v;
  if (v === "" || v == null) return [];
  return [v];
}

function statusSetForType(type) {
  if (type === "group" || type === "country" || type === "GROUP" || type === "COUNTRY") {
    return ["DRAFT", "PROPOSING", "APPROVING", "ACTIVE", "RETIRED"];
  }
  if (type === "cet" || type === "sandbox" || type === "CET" || type === "SANDBOX") {
    return ["DRAFT", "INFLIGHT", "SUCCESS", "FAILED"];
  }
  return [];
}

function normalizeStatus(status, type) {
  const raw = String(status || "").trim().toUpperCase().replace(/\s+/g, "");
  if (type === "cad") {
    if (raw === "PROPOSING") return "PROPOSING";
    if (raw === "APPROVING") return "APPROVING";
    if (raw === "ACTIVE") return "ACTIVE";
    if (raw === "RETIRED") return "RETIRED";
    if (raw === "DRAFT") return "DRAFT";
    if (raw === "INFLIGHT") return "APPROVING";
    if (raw === "COMPLETED" || raw === "SUCCESS") return "RETIRED";
    if (raw === "FAILED") return "RETIRED";
    return "DRAFT";
  }
  if (raw === "DRAFT") return "DRAFT";
  if (raw === "INFLIGHT") return "INFLIGHT";
  if (raw === "SUCCESS" || raw === "COMPLETED" || raw === "ACTIVE") return "SUCCESS";
  if (raw === "FAILED" || raw === "RETIRED") return "FAILED";
  return "DRAFT";
}

function normalizeAllStatuses(data) {
  data.groupCads = data.groupCads.map((row) => ({ ...row, status: normalizeStatus(row.status, "cad") }));
  data.countryCads = data.countryCads.map((row) => ({ ...row, status: normalizeStatus(row.status, "cad") }));
  data.cets = data.cets.map((row) => ({ ...row, status: normalizeStatus(row.status, "child") }));
  data.sandboxes = data.sandboxes.map((row) => ({ ...row, status: normalizeStatus(row.status, "child") }));
  if (data.cets[1]) data.cets[1].status = "DRAFT";
  if (data.cets[6]) data.cets[6].status = "FAILED";
  if (data.sandboxes[2]) data.sandboxes[2].status = "DRAFT";
  if (data.sandboxes[4]) data.sandboxes[4].status = "FAILED";
}

function workflowStageLabel(stage) {
  const map = {
    [WORKFLOW_STAGES.DRAFT_RM]: "Draft - 1st Line Working",
    [WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER]: "Draft - Proposer Review",
    [WORKFLOW_STAGES.SUBMITTED_2LOD]: "Submitted to 2nd Line Approver (CCH)",
    [WORKFLOW_STAGES.DECISION_ACCEPTED]: "2nd Line Decision - Accepted",
    [WORKFLOW_STAGES.DECISION_ACCEPTED_CAVEATS]: "2nd Line Decision - Accepted with Caveats",
    [WORKFLOW_STAGES.DECISION_REJECTED]: "2nd Line Decision - Rejected",
    [WORKFLOW_STAGES.RETURNED_REWORK_RM]: "Returned for Rework - RM",
    [WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER]: "Returned for Rework - Proposer"
  };
  return map[stage] || "Draft - RM Working";
}

function actorRoleLabel(role) {
  const map = {
    [ACTOR_ROLES.RM]: "1st Line RM",
    [ACTOR_ROLES.BUSINESS_PROPOSER]: "Proposer",
    [ACTOR_ROLES.EDITOR_2LOD]: "2nd Line Editor",
    [ACTOR_ROLES.APPROVER_2LOD]: "2nd Line Approver (CCH)",
    [ACTOR_ROLES.GOVERNANCE_ADMIN]: "Governance Admin",
    [ACTOR_ROLES.GLOBAL_HEAD]: "Global Head"
  };
  return map[role] || role;
}

function stageFromStatus(status, type = "child") {
  if (type === "cad") {
    if (status === "PROPOSING") return WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER;
    if (status === "APPROVING") return WORKFLOW_STAGES.SUBMITTED_2LOD;
    if (status === "ACTIVE") return WORKFLOW_STAGES.DECISION_ACCEPTED;
    if (status === "RETIRED") return WORKFLOW_STAGES.DECISION_REJECTED;
    return WORKFLOW_STAGES.DRAFT_RM;
  }
  if (status === "INFLIGHT") return WORKFLOW_STAGES.SUBMITTED_2LOD;
  if (status === "SUCCESS") return WORKFLOW_STAGES.DECISION_ACCEPTED;
  if (status === "FAILED") return WORKFLOW_STAGES.DECISION_REJECTED;
  return WORKFLOW_STAGES.DRAFT_RM;
}

function defaultParticipants(row) {
  const rm = row.rm || row.owner || "Country RM";
  const bp = row.businessProposer || `Proposer - ${row.country || "Region"}`;
  const editor = row.editor || row.secondLineEditor || "2LoD Editor";
  const approver = row.approver || row.secondLineApprover || "Country Credit Head";
  return {
    rm,
    businessProposer: bp,
    editor: editor,
    approver: approver,
    governanceAdmin: "Governance Ops"
  };
}

function ensureWorkflowRow(row, type = "child") {
  const existingParticipants = row.participants || {};
  const participants = {
    ...defaultParticipants(row),
    ...existingParticipants,
    editor: existingParticipants.editor || existingParticipants.secondLineEditor || defaultParticipants(row).editor,
    approver: existingParticipants.approver || existingParticipants.secondLineApprover || defaultParticipants(row).approver
  };
  delete participants.secondLineEditor;
  delete participants.secondLineApprover;
  const workflow = row.workflow || {
    stage: stageFromStatus(row.status, type),
    lastDecision: "",
    sectionComments: {},
    endCommentary: ""
  };
  return {
    ...row,
    participants,
    workflow
  };
}

function ensureWorkflowData(data) {
  data.groupCads = data.groupCads.map((row) => ensureWorkflowRow(row, "cad"));
  data.countryCads = data.countryCads.map((row) => ensureWorkflowRow(row, "cad"));
  data.cets = data.cets.map((row) => ensureWorkflowRow(row, "child"));
  data.sandboxes = data.sandboxes.map((row) => ensureWorkflowRow(row, "child"));
}

function currentActorNameForRole(role, row) {
  const p = row?.participants || defaultParticipants(row || {});
  if (role === ACTOR_ROLES.RM) return p.rm;
  if (role === ACTOR_ROLES.BUSINESS_PROPOSER) return p.businessProposer;
  if (role === ACTOR_ROLES.EDITOR_2LOD) return p.editor;
  if (role === ACTOR_ROLES.APPROVER_2LOD) return p.approver;
  if (role === ACTOR_ROLES.GLOBAL_HEAD) return "Global Head";
  return p.governanceAdmin;
}

function actorScopeCountries() {
  if (!state.actor) return new Set();
  const countries = state.actor.countries || [];
  return new Set(countries);
}

function rowInActorCountryScope(row) {
  const scope = actorScopeCountries();
  if (!scope.size || scope.has("*")) return true;
  return scope.has(row.country);
}

function isGovernanceAlertRow(row) {
  const util = Number(row.exposure) / Math.max(1, Number(row.cap || 0));
  return Number.isFinite(util) && util >= 0.8;
}

function roleOwnsWorkflowStage(role, row) {
  const stage = row?.workflow?.stage;
  if (role === ACTOR_ROLES.RM) return stage === WORKFLOW_STAGES.DRAFT_RM || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM;
  if (role === ACTOR_ROLES.BUSINESS_PROPOSER) return stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER;
  if (role === ACTOR_ROLES.EDITOR_2LOD) {
    if ((row.participants || {}).editor !== state.actor.name) return false;
    return stage === WORKFLOW_STAGES.DRAFT_RM
      || stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER
      || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM
      || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER;
  }
  if (role === ACTOR_ROLES.APPROVER_2LOD) {
    if ((row.participants || {}).approver !== state.actor.name) return false;
    return stage === WORKFLOW_STAGES.SUBMITTED_2LOD;
  }
  if (role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD) return isGovernanceAlertRow(row) || stage === WORKFLOW_STAGES.SUBMITTED_2LOD;
  return false;
}

function actorHasCountryApprovalAuthority(row) {
  if (state.actor.role !== ACTOR_ROLES.APPROVER_2LOD) return false;
  return rowInActorCountryScope(row);
}

function hasDelegatedEditGrant(row) {
  const grants = state.data?.delegatedEditGrants || [];
  const now = Date.now();
  return grants.some((g) => {
    if (!g || g.role !== ACTOR_ROLES.GLOBAL_HEAD) return false;
    if (g.revokedAt) return false;
    if (g.expiry && new Date(g.expiry).getTime() < now) return false;
    if (!g.scopeCountries || g.scopeCountries.includes("*")) return true;
    return g.scopeCountries.includes(row.country);
  });
}

function syncActorProfile(role, row) {
  const user = state.data.userProfile || {};
  const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS[ACTOR_ROLES.RM];
  const fallbackCountry = state.data.countryCads?.[0]?.country || "Singapore";
  const userCountries = (user.countries && user.countries.length ? user.countries : [fallbackCountry]).filter(Boolean);
  const countryForRole = role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD
    ? "All Countries"
    : userCountries[0];
  state.actor.region = role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD ? defaults.region : (user.cluster || defaults.region);
  state.actor.country = countryForRole || defaults.country;
  state.actor.product = role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD ? defaults.product : (state.data.countryCads?.[0]?.product || defaults.product || "Credit Cards");
  state.actor.clientSegment = role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD ? defaults.clientSegment : (state.data.countryCads?.[0]?.clientSegment || defaults.clientSegment || "Retail");
  state.actor.countries = role === ACTOR_ROLES.GOVERNANCE_ADMIN || role === ACTOR_ROLES.GLOBAL_HEAD ? ["*"] : userCountries;
  state.actor.name = currentActorNameForRole(role, row);
}

function applyCommonFilters(rows, opts = {}) {
  const term = state.searchTerm.trim().toLowerCase();
  const productFilters = filterValues("product");
  const segmentFilters = filterValues("clientSegment");
  const countryFilters = filterValues("country");
  return rows.filter((row) => {
    const myDocsActive = state.filters.myDocs || state.quickView === "mydocs";
    if (myDocsActive) {
      if (!rowInActorCountryScope(row) && row.cluster !== state.actor.region) return false;
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

    const participants = row.participants || {};
    const haystack = [row.id, row.name, row.country, row.owner, participants.rm, participants.businessProposer, participants.approver, row.product, row.clientSegment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

function isMyScopeRow(row) {
  if (!rowInActorCountryScope(row)) return false;
  if (row.createdByCurrentUser && (state.actor.role === ACTOR_ROLES.RM || state.actor.role === ACTOR_ROLES.BUSINESS_PROPOSER)) return true;
  return roleOwnsWorkflowStage(state.actor.role, row);
}

function isAssignedToMeRow(row) {
  if (!rowInActorCountryScope(row)) return false;
  return isMyScopeRow(row);
}

function teamScopeProducts() {
  const countries = actorScopeCountries();
  const products = new Set();
  [
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ].forEach((row) => {
    if (!countries.size || countries.has("*") || countries.has(row.country)) products.add(row.product);
  });
  return [...products];
}

function isAssignedToTeamRow(row) {
  const countries = actorScopeCountries();
  const products = teamScopeProducts();
  const countryMatch = countries.size === 0 || countries.has("*") || countries.has(row.country);
  const productMatch = products.length === 0 || products.includes(row.product);
  return countryMatch && productMatch;
}

function inboxStatusFor(row) {
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
    .filter((row) => state.inboxType === "all" || row.type === state.inboxType)
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
          const participants = row.participants || {};
          const haystack = [row.id, row.name, row.owner, participants.rm, participants.businessProposer, participants.approver, row.country, row.product, row.clientSegment]
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

function clampPct(num) {
  return Math.max(0, Math.min(200, Number(num || 0)));
}

function formatPct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function toNum(value, fallback = 0) {
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

function defaultCetFinancials(cet, index = 0) {
  const exposure = Math.max(1, Number(cet.exposure || 1));
  const peakExposure = Number(cet.limits?.peakExposure ?? exposure);
  const accountsBooked = Math.round(exposure * 72 + 800 + index * 17);
  const accountsControlGroup = Math.round(accountsBooked * 0.22);
  const avgCreditLimitExtended = Math.round((peakExposure * 1000000) / Math.max(accountsBooked, 1));
  const totalCreditLimitExtended = Math.round(peakExposure * 1000000);
  const totalIncrementalCreditLimit = Math.round(totalCreditLimitExtended * 0.28);
  const y1Customers = Number((exposure * 0.08).toFixed(1));
  const y2Customers = Number((exposure * 0.11).toFixed(1));
  const y3Customers = Number((exposure * 0.13).toFixed(1));

  const metricRow = (label, y1, y2, y3, assumption) => ({
    label,
    y1,
    y2,
    y3,
    cumulative: typeof y1 === "number" && typeof y2 === "number" && typeof y3 === "number"
      ? Number((y1 + y2 + y3).toFixed(2))
      : "-",
    assumption
  });

  return {
    size: {
      accountsBookedTested: accountsBooked,
      accountsControlGroup,
      peakExposure,
      startTrackingDate: cet.startDate || "2026-01-15",
      endBookingsDate: cet.endDate || "2026-07-15",
      avgCreditLimitExtended,
      totalCreditLimitExtended,
      totalIncrementalCreditLimit
    },
    pnl: {
      metrics: [
        metricRow("# Customers (000s)", y1Customers, y2Customers, y3Customers, "Ramp-up through phased sourcing by segment."),
        metricRow("Total lines/disbursals (USD m)", Number((exposure * 1.2).toFixed(1)), Number((exposure * 1.55).toFixed(1)), Number((exposure * 1.78).toFixed(1)), "Conversion improves after scorecard tuning."),
        metricRow("ANR (%)", Number((2.2 + (index % 3) * 0.1).toFixed(2)), Number((2.5 + (index % 3) * 0.1).toFixed(2)), Number((2.8 + (index % 3) * 0.1).toFixed(2)), "Risk-based pricing uplift from month 4."),
        metricRow("ENR (%)", Number((3.6 + (index % 2) * 0.12).toFixed(2)), Number((3.9 + (index % 2) * 0.12).toFixed(2)), Number((4.1 + (index % 2) * 0.12).toFixed(2)), "Improved revolve mix and fee income.")
      ],
      incomeCost: [
        metricRow("Gross Interest Income", Number((exposure * 0.19).toFixed(1)), Number((exposure * 0.24).toFixed(1)), Number((exposure * 0.29).toFixed(1)), "Portfolio seasoning and stable utilization."),
        metricRow("Cost of Funds", Number((exposure * 0.07).toFixed(1)), Number((exposure * 0.09).toFixed(1)), Number((exposure * 0.1).toFixed(1)), "Funding spread assumes current treasury curve."),
        metricRow("Net Interest Income", Number((exposure * 0.12).toFixed(1)), Number((exposure * 0.15).toFixed(1)), Number((exposure * 0.19).toFixed(1)), "Margin expansion from better cohort mix."),
        metricRow("Net Fees Income", Number((exposure * 0.03).toFixed(1)), Number((exposure * 0.04).toFixed(1)), Number((exposure * 0.05).toFixed(1)), "Annual fee and usage fee growth."),
        metricRow("Revenue", Number((exposure * 0.15).toFixed(1)), Number((exposure * 0.2).toFixed(1)), Number((exposure * 0.24).toFixed(1)), "Revenue reflects net interest plus fee drivers."),
        metricRow("Cost", Number((exposure * 0.06).toFixed(1)), Number((exposure * 0.08).toFixed(1)), Number((exposure * 0.09).toFixed(1)), "Opex includes servicing and collections.")
      ],
      loanImpairment: [
        metricRow("Gross Charge-off", Number((exposure * 0.025).toFixed(2)), Number((exposure * 0.031).toFixed(2)), Number((exposure * 0.034).toFixed(2)), "Higher in new-to-bank cohorts."),
        metricRow("ECL", Number((exposure * 0.018).toFixed(2)), Number((exposure * 0.022).toFixed(2)), Number((exposure * 0.024).toFixed(2)), "Stage migration based on historical vintage behavior."),
        metricRow("Loan Impairment", Number((exposure * 0.02).toFixed(2)), Number((exposure * 0.024).toFixed(2)), Number((exposure * 0.026).toFixed(2)), "Overlay includes stress scenario buffer.")
      ],
      profit: [
        metricRow("Loss Adjusted Returns (Revenue - LI)", Number((exposure * 0.13).toFixed(1)), Number((exposure * 0.18).toFixed(1)), Number((exposure * 0.21).toFixed(1)), "Positive from cohort quality improvement."),
        metricRow("Operating Profit", Number((exposure * 0.09).toFixed(1)), Number((exposure * 0.12).toFixed(1)), Number((exposure * 0.14).toFixed(1)), "Efficiency gains from operating scale."),
        metricRow("Profit After Tax", Number((exposure * 0.07).toFixed(1)), Number((exposure * 0.1).toFixed(1)), Number((exposure * 0.12).toFixed(1)), "Effective tax rate assumed stable."),
        metricRow("Loss Coverage (LI/Revenue)", Number((13 + (index % 4) * 1.1).toFixed(1)), Number((12.2 + (index % 3) * 1).toFixed(1)), Number((11.7 + (index % 2) * 0.8).toFixed(1)), "Improves as risk calibration stabilizes."),
        metricRow("RWA (incl OP RWA)", Number((exposure * 0.62).toFixed(1)), Number((exposure * 0.67).toFixed(1)), Number((exposure * 0.7).toFixed(1)), "RWA trend aligned with growth and risk profile."),
        metricRow("RoTE (PAT/Equity) %", Number((10.4 + (index % 3) * 0.7).toFixed(1)), Number((11.8 + (index % 3) * 0.8).toFixed(1)), Number((12.9 + (index % 3) * 0.8).toFixed(1)), "Equity allocation based on internal capital model.")
      ]
    }
  };
}

function defaultEndorsements(cet, index = 0) {
  return {
    oneLod: {
      certAccepted: true,
      certAcceptedAt: `2026-02-${String(10 + (index % 15)).padStart(2, "0")}T09:30:00Z`,
      certAcceptedBy: cet.owner || "Country Risk Manager",
      nameDesignation: `${cet.owner || "Country Risk Manager"}, Country Credit Head`,
      endorsementDate: `2026-02-${String(11 + (index % 15)).padStart(2, "0")}`,
      conditions: index % 2 === 0 ? "Weekly delinquency checkpoint during first 8 weeks." : "No additional conditions."
    }
  };
}

function createSectionOwnership(existing = []) {
  const existingMap = new Map(existing.map((x) => [x.sectionId, x]));
  return CET_FORM_CONFIG.sections.map((section) => {
    const seed = existingMap.get(section.id) || {};
    return {
      sectionId: section.id,
      ownerRole: seed.ownerRole || section.ownerRoleDefault,
      currentEditor: seed.currentEditor || null,
      lastEditedAt: seed.lastEditedAt || null
    };
  });
}

function seedCets(rawData) {
  const countriesById = new Map(rawData.countryCads.map((x) => [x.id, x]));
  rawData.cets = rawData.cets.map((cet, index) => {
    if (cet.limits && cet.sectionOwnership && cet.triggers && cet.products && cet.clientSegments && cet.financials && cet.endorsements) return cet;
    const parent = countriesById.get(cet.countryCadId) || {};
    const parentCap = Number(parent.cap || 100);
    const parentExposure = Number(parent.exposure || 60);
    const baseParentUtil = clampPct(((parentExposure + Number(cet.exposure || 0)) / Math.max(1, parentCap)) * 100);
    const segmentThresholdPct = 20;
    const segmentUtilPct = clampPct((Number(cet.exposure || 0) / Math.max(1, Number(cet.cap || 1))) * 30 + (index % 3) * 2.5);
    const parentThresholdPct = 85;
    const severity = baseParentUtil > parentThresholdPct || segmentUtilPct > segmentThresholdPct ? "Blocker" : "Warning";
    const sectionOwnership = createSectionOwnership(cet.sectionOwnership);
    const ownerSection = sectionOwnership.find((x) => x.ownerRole === "1LOD");
    if (ownerSection && !ownerSection.currentEditor) ownerSection.currentEditor = cet.owner || "Country Risk Manager";

    return {
      ...cet,
      parentCountryCadId: cet.countryCadId,
      parentGroupCadId: cet.groupCadId,
      products: cet.products || [cet.product].filter(Boolean),
      clientSegments: cet.clientSegments || [cet.clientSegment].filter(Boolean),
      rationale: cet.rationale || `${cet.name} for ${cet.country} ${cet.clientSegment} to validate controlled risk expansion.`,
      startDate: cet.startDate || "2026-01-15",
      endDate: cet.endDate || "2026-07-15",
      status: normalizeStatus((cet.status || "DRAFT"), "child"),
      sectionOwnership,
      limits: cet.limits || {
        parentCadUtilPct: baseParentUtil,
        parentCadThresholdPct: parentThresholdPct,
        segmentUtilPct,
        segmentThresholdPct,
        peakExposure: Number(cet.exposure || 0)
      },
      triggers: cet.triggers || [
        { metricCode: "FID", threshold: "4.5%", actual: `${(3.8 + index * 0.2).toFixed(1)}%`, blackLine: "6.0%" },
        { metricCode: "Ever30", threshold: "8.0%", actual: `${(6.2 + index * 0.15).toFixed(1)}%`, blackLine: "10.0%" },
        { metricCode: "GCO_ANR", threshold: "45%", actual: `${(38 + index * 1.2).toFixed(1)}%`, blackLine: "55%" }
      ],
      financials: cet.financials || defaultCetFinancials(cet, index),
      endorsements: cet.endorsements || defaultEndorsements(cet, index),
      issues: cet.issues || (baseParentUtil > parentThresholdPct || segmentUtilPct > segmentThresholdPct ? [
        {
          issueId: baseParentUtil > parentThresholdPct ? "GOV-CAD-UTIL-001" : "GOV-SEG-CONC-004",
          severity,
          boundaryType: baseParentUtil > parentThresholdPct ? "parentCad" : "segmentCap",
          thresholdValue: baseParentUtil > parentThresholdPct ? parentThresholdPct : segmentThresholdPct,
          actualValue: baseParentUtil > parentThresholdPct ? baseParentUtil : segmentUtilPct,
          delta: Number((baseParentUtil > parentThresholdPct ? baseParentUtil - parentThresholdPct : segmentUtilPct - segmentThresholdPct).toFixed(2)),
          linkedSectionId: "cet-risk",
          mitigationChecklist: [
            "Reduce CET peak exposure",
            "Tighten segment cap",
            "Attach 2LOD commentary for temporary override"
          ]
        }
      ] : [])
    };
  });
}

function sectionOwnerMeta(row, sectionId) {
  const hit = (row.sectionOwnership || []).find((x) => x.sectionId === sectionId);
  const explicit = sectionActorRole(sectionId);
  return {
    ownerRole: explicit || hit?.ownerRole || "1LOD",
    currentEditor: hit?.currentEditor || null,
    lastEditedAt: hit?.lastEditedAt || null
  };
}

function sectionActorRole(sectionId) {
  if (sectionId === "cet-approvals-2lod") return "2LOD";
  if (sectionId === "cet-approvals-1lod") return "1LOD";
  if (sectionId === "cet-commentary") return "2LOD";
  if (sectionId.startsWith("cet-")) return "1LOD";
  if (sectionId.startsWith("sbx-")) return "1LOD";
  return "1LOD";
}

function canEditSection(row, sectionId) {
  const stage = row?.workflow?.stage;
  const sectionRole = sectionActorRole(sectionId);
  const actor = state.actor.role;
  if (actor === ACTOR_ROLES.GOVERNANCE_ADMIN) return false;
  if (actor === ACTOR_ROLES.GLOBAL_HEAD) return hasDelegatedEditGrant(row);
  if (sectionRole === "2LOD") {
    if (actor === ACTOR_ROLES.EDITOR_2LOD) {
      return stage === WORKFLOW_STAGES.DRAFT_RM
        || stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER
        || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM
        || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER;
    }
    return actor === ACTOR_ROLES.APPROVER_2LOD && stage === WORKFLOW_STAGES.SUBMITTED_2LOD;
  }
  if (sectionRole === "1LOD") {
    if (stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER) return actor === ACTOR_ROLES.BUSINESS_PROPOSER;
    return actor === ACTOR_ROLES.RM;
  }
  return false;
}

function ownerBadge(ownerRole) {
  const cls = ownerRole === "2LOD" ? "owner-2lod" : "owner-1lod";
  const label = ownerRole === "2LOD" ? "2LoD" : "1LoD";
  return `<span class="owner-badge ${cls}">${label}</span>`;
}

function isReadOnlyCadStatus(status) {
  return status === "ACTIVE" || status === "RETIRED";
}

function isReadOnlyChildStatus(status) {
  return status === "INFLIGHT" || status === "SUCCESS" || status === "FAILED";
}

function activeRouteEntity() {
  if (state.route.view === "group") return state.data.groupCads.find((x) => x.id === state.route.groupCadId) || null;
  if (state.route.view === "country") return state.data.countryCads.find((x) => x.id === state.route.countryCadId) || null;
  if (state.route.view === "cet") return state.data.cets.find((x) => x.id === state.route.childId) || null;
  if (state.route.view === "sandbox") return state.data.sandboxes.find((x) => x.id === state.route.childId) || null;
  return null;
}

function canSubmitCurrentStage(row) {
  const stage = row?.workflow?.stage;
  if (!stage) return false;
  if (stage === WORKFLOW_STAGES.DRAFT_RM || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM) return state.actor.role === ACTOR_ROLES.RM;
  if (stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER) return state.actor.role === ACTOR_ROLES.BUSINESS_PROPOSER;
  return false;
}

function submitButtonText(row) {
  const stage = row?.workflow?.stage;
  if (stage === WORKFLOW_STAGES.DRAFT_RM || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM) return "Submit to Proposer";
  if (stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER) return "Submit to 2nd Line Approver (CCH)";
  return "Submit";
}

function roleContextText() {
  const scope = (state.actor.countries || []).join(", ");
  return `${actorRoleLabel(state.actor.role)} (${state.actor.region}, ${state.actor.product}, ${state.actor.clientSegment}) | Scope: ${scope || "-"}`;
}

function renderViewSubheading(text) {
  return `<p class="view-subheading">${text}</p>`;
}

function workflowTimelineItems(row) {
  const isCad = state.route.view === "group" || state.route.view === "country";
  if (isCad) {
    const items = [
      { key: WORKFLOW_STAGES.DRAFT_RM, label: "Draft" },
      { key: WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER, label: "Proposing" },
      { key: WORKFLOW_STAGES.SUBMITTED_2LOD, label: "Approving" },
      { key: WORKFLOW_STAGES.DECISION_ACCEPTED, label: "Active" }
    ];
    const currentIndex = Math.max(0, items.findIndex((step) => step.key === row.workflow?.stage));
    return items.map((step, idx) => ({
      label: step.label,
      token: timelineToken(step.label),
      state: idx < currentIndex ? "done" : idx === currentIndex ? "current" : "pending"
    }));
  }

  const stageItems = [
    { key: WORKFLOW_STAGES.DRAFT_RM, label: "Draft" },
    { key: WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER, label: "Proposing" },
    { key: WORKFLOW_STAGES.SUBMITTED_2LOD, label: "Approving" }
  ];
  const terminalStatus = String(row.status || "").toUpperCase();
  if (terminalStatus === "SUCCESS" || terminalStatus === "FAILED") {
    return [
      ...stageItems.map((step) => ({ label: step.label, token: timelineToken(step.label), state: "done" })),
      {
        label: terminalStatus === "SUCCESS" ? "Outcome: Success" : "Outcome: Failed",
        token: terminalStatus === "SUCCESS" ? "SU" : "FA",
        state: terminalStatus === "SUCCESS" ? "terminal-success" : "terminal-failed"
      }
    ];
  }

  const currentIndex = Math.max(0, stageItems.findIndex((step) => step.key === row.workflow?.stage));
  return [
    ...stageItems.map((step, idx) => ({
      label: step.label,
      token: timelineToken(step.label),
      state: idx < currentIndex ? "done" : idx === currentIndex ? "current" : "pending"
    })),
    { label: "Outcome", token: "OU", state: "pending" }
  ];
}

function renderWorkflowTimeline(row) {
  return `<ul class="workflow-timeline" aria-label="Workflow timeline">
    ${workflowTimelineItems(row).map((item) => `<li class="workflow-step ${item.state}" title="${attrEscape(item.label)}" aria-label="${attrEscape(item.label)}">
      <span class="workflow-dot" aria-hidden="true"><span class="workflow-dot-text">${item.token || timelineToken(item.label)}</span></span>
      <span class="workflow-label">${item.label}</span>
    </li>`).join("")}
  </ul>`;
}

function renderWorkflowBanner(row) {
  if (!row) return "";
  const comments = row.workflow?.sectionComments || {};
  const commentEntries = Object.entries(comments).filter(([, value]) => String(value || "").trim());
  return `<section class="card workflow-banner">
    <div class="panel-head">
      <h3>Stage: ${workflowStageLabel(row.workflow?.stage)}</h3>
      <div class="stage-role">Role: ${roleContextText()}</div>
    </div>
    ${renderWorkflowTimeline(row)}
    ${row.workflow?.lastDecision ? `<p class="muted">Last 2nd-line outcome: ${row.workflow.lastDecision}</p>` : ""}
    ${commentEntries.length ? `<div class="warning-note">Section feedback: ${commentEntries.map(([k, v]) => `${k}: ${v}`).join(" | ")}</div>` : ""}
    ${row.workflow?.endCommentary ? `<div class="warning-note">End commentary: ${row.workflow.endCommentary}</div>` : ""}
  </section>`;
}

function renderTopbarRoleSwitcher() {
  if (!dom.topbarRoleSelect) return;
  dom.topbarRoleSelect.value = state.actor.role;
}

function supportsLocalDraftSave(role) {
  return role === ACTOR_ROLES.RM || role === ACTOR_ROLES.BUSINESS_PROPOSER || role === ACTOR_ROLES.EDITOR_2LOD;
}

function activeDraftStorageKey(row) {
  if (!row || !supportsLocalDraftSave(state.actor.role)) return "";
  const docType = state.route.view;
  const docId = row.id || state.route.childId || state.route.countryCadId || state.route.groupCadId || "unknown";
  return `cw:draft:${docType}:${docId}:${state.actor.role}`;
}

function collectDraftPayload() {
  const values = {};
  dom.viewRoot.querySelectorAll("input[id], textarea[id], select[id]").forEach((el) => {
    if (!el.id || el.id === "main-search" || el.id === "topbar-role-select") return;
    if (el.type === "checkbox") values[el.id] = Boolean(el.checked);
    else values[el.id] = el.value;
  });
  return values;
}

function saveActiveDraftToLocal(row) {
  const key = activeDraftStorageKey(row);
  if (!key) return;
  const payload = {
    savedAt: new Date().toISOString(),
    actorRole: state.actor.role,
    values: collectDraftPayload()
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

function applyLocalDraftToForm(row) {
  const key = activeDraftStorageKey(row);
  if (!key || state.lastAppliedDraftKey === key) return;
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    state.lastAppliedDraftKey = key;
    return;
  }
  try {
    const payload = JSON.parse(raw);
    const values = payload?.values || {};
    Object.entries(values).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox") el.checked = Boolean(value);
      else el.value = value ?? "";
    });
  } catch (_e) {
    // Ignore invalid local draft payloads and continue rendering.
  }
  state.lastAppliedDraftKey = key;
}

function applySubmitTransition(row) {
  if (!row?.workflow) return;
  const isCad = state.route.view === "group" || state.route.view === "country";
  if (row.workflow.stage === WORKFLOW_STAGES.DRAFT_RM || row.workflow.stage === WORKFLOW_STAGES.RETURNED_REWORK_RM) {
    row.workflow.stage = WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER;
    row.status = isCad ? "PROPOSING" : "DRAFT";
    return;
  }
  if (row.workflow.stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || row.workflow.stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER) {
    row.workflow.stage = WORKFLOW_STAGES.SUBMITTED_2LOD;
    row.status = isCad ? "APPROVING" : "INFLIGHT";
  }
}

function renderSecondLineDecisionPanel(row) {
  if (!row?.workflow) return "";
  if (state.actor.role !== ACTOR_ROLES.APPROVER_2LOD) return "";
  if (row.workflow.stage !== WORKFLOW_STAGES.SUBMITTED_2LOD) return "";
  if (!actorHasCountryApprovalAuthority(row)) {
    return `<section class="card" id="decision-panel"><h3>2nd Line Decision</h3><p class="warning-note">You do not have approval authority for ${row.country}.</p></section>`;
  }
  const existing = row.workflow.lastDecision || "";
  const sectionComments = row.workflow.sectionComments || {};
  const sectionA = state.route.view === "sandbox" ? "sbx-guardrails" : "cet-risk";
  const sectionB = state.route.view === "sandbox" ? "sbx-evidence" : "cet-financial";
  const sectionALabel = state.route.view === "sandbox" ? "Sandbox Guardrails" : "CET Risk";
  const sectionBLabel = state.route.view === "sandbox" ? "Sandbox Evidence" : "CET Financial";
  return `<section class="card" id="decision-panel">
    <h3>2nd Line Decision</h3>
    <div class="form-stack">
      <label><input type="radio" name="decision-outcome" value="accept" ${existing === "accept" ? "checked" : ""}/> Accept</label>
      <label><input type="radio" name="decision-outcome" value="accept-caveats" ${existing === "accept-caveats" ? "checked" : ""}/> Accept with caveats</label>
      <label><input type="radio" name="decision-outcome" value="reject" ${existing === "reject" ? "checked" : ""}/> Reject</label>
      <label>Section Comment: ${sectionALabel}
        <textarea id="decision-comment-a" rows="2">${sectionComments[sectionA] || ""}</textarea>
      </label>
      <label>Section Comment: ${sectionBLabel}
        <textarea id="decision-comment-b" rows="2">${sectionComments[sectionB] || ""}</textarea>
      </label>
      <label>End Commentary
        <textarea id="decision-end-commentary" rows="3">${row.workflow.endCommentary || ""}</textarea>
      </label>
      <button class="btn primary" data-submit-decision="1">Submit Decision</button>
    </div>
  </section>`;
}

function renderDescriptions(items) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return `<div class="descriptions-bordered">
    ${rows.map((pair) => `<div class="desc-row">
      <div class="desc-label">${pair[0]?.label || ""}</div><div class="desc-value">${pair[0]?.value ?? "-"}</div>
      <div class="desc-label">${pair[1]?.label || ""}</div><div class="desc-value">${pair[1]?.value ?? "-"}</div>
    </div>`).join("")}
  </div>`;
}

function docTypeLabel(type) {
  return String(type || "").toUpperCase() === "SANDBOX" ? "Sandbox" : "CET";
}

function topDetailSummary(type, row) {
  const t = String(type || "").toLowerCase() === "sandbox" ? "sandbox" : "cet";
  const label = docTypeLabel(type);
  return `<div class="descriptions-bordered top-detail-grid">
    <div class="desc-row single">
      <div class="desc-label">Name</div>
      <div class="desc-value">
        <span class="doc-name-with-icon">${navIcon(t)}<span class="doc-type-ascii">[${label}]</span><strong>${row.name || "-"}</strong></span>
      </div>
    </div>
    <div class="desc-row">
      <div class="desc-label">${label} ID</div><div class="desc-value">${row.id || "-"}</div>
      <div class="desc-label">Status</div><div class="desc-value">${statusTag(row.status)}</div>
    </div>
  </div>`;
}

function helperBox(text, title = "Guidance", expanded = false) {
  return `<details class="helper-box"${expanded ? " open" : ""}>
    <summary>${title}</summary>
    <div class="helper-box-content">${text}</div>
  </details>`;
}

function money(val) {
  return Number(val || 0).toLocaleString("en-US");
}

function subsectionFold(title, ownerRole, bodyHtml, open = true) {
  return `<details class="subsection-fold"${open ? " open" : ""}>
    <summary><span>${title}</span>${ownerBadge(ownerRole)}</summary>
    <div class="subsection-fold-body">${bodyHtml}</div>
  </details>`;
}

function renderFinancialPnlTable(rows, editable = false, keyPrefix = "pnl") {
  const toCell = (row, field, idx) => editable
    ? `<input class="number-format" data-required="true" data-label="${row.label} ${field.toUpperCase()}" id="field-${keyPrefix}-${idx}-${field}" value="${row[field] ?? ""}" />`
    : `${row[field] ?? "-"}`;
  return `<table class="data-table financial-metrics uniform-metrics-table">
    <colgroup>
      <col class="col-metric" />
      <col class="col-year" />
      <col class="col-year" />
      <col class="col-year" />
      <col class="col-cumulative" />
      <col class="col-assumption" />
    </colgroup>
    <thead><tr><th>Metric</th><th>Year 1</th><th>Year 2</th><th>Year 3</th><th>Cumulative</th><th>Key Assumptions and Rationale</th></tr></thead>
    <tbody>
      ${rows.map((row, idx) => `<tr>
        <td class="metric-col">${row.label}</td>
        <td>${toCell(row, "y1", idx)}</td>
        <td>${toCell(row, "y2", idx)}</td>
        <td>${toCell(row, "y3", idx)}</td>
        <td>${toCell(row, "cumulative", idx)}</td>
        <td>${editable ? `<textarea id="field-${keyPrefix}-${idx}-assumption" rows="2" data-required="true" data-label="${row.label} Assumption">${row.assumption || ""}</textarea>` : (row.assumption || "-")}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
}

function renderCetSizeDescription(financials, editable) {
  const size = financials.size || {};
  const valueOrInput = (id, label, value, options = {}) => {
    if (!editable) return value ?? "-";
    const type = options.type || "text";
    const cls = options.number ? "number-format" : "";
    return `<input id="${id}" class="${cls}" type="${type}" value="${value ?? ""}" data-required="true" data-label="${label}" />`;
  };
  const infoIcon = (text) => `<span class="help-inline" title="${text}">ⓘ</span>`;
  return `<div class="descriptions-bordered responsive-descriptions cet-size-descriptions">
    <div class="desc-row">
      <div class="desc-label"># Accounts to be booked/tested</div>
      <div class="desc-value">${valueOrInput("field-cet-accounts-booked", "# Accounts to be booked/tested", size.accountsBookedTested, { number: true })}</div>
      <div class="desc-label">Peak Exposure</div>
      <div class="desc-value">${valueOrInput("field-cet-peak-exposure", "Peak Exposure", size.peakExposure, { number: true })}</div>
    </div>
    <div class="desc-row">
      <div class="desc-label"># Accounts for Control Group ${infoIcon("For portfolio management actions")}</div>
      <div class="desc-value">${valueOrInput("field-cet-accounts-control", "# Accounts for Control group", size.accountsControlGroup, { number: true })}</div>
      <div class="desc-label">Start Date for CET Tracking ${infoIcon("Start date for CET tracking")}</div>
      <div class="desc-value">${valueOrInput("field-cet-track-start", "Start date for CET tracking", size.startTrackingDate, { type: "date" })}</div>
    </div>
    <div class="desc-row">
      <div class="desc-label">Average credit limit extended (Exposure) ${infoIcon("Average credit limit extended (Exposure)")}</div>
      <div class="desc-value">${valueOrInput("field-cet-avg-limit", "Average credit limit extended", size.avgCreditLimitExtended, { number: true })}</div>
      <div class="desc-label">End Date for CET Bookings ${infoIcon("End date for CET bookings")}</div>
      <div class="desc-value">${valueOrInput("field-cet-track-end", "End date for CET bookings", size.endBookingsDate, { type: "date" })}</div>
    </div>
    <div class="desc-row">
      <div class="desc-label">Total Credit Limit Extended (Exposure)</div>
      <div class="desc-value">${valueOrInput("field-cet-total-limit", "Total Credit Limit Extended", size.totalCreditLimitExtended, { number: true })}</div>
      <div class="desc-label">Total Incremental Credit Limit ${infoIcon("For portfolio management actions")}</div>
      <div class="desc-value">${valueOrInput("field-cet-total-incremental", "Total Incremental Credit Limit", size.totalIncrementalCreditLimit, { number: true })}</div>
    </div>
  </div>`;
}

function sectionIssueBadge(sectionId) {
  return state.issueStore.issues.some((x) => x.sectionId === sectionId && (x.type === "Field" || x.type === "Blocker" || x.type === "Warning"));
}

function syncDraftSummaryCards() {
  const scope = dom.viewRoot;
  if (!scope) return;
  const map = [
    { key: "name", id: "field-cet-name" },
    { key: "id", value: state.route.childId || "-" },
    { key: "status", value: statusTag((getChildById(state.route.childId || "") || {}).status || "DRAFT"), html: true },
    { key: "startDate", id: "field-cet-start" },
    { key: "endDate", id: "field-cet-end" },
    { key: "products", id: "field-cet-products" },
    { key: "segments", id: "field-cet-segments" },
    { key: "exposure", id: "field-cet-exposure" },
    { key: "cap", id: "field-cet-cap" },
    { key: "sbx-name", id: "field-sbx-name" },
    { key: "sbx-id", value: state.route.childId || "-" },
    { key: "sbx-status", value: statusTag((getChildById(state.route.childId || "") || {}).status || "DRAFT"), html: true },
    { key: "sbx-limit", id: "field-sbx-limit" },
    { key: "sbx-product", id: "field-sbx-product" },
    { key: "sbx-segment", id: "field-sbx-segment" },
    { key: "sbx-country", id: "field-sbx-country" },
    { key: "group-name", id: "field-group-name" },
    { key: "group-product", id: "field-group-product" },
    { key: "group-segment", id: "field-group-segment" },
    { key: "country-summary", id: "field-country-summary" },
    { key: "interim-note", id: "field-interim-note" }
  ];
  map.forEach((item) => {
    const target = scope.querySelector(`[data-summary-value="${item.key}"]`);
    if (!target) return;
    const value = item.id ? (document.getElementById(item.id)?.value || "-") : (item.value ?? "-");
    if (item.html) target.innerHTML = value;
    else target.textContent = String(value || "-");
  });
}

function sectionCompleteStatus(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return false;
  if (section.querySelector(".descriptions-bordered")) return true;
  const requiredFields = [...section.querySelectorAll("[data-required='true']")];
  if (!requiredFields.length) {
    if (section.querySelector("table.data-table")) return true;
    const text = section.textContent?.replace(/\s+/g, " ").trim() || "";
    return text.length > 24;
  }
  return requiredFields.every((field) => {
    if (field.type === "checkbox") return field.checked;
    return String(field.value || "").trim().length > 0;
  });
}

function completionBadge(sectionId, hasIssue = false) {
  const done = sectionCompleteStatus(sectionId);
  if (hasIssue) return `<span class="completion-dot error" aria-label="Error">×</span>`;
  return `<span class="completion-dot ${done ? "done" : "pending"}" aria-label="${done ? "Complete" : "Incomplete"}">${done ? "✓" : "○"}</span>`;
}

function formatNumberForDisplay(value) {
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function attachNumberFormatters() {
  dom.viewRoot.querySelectorAll(".number-format").forEach((input) => {
    if (input.dataset.boundFormatter === "true") return;
    input.dataset.boundFormatter = "true";
    input.value = formatNumberForDisplay(input.value);
    input.addEventListener("focus", () => {
      input.value = String(input.value || "").replace(/,/g, "");
    });
    input.addEventListener("blur", () => {
      input.value = formatNumberForDisplay(input.value);
    });
  });
}

function enforceReadOnlyMode() {
  const row = activeRouteEntity();
  if (!row) return;
  const readOnly = (state.route.view === "group" || state.route.view === "country")
    ? isReadOnlyCadStatus(row.status)
    : isReadOnlyChildStatus(row.status);
  if (readOnly) {
    dom.viewRoot.querySelectorAll("input, textarea, select, button[data-create-next]").forEach((field) => {
      if (field.id === "field-cet-ack") return;
      field.setAttribute("disabled", "disabled");
    });
    return;
  }
  if (state.route.view === "group" || state.route.view === "country") {
    const stage = row.workflow?.stage;
    const actor = state.actor.role;
    let canEdit = false;
    if (stage === WORKFLOW_STAGES.DRAFT_RM || stage === WORKFLOW_STAGES.RETURNED_REWORK_RM) canEdit = actor === ACTOR_ROLES.RM;
    if (stage === WORKFLOW_STAGES.DRAFT_BUSINESS_PROPOSER || stage === WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER) canEdit = actor === ACTOR_ROLES.BUSINESS_PROPOSER;
    if (stage === WORKFLOW_STAGES.SUBMITTED_2LOD) canEdit = actor === ACTOR_ROLES.APPROVER_2LOD;
    if (!canEdit) {
      dom.viewRoot.querySelectorAll("input, textarea, select").forEach((field) => field.setAttribute("disabled", "disabled"));
    }
    return;
  }
  if (state.route.view === "cet" || state.route.view === "sandbox") {
    dom.viewRoot.querySelectorAll("section.card").forEach((section) => {
      const id = section.id || "";
      if (!id.startsWith("cet-") && !id.startsWith("sbx-")) return;
      const allowed = canEditSection(row, id);
      section.querySelectorAll("input, textarea, select").forEach((field) => {
        if (!allowed) field.setAttribute("disabled", "disabled");
      });
    });
  }
}

function governanceIssueForRule(row, ruleId, payload) {
  const severity = payload.severity || "Warning";
  return {
    id: payload.issueId || ruleId,
    type: severity,
    sectionId: payload.linkedSectionId || "cet-risk",
    message: payload.message || `${ruleId} boundary breached.`,
    hint: payload.hint || "Adjust exposure or add mitigation.",
    details: {
      ruleId,
      severity,
      boundaryType: payload.boundaryType || "policyException",
      thresholdValue: payload.thresholdValue,
      actualValue: payload.actualValue,
      delta: payload.delta,
      linkedSectionId: payload.linkedSectionId || "cet-risk",
      mitigationChecklist: payload.mitigationChecklist || [],
      status: "Open"
    }
  };
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

function statusTag(status, opts = {}) {
  const normalized = String(status || "").toUpperCase();
  const fullLabel = normalized === "INFLIGHT" ? "INFLIGHT" : normalized;
  const compact = opts.compact ?? isCompactViewport();
  const label = compact ? compactStatusLabel(fullLabel) : fullLabel;
  const clsMap = {
    DRAFT: "tag-draft",
    PROPOSING: "tag-proposing",
    APPROVING: "tag-approving",
    ACTIVE: "tag-active",
    RETIRED: "tag-retired",
    INFLIGHT: "tag-inflight",
    SUCCESS: "tag-success",
    FAILED: "tag-failed"
  };
  const cls = clsMap[normalized] || "tag-draft";
  return `<span class="status-tag ${cls} ${compact ? "is-compact" : ""}" title="${attrEscape(fullLabel)}"><span class="status-dot" aria-hidden="true"></span><span class="status-text">${label}</span></span>`;
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

function participantCell(row, key, opts = {}) {
  const participants = row.participants || defaultParticipants(row);
  const name = participants[key] || "-";
  const compact = opts.compact ?? isCompactViewport();
  return `<span title="${attrEscape(name)}">${compact ? ownerAvatarCell(name) : ownerCell(name)}</span>`;
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
  const statusRank = (status) => {
    const id = String(row.id || "").toUpperCase();
    const type = String(row.type || "").toUpperCase();
    const isCad = type === "GROUP" || type === "COUNTRY" || id.startsWith("G-CAD") || id.startsWith("C-CAD");
    const cadOrder = ["DRAFT", "PROPOSING", "APPROVING", "ACTIVE", "RETIRED"];
    const childOrder = ["DRAFT", "INFLIGHT", "SUCCESS", "FAILED"];
    const order = isCad ? cadOrder : childOrder;
    const idx = order.indexOf(String(status || "").toUpperCase());
    return idx >= 0 ? idx : 99;
  };
  if (key === "type") {
    const order = { GROUP: 1, COUNTRY: 2, CET: 3, SANDBOX: 4 };
    return order[String(row.type || "").toUpperCase()] || 99;
  }
  if (key === "country") return row.country || "Global";
  if (key === "rm") return (row.participants || {}).rm || "";
  if (key === "businessProposer") return (row.participants || {}).businessProposer || "";
  if (key === "approver") return (row.participants || {}).approver || "";
  if (key === "status") return statusRank(row.status);
  if (key === "inboxStatus") return statusRank(inboxStatusFor(row));
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

function isLaptopView() {
  return window.matchMedia("(min-width: 1025px)").matches;
}

function applyResponsiveColumnDefaults() {
  const mode = viewportMode();
  if (mode === "desktop") {
    state.compactDefaultsMode = "";
    return;
  }
  if (state.compactDefaultsMode === mode) return;
  Object.assign(state.visibleColumns.home, {
    id: false,
    legalEntity: false,
    product: false,
    clientSegment: false,
    rm: false,
    businessProposer: false,
    approver: false
  });
  Object.assign(state.visibleColumns.inbox, {
    id: false,
    legalEntity: false,
    product: false,
    clientSegment: false,
    rm: false,
    businessProposer: false,
    approver: false
  });
  Object.assign(state.visibleColumns.portfolio, {
    id: false,
    legalEntity: false
  });
  state.compactDefaultsMode = mode;
}

function paginateRows(rows, tableKey) {
  const pageSize = isLaptopView() ? (TABLE_PAGE_SIZE[tableKey] || 0) : 0;
  if (!pageSize) {
    return { rows, total: rows.length, page: 1, totalPages: 1, start: rows.length ? 1 : 0, end: rows.length, pageSize: rows.length || 1 };
  }
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requested = Number(state.tablePage[tableKey] || 1);
  const page = Math.min(Math.max(1, requested), totalPages);
  state.tablePage[tableKey] = page;
  const startIdx = (page - 1) * pageSize;
  return {
    rows: rows.slice(startIdx, startIdx + pageSize),
    total,
    page,
    totalPages,
    start: total ? (startIdx + 1) : 0,
    end: Math.min(total, startIdx + pageSize),
    pageSize
  };
}

function renderPagination(tableKey, paging) {
  if (!isLaptopView() || paging.totalPages <= 1) return "";
  return `<div class="table-pager" role="navigation" aria-label="Pagination">
    <span class="table-pager-meta">Showing ${paging.start}-${paging.end} of ${paging.total}</span>
    <div class="table-pager-controls">
      <button class="btn secondary small" data-page-table="${tableKey}" data-page-dir="prev" ${paging.page <= 1 ? "disabled" : ""}>Prev</button>
      <span class="table-pager-meta">Page ${paging.page} / ${paging.totalPages}</span>
      <button class="btn secondary small" data-page-table="${tableKey}" data-page-dir="next" ${paging.page >= paging.totalPages ? "disabled" : ""}>Next</button>
    </div>
  </div>`;
}

function syncShellLayoutMetrics() {
  const topbarHeight = Math.ceil(dom.topbar?.getBoundingClientRect().height || 0);
  const rootStyle = getComputedStyle(document.documentElement);
  const fontPx = parseFloat(rootStyle.fontSize || "16") || 16;
  const shellGapPx = 0.95 * fontPx;
  const panelHeight = Math.max(320, Math.floor(window.innerHeight - topbarHeight - (shellGapPx * 2)));
  document.documentElement.style.setProperty("--topbar-height", `${topbarHeight}px`);
  document.documentElement.style.setProperty("--panel-height", `${panelHeight}px`);
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
      { key: "rm", label: "RM" },
      { key: "businessProposer", label: "Proposer" },
      { key: "approver", label: "Approver" },
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
  if (tableKey === "home" || tableKey === "inbox") {
    const options = [
      { key: "product", label: "Product" },
      { key: "clientSegment", label: "Segment" },
      { key: "rm", label: "RM" },
      { key: "businessProposer", label: "Proposer" },
      { key: "approver", label: "Approver" },
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
  const compact = isCompactViewport();
  const steps = 5;
  const active = Math.max(0, Math.min(steps, Math.round((pct / 100) * steps)));
  return `<div class="util-wrap ${cls} ${compact ? "compact" : ""}" title="Utilization ${pct}%">
    <div class="util-steps">${new Array(steps).fill(0).map((_, i) => `<span class="util-step ${i < active ? "on" : ""}"></span>`).join("")}</div>
    <span class="util-num">${pct}%</span>
  </div>`;
}

function trendCell(row) {
  const compact = isCompactViewport();
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
  const util = utilizationPct(row);
  const headroom = Math.max(0, 100 - util);
  return `<div class="trend-mini ${compact ? "compact" : ""}" title="${hint} | Headroom ${headroom}%">
    <span class="limit-line"></span>
    <div class="trend-bars">${bars}</div>
    <span class="headroom">${compact ? `HR ${headroom}` : `Headroom ${headroom}%`}</span>
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
  const compact = isCompactViewport();
  ensureExpandedDefaults();
  const cols = state.visibleColumns.portfolio;
  const selectedType = state.portfolioType || "all";
  const orderedOptional = state.portfolioColumnOrder.filter((k) => cols[k] && k !== "type");
  const showSegment = !compact;
  const showProduct = !compact;
  const showExposure = !compact;
  const showLimit = !compact;
  const showStatus = true;
  const optionalLabel = {
    rm: "RM",
    businessProposer: "Proposer",
    approver: "Approver",
    legalEntity: "Legal Entity",
    id: "ID"
  };
  const depthForType = (type) => {
    if (type === "GROUP") return 1;
    if (type === "COUNTRY") return 2;
    return 3;
  };
  const optionalCell = (row, _depth, key) => {
    if (key === "rm") return `<td>${ownerAvatarCell((row.participants || {}).rm)}</td>`;
    if (key === "businessProposer") return `<td>${ownerAvatarCell((row.participants || {}).businessProposer)}</td>`;
    if (key === "approver") return `<td>${ownerAvatarCell((row.participants || {}).approver)}</td>`;
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
    return `<td class="key-col"><div class="name-tree"><a href="${href}">${truncateWithTitle(row.name, compact ? 24 : 56)}</a></div><div class="id-row">${idTag(row.id)}</div></td>`;
  };
  const groupRows = sortRows(applyCommonFilters(state.data.groupCads).filter((g) => statusMatch("group", g)).map((g) => ({ type: "GROUP", ...g })), "portfolio");
  const out = [];
  const colCount = 7 + orderedOptional.length + (showSegment ? 1 : 0) + (showProduct ? 1 : 0) + (showExposure ? 1 : 0) + (showLimit ? 1 : 0);

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
              ${showSegment ? `<td>${truncateWithTitle(x.clientSegment || "-", 12)}</td>` : ""}
              ${showProduct ? `<td>${productCell(x.product)}</td>` : ""}
              ${nameCell(x, PATH.detail(group.id, country.country, country.id, x.id))}
              ${orderedOptional.map((k) => optionalCell(x, 3, k)).join("")}
              ${showExposure ? `<td class="num-cell">${formatMoney(x, x.exposure || Math.round((x.limit || 10) * 0.65))}</td>` : ""}
              ${showLimit ? `<td class="num-cell">${formatMoney(x, x.cap || x.limit || 10)}</td>` : ""}
              ${showStatus ? `<td>${statusTag(x.status, { compact })}</td>` : ""}
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
          ${showSegment ? `<td>${truncateWithTitle(country.clientSegment || "-", 12)}</td>` : ""}
          ${showProduct ? `<td>${productCell(country.product)}</td>` : ""}
          ${nameCell(country, PATH.country(group.id, country.country, country.id))}
          ${orderedOptional.map((k) => optionalCell(country, 2, k)).join("")}
          ${showExposure ? `<td class="num-cell">${formatMoney(country, country.exposure || Math.round(((country.cetExposure || 0) + (country.sandboxExposure || 0) || 42)))}</td>` : ""}
          ${showLimit ? `<td class="num-cell">${formatMoney(country, country.cap || country.limit || 100)}</td>` : ""}
          ${showStatus ? `<td>${statusTag(country.status, { compact })}</td>` : ""}
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
        ${showSegment ? `<td>${truncateWithTitle(group.clientSegment || "-", 12)}</td>` : ""}
        ${showProduct ? `<td>${productCell(group.product)}</td>` : ""}
        ${nameCell(group, PATH.group(group.id))}
        ${orderedOptional.map((k) => optionalCell(group, 1, k)).join("")}
        ${showExposure ? `<td class="num-cell">${formatMoney(group, group.exposure || 180)}</td>` : ""}
        ${showLimit ? `<td class="num-cell">${formatMoney(group, group.cap || 250)}</td>` : ""}
        ${showStatus ? `<td>${statusTag(group.status, { compact })}</td>` : ""}
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
    <table class="data-table hierarchy-table ${compact ? "compact-table" : ""}">
      <thead><tr>
        <th></th>
        ${sortableTh("portfolio", "type", compactHeader("Type", "Typ"))}
        ${sortableTh("portfolio", "country", compactHeader("Country", "Ctry"))}
        ${showSegment ? sortableTh("portfolio", "clientSegment", compactHeader("Segment", "Seg")) : ""}
        ${showProduct ? sortableTh("portfolio", "product", compactHeader("Product", "Prod")) : ""}
        ${sortableTh("portfolio", "name", compactHeader("Name", "Nm"), "key-col")}
        ${orderedOptional.map((k) => sortableTh("portfolio", k, optionalLabel[k])).join("")}
        ${showExposure ? sortableTh("portfolio", "exposure", compactHeader("Exposure (USD)", "Expo")) : ""}
        ${showLimit ? sortableTh("portfolio", "cap", compactHeader("Limit (USD)", "Lmt")) : ""}
        ${showStatus ? sortableTh("portfolio", "status", compactHeader("Status", "Stat")) : ""}
        ${sortableTh("portfolio", "utilization", compactHeader("Utilization", "Util"))}
        <th>${compactHeader("Trend", "Trnd")}</th></tr></thead>
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
  const typeIcon = { group: "group", country: "country", cet: "cet", sandbox: "sandbox" };
  const entityTitle = (type) => ({ group: "Group CADs", country: "Country CADs", cet: "CETs", sandbox: "Sandboxes" }[type] || type);
  const rowStatus = (type, status, label) => `
    <button class="side-row ${type === "inbox" ? (state.inboxStatus === status ? "on" : "") : (state.homeType === type && state.homeStatus === status ? "on" : "")}" data-home-type="${type}" data-home-status="${status}">
      <span>${label}</span>
    </button>`;
  const parentType = (type) => `
    <button class="menu-item with-icon ${state.homeType === type && state.homeStatus === "all" ? "active" : ""}" data-home-type="${type}" data-home-status="all">${navIcon(typeIcon[type] || "file")} <span>${entityTitle(type)}</span></button>`;
  const statusRows = (type) => `
    <div class="side-rows ${state.homeType === type ? "open" : "closed"}">
      ${statusSetForType(type).map((status) => rowStatus(type, status, status)).join("")}
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
      ${(!isMobile || state.mobileSectionsOpen)
        ? detailSections.map((s) => {
          const ownerRole = (r.view === "cet" && child) ? sectionOwnerMeta(child, s.id).ownerRole : null;
          const hasIssue = sectionIssueBadge(s.id);
          return `<div class="section-link-row">
            <a class="menu-item section-link ${state.activeSectionId === s.id ? "active" : ""} ${hasIssue ? "has-error" : ""}" data-section-id="${s.id}" href="#${s.id}">${s.label}</a>
            ${completionBadge(s.id, hasIssue)}
            ${ownerRole ? ownerBadge(ownerRole) : ""}
          </div>`;
        }).join("")
        : ""}
    </div>`;

  const pagesGroup = `
    <div class="menu-group">
      <p class="menu-title">Pages</p>
      <a class="menu-item with-icon ${r.view === "home" ? "active" : ""}" href="${PATH.home}">${navIcon("home")} <span>Credit Approvals</span></a>
      <a class="menu-item with-icon ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}">${navIcon("inbox")} <span>Inbox</span></a>
      <a class="menu-item with-icon ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}">${navIcon("portfolio")} <span>Portfolio Monitoring</span></a>
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
    </div>`;

  const inboxDocs = inboxRows();
  const inboxTypeMeta = [
    { key: "GROUP", label: "Group CADs", statuses: statusSetForType("GROUP") },
    { key: "COUNTRY", label: "Country CADs", statuses: statusSetForType("COUNTRY") },
    { key: "CET", label: "CETs", statuses: statusSetForType("CET") },
    { key: "SANDBOX", label: "Sandboxes", statuses: statusSetForType("SANDBOX") }
  ];
  const inboxExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">Document Filters</p>
      ${inboxTypeMeta.map((meta) => {
        const typeRows = inboxDocs.filter((row) => row.type === meta.key);
        const parentOn = state.inboxType === meta.key && state.inboxStatus === "all";
        const statusOpen = state.inboxType === meta.key;
        const icon = { GROUP: "group", COUNTRY: "country", CET: "cet", SANDBOX: "sandbox" }[meta.key] || "file";
        return `<div class="side-group">
          <button class="menu-item with-icon ${parentOn ? "active" : ""}" data-inbox-type="${meta.key}" data-inbox-status="all">${navIcon(icon)} <span>${meta.label} <span class="mini-badge">${typeRows.length}</span></span></button>
          <div class="side-rows ${statusOpen ? "open" : "closed"}">
            ${meta.statuses.map((status) => {
              const count = typeRows.filter((row) => inboxStatusFor(row) === status).length;
              return `<button class="side-row ${state.inboxType === meta.key && state.inboxStatus === status ? "on" : ""}" data-inbox-type="${meta.key}" data-inbox-status="${status}"><span>${status} <span class="mini-badge">${count}</span></span></button>`;
            }).join("")}
          </div>
        </div>`;
      }).join("")}
    </div>`;

  const portfolioExpanded = `
    <div class="side-head-row"><h2>Context</h2><button id="left-toggle" class="collapse-btn" aria-label="Collapse menu">${navIcon("menu")}</button></div>
    ${pagesGroup}
    <div class="menu-group">
      <p class="menu-title">Portfolio Filters</p>
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
      <button class="icon-pill has-tooltip ${state.homeType === "group" ? "active" : ""}" data-home-type="group" data-home-status="all" aria-label="Group CADs" data-tooltip="Group CADs">${navIcon("group")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "country" ? "active" : ""}" data-home-type="country" data-home-status="all" aria-label="Country CADs" data-tooltip="Country CADs">${navIcon("country")}</button>
      <button class="icon-pill has-tooltip ${state.homeType === "cet" ? "active" : ""}" data-home-type="cet" data-home-status="all" aria-label="CETs" data-tooltip="CETs">${navIcon("cet")}</button>      
      <button class="icon-pill has-tooltip ${state.homeType === "sandbox" ? "active" : ""}" data-home-type="sandbox" data-home-status="all" aria-label="Sandboxes" data-tooltip="Sandboxes">${navIcon("sandbox")}</button>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.quickView === "none" ? "active" : ""}" data-quick-view="none" aria-label="All Docs" data-tooltip="All Docs">${navIcon("all")}</button>
      <button class="icon-pill has-tooltip ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs" aria-label="My Docs" data-tooltip="My Docs">${navIcon("mine")}</button>
      <button class="icon-pill has-tooltip ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts" aria-label="Governance Alerts" data-tooltip="Governance Alerts">${navIcon("alert")}</button>
      ${r.view !== "home" ? `<span class="icon-pill has-tooltip active" aria-label="Opened document" data-tooltip="Opened document">${navIcon("file")}</span>` : ""}
    </div>`;
  const collapsedInbox = `
    <div class="icon-rail">
      <button id="left-toggle" class="icon-pill has-tooltip" aria-label="Expand menu" data-tooltip="Expand menu">${navIcon("menu")}</button>
      <a class="icon-pill has-tooltip ${r.view === "home" ? "active" : ""}" href="${PATH.home}" aria-label="Credit Approvals" data-tooltip="Credit Approvals">${navIcon("home")}</a>
      <a class="icon-pill has-tooltip ${r.view === "inbox" ? "active" : ""}" href="${PATH.inbox}" aria-label="Inbox" data-tooltip="Inbox">${navIcon("inbox")}</a>
      <a class="icon-pill has-tooltip ${r.view === "portfolio" ? "active" : ""}" href="${PATH.portfolio}" aria-label="Portfolio Monitoring" data-tooltip="Portfolio Monitoring">${navIcon("portfolio")}</a>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.inboxType === "GROUP" ? "active" : ""}" data-inbox-type="GROUP" data-inbox-status="all" aria-label="Group CADs" data-tooltip="Group CADs">${navIcon("group")}</button>
      <button class="icon-pill has-tooltip ${state.inboxType === "COUNTRY" ? "active" : ""}" data-inbox-type="COUNTRY" data-inbox-status="all" aria-label="Country CADs" data-tooltip="Country CADs">${navIcon("country")}</button>
      <button class="icon-pill has-tooltip ${state.inboxType === "CET" ? "active" : ""}" data-inbox-type="CET" data-inbox-status="all" aria-label="CETs" data-tooltip="CETs">${navIcon("cet")}</button>
      <button class="icon-pill has-tooltip ${state.inboxType === "SANDBOX" ? "active" : ""}" data-inbox-type="SANDBOX" data-inbox-status="all" aria-label="Sandboxes" data-tooltip="Sandboxes">${navIcon("sandbox")}</button>
      <span class="icon-separator"></span>
      <button class="icon-pill has-tooltip ${state.inboxScope === "my" ? "active" : ""}" data-inbox-scope="my" aria-label="My Inbox" data-tooltip="My Inbox">Me</button>
      <button class="icon-pill has-tooltip ${state.inboxScope === "team" ? "active" : ""}" data-inbox-scope="team" aria-label="Team Inbox" data-tooltip="Team Inbox">Tm</button>
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
    ? (r.view === "home" ? collapsedHome : r.view === "inbox" ? collapsedInbox : r.view === "portfolio" ? collapsedPortfolio : collapsedMinimal)
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
      state.inboxType = "all";
      state.inboxStatus = "all";
      if (state.route.view !== "inbox") window.location.hash = PATH.inbox;
      else render();
    });
  });

  dom.leftPanel.querySelectorAll("[data-inbox-type]").forEach((el) => {
    el.addEventListener("click", () => {
      state.inboxType = el.dataset.inboxType;
      state.inboxStatus = el.dataset.inboxStatus || "all";
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
  const compact = isCompactViewport();
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
  const selectedPaging = paginateRows(selectedRows, "home");
  const cols = state.visibleColumns.home;
  const showType = compact;
  const showCountry = true;
  const showProduct = !compact || cols.product;
  const showSegment = !compact || cols.clientSegment;
  const showRm = !compact || cols.rm;
  const showProposer = !compact || cols.businessProposer;
  const showApprover = !compact || cols.approver;
  const showId = cols.id;
  const showLegal = cols.legalEntity;

  const selectedTable = selectedPaging.rows.map((r) => `<tr>
    <td class="key-col"><a href="${openHrefForRow(r, state.homeType)}">${truncateWithTitle(r.name, compact ? 24 : 56)}</a><div>${idTag(r.id)}${legalEntityTag(r)}</div></td>
    ${showType ? `<td title="${attrEscape(state.homeType.toUpperCase())}">${typeIconCell(state.homeType.toUpperCase(), "tiny")}</td>` : ""}
    ${showId ? `<td>${r.id}</td>` : ""}
    ${showLegal ? `<td>${r.legalEntity || "-"}</td>` : ""}
    ${showCountry ? `<td>${countryCell(r.country)}</td>` : ""}
    ${showProduct ? `<td>${productCell(r.product)}</td>` : ""}
    ${showSegment ? `<td>${truncateWithTitle(r.clientSegment || "-", 12)}</td>` : ""}
    ${showRm ? `<td>${participantCell(r, "rm", { compact })}</td>` : ""}
    ${showProposer ? `<td>${participantCell(r, "businessProposer", { compact })}</td>` : ""}
    ${showApprover ? `<td>${participantCell(r, "approver", { compact })}</td>` : ""}
    <td>${statusTag(r.status, { compact })}</td>
  </tr>`).join("");

  const metricRows = rows[state.homeType];
  const statusCardsByType = {
    group: ["DRAFT", "PROPOSING", "APPROVING", "ACTIVE", "RETIRED"],
    country: ["DRAFT", "PROPOSING", "APPROVING", "ACTIVE", "RETIRED"],
    cet: ["DRAFT", "INFLIGHT", "SUCCESS", "FAILED"],
    sandbox: ["DRAFT", "INFLIGHT", "SUCCESS", "FAILED"]
  };
  const metricStatuses = statusCardsByType[state.homeType] || [];
  const governanceCount = metricRows.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length;
  const metricCards = metricStatuses.map((status) => ({
    label: compactMetricLabel(status),
    value: metricRows.filter((x) => x.status === status).length
  }));
  const statusText = `${state.homeType.toUpperCase()} / ${state.homeStatus.toUpperCase()}`;

  const selectedTableHtml = `
    <section class="card">
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <div class="autocomplete-wrap">
          <input id="main-search" value="${state.searchTerm}" autocomplete="off" placeholder="ID / Name / RM / Country" />
          ${renderSearchAutocomplete()}
        </div>
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="table-filter-row">
        <button class="btn secondary small ${state.quickView === "none" ? "active" : ""}" data-quick-view="none">All Docs</button>
        <button class="btn secondary small ${state.quickView === "mydocs" ? "active" : ""}" data-quick-view="mydocs">My Docs</button>
        <button class="btn secondary small ${state.quickView === "governancealerts" ? "active" : ""}" data-quick-view="governancealerts">Alerts</button>
      </div>
      <div class="panel-head">
        <h3>Selected View: ${statusText}</h3>
        ${renderColumnsToggle("home")}
      </div>
      <p class="muted">Filters Applied: ${state.quickView === "none" ? "Action=All Docs" : state.quickView === "mydocs" ? "Action=My Docs" : "Action=Alerts"}${filterValues("product").length ? ` | Product=${filterValues("product").join(", ")}` : ""}${filterValues("clientSegment").length ? ` | Segment=${filterValues("clientSegment").join(", ")}` : ""}${state.searchTerm ? ` | Search=\"${state.searchTerm}\"` : ""}</p>
      <table class="data-table home-table ${compact ? "compact-table" : ""}">
        <thead><tr>
          ${sortableTh("home", "name", compactHeader("Name", "Nm"), "key-col")}
          ${showType ? sortableTh("home", "type", compactHeader("Type", "Typ")) : ""}
          ${showId ? sortableTh("home", "id", compactHeader("ID", "ID")) : ""}
          ${showLegal ? sortableTh("home", "legalEntity", compactHeader("Legal Entity", "Lgl")) : ""}
          ${showCountry ? sortableTh("home", "country", compactHeader("Country", "Ctry")) : ""}
          ${showProduct ? sortableTh("home", "product", compactHeader("Product", "Prod")) : ""}
          ${showSegment ? sortableTh("home", "clientSegment", compactHeader("Segment", "Seg")) : ""}
          ${showRm ? `<th>${compactHeader("RM", "RM")}</th>` : ""}
          ${showProposer ? `<th>${compactHeader("Proposer", "Prop")}</th>` : ""}
          ${showApprover ? `<th>${compactHeader("Approver", "Appr")}</th>` : ""}
          ${sortableTh("home", "status", compactHeader("Status", "Stat"))}</tr></thead>
        <tbody>${selectedTable || `<tr><td colspan="${1 + (showType ? 1 : 0) + (showId ? 1 : 0) + (showLegal ? 1 : 0) + (showCountry ? 1 : 0) + (showProduct ? 1 : 0) + (showSegment ? 1 : 0) + (showRm ? 1 : 0) + (showProposer ? 1 : 0) + (showApprover ? 1 : 0) + 1}">No rows</td></tr>`}</tbody>
      </table>
      ${renderPagination("home", selectedPaging)}
    </section>`;

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Credit Approvals</h2>
      
      ${renderViewSubheading("Monitor credit documents at a glance, then refine directly in the selected table view.")}
      <div class="metric-grid ${compact ? "compact-one-line" : ""}">
        ${metricCards.map((card) => `<div class="metric"><span>${card.label}</span><strong>${card.value}</strong></div>`).join("")}
        <div class="metric"><span>${compactMetricLabel("Governance Alerts")}</span><strong>${governanceCount}</strong></div>
      </div>
    </section>
    ${selectedTableHtml}
  `;
}

function renderInbox() {
  const compact = isCompactViewport();
  const term = state.searchTerm.trim().toLowerCase();
  const cols = state.visibleColumns.inbox;
  const showId = cols.id;
  const showLegal = cols.legalEntity;
  const showProduct = !compact || cols.product;
  const showSegment = !compact || cols.clientSegment;
  const showRm = !compact || cols.rm;
  const showProposer = !compact || cols.businessProposer;
  const showApprover = !compact || cols.approver;
  const rows = sortRows(inboxRows().filter((row) => {
    if (!term) return true;
    const participants = row.participants || {};
    const haystack = [row.id, row.name, row.owner, participants.rm, participants.businessProposer, participants.approver, row.country, row.product, row.clientSegment].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(term);
  }), "inbox");
  const inboxPaging = paginateRows(rows, "inbox");
  const counts = {
    myScope: rows.length,
    inflight: rows.filter((x) => inboxStatusFor(x) === "INFLIGHT").length,
    governanceAlerts: rows.filter((x) => Number(x.exposure) / Math.max(1, Number(x.cap || 0)) >= 0.8).length,
    closed: rows.filter((x) => ["SUCCESS", "FAILED", "RETIRED"].includes(inboxStatusFor(x))).length
  };
  const statusMetricType = state.inboxType === "all" ? null : state.inboxType.toLowerCase();
  const statusMetrics = statusMetricType
    ? statusSetForType(statusMetricType).map((status) => ({
      label: compactMetricLabel(status),
      value: rows.filter((x) => x.type === state.inboxType && inboxStatusFor(x) === status).length
    }))
    : [];
  const metricHtml = statusMetricType
    ? `${statusMetrics.map((card) => `<div class="metric"><span>${card.label}</span><strong>${card.value}</strong></div>`).join("")}
       <div class="metric"><span>${compactMetricLabel("Governance Alerts")}</span><strong>${counts.governanceAlerts}</strong></div>`
    : `<div class="metric"><span>${compactMetricLabel("My Docs")}</span><strong>${counts.myScope}</strong></div>
       <div class="metric"><span>${compactMetricLabel("Inflight")}</span><strong>${counts.inflight}</strong></div>
       <div class="metric"><span>${compactMetricLabel("Governance Alerts")}</span><strong>${counts.governanceAlerts}</strong></div>
       <div class="metric"><span>${compactMetricLabel("Closed")}</span><strong>${counts.closed}</strong></div>`;
  const tableRows = inboxPaging.rows.map((r) => `<tr>
    <td class="key-col"><a href="${openHrefForRow(r, r.type.toLowerCase())}">${truncateWithTitle(r.name, compact ? 24 : 56)}</a><div>${idTag(r.id)}${legalEntityTag(r)}</div></td>
    <td title="${attrEscape(r.type)}">${compact ? typeIconCell(r.type, "tiny") : r.type}</td>
    ${showId ? `<td>${r.id}</td>` : ""}
    ${showLegal ? `<td>${r.legalEntity || "-"}</td>` : ""}
    <td>${countryCell(r.country)}</td>
    ${showProduct ? `<td>${productCell(r.product)}</td>` : ""}
    ${showSegment ? `<td>${truncateWithTitle(r.clientSegment || "-", 12)}</td>` : ""}
    ${showRm ? `<td>${participantCell(r, "rm", { compact })}</td>` : ""}
    ${showProposer ? `<td>${participantCell(r, "businessProposer", { compact })}</td>` : ""}
    ${showApprover ? `<td>${participantCell(r, "approver", { compact })}</td>` : ""}
    <td>${statusTag(inboxStatusFor(r), { compact })}</td>
  </tr>`).join("");

  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Inbox</h2>
      ${renderViewSubheading("Prioritize assigned work quickly, then switch scope and search in the results table card.")}
      <div class="metric-grid ${compact ? "compact-one-line" : ""}">
        ${metricHtml}
      </div>
    </section>
    <section class="card">
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / RM / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="table-filter-row">
        <button class="btn secondary small ${state.inboxScope === "my" ? "active" : ""}" data-inbox-scope="my">My Inbox</button>
        <button class="btn secondary small ${state.inboxScope === "team" ? "active" : ""}" data-inbox-scope="team">Team Inbox</button>
      </div>
      <div class="panel-head">
        <h3>${state.inboxScope === "my" ? "My Inbox" : "Team Inbox"} | ${state.inboxType} | ${state.inboxStatus === "all" ? "ALL" : state.inboxStatus.toUpperCase()}</h3>
        ${renderColumnsToggle("inbox")}
      </div>
      <table class="data-table inbox-table ${compact ? "compact-table" : ""}">
        <thead><tr>
          ${sortableTh("inbox", "name", compactHeader("Name", "Nm"), "key-col")}
          ${sortableTh("inbox", "type", compactHeader("Type", "Typ"))}
          ${showId ? sortableTh("inbox", "id", compactHeader("ID", "ID")) : ""}
          ${showLegal ? sortableTh("inbox", "legalEntity", compactHeader("Legal Entity", "Lgl")) : ""}
          ${sortableTh("inbox", "country", compactHeader("Country", "Ctry"))}
          ${showProduct ? sortableTh("inbox", "product", compactHeader("Product", "Prod")) : ""}
          ${showSegment ? sortableTh("inbox", "clientSegment", compactHeader("Segment", "Seg")) : ""}
          ${showRm ? `<th>${compactHeader("RM", "RM")}</th>` : ""}
          ${showProposer ? `<th>${compactHeader("Proposer", "Prop")}</th>` : ""}
          ${showApprover ? `<th>${compactHeader("Approver", "Appr")}</th>` : ""}
          ${sortableTh("inbox", "inboxStatus", compactHeader("Status", "Stat"))}</tr></thead>
        <tbody>${tableRows || `<tr><td colspan="${2 + (showId ? 1 : 0) + (showLegal ? 1 : 0) + 1 + (showProduct ? 1 : 0) + (showSegment ? 1 : 0) + (showRm ? 1 : 0) + (showProposer ? 1 : 0) + (showApprover ? 1 : 0) + 1}">No rows</td></tr>`}</tbody>
      </table>
      ${renderPagination("inbox", inboxPaging)}
    </section>
  `;
}

function renderPortfolio() {
  const compact = isCompactViewport();
  const typeMap = { all: "ALL", group: "GROUP", country: "COUNTRY", cet: "CET", sandbox: "SANDBOX" };
  const statusText = `${typeMap[state.portfolioType] || "ALL"} / ${state.homeStatus.toUpperCase()}`;
  const allRows = applyCommonFilters([
    ...state.data.groupCads,
    ...state.data.countryCads,
    ...state.data.cets,
    ...state.data.sandboxes
  ]);
  const segmentGroups = [
    { label: "Wealth", match: (x) => String(x.clientSegment || "").toUpperCase().includes("WEALTH") },
    { label: "Retail", match: (x) => String(x.clientSegment || "").toUpperCase().includes("RETAIL") },
    { label: "SME Business Banking", match: (x) => {
      const seg = String(x.clientSegment || "").toUpperCase();
      return seg.includes("SME") || seg.includes("BUSINESS BANKING");
    } }
  ];
  const segmentCards = segmentGroups.map((segment) => {
    const rows = allRows.filter(segment.match);
    const amount = rows.reduce((sum, row) => sum + Number(row.exposure || 0), 0);
    const cap = rows.reduce((sum, row) => sum + Math.max(1, Number(row.cap || row.limit || 1)), 0);
    const utilization = cap ? Math.round((amount / cap) * 100) : 0;
    const miniBars = rows.slice(0, 6).map((row) => Math.round((Number(row.exposure || 0) / Math.max(1, Number(row.cap || 1))) * 100));
    const shortLabel = segment.label === "SME Business Banking" ? "SMEB" : shortCode(segment.label, 4);
    return { label: compact ? shortLabel : segment.label, amount, utilization, miniBars };
  });
  const hasPortfolioFilters = filterValues("country").length || filterValues("clientSegment").length || filterValues("product").length;
  const portfolioFilters = `
        ${renderTagMultiSelect("country", "Country")}
        ${renderTagMultiSelect("clientSegment", "Segment")}
        ${renderTagMultiSelect("product", "Product")}
        <button class="btn secondary small portfolio-clear-btn" data-action="reset-table-filters">Clear</button>`;
  dom.viewRoot.innerHTML = `
    <section class="card">
      <h2>Portfolio Monitoring</h2>
      ${renderViewSubheading("Track segment utilization trends first, then apply search and filters directly above the hierarchy table.")}
      <div class="metric-grid ${compact ? "compact-one-line" : ""}">
        ${segmentCards.map((card) => `<div class="metric metric-segment"><span>${card.label}</span><strong>$${card.amount.toFixed(1)}m</strong><small>${compact ? "Util" : "Utilization"} ${card.utilization}%</small><div class="metric-mini-chart">${card.miniBars.map((v) => `<i style="height:${Math.max(10, Math.min(100, v))}%"></i>`).join("")}</div></div>`).join("")}
      </div>
    </section>
    <section class="card">
      <div class="main-search-row">
        <label for="main-search">Search</label>
        <input id="main-search" value="${state.searchTerm}" placeholder="ID / Name / RM / Country" />
        <button class="btn secondary small" data-action="reset-search">Reset</button>
      </div>
      <div class="table-filter-row portfolio-filter-row">
        ${compact ? `<button class="btn secondary small ${state.portfolioFiltersOpen ? "active" : ""}" data-action="toggle-portfolio-filters">${state.portfolioFiltersOpen ? "Hide Filters" : "Filters"}</button>` : ""}
        ${(!compact || state.portfolioFiltersOpen) ? portfolioFilters : ""}
        ${compact && hasPortfolioFilters && !state.portfolioFiltersOpen ? `<button class="btn secondary small portfolio-clear-btn" data-action="reset-table-filters">Clear</button>` : ""}
      </div>
      <div class="panel-head">
        <h3>Selected View: ${statusText}</h3>
        <div class="quick-actions">
          <button class="btn secondary small" data-action="expand-all">Expand All</button>
          <button class="btn secondary small" data-action="collapse-all">Collapse All</button>
          ${renderColumnsToggle("portfolio")}
        </div>
      </div>
      <p class="muted">Filters Applied: Type=${state.portfolioType.toUpperCase()}${state.homeStatus !== "all" ? ` | Status=${state.homeStatus.toUpperCase()}` : ""}${filterValues("country").length ? ` | Country=${filterValues("country").join(", ")}` : ""}${filterValues("clientSegment").length ? ` | Segment=${filterValues("clientSegment").join(", ")}` : ""}${filterValues("product").length ? ` | Product=${filterValues("product").join(", ")}` : ""}${state.searchTerm ? ` | Search=\"${state.searchTerm}\"` : ""}</p>
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
  const workflowBanner = renderWorkflowBanner(group);
  const rowData = countries.map((c) => {
    const counts = childCounts(c.id);
    return { ...c, cetsCount: counts.cets, sandboxesCount: counts.sandboxes };
  });
  const sortedRows = sortRows(rowData, "groupDetail");
  const groupDetailPaging = paginateRows(sortedRows, "groupDetail");
  const rows = groupDetailPaging.rows.map((c) =>
    `<tr><td class="key-col"><a href="${PATH.country(group.id, c.country, c.id)}">${c.name}</a><div>${idTag(c.id)}${legalEntityTag(c)}</div></td>${cols.id ? `<td>${c.id}</td>` : ""}${cols.legalEntity ? `<td>${c.legalEntity || "-"}</td>` : ""}<td>${c.cetsCount}</td><td>${c.sandboxesCount}</td><td>${participantCell(c, "rm")}</td><td>${participantCell(c, "businessProposer")}</td><td>${participantCell(c, "approver")}</td><td>${statusTag(c.status)}</td></tr>`
  ).join("");
  const readOnly = isReadOnlyCadStatus(group.status);
  const groupHeader = `<div class="descriptions-bordered top-detail-grid">
    <div class="desc-row single">
      <div class="desc-label">Name</div>
      <div class="desc-value"><span class="doc-name-with-icon">${navIcon("group")}<span class="doc-type-ascii">[Group CAD]</span><strong>${group.name || "-"}</strong></span></div>
    </div>
    <div class="desc-row">
      <div class="desc-label">Group CAD ID</div><div class="desc-value">${group.id || "-"}</div>
      <div class="desc-label">Status</div><div class="desc-value">${statusTag(group.status)}</div>
    </div>
  </div>`;
  const groupSnapshot = `<section class="card" id="cad-overview-summary">
      <h2>Group CAD Summary Snapshot</h2>
      <div class="descriptions-bordered top-detail-grid">
        <div class="desc-row single">
          <div class="desc-label">Name</div>
          <div class="desc-value"><span class="doc-name-with-icon">${navIcon("group")}<span class="doc-type-ascii">[Group CAD]</span><strong data-summary-value="group-name">${group.name || "-"}</strong></span></div>
        </div>
        <div class="desc-row">
          <div class="desc-label">Group CAD ID</div><div class="desc-value">${group.id || "-"}</div>
          <div class="desc-label">Status</div><div class="desc-value">${statusTag(group.status)}</div>
        </div>
      </div>
      ${renderDescriptions([
        { label: "Product", value: `<span data-summary-value="group-product">${group.product || "-"}</span>` },
        { label: "Client Segment", value: `<span data-summary-value="group-segment">${group.clientSegment || "-"}</span>` },
        { label: "RM", value: (group.participants || {}).rm || group.owner || "-" },
        { label: "Proposer", value: (group.participants || {}).businessProposer || "-" },
        { label: "Approver", value: (group.participants || {}).approver || "-" },
        { label: "Legal Entity", value: group.legalEntity || "-" }
      ])}
    </section>`;
  const overviewContent = readOnly
    ? `${groupHeader}${renderDescriptions([
      { label: "Product", value: group.product },
      { label: "Client Segment", value: group.clientSegment },
      { label: "RM", value: (group.participants || {}).rm || group.owner || "-" },
      { label: "Proposer", value: (group.participants || {}).businessProposer || "-" },
      { label: "Approver", value: (group.participants || {}).approver || "-" },
      { label: "Legal Entity", value: group.legalEntity || "-" }
    ])}`
    : `<div class="form-stack">
        <label>Group CAD Name
          <input id="field-group-name" data-required="true" data-label="Group CAD Name" value="${group.name}" />
        </label>
        <label>Group CAD Summary
          <textarea id="field-group-summary" rows="3" data-required="true" data-label="Group CAD Summary">${group.name} for ${group.country || "Global"}.</textarea>
        </label>
        <label>Product
          <input id="field-group-product" value="${group.product || ""}" />
        </label>
        <label>Client Segment
          <input id="field-group-segment" value="${group.clientSegment || ""}" />
        </label>
      </div>`;

  dom.viewRoot.innerHTML = `
    ${workflowBanner}
    ${readOnly ? `<section class="card" id="cad-overview"><h2>Group CAD Detail</h2>${overviewContent}</section>` : `${groupSnapshot}
    <section class="card" id="cad-overview">
      <h2>Group CAD Overview (Editable)</h2>
      ${helperBox("Keep Group CAD summary focused on portfolio intent and avoid repeating country-level execution details.")}
      ${overviewContent}
    </section>`}
    <section class="card" id="cad-summary"><h3>Summary</h3><p class="muted">Programme summary and country rollout status.</p></section>
    <section class="card" id="cad-strategy"><h3>Strategy</h3><p class="muted">Portfolio strategy and constraints.</p></section>
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
          ${sortableTh("groupDetail", "cetsCount", "CETs")}
          ${sortableTh("groupDetail", "sandboxesCount", "Sandboxes")}
          <th>RM</th>
          <th>Proposer</th>
          <th>Approver</th>
          ${sortableTh("groupDetail", "status", "Status")}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${9 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No country CADs</td></tr>`}</tbody>
      </table>
      ${renderPagination("groupDetail", groupDetailPaging)}
    </section>
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
  const readOnly = isReadOnlyCadStatus(countryCad.status);
  const countryHeader = `<div class="descriptions-bordered top-detail-grid">
    <div class="desc-row single">
      <div class="desc-label">Name</div>
      <div class="desc-value"><span class="doc-name-with-icon">${navIcon("country")}<span class="doc-type-ascii">[Country CAD]</span><strong>${countryCad.name || "-"}</strong></span></div>
    </div>
    <div class="desc-row">
      <div class="desc-label">Country CAD ID</div><div class="desc-value">${countryCad.id || "-"}</div>
      <div class="desc-label">Status</div><div class="desc-value">${statusTag(countryCad.status)}</div>
    </div>
  </div>`;
  const countrySnapshot = `<section class="card" id="cad-overview-summary">
      <h2>Country CAD Summary Snapshot</h2>
      ${countryHeader}
      ${renderDescriptions([
        { label: "Country", value: countryCad.country },
        { label: "Product", value: countryCad.product },
        { label: "Client Segment", value: countryCad.clientSegment },
        { label: "RM", value: (countryCad.participants || {}).rm || countryCad.owner || "-" },
        { label: "Proposer", value: (countryCad.participants || {}).businessProposer || "-" },
        { label: "Approver", value: (countryCad.participants || {}).approver || "-" },
        { label: "Legal Entity", value: countryCad.legalEntity || "-" },
        { label: "Summary", value: `<span data-summary-value="country-summary">-</span>` }
      ])}
    </section>`;
  const overviewContent = readOnly
    ? `${countryHeader}${renderDescriptions([
      { label: "Country", value: countryCad.country },
      { label: "Product", value: countryCad.product },
      { label: "Client Segment", value: countryCad.clientSegment },
      { label: "RM", value: (countryCad.participants || {}).rm || countryCad.owner || "-" },
      { label: "Proposer", value: (countryCad.participants || {}).businessProposer || "-" },
      { label: "Approver", value: (countryCad.participants || {}).approver || "-" },
      { label: "Legal Entity", value: countryCad.legalEntity || "-" }
    ])}`
    : `<div class="form-stack">
        <label>Country CAD Summary
          <textarea id="field-country-summary" data-required="true" data-label="Country CAD Summary" rows="3"></textarea>
        </label>
        <label>Interim Change Note
          <textarea id="field-interim-note" rows="3"></textarea>
        </label>
      </div>`;

  const cols = state.visibleColumns.countryDetail;
  const workflowBanner = renderWorkflowBanner(countryCad);
  const childRowsSorted = sortRows([
    ...cets.map((x) => ({ type: "CET", ...x })),
    ...sandboxes.map((x) => ({ type: "SANDBOX", ...x }))
  ], "countryDetail");
  const countryDetailPaging = paginateRows(childRowsSorted, "countryDetail");
  const childRowsHtml = countryDetailPaging.rows.map((x) => `<tr><td class="key-col"><a href="${PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, x.id)}">${x.name}</a><div>${idTag(x.id)}${legalEntityTag(x)}</div></td><td>${x.type}</td>${cols.id ? `<td>${x.id}</td>` : ""}${cols.legalEntity ? `<td>${x.legalEntity || "-"}</td>` : ""}<td>${x.clientSegment || "-"}</td><td>${participantCell(x, "rm")}</td><td>${participantCell(x, "businessProposer")}</td><td>${participantCell(x, "approver")}</td><td>${statusTag(x.status)}</td></tr>`).join("");
  dom.viewRoot.innerHTML = `
    ${workflowBanner}
    ${readOnly ? `<section class="card" id="cad-overview"><h2>Country CAD Detail</h2>${overviewContent}
      <p class="muted">Successful CETs can be referenced as audit trail for interim changes.</p>
      <ul>${successful.map((s) => `<li>${s.id} - ${s.name}</li>`).join("") || "<li>No successful CET yet</li>"}</ul>
    </section>` : `${countrySnapshot}
    <section class="card" id="cad-overview">
      <h2>Country CAD Overview (Editable)</h2>
      ${helperBox("Use interim change note only for what changed versus approved baseline; keep full rationale in summary.")}
      ${overviewContent}
      <p class="muted">Successful CETs can be referenced as audit trail for interim changes.</p>
      <ul>${successful.map((s) => `<li>${s.id} - ${s.name}</li>`).join("") || "<li>No successful CET yet</li>"}</ul>
    </section>`}
    <section class="card" id="cad-summary"><h3>Summary</h3><p class="muted">Country summary for policy and limits.</p></section>
    <section class="card" id="cad-strategy"><h3>Strategy</h3><p class="muted">Country strategy for execution.</p></section>
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
          <th>RM</th>
          <th>Proposer</th>
          <th>Approver</th>
          ${sortableTh("countryDetail", "status", "Status")}</tr></thead>
        <tbody>
          ${childRowsHtml || `<tr><td colspan="${9 + (cols.id ? 1 : 0) + (cols.legalEntity ? 1 : 0)}">No child tests</td></tr>`}
        </tbody>
      </table>
      ${renderPagination("countryDetail", countryDetailPaging)}
    </section>
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
    const readOnly = isReadOnlyChildStatus(row.status);
    const sandboxSummaryCard = `<section class="card" id="sbx-overview-summary">
      <h2>Sandbox Summary Snapshot</h2>
      <div class="descriptions-bordered top-detail-grid">
        <div class="desc-row single">
          <div class="desc-label">Name</div>
          <div class="desc-value"><span class="doc-name-with-icon">${navIcon("sandbox")}<span class="doc-type-ascii">[Sandbox]</span><strong data-summary-value="sbx-name">${row.name || "-"}</strong></span></div>
        </div>
        <div class="desc-row">
          <div class="desc-label">Sandbox ID</div><div class="desc-value"><span data-summary-value="sbx-id">${row.id || "-"}</span></div>
          <div class="desc-label">Status</div><div class="desc-value"><span data-summary-value="sbx-status">${statusTag(row.status)}</span></div>
        </div>
      </div>
      ${readOnly ? renderDescriptions([
        { label: "Country", value: row.country || "-" },
        { label: "Product", value: row.product || "-" },
        { label: "Client Segment", value: row.clientSegment || "-" },
        { label: "Execution Limit", value: row.limit ?? "-" }
      ]) : renderDescriptions([
        { label: "Country", value: `<span data-summary-value="sbx-country">${row.country || "-"}</span>` },
        { label: "Product", value: `<span data-summary-value="sbx-product">${row.product || "-"}</span>` },
        { label: "Client Segment", value: `<span data-summary-value="sbx-segment">${row.clientSegment || "-"}</span>` },
        { label: "Execution Limit", value: `<span data-summary-value="sbx-limit">${row.limit ?? "-"}</span>` }
      ])}
    </section>`;

    const sandboxASection = `<section class="card" id="sbx-overview">
      <h2>Sandbox A Summary (Editable)</h2>
      ${helperBox("Describe objective, boundaries and controls clearly so reviewers can assess whether the sandbox can run safely within policy intent.")}
      <div class="form-stack">
        <label>Sandbox Name
          <input id="field-sbx-name" data-required="true" data-label="Sandbox Name" value="${row.name || ""}" />
        </label>
        <label>Country
          <input id="field-sbx-country" data-required="true" data-label="Country" value="${row.country || ""}" />
        </label>
        <label>Product
          <input id="field-sbx-product" data-required="true" data-label="Product" value="${row.product || ""}" />
        </label>
        <label>Client Segment
          <input id="field-sbx-segment" data-required="true" data-label="Client Segment" value="${row.clientSegment || ""}" />
        </label>
        <label>Execution Limit
          <input id="field-sbx-limit" type="number" value="${row.limit}" data-required="true" data-label="Execution Limit" />
        </label>
      </div>
    </section>`;

    dom.viewRoot.innerHTML = `
      ${renderWorkflowBanner(row)}
      ${readOnly ? `<section class="card" id="sbx-overview"><h2>Sandbox Detail</h2>${topDetailSummary("sandbox", row)}${renderDescriptions([
        { label: "Country", value: row.country || "-" },
        { label: "Product", value: row.product || "-" },
        { label: "Client Segment", value: row.clientSegment || "-" },
        { label: "Execution Limit", value: row.limit ?? "-" }
      ])}</section>` : `${sandboxSummaryCard}${sandboxASection}`}
      <section class="card" id="sbx-scope">
        <h3>Scope</h3>
        ${helperBox("What geographies, products, and cohorts are in-scope, and which are explicitly excluded?")}
        <div class="ant-form-vertical form-stack">
          ${readOnly ? renderDescriptions([
            { label: "Countries", value: row.country || "-" },
            { label: "Duration", value: "12 weeks" }
          ]) : `<label>Scope Narrative
              <textarea id="field-sbx-scope" data-required="true" data-label="Sandbox Scope" rows="3" placeholder="Describe countries, segments, and policy scope for sandbox test."></textarea>
            </label>`}
        </div>
      </section>
      <section class="card" id="sbx-guardrails">
        <h3>Guardrails</h3>
        ${helperBox("Define stop-loss, segment caps, trigger thresholds, and escalation checkpoints before launch.")}
        <div class="ant-form-vertical form-stack">
          ${readOnly ? renderDescriptions([
            { label: "Exposure Cap", value: row.cap ?? row.limit ?? "-" },
            { label: "Trigger", value: "Ever30 <= 8%" },
            { label: "Collections Readiness", value: "Confirmed" },
            { label: "Monitoring", value: "Weekly" }
          ]) : `<label>Guardrails
              <textarea id="field-sbx-guardrails-note" data-required="true" data-label="Sandbox Guardrails" rows="3" placeholder="Define stop-loss, segment caps, and trigger boundaries."></textarea>
            </label>`}
        </div>
      </section>
      <section class="card" id="sbx-evidence">
        <h3>Evidence</h3>
        ${helperBox("Capture observed outcomes, variance against plan, and recommendation to scale, pause, or stop.")}
        <div class="ant-form-vertical form-stack">
          ${readOnly ? renderDescriptions([
            { label: "Outcome", value: row.status === "SUCCESS" ? "Pilot succeeded" : row.status === "FAILED" ? "Pilot failed" : "In progress" },
            { label: "Recommendation", value: row.status === "SUCCESS" ? "Scale with control limits" : "Recalibrate and rerun" }
          ]) : `<label>Evidence / Outcome Notes
              <textarea id="field-sbx-evidence" data-required="true" data-label="Sandbox Evidence" rows="3" placeholder="Attach observed outcomes, variances, and recommendation."></textarea>
            </label>`}
        </div>
      </section>
      ${renderSecondLineDecisionPanel(row)}`;
    return;
  }

  const readOnly = isReadOnlyChildStatus(row.status);
  const financials = row.financials || defaultCetFinancials(row, 0);
  const oneLod = row.endorsements?.oneLod || defaultEndorsements(row, 0).oneLod;
  const sectionCard = (sectionId, bodyHtml) => {
    const owner = sectionOwnerMeta(row, sectionId);
    return `<section class="card" id="${sectionId}">
      <div class="panel-head">
        <h3>${CET_SECTIONS.find((x) => x.id === sectionId)?.label || sectionId}</h3>
        <div class="section-meta">
          ${ownerBadge(owner.ownerRole)}
          <span class="editor-pill">${owner.currentEditor ? `Editing: ${owner.currentEditor}` : "No active editor"}</span>
        </div>
      </div>
      <div class="ant-form-vertical">${bodyHtml}</div>
    </section>`;
  };
  const ruleRows = (row.triggers || []).map((trigger) => `<tr>
    <td>${trigger.metricCode}</td>
    <td>${trigger.threshold}</td>
    <td>${trigger.actual}</td>
    <td>${trigger.blackLine || "-"}</td>
  </tr>`).join("");

  const cetSnapshotCard = `<section class="card" id="cet-overview-summary">
    <h2>CET Summary Snapshot</h2>
    <div class="descriptions-bordered top-detail-grid">
      <div class="desc-row single">
        <div class="desc-label">Name</div>
        <div class="desc-value"><span class="doc-name-with-icon">${navIcon("cet")}<span class="doc-type-ascii">[CET]</span><strong data-summary-value="name">${row.name || "-"}</strong></span></div>
      </div>
      <div class="desc-row">
        <div class="desc-label">CET ID</div><div class="desc-value"><span data-summary-value="id">${row.id || "-"}</span></div>
        <div class="desc-label">Status</div><div class="desc-value"><span data-summary-value="status">${statusTag(row.status)}</span></div>
      </div>
    </div>
    ${readOnly ? renderDescriptions([
      { label: "Start Date", value: row.startDate || "-" },
      { label: "End Date", value: row.endDate || "-" },
      { label: "Client Segments", value: (row.clientSegments || []).join(", ") || "-" },
      { label: "Products", value: (row.products || []).join(", ") || "-" },
      { label: "CET Exposure", value: money(row.exposure) },
      { label: "CET Cap", value: money(row.cap) }
    ]) : renderDescriptions([
      { label: "Start Date", value: `<span data-summary-value="startDate">${row.startDate || "-"}</span>` },
      { label: "End Date", value: `<span data-summary-value="endDate">${row.endDate || "-"}</span>` },
      { label: "Client Segments", value: `<span data-summary-value="segments">${(row.clientSegments || []).join(", ") || "-"}</span>` },
      { label: "Products", value: `<span data-summary-value="products">${(row.products || []).join(", ") || "-"}</span>` },
      { label: "CET Exposure", value: `<span data-summary-value="exposure">${row.exposure ?? "-"}</span>` },
      { label: "CET Cap", value: `<span data-summary-value="cap">${row.cap ?? "-"}</span>` }
    ])}
  </section>`;

  const summaryEditableCard = sectionCard("cet-overview", `${helperBox("Use this section to define test scope and boundaries. Keep details specific to avoid repetition in later sections.")}<div class="form-stack">
      <label>CET Name
        <input id="field-cet-name" data-required="true" data-label="CET Name" value="${row.name || ""}" />
      </label>
      <label>CET Rationale
        <textarea id="field-cet-rationale" data-required="true" data-label="CET Rationale" rows="3">${row.rationale || ""}</textarea>
      </label>
      <label>Products
        <input id="field-cet-products" data-required="true" data-label="Products" value="${(row.products || []).join(", ")}" />
      </label>
      <label>Client Segments
        <input id="field-cet-segments" data-required="true" data-label="Client Segments" value="${(row.clientSegments || []).join(", ")}" />
      </label>
      <label>Start Date
        <input id="field-cet-start" type="date" data-required="true" data-label="Start Date" value="${row.startDate || ""}" />
      </label>
      <label>End Date
        <input id="field-cet-end" type="date" data-required="true" data-label="End Date" value="${row.endDate || ""}" />
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
    </div>`);

  dom.viewRoot.innerHTML = `
    ${renderWorkflowBanner(row)}
    ${readOnly ? `<section class="card" id="cet-overview"><h2>CET Detail</h2>${topDetailSummary("cet", row)}${renderDescriptions([
      { label: "Start Date", value: row.startDate || "-" },
      { label: "End Date", value: row.endDate || "-" },
      { label: "Client Segments", value: (row.clientSegments || []).join(", ") || "-" },
      { label: "Products", value: (row.products || []).join(", ") || "-" },
      { label: "CET Exposure", value: money(row.exposure) },
      { label: "CET Cap", value: money(row.cap) }
    ])}</section>` : `${cetSnapshotCard}${summaryEditableCard}`}
    ${sectionCard("cet-objective", `${helperBox("Expected outcomes: identify performance uplift, key levers and risk controls.")}<label>Objective Narrative
      <textarea id="field-cet-objective" data-required="true" data-label="Objective Narrative" rows="3">${row.objective || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-testing", `${helperBox("State the exact policy/control changes being tested and why now.")}<label>Testing Criteria
      <textarea id="field-cet-testing" data-required="true" data-label="Testing Criteria" rows="3">${row.testingCriteria || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-portfolio", `${helperBox("Summarize current segment performance, expected uplift and assumptions not captured in existing metrics.")}<label>Portfolio Analysis
      <textarea id="field-cet-portfolio" data-required="true" data-label="Portfolio Analysis" rows="3">${row.portfolioAnalysis || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-financial", `
      ${helperBox("Assumptions for each metric should be clearly called out. Specify whether cost basis is full or marginal.")}
      ${subsectionFold("CET Size", "1LOD", renderCetSizeDescription(financials, !readOnly), true)}
      ${subsectionFold("Profit and Loss", "1LOD", `
        ${subsectionFold("Overview", "1LOD", renderFinancialPnlTable(financials.pnl.metrics || [], !readOnly, "pnl-metrics"), true)}
        ${subsectionFold("Income and Cost", "1LOD", renderFinancialPnlTable(financials.pnl.incomeCost || [], !readOnly, "pnl-income"), false)}
        ${subsectionFold("Loan Impairment", "2LOD", renderFinancialPnlTable(financials.pnl.loanImpairment || [], !readOnly, "pnl-li"), false)}
        ${subsectionFold("Profit", "1LOD", renderFinancialPnlTable(financials.pnl.profit || [], !readOnly, "pnl-profit"), false)}
      `, true)}
    `)}
    ${sectionCard("cet-customer-impact", `${helperBox("Discuss customer complaints, attrition and customer experience impacts.")}<label>Customer Impact
      <textarea id="field-cet-customer-impact" data-required="true" data-label="Customer Impact" rows="3">${row.customerImpact || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-risk", `${helperBox("If trigger breaches occur in two consecutive months, raise an action plan and escalate for approval.")}<div class="guardrail-grid">
      <div class="guardrail-row ${Number(row.limits?.parentCadUtilPct || 0) > Number(row.limits?.parentCadThresholdPct || 0) ? "blocker" : ""}">
        <strong>Parent Country CAD Utilization</strong>
        <p class="muted">${formatPct(row.limits?.parentCadUtilPct)} / ${formatPct(row.limits?.parentCadThresholdPct)}</p>
      </div>
      <div class="guardrail-row ${Number(row.limits?.segmentUtilPct || 0) > Number(row.limits?.segmentThresholdPct || 0) ? "warn" : ""}">
        <strong>Segment Sub-limit</strong>
        <p class="muted">${formatPct(row.limits?.segmentUtilPct)} / ${formatPct(row.limits?.segmentThresholdPct)}</p>
      </div>
    </div>
    <table class="data-table uniform-metrics-table trigger-table">
      <colgroup>
        <col class="col-metric" />
        <col class="col-year" />
        <col class="col-year" />
        <col class="col-cumulative" />
      </colgroup>
      <thead><tr><th>Trigger</th><th>Threshold</th><th>Actual</th><th>Black Line</th></tr></thead>
      <tbody>${ruleRows}</tbody>
    </table>`)}
    ${sectionCard("cet-exceptions", `${helperBox("Detail any deviations to Group Policy/Standards with rationale and mitigants.")}<label>Exceptions & Mitigants
      <textarea id="field-cet-exceptions" data-required="true" data-label="Exceptions & Mitigants" rows="3">${row.exceptions || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-commentary", `${helperBox("Independent WRB 2LOD commentary with supporting challenge evidence where needed.")}<label>WRB Credit Risk Commentary
      <textarea id="field-cet-commentary" data-required="true" data-label="WRB Commentary" rows="3">${row.wrbCommentary || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-other-risks", `${helperBox("Confirm principal risk types are assessed (including CRRAM for elevated risks).")}<label>Other Principal Risks
      <textarea id="field-cet-other-risks" data-required="true" data-label="Other Principal Risks" rows="3">${row.otherRisks || ""}</textarea>
    </label>`)}
    ${sectionCard("cet-approvals-1lod", `${helperBox("In endorsing this CET for 1LOD proposal, the endorser certifies risk appetite and principal risk assessments are complete.")}${readOnly
      ? `${renderDescriptions([
        { label: "E-Acknowledged By", value: oneLod.certAcceptedBy || "-" },
        { label: "E-Acknowledged At", value: oneLod.certAcceptedAt || "-" },
        { label: "Name and Designation", value: oneLod.nameDesignation || "-" },
        { label: "Date of Endorsement for Proposal", value: oneLod.endorsementDate || "-" }
      ])}<table class="data-table"><thead><tr><th>1LOD Proposal</th><th>Name and Designation</th><th>Date of Endorsement for Proposal</th><th>Endorsement Conditions (if any)</th></tr></thead><tbody><tr><td>Endorsed for 1LOD Proposal by</td><td>${oneLod.nameDesignation || "-"}</td><td>${oneLod.endorsementDate || "-"}</td><td>${oneLod.conditions || "-"}</td></tr></tbody></table>`
      : `<label class="checkbox-row"><input id="field-cet-k-eack" type="checkbox" data-required="true" data-label="K e-Acknowledgement" ${oneLod.certAccepted ? "checked" : ""} /> I e-acknowledge the 1LOD certification statements.</label>
      <label>Name and Designation
        <input id="field-cet-k-name" data-required="true" data-label="1LOD Name and Designation" value="${oneLod.nameDesignation || ""}" />
      </label>
      <label>Date of Endorsement for Proposal
        <input id="field-cet-k-date" type="date" data-required="true" data-label="1LOD Endorsement Date" value="${oneLod.endorsementDate || ""}" />
      </label>
      <label>Endorsement Conditions (if any)
        <textarea id="field-cet-k-conditions" rows="3">${oneLod.conditions || ""}</textarea>
      </label>`}`)}
    ${sectionCard("cet-approvals-2lod", `${helperBox("First approval is by relevant CCO. Additional approvals may be required based on delegated authority.")}<label>2LOD Approval Conditions
      <textarea id="field-cet-2lod" data-required="true" data-label="2LOD Approval Conditions" rows="3">${row.twoLodApproval || ""}</textarea>
    </label>`)}
    ${renderSecondLineDecisionPanel(row)}`;
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
  if (state.testBypassIssueGate) {
    state.issueStore = { issues: [], summary: { blockers: 0, errors: 0, warnings: 0, total: 0 } };
    state.previousIssueCount = 0;
    return;
  }
  const inputs = [...dom.viewRoot.querySelectorAll("input, textarea")];
  const issues = [];
  const routeEntity = state.route.view === "group"
    ? state.data.groupCads.find((x) => x.id === state.route.groupCadId)
    : state.route.view === "country"
      ? state.data.countryCads.find((x) => x.id === state.route.countryCadId)
      : state.route.view === "cet"
        ? state.data.cets.find((x) => x.id === state.route.childId)
        : state.route.view === "sandbox"
          ? state.data.sandboxes.find((x) => x.id === state.route.childId)
          : null;
  const readOnlyRoute = (state.route.view === "group" || state.route.view === "country")
    ? isReadOnlyCadStatus(routeEntity?.status)
    : (state.route.view === "cet" || state.route.view === "sandbox")
      ? isReadOnlyChildStatus(routeEntity?.status)
      : false;

  if (!readOnlyRoute) {
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
  }

  if (state.route.view === "cet") {
    const row = state.data.cets.find((c) => c.id === state.route.childId);
    const exposure = Number(document.getElementById("field-cet-exposure")?.value || row?.exposure || 0);
    const cap = Math.max(1, Number(document.getElementById("field-cet-cap")?.value || row?.cap || 1));
    const ack = document.getElementById("field-cet-ack")?.checked;
    const parentThreshold = Number(row?.limits?.parentCadThresholdPct || 85);
    const segmentThreshold = Number(row?.limits?.segmentThresholdPct || 20);
    const parentUtil = Number(row?.limits?.parentCadUtilPct || 0);
    const segmentUtil = Number(row?.limits?.segmentUtilPct || 0);

    if (exposure > cap) {
      issues.push(governanceIssueForRule(row, "GOV-AGG-CAP-001", {
        issueId: "GOV-AGG-CAP-001",
        severity: "Blocker",
        boundaryType: "policyException",
        thresholdValue: cap,
        actualValue: exposure,
        delta: Number((exposure - cap).toFixed(2)),
        linkedSectionId: "cet-overview",
        message: "CET exposure exceeds cap.",
        hint: `Current ${exposure}, allowed ${cap}, reduce by ${Number(exposure - cap).toFixed(2)}.`,
        mitigationChecklist: ["Reduce CET exposure", "Revise cap and rationale", "Attach 2LOD note"]
      }));
    }

    if (parentUtil > parentThreshold) {
      issues.push(governanceIssueForRule(row, "GOV-CAD-UTIL-001", {
        issueId: "GOV-CAD-UTIL-001",
        severity: "Blocker",
        boundaryType: "parentCad",
        thresholdValue: parentThreshold,
        actualValue: parentUtil,
        delta: Number((parentUtil - parentThreshold).toFixed(2)),
        linkedSectionId: "cet-risk",
        message: "Parent country CAD utilization threshold breached.",
        hint: `Actual ${formatPct(parentUtil)} vs threshold ${formatPct(parentThreshold)}.`,
        mitigationChecklist: ["Reduce CET peak exposure", "Open parent CAD review", "Attach temporary 2LOD override"]
      }));
    }
    if (segmentUtil > segmentThreshold) {
      issues.push(governanceIssueForRule(row, "GOV-SEG-CONC-004", {
        issueId: "GOV-SEG-CONC-004",
        severity: "Warning",
        boundaryType: "segmentCap",
        thresholdValue: segmentThreshold,
        actualValue: segmentUtil,
        delta: Number((segmentUtil - segmentThreshold).toFixed(2)),
        linkedSectionId: "cet-risk",
        message: "Product/segment sub-limit exceeded.",
        hint: `Actual ${formatPct(segmentUtil)} vs threshold ${formatPct(segmentThreshold)}.`,
        mitigationChecklist: ["Tighten segment cap", "Refine target cohort", "Monitor weekly delinquency trend"]
      }));
    }
    if ((exposure / cap) * 100 >= 80 && !ack) {
      issues.push({
        id: "GOV-WARN-ACK-010",
        type: "Warning",
        sectionId: "cet-overview",
        fieldId: "field-cet-ack",
        message: "High utilization needs acknowledgement.",
        hint: "Tick governance warning acknowledgement."
      });
    }
    (row?.issues || []).forEach((payload) => {
      issues.push(governanceIssueForRule(row, payload.issueId, {
        ...payload,
        message: payload.boundaryType === "delinquency" ? "Delinquency indicator close to limit." : undefined,
        hint: payload.boundaryType === "delinquency" ? "Review trigger assumptions." : undefined
      }));
    });
  }

  const seen = new Set();
  const compact = issues.filter((item) => {
    const key = `${item.id}::${item.sectionId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  compact.sort((a, b) => ({ Blocker: 0, Field: 1, Warning: 2 }[a.type] - ({ Blocker: 0, Field: 1, Warning: 2 }[b.type])));
  const summary = {
    blockers: compact.filter((x) => x.type === "Blocker").length,
    errors: compact.filter((x) => x.type === "Field").length,
    warnings: compact.filter((x) => x.type === "Warning").length,
    total: compact.length
  };

  const prev = state.previousIssueCount;
  state.issueStore = { issues: compact, summary };
  state.previousIssueCount = summary.total;

  if (summary.total > 0) {
    if (!state.rightPanel.autoHiddenBySection) state.rightPanel.isOpen = true;
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

function manageRightPanelForActiveSection() {
  const heavySections = new Set(["cet-financial", "cet-risk"]);
  const onHeavy = state.route.view === "cet" && heavySections.has(state.activeSectionId);
  const hasIssues = state.issueStore.summary.total > 0;
  if (onHeavy && hasIssues) {
    state.rightPanel.autoHiddenBySection = true;
    state.rightPanel.isOpen = false;
    return;
  }
  if (!onHeavy && state.rightPanel.autoHiddenBySection) {
    state.rightPanel.autoHiddenBySection = false;
    if (hasIssues) state.rightPanel.isOpen = true;
  }
}

function renderIssuePanel() {
  const { blockers, errors, warnings, total } = state.issueStore.summary;
  dom.issueSummary.textContent = `Blockers ${blockers} | Errors ${errors} | Warnings ${warnings}`;
  const active = activeRouteEntity();
  const stageAllowed = Boolean(active && canSubmitCurrentStage(active));
  dom.submitBtn.disabled = !stageAllowed || total > 0;
  const activeCet = state.route.view === "cet" ? state.data.cets.find((x) => x.id === state.route.childId) : null;

  const filtered = state.rightPanel.activeFilter === "all"
    ? state.issueStore.issues
    : state.issueStore.issues.filter((x) => (state.rightPanel.activeFilter === "errors" ? x.type === "Field" : x.type.toLowerCase() === state.rightPanel.activeFilter.slice(0, -1)));

  const guardrailCard = activeCet ? `<li class="issue-item">
      <strong>Country CAD Utilization</strong>
      <span class="muted">${formatPct(activeCet.limits?.parentCadUtilPct)} / ${formatPct(activeCet.limits?.parentCadThresholdPct)}</span>
      <strong>Segment Sub-limit</strong>
      <span class="muted">${formatPct(activeCet.limits?.segmentUtilPct)} / ${formatPct(activeCet.limits?.segmentThresholdPct)}</span>
    </li>` : "";
  dom.issueList.innerHTML = `${guardrailCard}${filtered.map((x) => `
    <li class="issue-item">
      <div class="issue-top"><span class="badge ${x.type.toLowerCase()}">${x.type}</span><small>${x.sectionId}</small></div>
      <strong>${x.message}</strong>
      <span class="muted">Hint: ${x.hint}</span>
      <div class="issue-actions">
        <button class="jump-btn" data-issue-id="${x.id}">Go to field/rule</button>
        ${x.details ? `<button class="jump-btn" data-view-rule="${x.id}">View rule detail</button>` : ""}
      </div>
    </li>
  `).join("")}`;

  dom.filterButtons.forEach((b) => b.classList.toggle("active", b.dataset.filter === state.rightPanel.activeFilter));

  const show = state.rightPanel.isOpen && (total > 0 || Date.now() < state.rightPanel.resolvedBannerUntil);
  dom.issuePanel.classList.toggle("open", show);
  if (dom.openPanelBtn) {
    const detailRoute = state.route.view === "group" || state.route.view === "country" || state.route.view === "cet" || state.route.view === "sandbox";
    const showReopen = detailRoute && !show && total > 0;
    dom.openPanelBtn.classList.toggle("show", showReopen);
  }
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

function openGovernanceModal(issueId) {
  state.governanceModal.open = true;
  state.governanceModal.issueId = issueId;
  renderGovernanceModal();
}

function closeGovernanceModal() {
  state.governanceModal.open = false;
  state.governanceModal.issueId = "";
  renderGovernanceModal();
}

function renderGovernanceModal() {
  if (!dom.governanceModal) return;
  const issue = state.issueStore.issues.find((x) => x.id === state.governanceModal.issueId);
  if (!state.governanceModal.open || !issue?.details) {
    dom.governanceModal.classList.remove("open");
    dom.governanceModal.setAttribute("aria-hidden", "true");
    dom.governanceModal.innerHTML = "";
    return;
  }
  const details = issue.details;
  const row = state.data.cets.find((c) => c.id === state.route.childId);
  dom.governanceModal.classList.add("open");
  dom.governanceModal.setAttribute("aria-hidden", "false");
  dom.governanceModal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Governance rule breach detail">
      <div class="panel-head">
        <h3>Governance Rule Breach</h3>
        <button class="icon-btn" data-modal-close="1" aria-label="Close">x</button>
      </div>
      <div class="modal-grid">
        <div><strong>Rule ID</strong><p>${details.ruleId}</p></div>
        <div><strong>Severity</strong><p>${details.severity}</p></div>
        <div><strong>Boundary Type</strong><p>${details.boundaryType}</p></div>
        <div><strong>Status</strong><p>${details.status || "Open"}</p></div>
        <div><strong>Parent Country CAD</strong><p>${row?.parentCountryCadId || row?.countryCadId || "-"}</p></div>
        <div><strong>Driver CET</strong><p>${row?.id || "-"}</p></div>
        <div><strong>Threshold</strong><p>${details.thresholdValue ?? "-"}</p></div>
        <div><strong>Actual</strong><p>${details.actualValue ?? "-"}</p></div>
        <div><strong>Delta</strong><p>${details.delta ?? "-"}</p></div>
        <div class="full"><strong>Mitigation Required</strong><ul>${(details.mitigationChecklist || []).map((item) => `<li>${item}</li>`).join("") || "<li>No mitigation checklist</li>"}</ul></div>
      </div>
      <div class="modal-actions">
        <button class="btn secondary" data-modal-open-parent="1">Open Parent CAD</button>
        <button class="btn secondary" data-modal-jump="${details.linkedSectionId}">Go to Section</button>
        <button class="btn primary" data-modal-close="1">Close</button>
      </div>
    </div>`;
}

function openCreateCetDrawer() {
  state.createDrawer.open = true;
  state.createDrawer.step = 1;
  state.createDrawer.errors = [];
  state.createDrawer.warnings = [];
  state.createDrawer.draft = {
    parentCountryCadId: "",
    products: [],
    clientSegments: [],
    name: "",
    rationale: "",
    startDate: "",
    endDate: ""
  };
  state.governanceModal.open = false;
  dom.floatMenu?.classList.remove("open");
  renderCreateCetDrawer();
}

function closeCreateCetDrawer() {
  state.createDrawer.open = false;
  state.createDrawer.errors = [];
  state.createDrawer.warnings = [];
  renderCreateCetDrawer();
}

function pickValues(name) {
  return [...(dom.createCetDrawer?.querySelectorAll(`input[name="${name}"]:checked`) || [])].map((x) => x.value);
}

function validateCreateStepOne() {
  const draft = state.createDrawer.draft;
  const errors = [];
  if (!draft.parentCountryCadId) errors.push("Parent Country CAD is required.");
  if (!draft.products.length) errors.push("At least one Product is required.");
  if (!draft.clientSegments.length) errors.push("At least one Client Segment is required.");
  if (!String(draft.name || "").trim()) errors.push("CET Name is required.");
  if (!String(draft.rationale || "").trim()) errors.push("Rationale is required.");
  if (!draft.startDate) errors.push("Start Date is required.");
  if (!draft.endDate) errors.push("End Date is required.");
  state.createDrawer.errors = errors;
  state.createDrawer.warnings = createCetWarnings(draft);
  return errors.length === 0;
}

function normalizeSelection(values) {
  return [...new Set(values.map((x) => String(x || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function sameSelection(a, b) {
  const aa = normalizeSelection(a);
  const bb = normalizeSelection(b);
  if (aa.length !== bb.length) return false;
  return aa.every((value, idx) => value === bb[idx]);
}

function createCetContextOptions(parentCountryCadId) {
  const selected = parentCountryCadId ? getCountryCadById(parentCountryCadId) : null;
  if (!selected) return { products: [], segments: [] };
  const lineageRows = state.data.countryCads.filter((cad) => cad.groupCadId === selected.groupCadId);
  const products = normalizeSelection(lineageRows.map((cad) => cad.product));
  const segments = normalizeSelection(lineageRows.map((cad) => cad.clientSegment));
  return { products, segments };
}

function createCetWarnings(draft) {
  const warnings = [];
  if (draft.startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const proposed = new Date(draft.startDate);
    proposed.setHours(0, 0, 0, 0);
    if (!Number.isNaN(proposed.getTime()) && proposed <= today) {
      warnings.push("Proposed Start Date is today/past. A future date is recommended.");
    }
  }
  if (draft.parentCountryCadId && draft.products.length && draft.clientSegments.length) {
    const duplicate = state.data.cets.find((cet) =>
      cet.countryCadId === draft.parentCountryCadId &&
      sameSelection(cet.products || [cet.product], draft.products) &&
      sameSelection(cet.clientSegments || [cet.clientSegment], draft.clientSegments)
    );
    if (duplicate) {
      warnings.push(`Similar CET already exists (${duplicate.id}: ${duplicate.name}). You can continue, but review overlap.`);
    }
  }
  return warnings;
}

function createCetFromDraft() {
  const draft = state.createDrawer.draft;
  const countryCad = getCountryCadById(draft.parentCountryCadId);
  if (!countryCad) return;
  const count = state.data.cets.filter((x) => x.countryCadId === countryCad.id).length + 200;
  const iso = countryMeta(countryCad.country).iso3.slice(0, 2);
  const newId = `CET-${iso}-${count}`;
  const newRow = {
    id: newId,
    countryCadId: countryCad.id,
    parentCountryCadId: countryCad.id,
    groupCadId: countryCad.groupCadId,
    parentGroupCadId: countryCad.groupCadId,
    country: countryCad.country,
    name: draft.name.trim(),
    product: draft.products[0],
    products: draft.products,
    clientSegment: draft.clientSegments[0],
    clientSegments: draft.clientSegments,
    cluster: countryCad.cluster,
    owner: state.data.userProfile?.name || "CET Owner",
    status: "DRAFT",
    createdByCurrentUser: true,
    exposure: 0,
    cap: Math.max(1, Math.round(Number(countryCad.cap || 80) * 0.2)),
    result: "Pending",
    legalEntity: countryCad.legalEntity,
    usageHistory: [0, 0, 0, 0, 0, 0],
    rationale: draft.rationale.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    sectionOwnership: createSectionOwnership([{
      sectionId: "cet-overview",
      ownerRole: "1LOD",
      currentEditor: state.data.userProfile?.name || "Creator",
      lastEditedAt: new Date().toISOString()
    }]),
    limits: {
      parentCadUtilPct: clampPct(((Number(countryCad.exposure || 0)) / Math.max(1, Number(countryCad.cap || 1))) * 100),
      parentCadThresholdPct: 85,
      segmentUtilPct: 0,
      segmentThresholdPct: 20,
      peakExposure: 0
    },
    triggers: [
      { metricCode: "FID", threshold: "4.5%", actual: "0.0%", blackLine: "6.0%" },
      { metricCode: "Ever30", threshold: "8.0%", actual: "0.0%", blackLine: "10.0%" }
    ],
    financials: defaultCetFinancials({ ...draft, exposure: 0, limits: { peakExposure: 0 } }, state.data.cets.length),
    endorsements: defaultEndorsements({ ...draft, owner: state.data.userProfile?.name || "CET Owner" }, state.data.cets.length),
    issues: [],
    participants: {
      rm: state.data.userProfile?.name || "Country RM",
      businessProposer: `Proposer - ${countryCad.country || "Region"}`,
      editor: "2LoD Editor",
      approver: "Country Credit Head",
      governanceAdmin: "Governance Ops"
    },
    workflow: {
      stage: WORKFLOW_STAGES.DRAFT_RM,
      lastDecision: "",
      sectionComments: {},
      endCommentary: ""
    }
  };
  state.data.cets.unshift(newRow);
  state.homeType = "cet";
  state.homeStatus = "all";
  state.quickView = "mydocs";
  closeCreateCetDrawer();
  window.location.hash = PATH.detail(countryCad.groupCadId, countryCad.country, countryCad.id, newId);
}

function renderCreateCetDrawer() {
  if (!dom.createCetDrawer) return;
  const open = state.createDrawer.open;
  dom.createCetDrawer.classList.toggle("open", open);
  dom.createCetDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  dom.backdrop.classList.toggle("show", open || (state.rightPanel.isOpen && window.matchMedia("(max-width: 1199px)").matches));
  if (!open) {
    dom.createCetDrawer.innerHTML = "";
    return;
  }
  const draft = state.createDrawer.draft;
  const countryOptions = state.data.countryCads.map((cad) => `<option value="${cad.id}" ${draft.parentCountryCadId === cad.id ? "selected" : ""}>${cad.country} - ${cad.name} (${cad.id})</option>`).join("");
  const contextOptions = createCetContextOptions(draft.parentCountryCadId);
  const products = contextOptions.products;
  const segments = contextOptions.segments;
  const checked = (arr, value) => arr.includes(value) ? "checked" : "";
  const selectedCountry = draft.parentCountryCadId ? getCountryCadById(draft.parentCountryCadId) : null;
  state.createDrawer.warnings = createCetWarnings(draft);

  dom.createCetDrawer.innerHTML = `
    <div class="drawer-head">
      <div>
        <h2>Create New CET</h2>
        <p class="muted">Step ${state.createDrawer.step} of 2: Context setup</p>
      </div>
      <button class="icon-btn" data-drawer-close="1" aria-label="Close">x</button>
    </div>
    <div class="drawer-form">
      <section class="drawer-section">
        <h3>Parent Context</h3>
        <label>Parent Country CAD *
          <select id="create-parent-country">
            <option value="">Select Country CAD</option>
            ${countryOptions}
          </select>
        </label>
      </section>
      <section class="drawer-section">
        <h3>Commercial Scope</h3>
        <label>Product(s) *</label>
        <div class="checkbox-grid ${selectedCountry ? "" : "disabled"}">
          ${products.map((product) => `<label><input type="checkbox" name="create-products" value="${product}" ${checked(draft.products, product)} ${selectedCountry ? "" : "disabled"} /> ${product}</label>`).join("") || `<p class="muted">Select a Country CAD to view applicable products.</p>`}
        </div>
        <label>Client Segment(s) *</label>
        <div class="checkbox-grid ${selectedCountry ? "" : "disabled"}">
          ${segments.map((segment) => `<label><input type="checkbox" name="create-segments" value="${segment}" ${checked(draft.clientSegments, segment)} ${selectedCountry ? "" : "disabled"} /> ${segment}</label>`).join("") || `<p class="muted">Select a Country CAD to view applicable client segments.</p>`}
        </div>
      </section>
      <section class="drawer-section">
        <h3>Proposal Details</h3>
        <label>CET Name *
          <input id="create-cet-name" value="${draft.name || ""}" />
        </label>
        <label>Rationale *
          <textarea id="create-cet-rationale" rows="3">${draft.rationale || ""}</textarea>
        </label>
      </section>
      <section class="drawer-section">
        <h3>Timeline</h3>
        <div class="form-grid">
          <label>Proposed Start Date *
            <input id="create-start-date" type="date" value="${draft.startDate || ""}" />
          </label>
          <label>Proposed End Date *
            <input id="create-end-date" type="date" value="${draft.endDate || ""}" />
          </label>
        </div>
      </section>
      ${selectedCountry ? `<p class="muted">Parent trace: ${selectedCountry.groupCadId} > ${selectedCountry.id}</p>` : ""}
      ${state.createDrawer.errors.length ? `<div class="warning-note">${state.createDrawer.errors.join("<br/>")}</div>` : ""}
      ${state.createDrawer.warnings.length ? `<div class="warning-note soft">${state.createDrawer.warnings.join("<br/>")}</div>` : ""}
    </div>
    <div class="drawer-footer">
      <button class="btn secondary" data-drawer-close="1">Cancel</button>
      <button class="btn primary" data-create-next="1">Next: Form</button>
    </div>`;
}

function render() {
  state.route = parseRoute();
  applyResponsiveColumnDefaults();
  const compactDevice = window.matchMedia("(max-width: 1024px)").matches;
  const routeChanged = state.lastRouteView !== state.route.view;
  if (state.route.view === "group") state.homeType = "group";
  if (state.route.view === "country") state.homeType = "country";
  if (state.route.view === "cet") state.homeType = "cet";
  if (state.route.view === "sandbox") state.homeType = "sandbox";
  if (state.homeStatus !== "all") {
    const allowed = statusSetForType(state.homeType);
    if (allowed.length && !allowed.includes(state.homeStatus)) state.homeStatus = allowed[0];
  }
  if (state.route.view === "portfolio") {
    state.homeStatus = "all";
    state.quickView = "none";
  }
  if (routeChanged) {
    state.mobileSectionsOpen = false;
    state.mobileTraceOpen = state.route.view !== "home";
    state.openColumnMenu = "";
    if (state.route.view === "portfolio") state.portfolioFiltersOpen = false;
  }
  if (compactDevice) {
    dom.leftPanel.classList.add("collapsed");
  } else if (dom.leftPanel.classList.contains("collapsed") && state.route.view !== "home" && state.route.view !== "inbox" && state.route.view !== "portfolio") {
    dom.leftPanel.classList.remove("collapsed");
  }
  dom.appShell?.classList.toggle("left-collapsed", dom.leftPanel.classList.contains("collapsed"));
  setBreadcrumb();

  if (state.route.view === "home") renderHome();
  else if (state.route.view === "inbox") renderInbox();
  else if (state.route.view === "portfolio") renderPortfolio();
  else if (state.route.view === "group") renderGroupDetail();
  else if (state.route.view === "country") renderCountryDetail();
  else renderCetOrSandbox();
  applyLocalDraftToForm(activeRouteEntity());
  attachNumberFormatters();
  enforceReadOnlyMode();

  const detailRoute = state.route.view === "group" || state.route.view === "country" || state.route.view === "cet" || state.route.view === "sandbox";
  dom.actionBar.style.display = "flex";
  syncShellLayoutMetrics();
  const active = activeRouteEntity();
  const hideSave = (state.route.view === "group" || state.route.view === "country") && active?.status === "ACTIVE";
  dom.saveBtn.style.display = detailRoute && !hideSave ? "inline-flex" : "none";
  dom.validateBtn.style.display = detailRoute ? "inline-flex" : "none";
  dom.submitBtn.textContent = submitButtonText(active);
  dom.submitBtn.disabled = !(active && canSubmitCurrentStage(active));
  dom.submitBtn.style.display = active && canSubmitCurrentStage(active) ? "inline-flex" : "none";
  renderTopbarRoleSwitcher();
  const noRightPanel = !detailRoute;
  dom.appShell?.classList.toggle("no-right-panel", noRightPanel);
  if (noRightPanel) state.rightPanel.isOpen = false;
  dom.backTopFab?.classList.toggle("show", detailRoute && window.scrollY > 260);

  recomputeIssues();
  manageRightPanelForActiveSection();
  renderIssuePanel();
  renderLeftPanel();
  setupSectionSpy();
  syncDraftSummaryCards();
  renderCreateCetDrawer();
  renderGovernanceModal();
  state.lastRouteView = state.route.view;

  dom.viewRoot.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => {
      recomputeIssues();
      renderIssuePanel();
      renderLeftPanel();
      setupSectionSpy();
      syncDraftSummaryCards();
    });
    el.addEventListener("blur", () => {
      recomputeIssues();
      renderIssuePanel();
      renderLeftPanel();
      setupSectionSpy();
      syncDraftSummaryCards();
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
  if (!state.activeSectionId || !ids.includes(state.activeSectionId)) state.activeSectionId = ids[0];

  state.sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    state.activeSectionId = visible.target.id;
    manageRightPanelForActiveSection();
    renderIssuePanel();
    dom.leftPanel.querySelectorAll(".section-link").forEach((el) => {
      el.classList.toggle("active", el.dataset.sectionId === state.activeSectionId);
    });
  }, { rootMargin: "-30% 0px -55% 0px", threshold: 0.01 });

  targets.forEach((t) => state.sectionObserver.observe(t));
}

function populateFilters() {}

function initEvents() {
  window.addEventListener("hashchange", render);

  dom.saveBtn.addEventListener("click", () => {
    const row = activeRouteEntity();
    if (!row?.workflow) return;
    row.workflow.lastSavedAt = new Date().toISOString();
    saveActiveDraftToLocal(row);
    render();
  });

  dom.submitBtn.addEventListener("click", () => {
    const row = activeRouteEntity();
    if (!row || !canSubmitCurrentStage(row)) return;
    applySubmitTransition(row);
    render();
  });

  dom.validateBtn.addEventListener("click", () => {
    recomputeIssues();
    state.rightPanel.autoHiddenBySection = false;
    state.rightPanel.isOpen = true;
    renderIssuePanel();
  });
  dom.closePanel.addEventListener("click", () => {
    state.rightPanel.isOpen = false;
    renderIssuePanel();
  });
  dom.openPanelBtn?.addEventListener("click", () => {
    state.rightPanel.autoHiddenBySection = false;
    state.rightPanel.isOpen = true;
    renderIssuePanel();
  });
  dom.backdrop.addEventListener("click", () => {
    if (state.createDrawer.open) closeCreateCetDrawer();
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
    if (btn) {
      jumpToIssue(btn.dataset.issueId);
      return;
    }
    const detailBtn = event.target.closest("button[data-view-rule]");
    if (detailBtn) openGovernanceModal(detailBtn.dataset.viewRule);
  });

  dom.viewRoot.addEventListener("click", (event) => {
    const decisionBtn = event.target.closest("[data-submit-decision]");
    if (decisionBtn) {
      const row = activeRouteEntity();
      if (!row?.workflow || state.actor.role !== ACTOR_ROLES.APPROVER_2LOD) return;
      if (!actorHasCountryApprovalAuthority(row)) {
        window.alert(`Approval authority missing for ${row.country}.`);
        return;
      }
      const outcome = dom.viewRoot.querySelector('input[name="decision-outcome"]:checked')?.value || "";
      const sectionA = state.route.view === "sandbox" ? "sbx-guardrails" : "cet-risk";
      const sectionB = state.route.view === "sandbox" ? "sbx-evidence" : "cet-financial";
      const riskComment = String(document.getElementById("decision-comment-a")?.value || "").trim();
      const finComment = String(document.getElementById("decision-comment-b")?.value || "").trim();
      const endCommentary = String(document.getElementById("decision-end-commentary")?.value || "").trim();
      const needsComment = outcome === "accept-caveats" || outcome === "reject";
      if (!outcome || (needsComment && !(riskComment || finComment || endCommentary))) {
        window.alert("Select a decision outcome. Caveats/Reject require section and/or end commentary.");
        return;
      }
      row.workflow.lastDecision = outcome;
      row.workflow.sectionComments = {
        ...(row.workflow.sectionComments || {}),
        [sectionA]: riskComment,
        [sectionB]: finComment
      };
      row.workflow.endCommentary = endCommentary;
      if (outcome === "accept") {
        row.workflow.stage = WORKFLOW_STAGES.DECISION_ACCEPTED;
        row.status = "SUCCESS";
      } else if (outcome === "accept-caveats") {
        row.workflow.stage = WORKFLOW_STAGES.RETURNED_REWORK_BUSINESS_PROPOSER;
        row.status = "DRAFT";
      } else {
        row.workflow.stage = WORKFLOW_STAGES.RETURNED_REWORK_RM;
        row.status = "DRAFT";
      }
      render();
      return;
    }

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
      if (state.tablePage[table] !== undefined) state.tablePage[table] = 1;
      render();
      return;
    }

    const pageBtn = event.target.closest("[data-page-table]");
    if (pageBtn) {
      const table = pageBtn.dataset.pageTable;
      const dir = pageBtn.dataset.pageDir;
      const currentPage = Number(state.tablePage[table] || 1);
      state.tablePage[table] = dir === "next" ? currentPage + 1 : Math.max(1, currentPage - 1);
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

    const inboxScopeBtn = event.target.closest("[data-inbox-scope]");
    if (inboxScopeBtn) {
      state.inboxScope = inboxScopeBtn.dataset.inboxScope || "my";
      state.inboxType = "all";
      state.inboxStatus = "all";
      if (state.route.view !== "inbox") window.location.hash = PATH.inbox;
      else render();
      return;
    }

    const quickBtn = event.target.closest("[data-quick-view]");
    if (quickBtn) {
      state.quickView = quickBtn.dataset.quickView;
      if (state.route.view !== "home") window.location.hash = PATH.home;
      else render();
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
      if (action === "toggle-portfolio-filters") {
        state.portfolioFiltersOpen = !state.portfolioFiltersOpen;
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

  dom.viewRoot.addEventListener("change", (event) => {
    const target = event.target;
    if (target.id === "actor-role-select") return;
  });

  dom.topbarRoleSelect?.addEventListener("change", (event) => {
    const target = event.target;
    state.actor.role = target.value;
    const row = activeRouteEntity();
    syncActorProfile(state.actor.role, row);
    state.lastAppliedDraftKey = "";
    render();
  });

  dom.createFab?.addEventListener("click", () => {
    if (state.actor.role === ACTOR_ROLES.EDITOR_2LOD || state.actor.role === ACTOR_ROLES.APPROVER_2LOD || state.actor.role === ACTOR_ROLES.GOVERNANCE_ADMIN || state.actor.role === ACTOR_ROLES.GLOBAL_HEAD) {
      window.alert("Only 1st line roles can initiate CAD/CET/Sandbox.");
      return;
    }
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
    if (state.actor.role === ACTOR_ROLES.EDITOR_2LOD || state.actor.role === ACTOR_ROLES.APPROVER_2LOD || state.actor.role === ACTOR_ROLES.GOVERNANCE_ADMIN || state.actor.role === ACTOR_ROLES.GLOBAL_HEAD) {
      window.alert("Only 1st line roles can initiate CAD/CET/Sandbox.");
      return;
    }
    dom.floatMenu.classList.remove("open");
    if (btn.classList.contains("coming-soon")) {
      window.alert("Coming Soon");
      return;
    }
    if (btn.dataset.createType === "cet") {
      openCreateCetDrawer();
      return;
    }
    window.alert(`Create ${btn.dataset.createType.toUpperCase()} flow placeholder.`);
  });

  dom.createCetDrawer?.addEventListener("input", (event) => {
    const target = event.target;
    let shouldRerenderDrawer = false;
    if (target.id === "create-parent-country") {
      state.createDrawer.draft.parentCountryCadId = target.value;
      const options = createCetContextOptions(target.value);
      state.createDrawer.draft.products = state.createDrawer.draft.products.filter((value) => options.products.includes(value));
      state.createDrawer.draft.clientSegments = state.createDrawer.draft.clientSegments.filter((value) => options.segments.includes(value));
      shouldRerenderDrawer = true;
    }
    if (target.id === "create-cet-name") state.createDrawer.draft.name = target.value;
    if (target.id === "create-cet-rationale") state.createDrawer.draft.rationale = target.value;
    if (target.id === "create-start-date") {
      state.createDrawer.draft.startDate = target.value;
      shouldRerenderDrawer = true;
    }
    if (target.id === "create-end-date") state.createDrawer.draft.endDate = target.value;
    if (target.name === "create-products") {
      state.createDrawer.draft.products = pickValues("create-products");
      shouldRerenderDrawer = true;
    }
    if (target.name === "create-segments") {
      state.createDrawer.draft.clientSegments = pickValues("create-segments");
      shouldRerenderDrawer = true;
    }
    state.createDrawer.warnings = createCetWarnings(state.createDrawer.draft);
    if (shouldRerenderDrawer) renderCreateCetDrawer();
  });

  dom.createCetDrawer?.addEventListener("click", (event) => {
    if (event.target.closest("[data-drawer-close]")) {
      closeCreateCetDrawer();
      return;
    }
    if (event.target.closest("[data-create-next]")) {
      if (!validateCreateStepOne()) {
        renderCreateCetDrawer();
        return;
      }
      createCetFromDraft();
    }
  });

  dom.governanceModal?.addEventListener("click", (event) => {
    if (event.target === dom.governanceModal || event.target.closest("[data-modal-close]")) {
      closeGovernanceModal();
      return;
    }
    const jumpBtn = event.target.closest("[data-modal-jump]");
    if (jumpBtn) {
      closeGovernanceModal();
      const sectionId = jumpBtn.dataset.modalJump;
      const target = document.getElementById(sectionId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (event.target.closest("[data-modal-open-parent]")) {
      const row = state.data.cets.find((c) => c.id === state.route.childId);
      if (!row) return;
      window.location.hash = PATH.country(row.groupCadId, row.country, row.countryCadId);
    }
  });

  dom.helpFab?.addEventListener("click", () => {
    dom.floatMenu?.classList.remove("open");
    state.openHelpMenu = !state.openHelpMenu;
    dom.helpMenu?.classList.toggle("open", state.openHelpMenu);
  });

  dom.helpMenu?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-help-type]");
    if (!btn) return;
    if (btn.dataset.helpType === "docs") {
      window.open("documents/openspec/index.html", "_blank", "noopener,noreferrer");
      dom.helpMenu.classList.remove("open");
      state.openHelpMenu = false;
      return;
    }
    if (btn.classList.contains("coming-soon")) {
      dom.helpMenu.classList.remove("open");
      state.openHelpMenu = false;
      window.alert("Coming Soon");
      return;
    }
    const messages = {
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
  window.addEventListener("resize", () => {
    syncShellLayoutMetrics();
  });
}

async function init() {
  state.data = structuredClone(SAMPLE_DATA);
  if (window.location.protocol === "file:") {
    state.data = structuredClone(FALLBACK_DATA);
    state.loadWarning = "Running from local file mode with embedded sample data.";
  } else {
    try {
      const res = await fetch("data/sample-hierarchy.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
    } catch (_err) {
      state.data = structuredClone(FALLBACK_DATA);
      state.loadWarning = "Using embedded fallback sample data because external JSON could not be loaded.";
    }
  }
  normalizeAllStatuses(state.data);
  seedCets(state.data);
  ensureWorkflowData(state.data);
  state.data.delegatedEditGrants = state.data.delegatedEditGrants || [];
  syncActorProfile(state.actor.role, null);
  populateFilters();
  if (!window.location.hash) window.location.hash = PATH.home;
  initEvents();
  syncShellLayoutMetrics();
  render();
}

// Non-UX test hooks for deterministic Playwright setup in prototype mode.
const __CW_TEST_MODE = /(?:\?|&)cwTestMode=1(?:&|$)/.test(window.location.search || "");
window.__CW_TEST_HOOKS = {
  setCetTestReadyById(cetId) {
    if (!__CW_TEST_MODE) return { ok: false, reason: "test-mode-disabled" };
    if (!state?.data?.cets) return { ok: false, reason: "no-data" };
    const row = state.data.cets.find((x) => x.id === cetId);
    if (!row) return { ok: false, reason: "no-cet" };
    row.status = "DRAFT";
    row.issues = [];
    row.exposure = 10;
    row.cap = 100;
    row.workflow = row.workflow || {};
    row.workflow.stage = WORKFLOW_STAGES.DRAFT_RM;
    row.limits = {
      ...(row.limits || {}),
      parentCadUtilPct: 10,
      parentCadThresholdPct: 85,
      segmentUtilPct: 5,
      segmentThresholdPct: 20
    };
    return { ok: true, id: row.id };
  },
  enableIssueGateBypass() {
    if (!__CW_TEST_MODE) return { ok: false, reason: "test-mode-disabled" };
    state.testBypassIssueGate = true;
    return { ok: true };
  },
  disableIssueGateBypass() {
    if (!__CW_TEST_MODE) return { ok: false, reason: "test-mode-disabled" };
    state.testBypassIssueGate = false;
    return { ok: true };
  }
};

init();
