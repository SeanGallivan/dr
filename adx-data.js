/* =====================================================================
   ADX (Accurate Diagnosis) — Derived Results Dashboard Mock Data
   ---------------------------------------------------------------------
   Prototype data only. Shaped so the live handoff is just pointing the
   data calls at real endpoints. Field groups tagged to their real
   source per BRD section 9:
     [DR]         Derived Results  — clinical & billing
     [Salesforce] referral, client, payer, revenue, aging
     [FHIR]       Practice EMR (Harris CareTracker) — calendar, no-shows
   Provider roster uses the real ADX physician network
   (adxcorp.net/physician-network).
   ===================================================================== */

/* ---------------------------------------------------------------------
   PAYERS — funding companies that pay ADX.  [Salesforce]
--------------------------------------------------------------------- */
var ADX_PAYERS = [
    { id: "PAY1", name: "Pathway Funding",          paysOnTime: true,  avgDaysToPay: 34, reminderRequired: false },
    { id: "PAY2", name: "Meridian Legal Capital",   paysOnTime: true,  avgDaysToPay: 41, reminderRequired: false },
    { id: "PAY3", name: "Summit Case Funding",      paysOnTime: false, avgDaysToPay: 78, reminderRequired: true  },
    { id: "PAY4", name: "Apex Funding Partners",       paysOnTime: false, avgDaysToPay: 96, reminderRequired: true  }
];

/* ---------------------------------------------------------------------
   PROVIDERS / VIEW-AS ROSTER  [DR]   (real ADX network names)
   role: 'admin' | 'ipm' | 'network'
   - Brad is admin + treating IPM (default view).
   - Only two IPMs: Dr. Bradley Vilims and Dr. Drew Trainor.
   - All other network physicians are specialists (single 'network' group).
--------------------------------------------------------------------- */
var ADX_PROVIDERS = [
    { id: "DR_BRAD", name: "Dr. Bradley Vilims", shortName: "Dr. Vilims", role: "admin",
      title: "President / CEO", org: "ADX Innovative Musculoskeletal Care",
      specialty: "Interventional Pain · Network Overseer",
      composite: null, note: "Network administrator, overseer, and treating IPM." },

    /* Interventional Pain Physicians (episode coordinators) */
    { id: "IPM_VILIMS", name: "Dr. Bradley Vilims", shortName: "Dr. Vilims", role: "ipm",
      title: "Interventional Pain (IPM)", org: "Colorado Pain Specialists",
      specialty: "Interventional Pain (IPM)",
      composite: 88, returnToWork: 0.84, pifMedianGain: 3.8, avgCostPerCase: 17800, avgDaysInADX: 44, bonusEligible: true },
    { id: "IPM_TRAINOR", name: "Dr. Drew Trainor", shortName: "Dr. Trainor", role: "ipm",
      title: "Pain Medicine & PM&R (IPM)", org: "Denver Back Pain Specialists",
      specialty: "Pain Medicine & PM&R (IPM)",
      composite: 73, returnToWork: 0.69, pifMedianGain: 2.5, avgCostPerCase: 24100, avgDaysInADX: 61, bonusEligible: false },

    /* Network physicians (specialists; use ADX purely as a payer) */
    { id: "NET_BAZAZ", name: "Dr. Rajesh Bazaz", shortName: "Dr. Bazaz", role: "network",
      title: "Orthopedic Sports Medicine", org: "Western Orthopaedics",
      specialty: "Knee & Shoulder / Joint Replacement",
      composite: 85, returnToWork: 0.81, pifMedianGain: 3.7, avgCostPerCase: 28900, avgDaysInADX: 31, bonusEligible: true },
    { id: "NET_DUHON", name: "Dr. Brad Duhon", shortName: "Dr. Duhon", role: "network",
      title: "Board-Certified Neurosurgeon", org: "Boulder Neurosurgical & Spine Associates",
      specialty: "Neurosurgery / Spine",
      composite: 79, returnToWork: 0.75, pifMedianGain: 3.4, avgCostPerCase: 36200, avgDaysInADX: 35, bonusEligible: false },
    { id: "NET_GHAZI", name: "Dr. Usama Ghazi", shortName: "Dr. Ghazi", role: "network",
      title: "Physical Medicine & Rehabilitation / Pain", org: "Colorado Rehabilitation & Occupational Medicine",
      specialty: "PM&R / Pain Management",
      composite: 90, returnToWork: 0.87, pifMedianGain: 4.0, avgCostPerCase: 11200, avgDaysInADX: 39, bonusEligible: true },
    { id: "NET_HATZ", name: "Dr. Armodios Hatzidakis", shortName: "Dr. Hatzidakis", role: "network",
      title: "Orthopaedic Specialist – Shoulder & Elbow", org: "Western Orthopaedics, P.C.",
      specialty: "Shoulder & Elbow",
      composite: 83, returnToWork: 0.80, pifMedianGain: 3.6, avgCostPerCase: 22400, avgDaysInADX: 30, bonusEligible: true },
    { id: "NET_NAKAMURA", name: "Dr. Shawn Nakamura", shortName: "Dr. Nakamura", role: "network",
      title: "Orthopedic Surgery", org: "AdventHealth Medical Group Orthopedics at Castle Rock",
      specialty: "Orthopedic Surgery",
      composite: 76, returnToWork: 0.72, pifMedianGain: 3.1, avgCostPerCase: 30100, avgDaysInADX: 36, bonusEligible: false },
    { id: "NET_WHITE", name: "Dr. Brian White", shortName: "Dr. White", role: "network",
      title: "Board-Certified Orthopaedic Hip Surgeon", org: "Western Orthopaedics, P.C.",
      specialty: "Hip Surgery",
      composite: 81, returnToWork: 0.78, pifMedianGain: 3.5, avgCostPerCase: 33400, avgDaysInADX: 33, bonusEligible: true },
    { id: "NET_YI", name: "Dr. In Sok Yi", shortName: "Dr. Yi", role: "network",
      title: "Orthopedic Hand, Wrist & Elbow Surgeon", org: "Orthopedics and Spine at Inverness",
      specialty: "Hand, Wrist & Elbow",
      composite: 77, returnToWork: 0.73, pifMedianGain: 3.0, avgCostPerCase: 18900, avgDaysInADX: 34, bonusEligible: false }
];

