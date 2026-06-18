/* =====================================================================
   ADX Dashboard — Role & View Configuration
   ===================================================================== */

/* ---------------------------------------------------------------------
   FLAG METADATA  (BRD 5.3)
   Three severity tiers drive the default sort order (red → orange →
   yellow). Color is never the only signal — each flag carries an icon
   + label (WCAG 2.1 AA, no color-only meaning).
     rank: 3 = red, 2 = orange, 1 = yellow
--------------------------------------------------------------------- */
var ADX_FLAGS = {
    "no-visit":    { label: "No visit in 14+ days",  short: "MISSED",   sev: "red",    rank: 3, marker: "triangle", color: "clay" },
    "past-window": { label: "Past next-visit window", short: "OVERDUE", sev: "red",    rank: 3, marker: "diamond",  color: "clay" },
    "off-track":   { label: "Below expected outcome trajectory", short: "OFF-TRACK", sev: "red",   rank: 3, marker: "square",   color: "clay" },
    "no-update":   { label: "No update in 10+ days", short: "STALE",    sev: "orange", rank: 2, marker: "ring",     color: "amber" },
    "needs-appt":  { label: "Needs appointment",     short: "APPT",     sev: "muted",  rank: 1, marker: "bar",      color: "muted" },
    "needs-test":  { label: "Needs test",            short: "TEST",     sev: "muted",  rank: 1, marker: "dot",      color: "muted" }
};

/* Scheduling shape markers (mirrors flag system; reuse same shapes). */
var ADX_SCHED_MARKERS = {
    "No-show":     { marker: "triangle-lg", color: "clay"   },
    "Unscheduled": { marker: "ring-lg",     color: "amber"  },
    "Scheduled":   { marker: "diamond-lg",  color: "accent" },
    "Seen":        { marker: "dot-lg",      color: "green"  }
};

/* Thresholds for "no update" / "no visit" flags — configurable (BRD 5.3) */
var ADX_THRESHOLDS = { noUpdateDays: 10, noVisitDays: 14 };

/* ---------------------------------------------------------------------
   CASE-STATUS OPTIONS for the status selector (BRD 5.4)
--------------------------------------------------------------------- */
var ADX_STATUS_OPTIONS = [
    { value: "Active",               label: "Active only" },
    { value: "__all__",              label: "All statuses" },
    { value: "Inactive complete",    label: "Inactive — complete" },
    { value: "Inactive incomplete",  label: "Inactive — incomplete" },
    { value: "Maintenance",          label: "Maintenance" }
];

/* ---------------------------------------------------------------------
   COLUMNS for the active-cases table.
   Order: Flags · Case · Status · Quick Actions · $ · IPM · Aging ·
          Scheduling · Next Visit · vs Network (days/cost) · PIF
   `roles` lists which roles see the column (BRD 5.1).
--------------------------------------------------------------------- */
var ADX_COLUMNS = [
    { key: "flags",        label: "Flags",          roles: ["admin","ipm","network"], sortable: true,  type: "flags" },
    { key: "beneficiary",  label: "Case",           roles: ["admin","ipm","network"], sortable: true,  type: "text" },
    { key: "diagnosis",    label: "Status",         roles: ["admin","ipm","network"], sortable: true,  type: "diagnosis", info: "status" },
    { key: "actions",      label: "Quick Actions",  roles: ["admin","ipm","network"], sortable: false, type: "actions" },
    { key: "runningTotal", label: "$",              roles: ["admin","ipm","network"], sortable: true,  type: "money", info: "running-total" },
    { key: "ipmName",      label: "IPM",            roles: ["admin"],                 sortable: true,  type: "provider" },
    { key: "agingDays",    label: "Aging (days)",   roles: ["admin","ipm","network"], sortable: true,  type: "agingNum", info: "aging" },
    { key: "scheduling",   label: "Scheduling",     roles: ["admin","ipm","network"], sortable: true,  type: "scheduling", info: "scheduling" },
    { key: "nextVisit",    label: "Next Visit",     roles: ["admin","ipm","network"], sortable: true,  type: "nextVisit" },
    { key: "vsNetworkDays",label: "vs Network — Days", roles: ["admin","ipm"],        sortable: true,  type: "deltaDays", info: "vs-days" },
    { key: "vsNetworkCost",label: "vs Network — Cost", roles: ["admin","ipm"],        sortable: true,  type: "deltaMoney", info: "vs-cost" },
    { key: "pif",          label: "PIFs (start→now)",  roles: ["admin","ipm","network"], sortable: true, type: "pif", info: "pif" }
];

