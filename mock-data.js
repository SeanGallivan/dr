/* --- ADX Prototype: Master Data Vault --- */
const PATIENTS = [
    { id: "P1", name: "Elizabeth Blackwell", last: "Feb 24, 2026", dob: "8/27/1984", age: 41, h: "70", w: "206", bmi: "29.60", adx: "M54.16", complaint: "Lower Back Pain", allergies: "Penicillins", meds: "Naproxen 500mg", vitals: "128/82", summary: "L4-L5 Stenosis. Continue PT.", sub: "Last Seen: Feb 24" },
    { id: "P2", name: "Jonas Salk", last: "Feb 22, 2026", dob: "10/28/1975", age: 50, h: "68", w: "185", bmi: "28.1", adx: "M51.26", complaint: "Lumbar Follow-up", allergies: "Latex", meds: "Oxycodone", vitals: "135/88", summary: "Incision healing well.", sub: "Last Seen: Feb 22" },
    { id: "P3", name: "Virginia Apgar", last: "Feb 19, 2026", dob: "6/07/1981", age: 44, h: "64", w: "140", bmi: "24.0", adx: "M54.5", complaint: "Hip Flare-up", allergies: "None", meds: "Ibuprofen", vitals: "120/75", summary: "Bursitis suspected.", sub: "Last Seen: Feb 19" }
];
// Fill to 25 patients for scrolling
for(let i=4; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Record Archive #"+(100+i), sub: "Historical Data"}); }

const PRACTICES = [
    { id: "PR1", name: "Summit Musculoskeletal", days: "14.2", billing: "$42,850", patients: "134" },
    { id: "PR2", name: "Northside Chiropractic", days: "18.5", billing: "$38,200", patients: "98" },
    { id: "PR3", name: "Downtown Wellness", days: "11.0", billing: "$51,400", patients: "156" }
];
// Fill to 18 practices for scrolling
for(let i=4; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Network Clinic #"+i, days: "12.5"}); }
