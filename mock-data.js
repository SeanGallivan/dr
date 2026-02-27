/* --- ADX Master Data Vault: Gold Image --- */
const NETWORK_STATS = {
referrals: "142 New", throughput: "88% Clear", alerts: "4 Tasks (>48h)", pos: "$8,450",
squeeze: "Blackwell, Salk, Apgar", accuracy: "94% Redux", software: "98.2% Closure", speed: "4.2 Days",
savings: "$14,381", success: "+18% Trend", aging: "$112k (Avg 32d)", utilization: "MRI/Block Max",
innovation: "Regen: 40%", expansion: "Denver/Indiana", integrity: "99.9% Up", drift: "<2% Variance"
};

const PATIENTS = [
{
id: "P1", name: "Elizabeth Blackwell", dob: "8/27/1984", age: 41,
problems: "L4-L5 Stenosis, Lumbar Radiculopathy", complaint: "Increased radiating leg pain",
allergies: "PENICILLINS (Severe)", meds: "Naproxen, Gabapentin", vitals: "128/82 | 165 lbs",
lastVisit: "Feb 10: Initial ESI.", results: "MRI narrows at L4.",
functional: "Walk < 10m. No lifting.", pain: "7/10", orders: "EMG, PT Referral", gaps: "Wellness Overdue",
adherence: "90% Refill Rate", response: "-15% Mobility vs Baseline", billing: "Claims Clean",
surgery: "Appendectomy (2005)", family: "Fusion Hx", archive: "2018 Scans Available", social: "Teacher, Non-smoker", sub: "Last Seen: Feb 24"
}
];
for(let i=2; i<=25; i++) { PATIENTS.push({...PATIENTS[0], id: "P"+i, name: "Patient Record #"+(100+i)}); }

const PRACTICES = [
{
id: "PR1", name: "Summit Musculoskeletal",
density: "92%", noShow: "4%", charts: "12", pos: "$1,250", labs: "3",
rvu: "450/420 Target", lag: "1.2d", referrals: "24 New", hours: "160/150",
ar: "$14.2k (>90d)", collection: "96.2%", denials: "3.1%", mix: "65/35 Pvt/Pub", revenue: "$42.8k",
nps: "88", growth: "+5% Share", compliance: "Passed", equipment: "July 2026", days: "14.2"
}
];
for(let i=2; i<=18; i++) { PRACTICES.push({...PRACTICES[0], id: "PR"+i, name: "Clinic Location #"+i }); }

FILE 3: templates.js
(Copy everything below this line into your templates.js)

/* --- ADX Hierarchical UI Engine: Gold Image --- */
const TEMPLATES = {
network: (d) =>  <div class="section-header"><h3>Daily Operations</h3></div> <div class="daily-grid"> <div class="daily-stat"><span class="stat-label">Network Referrals</span><span class="stat-value">${d.referrals}</span></div> <div class="daily-stat"><span class="stat-label">Diagnostic Throughput</span><span class="stat-value">${d.throughput}</span></div> <div class="daily-stat alert"><span class="stat-label">High-Priority Alerts</span><span class="stat-value">${d.alerts}</span></div> <div class="daily-stat"><span class="stat-label">Daily POS Collected</span><span class="stat-value">${d.pos}</span></div> </div> <div class="section-header"><h3>Weekly Coordination</h3></div> <div class="weekly-grid"> <div class="weekly-stat"><span class="stat-label">"Squeeze" Report</span><div class="stat-value">${d.squeeze}</div></div> <div class="weekly-stat"><span class="stat-label">Accuracy Rate</span><div class="stat-value">${d.accuracy}</div></div> <div class="weekly-stat"><span class="stat-label">Compliance</span><div class="stat-value">${d.software}</div></div> <div class="weekly-stat"><span class="stat-label">Navigation Speed</span><div class="stat-value">${d.speed}</div></div> </div> <div class="section-header"><h3>Monthly Value</h3></div> <table class="table-custom"> <tbody> <tr><td><b>Savings Per Head</b></td><td>${d.savings}</td><td style="color:green; font-weight:800;">PASS</td></tr> <tr><td><b>Functional Trends</b></td><td>${d.success}</td><td>Aggregate Outcome</td></tr> <tr><td><b>A/R / Aging</b></td><td>${d.aging}</td><td>Solvent</td></tr> <tr><td><b>Utilization</b></td><td>${d.utilization}</td><td>Efficiency Index</td></tr> </tbody> </table> <div class="section-header"><h3>Rarely strategic</h3></div> <div style="font-size:0.85rem; opacity:0.7; display:grid; grid-template-columns:1fr 1fr; gap:15px;"> <div>Innovation Adoption: ${d.innovation}</div><div>Expansion Viability: ${d.expansion}</div> <div>Architecture Integrity: ${d.integrity}</div><div>Contractual Drift: ${d.drift}</div> </div>,

};
