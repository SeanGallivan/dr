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
    "no-visit":    { label: "No visit in 14+ days",  icon: "🚩", short: "MISSED",  sev: "red",    rank: 3 },
    "past-window": { label: "Past next-visit window", icon: "⌛", short: "OVERDUE", sev: "red",    rank: 3 },
    "needs-appt":  { label: "Needs appointment",     icon: "📅", short: "APPT",    sev: "orange", rank: 2 },
    "no-update":   { label: "No update in 10+ days", icon: "⏳", short: "STALE",   sev: "orange", rank: 2 },
    "needs-test":  { label: "Needs test",            icon: "🧪", short: "TEST",    sev: "yellow", rank: 1 }
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
    { key: "diagnosis",    label: "Status",         roles: ["admin","ipm","network"], sortable: true,  type: "diagnosis" },
    { key: "actions",      label: "Quick Actions",  roles: ["admin","ipm","network"], sortable: false, type: "actions" },
    { key: "runningTotal", label: "$",              roles: ["admin","ipm","network"], sortable: true,  type: "money" },
    { key: "ipmName",      label: "IPM",            roles: ["admin"],                 sortable: true,  type: "provider" },
    { key: "agingDays",    label: "Aging (days)",   roles: ["admin","ipm","network"], sortable: true,  type: "agingNum" },
    { key: "scheduling",   label: "Scheduling",     roles: ["admin","ipm","network"], sortable: true,  type: "scheduling" },
    { key: "nextVisit",    label: "Next Visit",     roles: ["admin","ipm","network"], sortable: true,  type: "nextVisit" },
    { key: "vsNetworkDays",label: "vs Network — Days", roles: ["admin","ipm"],        sortable: true,  type: "deltaDays" },
    { key: "vsNetworkCost",label: "vs Network — Cost", roles: ["admin","ipm"],        sortable: true,  type: "deltaMoney" },
    { key: "pif",          label: "PIF (start→now)",   roles: ["admin","ipm","network"], sortable: true, type: "pif" }
];

/* ---------------------------------------------------------------------
   ROLE DEFINITIONS — emphasis & tier access per role (BRD 3.2)
--------------------------------------------------------------------- */
var ADX_ROLES = {
    admin: {
        title: "Network Overview",
        subtitle: "All beneficiaries, all doctors, all payers — administrator & overseer view.",
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

/* ---------------------------------------------------------------------
   COMPOSITE / RAS SCORE  (BRD 6 & open question 10)
   Deliberately isolated & swappable — the formula can change without
   touching the UI. Function weighted more heavily than cost; absolute,
   like-for-like terms (a raw PIF percentage doesn't work).
--------------------------------------------------------------------- */
function computeComposite(provider, norms) {
    if (!provider || provider.composite == null) return null;
    norms = norms || ADX_NETWORK_NORMS;

    var W = { pif: 0.45, rtw: 0.25, cost: 0.20, time: 0.10 };

    var pifScore  = clamp100((provider.pifMedianGain / 5) * 100);
    var rtwScore  = clamp100(provider.returnToWork * 100);
    var costScore = clamp100((norms.avgCostPerCase / provider.avgCostPerCase) * 80);
    var timeScore = clamp100((norms.avgDaysInADX / provider.avgDaysInADX) * 80);

    var raw = pifScore * W.pif + rtwScore * W.rtw + costScore * W.cost + timeScore * W.time;
    return Math.round(raw);
}
function clamp100(n) { return Math.max(0, Math.min(100, n)); }

/* Bonus eligibility threshold (network/IPM) — swappable */
var ADX_BONUS_THRESHOLD = 80;