/* Network benchmarks used for "performance vs network" comparisons. */
var ADX_NETWORK_NORMS = {
    avgDaysInADX: 49,
    avgCostPerCase: 19500,
    composite: 78,
    returnToWork: 0.74
};

/* ---------------------------------------------------------------------
   REFERRAL SOURCES / CLIENTS  [Salesforce]
--------------------------------------------------------------------- */
var ADX_CLIENTS = [
    { id: "CL1", name: "Harmon & Reyes Injury Law", type: "Attorney",     volume: 38, activeVolume: 14, revenueYTD: 1284000, payer: "Pathway Funding",        cashValue: 412000 },
    { id: "CL2", name: "Delgado Trial Group",        type: "Attorney",     volume: 27, activeVolume: 9,  revenueYTD: 918000,  payer: "Meridian Legal Capital", cashValue: 286000 },
    { id: "CL3", name: "Whitaker & Stone, LLP",      type: "Attorney",     volume: 22, activeVolume: 7,  revenueYTD: 742000,  payer: "Summit Case Funding",    cashValue: 198000 },
    { id: "CL4", name: "Crossroads Spine & Sport",   type: "Chiropractor", volume: 19, activeVolume: 6,  revenueYTD: 421000,  payer: "Pathway Funding",        cashValue: 134000 },
    { id: "CL5", name: "Brennan Auto Injury Clinic", type: "Referring MD", volume: 15, activeVolume: 5,  revenueYTD: 356000,  payer: "Apex Funding Partners",     cashValue: 96000  },
    { id: "CL6", name: "Quincy Vargas Law Office",   type: "Attorney",     volume: 11, activeVolume: 3,  revenueYTD: 244000,  payer: "Meridian Legal Capital", cashValue: 71000  }
];

