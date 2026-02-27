/* --- ADX Master Data Vault: Hierarchical Clinical Edition --- */
const PATIENTS = [
    { 
        id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41, 
        // DAILY
        problems: "L4-L5 Stenosis, Lumbar Radiculopathy",
        complaint: "Increased radiating leg pain, 2 weeks",
        allergies: "PENICILLINS (Severe)",
        meds: "Naproxen 500mg, Gabapentin 300mg TID",
        vitals: "128/82 | 72 | 165 lbs",
        lastVisit: "Feb 10: Initial ESI. Minimal relief.",
        results: "MRI (Jan 15): Severe narrowing at L4-L5.",
        // WEEKLY
        functional: "Walking < 10 mins. No lifting > 5lbs.",
        pain: "7/10 (Trending Up)",
        orders: "EMG, PT Referral",
        gaps: "Annual Wellness Overdue",
        // MONTHLY
        adherence: "90% Compliance",
        response: "-15% Mobility vs Baseline",
        billing: "Feb Claims Processed",
        // RARELY
        surgery: "Appendectomy (2005), Left Knee (2012)",
        family: "Father: Osteoarthritis. Mother: Spinal Fusion.",
        archive: "Imaging (2018) shows stable alignment.",
        social: "Teacher. Non-smoker. 2-story home.",
        sub: "Last Seen: Feb 24"
    }
];
for(let i=2; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i), allergies: "None", sub: "Archive Record"}); }

const PRACTICES = [
    { 
        id: "PR1", name: "Summit Musculoskeletal", 
        // DAILY
        density: "92%", noShow: "4%", charts: "12", pos: "$1,250", labs: "3",
        // WEEKLY
        rvu: "450 / 420", lag: "1.2 Days", referrals: "24 New", hours: "160/150",
        // MONTHLY
        ar: "$14.2k", collection: "96.2%", denials: "3.1%", mix: "65/35 Pvt/Pub", revenue: "$42.8k / $38k",
        // RARELY
        nps: "88", growth: "+5% Share", compliance: "Audit Passed", equipment: "MRI Maint: July 2026",
        days: "14.2"
    }
];
for(let i=2; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, days: "12.0"}); }
