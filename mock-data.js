/* --- ADX Master Data Vault: Hierarchical Clinical Edition --- */
const PATIENTS = [
    { 
        id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41, 
        // DAILY
        problems: "L4-L5 Stenosis, Lumbar Radiculopathy",
        complaint: "Increased radiating leg pain, 2 weeks",
        allergies: "PENICILLINS (Severe)",
        meds: "Naproxen 500mg, Gabapentin 300mg TID",
        vitals: "BP 128/82 | HR 72 | WT 165 lbs",
        lastVisit: "Feb 10: Initial Epidural Steroid Injection (ESI). Minimal relief.",
        results: "MRI (Jan 15): Severe narrowing at L4-L5.",
        // WEEKLY
        functional: "Walking limited to 10 mins. Unable to lift >5lbs.",
        pain: "7/10 (Trending Up from 5/10)",
        orders: "EMG/Nerve Conduction Study, Physical Therapy Referral",
        gaps: "Annual Wellness Exam overdue",
        // MONTHLY
        adherence: "90% (Consistently filling Gabapentin)",
        response: "Mobility decreased 15% vs baseline",
        billing: "All claims for Jan/Feb visits processed",
        // RARELY
        surgery: "Appendectomy (2005), Left Knee Scope (2012)",
        family: "Father: Osteoarthritis. Mother: Spinal Fusion.",
        archive: "Imaging from 2018 shows stable lumbar alignment.",
        social: "Full-time Teacher. Non-smoker. Lives in 2-story home.",
        sub: "Last Seen: Feb 24"
    }
];
// Fillers for scrolling logic
for(let i=2; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i), allergies: "None", sub: "Archive Record"}); }

const PRACTICES = [
    { 
        id: "PR1", name: "Summit Musculoskeletal", 
        // DAILY
        density: "92%", noShow: "4%", charts: "12", pos: "$1,250", labs: "3",
        // WEEKLY
        rvu: "450 / 420 Target", lag: "1.2 Days", referrals: "24 New", hours: "160/150 Target",
        // MONTHLY
        ar: "$14,200 (>90 Days)", collection: "96.2%", denials: "3.1% (Incomplete Info)", mix: "65% Private / 35% Public", revenue: "$42,850 vs $38k Budget",
        // RARELY
        nps: "88 (World Class)", growth: "+5% Regional Share", compliance: "Audit Passed Oct 2025", equipment: "MRI Maintenance: Scheduled July 2026",
        days: "14.2"
    }
];
for(let i=2; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, days: "12.0"}); }