/* ---------------------------------------------------------------------
   ACTIVE-CASES TABLE — the spine of the Daily view.
   One row per active case (a beneficiary's diagnosis / episode).
   IPM is always Vilims or Trainor; team providers are network specialists.
--------------------------------------------------------------------- */
var ADX_CASES = [
    {
        id: "C1001", beneficiary: "Marcus Whitfield", dob: "4/12/1979", age: 47,
        diagnosis: "L4-L5 disc herniation w/ radiculopathy", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI", "NET_DUHON"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 22850, agingDays: 52,
        scheduling: "Scheduled", lastVisit: "2026-06-09", nextVisit: "2026-06-23",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 3, vsNetworkCost: 3350,
        pifStart: 3, pifCurrent: 6, pifTarget: 8,
        flags: ["needs-test"],
        planNote: "Continue conservative + ESI series; reassess for surgical consult at MBT.",
        costBreakdown: [
            { item: "IPM evaluation & management (Vilims)", amount: 3200, source: "DR" },
            { item: "Lumbar MRI", amount: 2650, source: "DR" },
            { item: "PM&R / PT course (Ghazi)", amount: 4800, source: "DR" },
            { item: "Lumbar ESI x2", amount: 5400, source: "DR" },
            { item: "Spine surgery consult (Duhon)", amount: 6800, source: "DR" }
        ],
        visits: [
            { date: "2026-04-18", note: "Intake & exam — IPM (Vilims). PIF 3.", source: "DR" },
            { date: "2026-05-02", note: "Lumbar MRI reviewed; ESI planned.", source: "DR" },
            { date: "2026-05-20", note: "ESI #1 administered. PIF 5.", source: "DR" },
            { date: "2026-06-09", note: "PT progress; surgical consult ordered. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1002", beneficiary: "Daniela Ferreira", dob: "9/30/1986", age: 39,
        diagnosis: "Rotator cuff tear, right shoulder", diagnosisStatus: "Awaiting surgery",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_HATZ"],
        payerId: "PAY2", clientId: "CL2",
        runningTotal: 18920, agingDays: 38,
        scheduling: "Scheduled", lastVisit: "2026-06-11", nextVisit: "2026-06-19",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -8, vsNetworkCost: -580,
        pifStart: 2, pifCurrent: 4, pifTarget: 8,
        flags: [],
        planNote: "Pre-op optimization; arthroscopic repair scheduled with Hatzidakis.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2900, source: "DR" },
            { item: "Shoulder MRI", amount: 2420, source: "DR" },
            { item: "Subacromial injection", amount: 1600, source: "DR" },
            { item: "Ortho surgical consult (Hatzidakis)", amount: 5200, source: "DR" },
            { item: "Pre-op labs & clearance", amount: 6800, source: "DR" }
        ],
        visits: [
            { date: "2026-05-04", note: "Intake — IPM (Vilims). Conservative trial begun. PIF 2.", source: "DR" },
            { date: "2026-05-22", note: "Injection; limited relief.", source: "DR" },
            { date: "2026-06-11", note: "Surgical consult — repair scheduled. PIF 4.", source: "DR" }
        ]
    },
    {
        id: "C1003", beneficiary: "Terrence Bauer", dob: "1/8/1968", age: 58,
        diagnosis: "Cervical facet syndrome C5-C7", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 34110, agingDays: 91,
        scheduling: "No-show", lastVisit: "2026-05-12", nextVisit: "2026-06-02",
        nextVisitFlag: true, unscheduledAgeDays: 15,
        vsNetworkDays: 28, vsNetworkCost: 11600,
        pifStart: 4, pifCurrent: 5, pifTarget: 8,
        flags: ["no-visit", "past-window", "needs-appt"],
        planNote: "Stalled — RFA discussed but patient missed last two visits. Push to re-engage.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3100, source: "DR" },
            { item: "Cervical MRI + X-ray", amount: 3010, source: "DR" },
            { item: "Medial branch blocks x3", amount: 8200, source: "DR" },
            { item: "PT course (Ghazi)", amount: 6800, source: "DR" },
            { item: "Repeat imaging + E&M", amount: 13000, source: "DR" }
        ],
        visits: [
            { date: "2026-03-12", note: "Intake — IPM (Trainor). PIF 4.", source: "DR" },
            { date: "2026-04-09", note: "Medial branch blocks; partial relief.", source: "DR" },
            { date: "2026-05-12", note: "PT progress slow. PIF 5.", source: "DR" },
            { date: "2026-06-02", note: "No-show — RFA visit missed.", source: "FHIR" }
        ]
    },
    {
        id: "C1004", beneficiary: "Aisha Okonkwo", dob: "6/22/1992", age: 33,
        diagnosis: "Knee meniscal tear, left", diagnosisStatus: "New intake",
        status: "Active", newIntake: true,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_BAZAZ"],
        payerId: "PAY1", clientId: "CL4",
        runningTotal: 2400, agingDays: 4,
        scheduling: "Unscheduled", lastVisit: "2026-06-13", nextVisit: null,
        nextVisitFlag: false, unscheduledAgeDays: 4,
        vsNetworkDays: -42, vsNetworkCost: -16800,
        pifStart: 3, pifCurrent: 3, pifTarget: 8,
        flags: ["needs-appt"],
        planNote: "New intake — order MRI, begin PT, schedule sports-medicine consult with Bazaz.",
        costBreakdown: [
            { item: "Intake evaluation (Vilims)", amount: 2400, source: "DR" }
        ],
        visits: [
            { date: "2026-06-13", note: "Intake — IPM (Vilims). PIF 3.", source: "DR" }
        ]
    },
    {
        id: "C1005", beneficiary: "Roy Calderon", dob: "11/3/1974", age: 51,
        diagnosis: "Lumbar spinal stenosis", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI", "NET_DUHON"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 41280, agingDays: 118,
        scheduling: "Seen", lastVisit: "2026-06-14", nextVisit: "2026-07-05",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 41, vsNetworkCost: 18900,
        pifStart: 2, pifCurrent: 4, pifTarget: 8,
        flags: ["no-update", "off-track"],
        planNote: "High-cost outlier. Surgical decompression under review with Duhon.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3300, source: "DR" },
            { item: "Lumbar MRI + EMG", amount: 4980, source: "DR" },
            { item: "ESI series x3", amount: 8100, source: "DR" },
            { item: "Rehab course (Ghazi)", amount: 5900, source: "DR" },
            { item: "Spine consult + repeat imaging (Duhon)", amount: 19000, source: "DR" }
        ],
        visits: [
            { date: "2026-02-16", note: "Intake — IPM (Trainor). PIF 2.", source: "DR" },
            { date: "2026-03-30", note: "ESI series begun.", source: "DR" },
            { date: "2026-05-08", note: "Rehab progress modest. PIF 4.", source: "DR" },
            { date: "2026-06-14", note: "Surgical decompression under review.", source: "DR" }
        ]
    },
    {
        id: "C1006", beneficiary: "Naomi Sutter", dob: "3/17/1990", age: 36,
        diagnosis: "Whiplash-associated disorder", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY2", clientId: "CL1",
        runningTotal: 8650, agingDays: 22,
        scheduling: "Scheduled", lastVisit: "2026-06-12", nextVisit: "2026-06-26",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -19, vsNetworkCost: -7200,
        pifStart: 4, pifCurrent: 7, pifTarget: 8,
        flags: [],
        planNote: "Responding well to PT. Likely to reach MBT within 3 weeks.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2800, source: "DR" },
            { item: "Cervical X-ray", amount: 850, source: "DR" },
            { item: "PT course (Ghazi)", amount: 5000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-22", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-02", note: "PT progressing; pain down. PIF 6.", source: "DR" },
            { date: "2026-06-12", note: "Continued improvement. PIF 7.", source: "DR" }
        ]
    },
    {
        id: "C1007", beneficiary: "Hector Salinas", dob: "7/25/1963", age: 62,
        diagnosis: "Hip osteoarthritis, right", diagnosisStatus: "Maintenance",
        status: "Maintenance", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_WHITE"],
        payerId: "PAY1", clientId: "CL2",
        runningTotal: 27600, agingDays: 0,
        scheduling: "Seen", lastVisit: "2026-05-28", nextVisit: "2026-08-28",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 12, vsNetworkCost: 4100,
        pifStart: 3, pifCurrent: 6, pifTarget: 7,
        flags: [],
        planNote: "Meds-only maintenance (clock stopped). Cannot order new tests without reactivating.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3000, source: "DR" },
            { item: "Hip injection series", amount: 6600, source: "DR" },
            { item: "Ortho consult (White)", amount: 8000, source: "DR" },
            { item: "PT + maintenance meds", amount: 10000, source: "DR" }
        ],
        visits: [
            { date: "2026-01-14", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-03-20", note: "Injection series; good response.", source: "DR" },
            { date: "2026-05-28", note: "Transitioned to maintenance. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1008", beneficiary: "Priya Nadkarni", dob: "12/9/1983", age: 42,
        diagnosis: "Carpal tunnel syndrome, bilateral", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_YI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 6120, agingDays: 29,
        scheduling: "Scheduled", lastVisit: "2026-06-10", nextVisit: "2026-06-24",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -14, vsNetworkCost: -5800,
        pifStart: 4, pifCurrent: 6, pifTarget: 8,
        flags: ["needs-test"],
        planNote: "Conservative management; EMG pending to confirm severity.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2700, source: "DR" },
            { item: "Bilateral wrist splinting + rehab (Yi)", amount: 3420, source: "DR" }
        ],
        visits: [
            { date: "2026-05-16", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-10", note: "Splinting + rehab; EMG ordered. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1009", beneficiary: "Garrett Mullins", dob: "5/14/1971", age: 55,
        diagnosis: "Lumbar radiculopathy", diagnosisStatus: "Closed — reached MBT",
        status: "Inactive complete", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 14200, agingDays: 0,
        scheduling: "Seen", lastVisit: "2026-05-30", nextVisit: null,
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -11, vsNetworkCost: -5300,
        pifStart: 3, pifCurrent: 8, pifTarget: 8,
        flags: [],
        planNote: "Closed at MBT. PIF 3→8, returned to work. Strong outcome.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2900, source: "DR" },
            { item: "Lumbar MRI", amount: 2600, source: "DR" },
            { item: "ESI x2 + PT (Ghazi)", amount: 8700, source: "DR" }
        ],
        visits: [
            { date: "2026-03-02", note: "Intake — IPM (Vilims). PIF 3.", source: "DR" },
            { date: "2026-04-15", note: "ESI + PT; strong response.", source: "DR" },
            { date: "2026-05-30", note: "Closed at MBT. PIF 8. RTW.", source: "DR" }
        ]
    },
    {
        id: "C1010", beneficiary: "Lorraine Esposito", dob: "8/2/1959", age: 66,
        diagnosis: "Cervical spondylosis", diagnosisStatus: "Funding lapsed",
        status: "Inactive incomplete", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 9800, agingDays: 0,
        scheduling: "Unscheduled", lastVisit: "2026-04-26", nextVisit: null,
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 0, vsNetworkCost: 0,
        pifStart: 3, pifCurrent: 4, pifTarget: 8,
        flags: [],
        planNote: "Inactive incomplete — funding lapsed, patient declined to continue. Clock stopped.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3100, source: "DR" },
            { item: "Cervical imaging + PT (Ghazi)", amount: 6700, source: "DR" }
        ],
        visits: [
            { date: "2026-03-18", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-04-26", note: "Funding lapsed; treatment paused.", source: "DR" }
        ]
    },
    {
        id: "C1011", beneficiary: "Devin Pruitt", dob: "2/19/1995", age: 31,
        diagnosis: "Lumbar strain w/ SI joint dysfunction", diagnosisStatus: "New intake",
        status: "Active", newIntake: true,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY2", clientId: "CL6",
        runningTotal: 1800, agingDays: 2,
        scheduling: "Scheduled", lastVisit: "2026-06-15", nextVisit: "2026-06-22",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -47, vsNetworkCost: -17700,
        pifStart: 4, pifCurrent: 4, pifTarget: 8,
        flags: [],
        planNote: "New intake. Begin conservative rehab.",
        costBreakdown: [
            { item: "Intake evaluation (Vilims)", amount: 1800, source: "DR" }
        ],
        visits: [
            { date: "2026-06-15", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" }
        ]
    },
    {
        id: "C1012", beneficiary: "Yolanda Reyes", dob: "10/28/1977", age: 48,
        diagnosis: "Thoracic outlet syndrome", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI", "NET_DUHON"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 19340, agingDays: 64,
        scheduling: "Scheduled", lastVisit: "2026-06-08", nextVisit: "2026-06-29",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 9, vsNetworkCost: 1200,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: ["no-update"],
        planNote: "Multidisciplinary; awaiting surgical opinion from Duhon.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3200, source: "DR" },
            { item: "Imaging + nerve studies", amount: 4140, source: "DR" },
            { item: "PT course (Ghazi)", amount: 5000, source: "DR" },
            { item: "Spine/vascular consult (Duhon)", amount: 7000, source: "DR" }
        ],
        visits: [
            { date: "2026-04-12", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-05-15", note: "Nerve studies; PT begun.", source: "DR" },
            { date: "2026-06-08", note: "Surgical opinion requested. PIF 5.", source: "DR" }
        ]
    },
    {
        id: "C1013", beneficiary: "Caleb Whitman", dob: "6/6/1988", age: 38,
        diagnosis: "ACL tear, right knee", diagnosisStatus: "Post-op rehab",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_BAZAZ", "NET_GHAZI"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 36750, agingDays: 73,
        scheduling: "Seen", lastVisit: "2026-06-13", nextVisit: "2026-06-27",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 5, vsNetworkCost: 2600,
        pifStart: 2, pifCurrent: 6, pifTarget: 9,
        flags: [],
        planNote: "Post-op rehab progressing on schedule with Ghazi.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2900, source: "DR" },
            { item: "Knee MRI", amount: 2450, source: "DR" },
            { item: "ACL reconstruction (Bazaz)", amount: 24400, source: "DR" },
            { item: "Post-op rehab (Ghazi)", amount: 7000, source: "DR" }
        ],
        visits: [
            { date: "2026-04-04", note: "Intake — IPM (Vilims). PIF 2.", source: "DR" },
            { date: "2026-04-28", note: "ACL reconstruction (Bazaz).", source: "DR" },
            { date: "2026-06-13", note: "Rehab on schedule. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1014", beneficiary: "Simone Beckett", dob: "4/1/1981", age: 45,
        diagnosis: "Chronic migraine post-MVA", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY2", clientId: "CL2",
        runningTotal: 11420, agingDays: 47,
        scheduling: "No-show", lastVisit: "2026-05-19", nextVisit: "2026-06-09",
        nextVisitFlag: true, unscheduledAgeDays: 8,
        vsNetworkDays: 2, vsNetworkCost: -400,
        pifStart: 3, pifCurrent: 4, pifTarget: 7,
        flags: ["no-visit", "needs-appt"],
        planNote: "Missed Botox follow-up. Notify ADX; re-engage scheduling.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3100, source: "DR" },
            { item: "Imaging + neuro workup", amount: 3320, source: "DR" },
            { item: "Botox + PT (Ghazi)", amount: 5000, source: "DR" }
        ],
        visits: [
            { date: "2026-04-10", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-05-19", note: "Botox administered. PIF 4.", source: "DR" },
            { date: "2026-06-09", note: "No-show — follow-up missed.", source: "FHIR" }
        ]
    },
    {
        id: "C1015", beneficiary: "Andre Fontaine", dob: "9/12/1966", age: 59,
        diagnosis: "Shoulder impingement, left", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_HATZ"],
        payerId: "PAY1", clientId: "CL4",
        runningTotal: 7240, agingDays: 19,
        scheduling: "Scheduled", lastVisit: "2026-06-11", nextVisit: "2026-06-25",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -22, vsNetworkCost: -8900,
        pifStart: 4, pifCurrent: 6, pifTarget: 8,
        flags: [],
        planNote: "Good response to PT + injection. On track for MBT.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2740, source: "DR" },
            { item: "Subacromial injection + PT (Hatzidakis)", amount: 4500, source: "DR" }
        ],
        visits: [
            { date: "2026-05-28", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-11", note: "Injection + PT; improving. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1016", beneficiary: "Brenda Coates", dob: "1/30/1972", age: 54,
        diagnosis: "Lumbar facet arthropathy", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 16880, agingDays: 81,
        scheduling: "Unscheduled", lastVisit: "2026-05-05", nextVisit: null,
        nextVisitFlag: true, unscheduledAgeDays: 43,
        vsNetworkDays: 17, vsNetworkCost: 3400,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: ["past-window", "no-update", "needs-appt"],
        planNote: "Said 'see in 6 weeks' — next visit never scheduled (43 days). Surface to scheduling.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3200, source: "DR" },
            { item: "RFA + medial branch blocks", amount: 8680, source: "DR" },
            { item: "Rehab course (Ghazi)", amount: 5000, source: "DR" }
        ],
        visits: [
            { date: "2026-03-24", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-05-05", note: "RFA; advised 6-week follow-up.", source: "DR" }
        ]
    },
    {
        id: "C1017", beneficiary: "Marcus Whitfield", dob: "4/12/1979", age: 47,
        diagnosis: "Right shoulder bursitis (secondary dx)", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_HATZ"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 4100, agingDays: 16,
        scheduling: "Scheduled", lastVisit: "2026-06-09", nextVisit: "2026-06-23",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -25, vsNetworkCost: -9100,
        pifStart: 5, pifCurrent: 6, pifTarget: 8,
        flags: [],
        planNote: "Second diagnosis for an existing beneficiary — tracked as its own episode.",
        costBreakdown: [
            { item: "Shoulder eval + injection (Vilims)", amount: 4100, source: "DR" }
        ],
        visits: [
            { date: "2026-05-30", note: "Secondary dx opened. PIF 5.", source: "DR" },
            { date: "2026-06-09", note: "Injection; mild improvement. PIF 6.", source: "DR" }
        ]
    },
    {
        id: "C1018", beneficiary: "Wendell Pierce", dob: "7/7/1955", age: 70,
        diagnosis: "Spinal stenosis w/ neurogenic claudication", diagnosisStatus: "Surgical workup",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_DUHON", "NET_GHAZI"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 29870, agingDays: 102,
        scheduling: "Seen", lastVisit: "2026-06-12", nextVisit: "2026-06-30",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 33, vsNetworkCost: 9100,
        pifStart: 2, pifCurrent: 3, pifTarget: 7,
        flags: ["no-update", "off-track"],
        planNote: "High-cost, slow progress. Surgical decompression workup with Duhon.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3300, source: "DR" },
            { item: "Imaging + EMG", amount: 4970, source: "DR" },
            { item: "ESI series", amount: 6600, source: "DR" },
            { item: "Spine surgical workup (Duhon)", amount: 15000, source: "DR" }
        ],
        visits: [
            { date: "2026-03-06", note: "Intake — IPM (Trainor). PIF 2.", source: "DR" },
            { date: "2026-04-22", note: "ESI series; limited relief.", source: "DR" },
            { date: "2026-06-12", note: "Surgical workup begun. PIF 3.", source: "DR" }
        ]
    },

    /* ---------------------------------------------------------------
       Additional diagnoses so patients carry multiple patient/diagnosis
       pairs (realistic for PI / MVA cases with several injuries).
       Distribution target: ~50% of patients with 2 diagnoses, ~25% with
       3. Each pair keeps the patient's existing IPM, payer, and client.
    --------------------------------------------------------------- */

    /* Marcus Whitfield — 3rd diagnosis */
    {
        id: "C1019", beneficiary: "Marcus Whitfield", dob: "4/12/1979", age: 47,
        diagnosis: "Cervical strain (whiplash)", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 5200, agingDays: 30,
        scheduling: "Scheduled", lastVisit: "2026-06-05", nextVisit: "2026-06-26",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -20, vsNetworkCost: -8200,
        pifStart: 4, pifCurrent: 6, pifTarget: 8,
        flags: [],
        planNote: "Whiplash from the same MVA; PT progressing well.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2200, source: "DR" },
            { item: "Cervical X-ray + PT (Ghazi)", amount: 3000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-19", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-05", note: "PT progressing; ROM improving. PIF 6.", source: "DR" }
        ]
    },

    /* Roy Calderon — 2nd & 3rd diagnoses */
    {
        id: "C1020", beneficiary: "Roy Calderon", dob: "11/3/1974", age: 51,
        diagnosis: "Cervical radiculopathy C6", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_DUHON"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 12400, agingDays: 70,
        scheduling: "Scheduled", lastVisit: "2026-05-28", nextVisit: "2026-06-24",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 9, vsNetworkCost: 1100,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Cervical component of a multi-level injury; ESI underway.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 3000, source: "DR" },
            { item: "Cervical MRI + ESI (Duhon)", amount: 9400, source: "DR" }
        ],
        visits: [
            { date: "2026-04-15", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-05-28", note: "ESI administered; partial relief. PIF 5.", source: "DR" }
        ]
    },
    {
        id: "C1021", beneficiary: "Roy Calderon", dob: "11/3/1974", age: 51,
        diagnosis: "Right shoulder impingement", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_HATZ"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 6800, agingDays: 45,
        scheduling: "Seen", lastVisit: "2026-06-10", nextVisit: "2026-07-01",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -10, vsNetworkCost: -7000,
        pifStart: 4, pifCurrent: 6, pifTarget: 8,
        flags: [],
        planNote: "Shoulder responding to injection + PT.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2400, source: "DR" },
            { item: "Subacromial injection + PT (Hatzidakis)", amount: 4400, source: "DR" }
        ],
        visits: [
            { date: "2026-05-10", note: "Intake — IPM (Trainor). PIF 4.", source: "DR" },
            { date: "2026-06-10", note: "Injection; improving. PIF 6.", source: "DR" }
        ]
    },

    /* Terrence Bauer — 2nd & 3rd diagnoses */
    {
        id: "C1022", beneficiary: "Terrence Bauer", dob: "1/8/1968", age: 58,
        diagnosis: "Lumbar strain", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 7100, agingDays: 60,
        scheduling: "Scheduled", lastVisit: "2026-06-02", nextVisit: "2026-06-23",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 5, vsNetworkCost: -3000,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Lumbar component; conservative PT course.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2600, source: "DR" },
            { item: "PT course (Ghazi)", amount: 4500, source: "DR" }
        ],
        visits: [
            { date: "2026-04-20", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-06-02", note: "PT progressing. PIF 5.", source: "DR" }
        ]
    },
    {
        id: "C1023", beneficiary: "Terrence Bauer", dob: "1/8/1968", age: 58,
        diagnosis: "Right wrist sprain w/ TFCC tear", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_YI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 4300, agingDays: 28,
        scheduling: "Seen", lastVisit: "2026-06-08", nextVisit: "2026-06-29",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -18, vsNetworkCost: -9000,
        pifStart: 5, pifCurrent: 6, pifTarget: 7,
        flags: [],
        planNote: "Wrist splinted; hand-surgery consult done.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2100, source: "DR" },
            { item: "Wrist splint + hand consult (Yi)", amount: 2200, source: "DR" }
        ],
        visits: [
            { date: "2026-05-21", note: "Intake — IPM (Trainor). PIF 5.", source: "DR" },
            { date: "2026-06-08", note: "Splinting; mild improvement. PIF 6.", source: "DR" }
        ]
    },

    /* Daniela Ferreira — 2nd & 3rd diagnoses */
    {
        id: "C1024", beneficiary: "Daniela Ferreira", dob: "9/30/1986", age: 39,
        diagnosis: "Cervical facet syndrome", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY2", clientId: "CL2",
        runningTotal: 8900, agingDays: 40,
        scheduling: "Scheduled", lastVisit: "2026-06-04", nextVisit: "2026-06-25",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -8, vsNetworkCost: -2000,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Cervical facet pain; medial branch blocks + PT.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2900, source: "DR" },
            { item: "Medial branch blocks + PT (Ghazi)", amount: 6000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-05", note: "Intake — IPM (Vilims). PIF 3.", source: "DR" },
            { date: "2026-06-04", note: "Blocks; partial relief. PIF 5.", source: "DR" }
        ]
    },
    {
        id: "C1025", beneficiary: "Daniela Ferreira", dob: "9/30/1986", age: 39,
        diagnosis: "Lumbar disc bulge L5-S1", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_DUHON"],
        payerId: "PAY2", clientId: "CL2",
        runningTotal: 11200, agingDays: 52,
        scheduling: "Seen", lastVisit: "2026-06-09", nextVisit: "2026-06-30",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 3, vsNetworkCost: 900,
        pifStart: 2, pifCurrent: 4, pifTarget: 8,
        flags: ["needs-test"],
        planNote: "Lumbar disc; MRI reviewed, spine consult pending EMG.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 3000, source: "DR" },
            { item: "Lumbar MRI + spine consult (Duhon)", amount: 8200, source: "DR" }
        ],
        visits: [
            { date: "2026-04-28", note: "Intake — IPM (Vilims). PIF 2.", source: "DR" },
            { date: "2026-06-09", note: "MRI reviewed; EMG ordered. PIF 4.", source: "DR" }
        ]
    },

    /* Naomi Sutter — 2nd diagnosis */
    {
        id: "C1026", beneficiary: "Naomi Sutter", dob: "3/17/1990", age: 36,
        diagnosis: "Right knee contusion", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_NAKAMURA"],
        payerId: "PAY2", clientId: "CL1",
        runningTotal: 3600, agingDays: 18,
        scheduling: "Scheduled", lastVisit: "2026-06-12", nextVisit: "2026-06-27",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -26, vsNetworkCost: -12000,
        pifStart: 5, pifCurrent: 7, pifTarget: 8,
        flags: [],
        planNote: "Minor knee contusion; resolving with conservative care.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 1800, source: "DR" },
            { item: "Knee X-ray + ortho consult (Nakamura)", amount: 1800, source: "DR" }
        ],
        visits: [
            { date: "2026-05-30", note: "Intake — IPM (Vilims). PIF 5.", source: "DR" },
            { date: "2026-06-12", note: "Ortho consult; near resolution. PIF 7.", source: "DR" }
        ]
    },

    /* Hector Salinas — 2nd diagnosis (also maintenance) */
    {
        id: "C1027", beneficiary: "Hector Salinas", dob: "7/25/1963", age: 62,
        diagnosis: "Lumbar facet arthropathy", diagnosisStatus: "Maintenance",
        status: "Maintenance", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY1", clientId: "CL2",
        runningTotal: 9100, agingDays: 0,
        scheduling: "Seen", lastVisit: "2026-05-30", nextVisit: "2026-08-30",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 6, vsNetworkCost: 1000,
        pifStart: 3, pifCurrent: 5, pifTarget: 7,
        flags: [],
        planNote: "Meds-only maintenance (clock stopped), like his hip.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2600, source: "DR" },
            { item: "RFA + maintenance meds (Ghazi)", amount: 6500, source: "DR" }
        ],
        visits: [
            { date: "2026-02-10", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-05-30", note: "Transitioned to maintenance. PIF 5.", source: "DR" }
        ]
    },

    /* Priya Nadkarni — 2nd diagnosis */
    {
        id: "C1028", beneficiary: "Priya Nadkarni", dob: "12/9/1983", age: 42,
        diagnosis: "Cervical strain", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 4200, agingDays: 22,
        scheduling: "Scheduled", lastVisit: "2026-06-10", nextVisit: "2026-06-24",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -16, vsNetworkCost: -7000,
        pifStart: 4, pifCurrent: 6, pifTarget: 8,
        flags: [],
        planNote: "Cervical strain alongside the carpal tunnel; PT.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2200, source: "DR" },
            { item: "PT course (Ghazi)", amount: 2000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-26", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-10", note: "PT progressing. PIF 6.", source: "DR" }
        ]
    },

    /* Yolanda Reyes — 2nd diagnosis */
    {
        id: "C1029", beneficiary: "Yolanda Reyes", dob: "10/28/1977", age: 48,
        diagnosis: "Right shoulder bursitis", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_HATZ"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 5400, agingDays: 38,
        scheduling: "Seen", lastVisit: "2026-06-07", nextVisit: "2026-06-28",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -4, vsNetworkCost: -5000,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Shoulder bursitis; injection + PT.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2400, source: "DR" },
            { item: "Injection + PT (Hatzidakis)", amount: 3000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-12", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-06-07", note: "Injection; improving. PIF 5.", source: "DR" }
        ]
    },

    /* Caleb Whitman — 2nd diagnosis */
    {
        id: "C1030", beneficiary: "Caleb Whitman", dob: "6/6/1988", age: 38,
        diagnosis: "Lumbar strain", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_GHAZI"],
        payerId: "PAY1", clientId: "CL1",
        runningTotal: 6300, agingDays: 50,
        scheduling: "Scheduled", lastVisit: "2026-06-06", nextVisit: "2026-06-27",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -2, vsNetworkCost: -4000,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Low-back strain in addition to the ACL; PT.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2300, source: "DR" },
            { item: "PT course (Ghazi)", amount: 4000, source: "DR" }
        ],
        visits: [
            { date: "2026-04-25", note: "Intake — IPM (Vilims). PIF 3.", source: "DR" },
            { date: "2026-06-06", note: "PT progressing. PIF 5.", source: "DR" }
        ]
    },

    /* Andre Fontaine — 2nd diagnosis */
    {
        id: "C1031", beneficiary: "Andre Fontaine", dob: "9/12/1966", age: 59,
        diagnosis: "Cervical radiculopathy", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_VILIMS", teamProviderIds: ["NET_DUHON"],
        payerId: "PAY1", clientId: "CL4",
        runningTotal: 9800, agingDays: 33,
        scheduling: "Seen", lastVisit: "2026-06-11", nextVisit: "2026-07-02",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -12, vsNetworkCost: -2000,
        pifStart: 4, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Cervical radiculopathy alongside the shoulder; MRI + consult.",
        costBreakdown: [
            { item: "IPM evaluation (Vilims)", amount: 2800, source: "DR" },
            { item: "Cervical MRI + spine consult (Duhon)", amount: 7000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-15", note: "Intake — IPM (Vilims). PIF 4.", source: "DR" },
            { date: "2026-06-11", note: "Consult; modest gain. PIF 5.", source: "DR" }
        ]
    },

    /* Brenda Coates — 2nd diagnosis */
    {
        id: "C1032", beneficiary: "Brenda Coates", dob: "1/30/1972", age: 54,
        diagnosis: "Right hip bursitis", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_WHITE"],
        payerId: "PAY3", clientId: "CL3",
        runningTotal: 7400, agingDays: 44,
        scheduling: "Scheduled", lastVisit: "2026-06-05", nextVisit: "2026-06-26",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: 2, vsNetworkCost: -1000,
        pifStart: 3, pifCurrent: 5, pifTarget: 8,
        flags: [],
        planNote: "Hip bursitis alongside the lumbar facet; injection + consult.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2400, source: "DR" },
            { item: "Hip injection + consult (White)", amount: 5000, source: "DR" }
        ],
        visits: [
            { date: "2026-05-08", note: "Intake — IPM (Trainor). PIF 3.", source: "DR" },
            { date: "2026-06-05", note: "Injection; improving. PIF 5.", source: "DR" }
        ]
    },

    /* Wendell Pierce — 2nd diagnosis */
    {
        id: "C1033", beneficiary: "Wendell Pierce", dob: "7/7/1955", age: 70,
        diagnosis: "Bilateral carpal tunnel syndrome", diagnosisStatus: "Active treatment",
        status: "Active", newIntake: false,
        ipmId: "IPM_TRAINOR", teamProviderIds: ["NET_YI"],
        payerId: "PAY4", clientId: "CL5",
        runningTotal: 5600, agingDays: 36,
        scheduling: "Seen", lastVisit: "2026-06-09", nextVisit: "2026-06-30",
        nextVisitFlag: false, unscheduledAgeDays: 0,
        vsNetworkDays: -16, vsNetworkCost: -8000,
        pifStart: 2, pifCurrent: 4, pifTarget: 7,
        flags: ["needs-test"],
        planNote: "Carpal tunnel alongside the stenosis; EMG to confirm severity.",
        costBreakdown: [
            { item: "IPM evaluation (Trainor)", amount: 2200, source: "DR" },
            { item: "EMG + splinting (Yi)", amount: 3400, source: "DR" }
        ],
        visits: [
            { date: "2026-05-13", note: "Intake — IPM (Trainor). PIF 2.", source: "DR" },
            { date: "2026-06-09", note: "Splinting; EMG ordered. PIF 4.", source: "DR" }
        ]
    }
];

