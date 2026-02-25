const state = {
  form: {
    country: "",
    clientSegment: "",
    summary: "",
    cetName: "",
    product: "PL",
    cetExposure1: 60,
    cetExposure2: 55,
    capLimit: 100,
    rationale: "",
    warnAck: false
  },
  touched: {},
  issueStore: {
    issues: [],
    summary: { blockers: 0, errors: 0, warnings: 0, total: 0 }
  },
  rightPanel: {
    isOpen: false,
    activeFilter: "all",
    lastUpdatedAt: null,
    resolvedBannerUntil: 0
  },
  previousIssueCount: 0
};

const requiredFields = [
  { key: "country", sectionId: "section-basic", fieldId: "field-country", label: "Country" },
  { key: "clientSegment", sectionId: "section-basic", fieldId: "field-clientSegment", label: "Client Segment" },
  { key: "summary", sectionId: "section-basic", fieldId: "field-summary", label: "CAD Summary" },
  { key: "cetName", sectionId: "section-cet", fieldId: "field-cetName", label: "CET Name" },
  { key: "product", sectionId: "section-cet", fieldId: "field-product", label: "Product" }
];

const dom = {
  submitBtn: document.getElementById("submit-btn"),
  validateBtn: document.getElementById("validate-btn"),
  issuePanel: document.getElementById("issue-panel"),
  issueList: document.getElementById("issue-list"),
  issueSummary: document.getElementById("issue-summary"),
  closePanel: document.getElementById("close-panel"),
  resolvedBanner: document.getElementById("resolved-banner"),
  utilizationLine: document.getElementById("utilization-line"),
  backdrop: document.getElementById("drawer-backdrop"),
  appShell: document.getElementById("app-shell"),
  filterButtons: [...document.querySelectorAll(".filter")],
  fieldEls: [...document.querySelectorAll("input, textarea")]
};

function issuePriority(issue) {
  if (issue.type === "Blocker") return 0;
  if (issue.type === "Field") return 1;
  return 2;
}

function recomputeIssues() {
  const issues = [];

  for (const field of requiredFields) {
    const value = String(state.form[field.key] ?? "").trim();
    if (!value) {
      issues.push({
        id: `FIELD-${field.key}`,
        type: "Field",
        severity: "error",
        sectionId: field.sectionId,
        fieldId: field.fieldId,
        message: `${field.label} is required.`,
        hint: `Add a value in ${field.label} to continue.`,
        status: "active"
      });
    }
  }

  const exposure1 = Number(state.form.cetExposure1) || 0;
  const exposure2 = Number(state.form.cetExposure2) || 0;
  const cap = Math.max(1, Number(state.form.capLimit) || 1);
  const totalExposure = exposure1 + exposure2;
  const utilization = (totalExposure / cap) * 100;
  const delta = Math.max(0, totalExposure - cap);

  dom.utilizationLine.textContent =
    `Utilization: ${totalExposure}/${cap} (${utilization.toFixed(1)}%)`;

  if (totalExposure > cap) {
    issues.push({
      id: "GOV-AGG-CAP-001",
      type: "Blocker",
      severity: "blocking",
      sectionId: "section-governance",
      ruleId: "GOV-AGG-CAP-001",
      message: "Aggregate exposure exceeds the allowed cap.",
      hint: `Current ${totalExposure}, allowed ${cap}, reduce by ${delta}.`,
      status: "active"
    });
  }

  if (utilization >= 80 && utilization <= 100) {
    if (!String(state.form.rationale || "").trim() || !state.form.warnAck) {
      issues.push({
        id: "GOV-WARN-ACK-010",
        type: "Warning",
        severity: "warning",
        sectionId: "section-governance",
        fieldId: "field-rationale",
        ruleId: "GOV-WARN-ACK-010",
        message: "High utilization requires rationale and acknowledgement.",
        hint: "Fill warning rationale and tick acknowledgement.",
        status: "active"
      });
    }
  }

  issues.sort((a, b) => issuePriority(a) - issuePriority(b));

  const summary = {
    blockers: issues.filter((i) => i.type === "Blocker").length,
    errors: issues.filter((i) => i.type === "Field").length,
    warnings: issues.filter((i) => i.type === "Warning").length,
    total: issues.length
  };

  const previous = state.previousIssueCount;
  state.issueStore = { issues, summary };
  state.previousIssueCount = summary.total;

  if (summary.total > 0) {
    state.rightPanel.isOpen = true;
    state.rightPanel.resolvedBannerUntil = 0;
  } else if (previous > 0) {
    state.rightPanel.isOpen = true;
    state.rightPanel.resolvedBannerUntil = Date.now() + 1800;
    setTimeout(() => {
      if (Date.now() >= state.rightPanel.resolvedBannerUntil) {
        state.rightPanel.isOpen = false;
        render();
      }
    }, 1850);
  }

  state.rightPanel.lastUpdatedAt = new Date().toISOString();
}

function filteredIssues() {
  const { activeFilter } = state.rightPanel;
  if (activeFilter === "all") return state.issueStore.issues;
  if (activeFilter === "blockers") return state.issueStore.issues.filter((i) => i.type === "Blocker");
  if (activeFilter === "errors") return state.issueStore.issues.filter((i) => i.type === "Field");
  return state.issueStore.issues.filter((i) => i.type === "Warning");
}

