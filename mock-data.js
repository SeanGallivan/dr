/* --- ADX Prototype: Master Data Vault --- */

// ... (Keep PATIENTS as is)

const PRACTICES = [
    { 
        id: "PR1", 
        name: "Summit Musculoskeletal", 
        days: "14.2", 
        density: "92%", 
        charts: "12", 
        labs: "3", 
        pos: "$1,250",
        rvu: "450",
        lag: "1.2d",
        ar: "$14,200",
        collection: "96.2%"
    },
    { 
        id: "PR2", 
        name: "Northside Chiropractic", 
        days: "18.5", 
        density: "78%", 
        charts: "2", 
        labs: "0", 
        pos: "$850",
        rvu: "310",
        lag: "2.4d",
        ar: "$8,100",
        collection: "94.8%"
    },
    { 
        id: "PR3", 
        name: "Downtown Wellness", 
        days: "11.0", 
        density: "98%", 
        charts: "24", 
        labs: "1", 
        pos: "$2,100",
        rvu: "520",
        lag: "0.8d",
        ar: "$19,500",
        collection: "98.1%"
    }
];

// Fill remainder with randomized variations if needed
for(let i=4; i<=18; i++) { 
    PRACTICES.push({
        ...PRACTICES[1], 
        id: "PR"+i, 
        name: "Network Clinic #"+i, 
        density: (70 + i) + "%" 
    }); 
}