/* ---------------------------------------------------------------------
   WEEKLY — management roll-ups (primarily Brad).  [Salesforce + DR]
--------------------------------------------------------------------- */
var ADX_WEEKLY = {
    revenueThisWeek: 318000,
    revenueLastWeek: 291000,
    newReferrals: 23,
    casesToMBT: 7,
    note: "Composite score is supplied by ADX per provider (official formula pending)."
};

/* ---------------------------------------------------------------------
   MONTHLY / QUARTERLY — strategic.  [Salesforce + DR]
--------------------------------------------------------------------- */
var ADX_MONTHLY = {
    efficacy: {
        pifMedianGain: 3.4, pifTrend: +0.4,
        returnToWork: 0.76, rtwTrend: +0.05,
        avgCostPerCase: 19500, costTrend: -1800,
        avgDaysToMBT: 49, daysTrend: -4
    },
    paymentAging: [
        { payer: "Pathway Funding",        outstanding: 184000, avgDays: 34, status: "Current",  source: "Salesforce" },
        { payer: "Meridian Legal Capital", outstanding: 142000, avgDays: 41, status: "Current",  source: "Salesforce" },
        { payer: "Summit Case Funding",    outstanding: 96000,  avgDays: 78, status: "Slow — reminders required", source: "Salesforce" },
        { payer: "Apex Funding Partners",     outstanding: 71000,  avgDays: 96, status: "Slow — escalate", source: "Salesforce" }
    ],
    portfolio: {
        faceValue: 4960000,
        realizationRate: 0.94,
        weightedValue: 4662400,
        note: "ADX is guaranteed payment by the funding company regardless of case outcome — settlement probability is the funder's concern, not ADX's. Shown for completeness."
    },
    caseMix: [
        { type: "Lumbar spine",  cases: 6, avgMargin: 0.31 },
        { type: "Cervical spine", cases: 4, avgMargin: 0.28 },
        { type: "Shoulder",      cases: 3, avgMargin: 0.34 },
        { type: "Knee",          cases: 3, avgMargin: 0.22 },
        { type: "Other",         cases: 2, avgMargin: 0.26 }
    ]
};