function jumpToIssue(id) {
  const issue = state.issueStore.issues.find((i) => i.id === id);
  if (!issue) return;

  const target =
    (issue.fieldId && document.getElementById(issue.fieldId)) ||
    document.getElementById(issue.sectionId);

  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target.focus) target.focus({ preventScroll: true });
  }
}

function applyInvalidState() {
  const activeFieldIssues = new Set(
    state.issueStore.issues.filter((i) => i.type === "Field").map((i) => i.fieldId)
  );

  for (const el of dom.fieldEls) {
    if (activeFieldIssues.has(el.id)) el.classList.add("invalid");
    else el.classList.remove("invalid");
  }
}

function render() {
  const { blockers, errors, warnings, total } = state.issueStore.summary;
  dom.issueSummary.textContent = `Blockers ${blockers} | Errors ${errors} | Warnings ${warnings}`;

  dom.submitBtn.disabled = total > 0;

  dom.filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === state.rightPanel.activeFilter);
  });

  const shouldShowPanel = state.rightPanel.isOpen &&
    (total > 0 || Date.now() < state.rightPanel.resolvedBannerUntil);
  dom.issuePanel.classList.toggle("open", shouldShowPanel);

  const isTabletOrMobile = window.matchMedia("(max-width: 1199px)").matches;
  dom.backdrop.classList.toggle("show", isTabletOrMobile && shouldShowPanel && total > 0);

  const showResolved = total === 0 && Date.now() < state.rightPanel.resolvedBannerUntil;
  dom.resolvedBanner.classList.toggle("show", showResolved);

  const list = filteredIssues();
  dom.issueList.innerHTML = list.map((issue) => {
    const badgeClass = issue.type.toLowerCase();
    const location = issue.fieldId ? `${issue.sectionId} / ${issue.fieldId}` : issue.sectionId;
    return `
      <li class="issue-item">
        <div class="issue-top">
          <span class="badge ${badgeClass}">${issue.type}</span>
          <small>${location}</small>
        </div>
        <strong>${issue.message}</strong>
        <span class="muted">Hint: ${issue.hint}</span>
        <div class="issue-actions">
          <button class="jump-btn" data-issue-id="${issue.id}">Go to field/rule</button>
        </div>
      </li>`;
  }).join("");

  applyInvalidState();
}

function onFormInput(event) {
  const el = event.target;
  const key = el.name;
  if (!key) return;

  if (el.type === "checkbox") state.form[key] = el.checked;
  else if (el.type === "number") state.form[key] = el.value === "" ? "" : Number(el.value);
  else state.form[key] = el.value;

  recomputeIssues();
  render();
}

function initEvents() {
  dom.fieldEls.forEach((el) => {
    el.addEventListener("input", onFormInput);
    el.addEventListener("change", onFormInput);
    el.addEventListener("blur", () => {
      state.touched[el.name] = true;
      recomputeIssues();
      render();
    });
  });

  dom.issueList.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-issue-id]");
    if (!btn) return;
    jumpToIssue(btn.dataset.issueId);
  });

  dom.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rightPanel.activeFilter = btn.dataset.filter;
      render();
    });
  });

  dom.validateBtn.addEventListener("click", () => {
    recomputeIssues();
    state.rightPanel.isOpen = true;
    render();
  });

  dom.closePanel.addEventListener("click", () => {
    state.rightPanel.isOpen = false;
    render();
  });

  dom.backdrop.addEventListener("click", () => {
    state.rightPanel.isOpen = false;
    render();
  });
}

async function preloadData() {
  try {
    const [casesRes, cetsRes, govRes] = await Promise.all([
      fetch("data/sample-cases.json"),
      fetch("data/sample-cets.json"),
      fetch("data/sample-governance.json")
    ]);
    const [casesData, cetsData, govData] = await Promise.all([
      casesRes.json(),
      cetsRes.json(),
      govRes.json()
    ]);

    const currentCase = casesData.cadRecords[0];
    document.getElementById("breadcrumb").textContent =
      `Home / CADs / ${currentCase.cadId} / CET / CET-104`;

    state.form.country = currentCase.country;
    state.form.clientSegment = currentCase.clientSegment;
    state.form.product = (currentCase.products && currentCase.products[0]) || "PL";

    const c1 = cetsData.cets.find((c) => c.cetId === "CET-101");
    const c2 = cetsData.cets.find((c) => c.cetId === "CET-104");
    if (c1) state.form.cetExposure1 = c1.exposure;
    if (c2) state.form.cetExposure2 = c2.exposure;

    if (govData.aggregateCap && Number(govData.aggregateCap.limit) > 0) {
      state.form.capLimit = Number(govData.aggregateCap.limit);
    }

    for (const el of dom.fieldEls) {
      if (el.type === "checkbox") el.checked = !!state.form[el.name];
      else el.value = state.form[el.name] ?? "";
    }
  } catch (_err) {
    // Fall back to local defaults for prototype resilience.
  }
}

await preloadData();
initEvents();
recomputeIssues();
render();
