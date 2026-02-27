/* --- ADX Master Data Vault --- */
const NETWORK_STATS = {
    referrals: "142 New", throughput: "88%", alerts: "4 Tasks", pos: "$8,450",
    squeeze: "Blackwell/Salk/Apgar", accuracy: "94%", software: "98.2%", speed: "4.2 Days",
    savings: "$14,381", success: "+18%", aging: "$112k (32d)", utilization: "MRI/Block Max",
    innovation: "Regen: 40%", expansion: "Denver/Indiana", integrity: "99.9%", drift: "<2%"
};

const PATIENTS = [
    { 
        id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41, 
        complaint: "Chronic Lower Back Pain", allergies: "PENICILLINS", vitals: "128/82 | 165 lbs",
        problems: "L4-L5 Stenosis", meds: "Naproxen, Gabapentin", lastVisit: "Feb 10 ESI", results: "MRI narrows at L4",
        functional: "Walk < 10m", pain: "7/10", orders: "EMG/PT", gaps: "Wellness Overdue",
        adherence: "90%", response: "-15% Mobility", billing: "Claims Clean",
        surgery: "Appendectomy", family: "Fusion Hx", archive: "2018 Scans", social: "Teacher, Non-smoker", sub: "Last Seen: Feb 24"
    }
];
for(let i=2; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient #"+(100+i)}); }

const PRACTICES = [
    { 
        id: "PR1", name: "Summit Musculoskeletal", 
        density: "92%", noShow: "4%", charts: "12", pos: "$1,250", labs: "3",
        rvu: "450/420", lag: "1.2d", referrals: "24", hours: "160/150",
        ar: "$14.2k", collection: "96.2%", denials: "3.1%", mix: "65/35", revenue: "$42.8k",
        nps: "88", growth: "+5%", compliance: "Passed", equipment: "July 2026", days: "14.2"
    }
];
for(let i=2; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Clinic #"+i }); }