/* ---------------------------------------------------------------------
   ROLE DEFINITIONS — emphasis & tier access per role (BRD 3.2)
--------------------------------------------------------------------- */
var ADX_ROLES = {
    admin: {
        title: "Network Overview",
        subtitle: "",
        costEmphasis: true,
        multiPayer: true,
        tiers: ["daily", "weekly", "monthly"],
        showVsNetwork: true,
        terminology: "beneficiary"
    },
    ipm: {
        title: "IPM Coordinator View",
        subtitle: "Coordinated episodes — accumulating cost is central as referrals go out.",
        costEmphasis: true,
        multiPayer: true,
        tiers: ["daily", "weekly"],
        showVsNetwork: true,
        terminology: "patient"
    },
    network: {
        title: "Network Physician View",
        subtitle: "Your cases, your calendar & no-shows, your composite score vs the network. Single payer (ADX).",
        costEmphasis: false,
        multiPayer: false,
        tiers: ["daily", "weekly"],
        showVsNetwork: false,
        terminology: "patient"
    }
};

/* Tier labels for the header navigation */
var ADX_TIERS = {
    daily:   { label: "Daily",   sub: "Operational Pulse" },
    weekly:  { label: "Weekly",  sub: "Management" },
    monthly: { label: "Monthly", sub: "Strategic" }
};

/* Composite score is supplied by ADX (provider.composite). The real bonus
   formula / weighting is pending from ADX — until then the UI shows the
   score and eligibility without claiming a method (change-req D1/D2). */
var ADX_BONUS_THRESHOLD = 80;

/* Which composite components are clinical outcomes vs management inputs (C1c) */
var ADX_COMPONENT_KIND = {
    "PIF Median Gain":  "clinical",   // PIFs
    "Avg Days in ADX":  "clinical",   // proxy for Time to MBT
    "Return to Work":   "management",
    "Avg Cost / Case":  "management"
};

/* ---------------------------------------------------------------------
   METRIC DEFINITIONS (I1)
   Single editable source of truth so ADX can revise wording without code
   changes. Surfaced via adxInfo(key) as an accessible info-icon tooltip.
--------------------------------------------------------------------- */
var ADX_DEFINITIONS = {
    "pif": "PIFs score (Patient-Identified Functional improvement): a quantified measure of patient-identified functional improvement. The patient names the functional goals or activities they want to regain, and progress toward those goals is reassessed and scored over time. Because the patient sets the goals, it applies across every subspecialty.",
    "time-to-mbt": "Time to MBT: time from the start of treatment to the point of Maximum Benefit of Therapy.",
    "mbt": "Maximum Benefit of Therapy: the point at which a patient has reached the greatest clinically meaningful improvement treatment can reasonably provide; further treatment yields little or no added gain.",
    "composite": "Composite score: a single 0–100 score summarizing a physician's outcomes and efficiency for network benchmarking and bonus eligibility. (Official ADX formula pending.)",
    "bonus": "Bonus eligibility: whether the physician's composite score meets the network threshold for a performance bonus.",
    "aging": "Aging (days): number of days the case has been open in ADX since intake.",
    "running-total": "Running total: cumulative cost accrued on this case across all providers and services in the episode.",
    "vs-days": "vs Network — Days: how this case's aging compares to the network norm for similar cases. A positive value means it is running longer than peers.",
    "vs-cost": "vs Network — Cost: how this case's running cost compares to the network norm. A positive value means it is costing more than peers.",
    "rtw": "Return to Work: share of a physician's beneficiaries who have returned to work.",
    "avg-cost": "Avg Cost / Case: average cumulative cost across a physician's cases.",
    "avg-days": "Avg Days in ADX: average time a physician's cases stay open, intake to close.",
    "new-intake": "New intake: a newly referred case accepted into the physician's panel.",
    "status": "Active: in active treatment. Maintenance: stable, periodic care. Inactive (complete): closed, reached MBT. Inactive (incomplete): closed before reaching MBT.",
    "scheduling": "Scheduling: whether the next visit is scheduled, the patient has been seen, was a no-show, or is unscheduled.",
    "realization": "Realization rate: expected collectible share of the portfolio's face value.",
    "weighted-ev": "Weighted expected value: portfolio face value adjusted by the realization rate.",
    "referrals": "Referrals received: new patients ADX placed with you in the period.",
    "intakes": "Intakes accepted: referred cases you accepted into your panel in the period.",
    "adx-payment": "ADX payment: amount ADX paid you for the period (single payer — ADX)."
};

