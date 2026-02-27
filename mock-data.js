/* --- ADX Prototype: Master Data Vault (High-Density Clinical Edition) --- */
const PATIENTS = [
    { 
        id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41, 
        complaint: "Chronic Lower Back Pain", allergies: "Penicillins", meds: "Naproxen 500mg, Gabapentin", 
        vitals: "128/82 | 72bpm", bmi: "24.4", adx: "M54.16 - Lumbar Radiculopathy", 
        summary: "L4-L5 Stenosis. Continue PT 2x weekly.", pain: "7/10", orders: "1 (MRI Lumbar)",
        adherence: "90%", surgery: "Appendectomy (2005)", sub: "Last Seen: Feb 24" 
    },
    { 
        id: "P2", name: "Jonas Salk", dob: "10/28/1975", age: 50, 
        complaint: "Post-Op Follow-up", allergies: "Latex", meds: "Oxycodone, Aspirin", 
        vitals: "135/88 | 78bpm", bmi: "28.1", adx: "M51.26 - Disc Displacement", 
        summary: "Incision healing well.", pain: "4/10", orders: "0",
        adherence: "100%", surgery: "Lumbar Discectomy (2026)", sub: "Last Seen: Feb 22" 
    }
];
for(let i=3; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i), sub: "Archive Record"}); }

const PRACTICES = [
    { 
        id: "PR1", name: "Summit Musculoskeletal", days: "14.2", density: "92%", charts: "12", labs: "3", 
        pos: "$1,250", rvu: "450", lag: "1.2d", referrals: "24", ar: "$14,200", collection: "96.2%", denials: "3.1%", nps: "88"
    },
    { 
        id: "PR2", name: "Northside Chiropractic", days: "18.5", density: "78%", charts: "2", labs: "0", 
        pos: "$850", rvu: "310", lag: "2.4d", referrals: "12", ar: "$8,100", collection: "94.8%", denials: "4.5%", nps: "82"
    }
];
for(let i=3; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, density: (75+i)+"%", charts: (i%5).toString() }); }
