/* --- ADX Master Data Vault: Brad's Network & Clinical Profiles --- */

const NETWORK_STATS = {
    // DAILY: Operational Pulse
    referrals: "142 New Cases",
    throughput: "88% Clear / 12% Stalled",
    alerts: "4 Overdue Tasks (>48h)",
    pos: "$8,450 Collected",
    // WEEKLY: Performance & Friction
    squeeze: "Top 3: Blackwell, Salk, Apgar",
    accuracy: "94% Accuracy (Procedure Redux)",
    software: "98.2% Chart Closure",
    speed: "4.2 Days to Treatment",
    // MONTHLY: The Value Proposition
    savings: "$14,381 (Target Met)",
    success: "+18% Functional Gain",
    aging: "A/R: $112k (Avg 32 Days)",
    utilization: "Diagnostic Focus: MRI/Block Max",
    // RARELY: Strategic Evolution
    innovation: "Regen Protocol: 40% Adoption",
    expansion: "Market: Denver Active / Indiana Pending",
    integrity: "API Stability: 99.9% (Salesforce)",
    drift: "Admin Fees: <2% Variance"
};

const PATIENTS = [
    { 
        id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41, 
        problems: "L4-L5 Stenosis, Lumbar Radiculopathy", complaint: "Increased radiating leg pain, 2 weeks",
        allergies: "PENICILLINS (Severe)", meds: "Naproxen 500mg, Gabapentin 300mg TID", vitals: "128/82 | 72 | 165 lbs",
        lastVisit: "Feb 10: Initial ESI. Minimal relief.", results: "MRI (Jan 15): Severe narrowing at L4-L5.",
        functional: "Walking < 10 mins.", pain: "7/10 (Trending Up)", orders: "EMG, PT Referral", gaps: "Annual Wellness Overdue",
        adherence: "90% Compliance", response: "-15% Mobility", billing: "Claims Clean",
        surgery: "Appendectomy (2005)", family: "Spinal Fusion Hx", archive: "2018 Scans Available", social: "Teacher, Non-smoker", sub: "Last Seen: Feb 24"
    }
];
for(let i=2; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i), allergies: "None", sub: "Archive Record"}); }

const PRACTICES = [
    { id: "PR1", name: "Summit Musculoskeletal", density: "92%", noShow: "4%", charts: "12", pos: "$1,250", labs: "3", rvu: "450/420", lag: "1.2d", referrals: "24", hours: "160/150", ar: "$14.2k", collection: "96.2%", denials: "3.1%", mix: "65/35", revenue: "$42.8k", nps: "88", growth: "+5%", compliance: "Passed", equipment: "July 2026", days: "14.2" }
];
for(let i=2; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, days: "18.5" }); }
