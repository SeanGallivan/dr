/* =====================================================================
   ADX Dashboard — Role & View Configuration
   ---------------------------------------------------------------------
   Drives the "view-as" left nav (BRD 3.2) and role-specific differences
   (BRD 3.2 / 5.1): which columns show, whether cost is emphasized,
   single- vs multi-payer, composite score, and which tiers appear.
   ===================================================================== */

/* ---------------------------------------------------------------------
   FLAG METADATA  (BRD 5.3)
   Color is never the only signal — each flag carries an icon + label
   (WCAG 2.1 AA, no color-only meaning). `urgent` flags get promoted to
   the top alert surface (BRD section 4).
--------------------------------------------------------------------- */
var ADX_FLAGS = {
    "needs-test":   { label: "Needs test",            icon: "🧪", short: "TEST",  sev: "warn",   urgent: false, adminOnly: false },
    "needs-appt":   { label: "Needs appointment",     icon: "📅", short: "APPT",  sev: "warn",   urgent: false, adminOnly: false },
    "no-update":    { label: "No update in 10+ days", icon: "⏳", short: "STALE", sev: "warn",   urgent: false, adminOnly: false },
    "no-visit":     { label: "No visit in 14+ days",  icon: "🚩", short: "MISSED",sev: "urgent", urgent: true,  adminOnly: false },
    "missing-lien": { label: "No perfected lien on file", icon: "⚖️", short: "LIEN", sev: "urgent", urgent: true, adminOnly: true },
    "past-window":  { label: "Past next-visit window", icon: "⌛", short: "OVERDUE", sev: "urgent", urgent: true, adminOnly: false }
};

/* Threshold for "no update" / "no visit" flags — configurable (BRD 5.3) */
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
   `roles` lists which roles see the column (BRD 5.1).
     - payer: Brad/admin + IPM only (multi-payer). Hidden for single-payer network/specialty.
     - lien:  Brad/admin only.
     - runningTotal: central for admin + IPM; lighter for network/specialty.
   `sortable` columns power the sortable-table requirement.
--------------------------------------------------------------------- */
var ADX_COLUMNS = [
    { key: "beneficiary",  label: "Beneficiary / Patient", roles: ["admin","ipm","network","specialty"], sortable: true,  type: "text" },
    { key: "diagnosis",    label: "Diagnosis & Status",    roles: ["admin","ipm","network","specialty"], sortable: true,  type: "diagnosis" },
    { key: "runningTotal", label: "Running Total",         roles: ["admin","ipm","network","specialty"], sortable: true,  type: "money" },
    { key: "ipmName",      label: "Assigned IPM",          roles: ["admin"],                              sortable: true,  type: "provider" },
    { key: "payer",        label: "Payer",                 roles: ["admin","ipm"],                        sortable: true,  type: "payer" },
    { key: "agingDays",    label: "Aging (days)",          roles: ["admin","ipm","network"],              sortable: true,  type: "agingNum" },
    { key: "scheduling",   label: "Scheduling",            roles: ["admin","ipm","network","specialty"], sortable: true,  type: "scheduling" },
    { key: "nextVisit",    label: "Next Visit",            roles: ["admin","ipm","network","specialty"], sortable: true,  type: "nextVisit" },
    { key: "vsNetworkDays",label: "vs Network — Days",     roles: ["admin","ipm"],                        sortable: true,  type: "deltaDays" },
    { key: "vsNetworkCost",label: "vs Network — Cost",     roles: ["admin","ipm"],                        sortable: true,  type: "deltaMoney" },
    { key: "pif",          label: "PIF (start→now)",       roles: ["admin","ipm","network","specialty"], sortable: true,  type: "pif" },
    { key: "lienOnFile",   label: "Lien",                  roles: ["admin"],                              sortable: true,  type: "lien" },
    { key: "flags",        label: "Flags",                 roles: ["admin","ipm","network","specialty"], sortable: false, type: "flags" },
    { key: "actions",      label: "Quick Actions",         roles: ["admin","ipm","network","specialty"], sortable: false, type: "actions" }
];

/* ---------------------------------------------------------------------
   ROLE DEFINITIONS — emphasis & tier access per role (BRD 3.2)
--------------------------------------------------------------------- */
var ADX_ROLES = {
    admin: {
        title: "Network Overview",
        subtitle: "All beneficiaries, all providers, all payers — administrator & overseer view.",
        costEmphasis: true,
        multiPayer: true,
        tiers: ["daily", "weekly", "monthly"],
        showLien: true,
        showVsNetwork: true,
        terminology: "beneficiary"
    },
    ipm: {
        title: "IPM Coordinator View",
        subtitle: "Coordinated episodes — accumulating cost is central as referrals go out.",
        costEmphasis: true,
        multiPayer: true,
        tiers: ["daily", "weekly"],
        showLien: false,
        showVsNetwork: true,
        terminology: "patient"
    },
    network: {
        title: "Network Physician View",
        subtitle: "Your cases, your calendar & no-shows, your composite score vs the network. Single payer (ADX).",
        costEmphasis: false,
        multiPayer: false,
        tiers: ["daily", "weekly"],
        showLien: false,
        showVsNetwork: false,
        terminology: "patient"
    },
    specialty: {
        title: "Specialist View",
        subtitle: "Your procedures and their functional-score outcomes. Lightest view — running cost not shown.",
        costEmphasis: false,
        multiPayer: false,
        tiers: ["daily"],
        showLien: false,
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

/* ---------------------------------------------------------------------
   COMPOSITE / RAS SCORE  (BRD 6 & open question 10)
   Deliberately isolated & swappable: the formula can change without
   touching the UI. A raw PIF percentage does not work (a 2→4 is +100%
   but still poor), so components are weighted on absolute, like-for-like
   terms — function weighted more heavily than cost. Median is used at
   the network level so a couple of bad cases do not distort a provider
   who is generally strong.
--------------------------------------------------------------------- */
function computeComposite(provider, norms) {
    if (!provider || provider.composite == null) return null;
    norms = norms || ADX_NETWORK_NORMS;

    // Component weights — function weighted most heavily.
    var W = { pif: 0.45, rtw: 0.25, cost: 0.20, time: 0.10 };

    // Normalize each component to 0..100 against network norms.
    var pifScore  = clamp100((provider.pifMedianGain / 5) * 100);          // 5-pt gain ≈ excellent
    var rtwScore  = clamp100(provider.returnToWork * 100);
    var costScore = clamp100((norms.avgCostPerCase / provider.avgCostPerCase) * 80); // lower cost = higher
    var timeScore = clamp100((norms.avgDaysInADX / provider.avgDaysInADX) * 80);     // fewer days = higher

    var raw = pifScore * W.pif + rtwScore * W.rtw + costScore * W.cost + timeScore * W.time;
    return Math.round(raw);
}
function clamp100(n) { return Math.max(0, Math.min(100, n)); }

/* Bonus eligibility threshold (network/IPM) — swappable */
var ADX_BONUS_THRESHOLD = 80;