/* ---------------------------------------------------------------------
   REFERRAL & ADX-PAYMENT FLOW (B1)  [Salesforce + DR]
   The physician's side of the exchange: what ADX placed with them and
   what ADX paid, for the period. Single payer (ADX).
   Seed: ADX is placing ~12 new patients/week at the IPM level in Colorado,
   assigned out to specialists as needed, and growing.
     7 + 5 = 12/week across the two IPMs; specialists receive sub-referrals.
--------------------------------------------------------------------- */
var ADX_REFERRAL_FLOW = {
    IPM_VILIMS:   { period: "This week", referralsThisWeek: 7, referralsLastWeek: 5, intakesAccepted: 6, adxPaymentPeriod: 18400, adxPaymentMTD: 71200 },
    IPM_TRAINOR:  { period: "This week", referralsThisWeek: 5, referralsLastWeek: 4, intakesAccepted: 4, adxPaymentPeriod: 12900, adxPaymentMTD: 49500 },
    NET_GHAZI:    { period: "This week", referralsThisWeek: 4, referralsLastWeek: 3, intakesAccepted: 4, adxPaymentPeriod: 9600,  adxPaymentMTD: 36800 },
    NET_BAZAZ:    { period: "This week", referralsThisWeek: 2, referralsLastWeek: 2, intakesAccepted: 2, adxPaymentPeriod: 14200, adxPaymentMTD: 52100 },
    NET_DUHON:    { period: "This week", referralsThisWeek: 2, referralsLastWeek: 1, intakesAccepted: 1, adxPaymentPeriod: 16800, adxPaymentMTD: 58300 },
    NET_HATZ:     { period: "This week", referralsThisWeek: 2, referralsLastWeek: 2, intakesAccepted: 2, adxPaymentPeriod: 11100, adxPaymentMTD: 41900 },
    NET_WHITE:    { period: "This week", referralsThisWeek: 1, referralsLastWeek: 1, intakesAccepted: 1, adxPaymentPeriod: 13400, adxPaymentMTD: 39600 },
    NET_YI:       { period: "This week", referralsThisWeek: 1, referralsLastWeek: 0, intakesAccepted: 1, adxPaymentPeriod: 7800,  adxPaymentMTD: 24300 },
    NET_NAKAMURA: { period: "This week", referralsThisWeek: 1, referralsLastWeek: 1, intakesAccepted: 0, adxPaymentPeriod: 8900,  adxPaymentMTD: 27500 }
};
function adxReferralFlow(id) { return ADX_REFERRAL_FLOW[id]; }

/* Quick lookups */
function adxProvider(id) { return ADX_PROVIDERS.find(p => p.id === id); }
function adxPayer(id)    { return ADX_PAYERS.find(p => p.id === id); }
function adxClient(id)   { return ADX_CLIENTS.find(c => c.id === id); }
function adxCase(id)     { return ADX_CASES.find(c => c.id === id); }