/* Accessible info-icon tooltip (I1). The trigger is inline; the popup is a
   single portal node (#adxTooltip) positioned `fixed`, so it is never
   clipped by table scroll containers, KPI cards, or sidebars. Works on
   hover AND keyboard focus; ESC dismisses. */
function adxInfo(key) {
    var def = ADX_DEFINITIONS[key];
    if (!def) return "";
    var label = String(key).replace(/-/g, " ");
    var dataAttr = encodeURIComponent(def);
    return '<span class="adx-info-wrap">' +
        '<button type="button" class="adx-info" aria-label="Definition: ' + label + '" ' +
        'data-tip="' + dataAttr + '" data-tip-title="' + label + '">' +
        '<span aria-hidden="true">&#9432;</span></button></span>';
}

/* Shape marker (colorblind-safe). Returns an empty span with the shape +
   reinforcing color classes. Reused by flag chips and scheduling cells. */
function adxMarker(shape, color, extra) {
    return '<span class="adx-mk adx-mk-' + shape + ' adx-color-' + (color || "muted") +
           (extra ? ' ' + extra : '') + '" aria-hidden="true"></span>';
}

/* No-op kept for compatibility — the data-source legend has been removed
   per Sean's request; the inline [DR]/[FHIR]/[Salesforce] tags remain. */
function adxSourceLegend() { return ""; }

/* --------- Theme persistence (dark default, persists per user) --------- */
function adxTheme() {
    try { return localStorage.getItem("adx_theme") || "dark"; } catch (e) { return "dark"; }
}
function adxApplyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("adx_theme", t); } catch (e) {}
    var btn = document.getElementById("adxThemeToggle");
    if (btn) {
        btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
        var knob = btn.querySelector(".knob");
        if (knob) knob.textContent = t === "dark" ? "☾" : "☀";
    }
}
function adxToggleTheme() {
    adxApplyTheme(adxTheme() === "dark" ? "light" : "dark");
}
/* Apply at load so the page never flashes the wrong theme. */
(function () {
    try { document.documentElement.setAttribute("data-theme", localStorage.getItem("adx_theme") || "dark"); } catch (e) {}
})();

/* --------- Portal tooltip controller --------- */
var ADXTooltip = (function () {
    var el = null;
    function ensure() {
        if (el) return el;
        el = document.createElement("div");
        el.id = "adxTooltip"; el.setAttribute("role", "tooltip");
        el.innerHTML = '<div class="tip-title"></div><div class="tip-body"></div>';
        document.body.appendChild(el);
        return el;
    }
    function show(target) {
        var def = target.getAttribute("data-tip");
        if (!def) return;
        var title = target.getAttribute("data-tip-title") || "";
        var t = ensure();
        t.querySelector(".tip-title").textContent = title;
        t.querySelector(".tip-body").textContent = decodeURIComponent(def);
        t.classList.add("show");
        var r = target.getBoundingClientRect();
        // measure
        var tw = t.offsetWidth, th = t.offsetHeight;
        var vw = window.innerWidth, vh = window.innerHeight;
        var x = r.left;
        // clamp horizontally
        if (x + tw > vw - 10) x = vw - tw - 10;
        if (x < 10) x = 10;
        var y = r.bottom + 8;
        // flip above if it would overflow
        if (y + th > vh - 10) y = r.top - th - 8;
        t.style.left = x + "px";
        t.style.top = y + "px";
    }
    function hide() { if (el) el.classList.remove("show"); }
    function bind() {
        document.addEventListener("mouseover", function (e) {
            var t = e.target.closest && e.target.closest(".adx-info, [data-tip]");
            if (t && t.hasAttribute("data-tip")) show(t);
        });
        document.addEventListener("mouseout", function (e) {
            var t = e.target.closest && e.target.closest(".adx-info, [data-tip]");
            if (t) hide();
        });
        document.addEventListener("focusin", function (e) {
            var t = e.target.closest && e.target.closest(".adx-info, [data-tip]");
            if (t && t.hasAttribute("data-tip")) show(t);
        });
        document.addEventListener("focusout", function () { hide(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
        window.addEventListener("scroll", hide, true);
        window.addEventListener("resize", hide);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    } else { bind(); }
    return { show: show, hide: hide };
})();
