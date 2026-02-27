/* --- ADX Prototype: Master Data Vault --- */
const PATIENTS = [
    { id: "P1", name: "Elizabeth Blackwell", last: "Feb 24, 2026", dob: "8/27/1984", age: 41, complaint: "Lower Back Pain", allergies: "Penicillins", meds: "Naproxen 500mg, Gabapentin", vitals: "128/82 | 72bpm", summary: "L4-L5 Stenosis. Continue PT.", sub: "Last Seen: Feb 24" },
    { id: "P2", name: "Jonas Salk", last: "Feb 22, 2026", dob: "10/28/1975", age: 50, complaint: "Post-Op Follow-up", allergies: "Latex", meds: "Oxycodone (PRN), Aspirin", vitals: "135/88 | 78bpm", summary: "Post-op check. Incision healing.", sub: "Last Seen: Feb 22" },
    { id: "P3", name: "Virginia Apgar", last: "Feb 19, 2026", dob: "6/07/1981", age: 44, complaint: "Right Hip Flare-up", allergies: "None", meds: "Ibuprofen", vitals: "120/75 | 68bpm", summary: "Bursitis suspected. Order MRI.", sub: "Last Seen: Feb 19" },
    { id: "P4", name: "Charles Drew", last: "Feb 15, 2026", dob: "6/03/1992", age: 33, complaint: "Neck Stiffness", allergies: "Aspirin", meds: "None", vitals: "118/72 | 65bpm", summary: "Cervical strain. Ergo assessment.", sub: "Last Seen: Feb 15" }
];
// Fill to 25 patients
for(let i=5; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i), sub: "Archive Record"}); }

const PRACTICES = [
    { id: "PR1", name: "Summit Musculoskeletal", days: "14.2", billing: "$42,850", patients: "134" },
    { id: "PR2", name: "Northside Chiropractic", days: "18.5", billing: "$38,200", patients: "98" },
    { id: "PR3", name: "Downtown Wellness", days: "11.0", billing: "$51,400", patients: "156" }
];
// Fill to 18 practices
for(let i=4; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, days: "12.5"}); }
