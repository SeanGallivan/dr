/* --- ADX Hierarchical UI Engine: Clinical, Ops, & Network --- */
const TEMPLATES = {
    network: (d) => `
        <div class="section-header"><h3>Daily: Operational Pulse</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Network Referrals</span><span class="stat-value" style="font-size:2rem;">${d.referrals}</span></div>
            <div class="daily-stat"><span class="stat-label">Diag Throughput</span><span class="stat-value" style="font-size:2rem;">${d.throughput}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Task Alerts (>48h)</span><span class="stat-value" style="font-size:2rem;">${d.alerts}</span></div>
            <div class="daily-stat"><span class="stat-label">Daily POS Coll</span><span class="stat-value" style="font-size:2rem;">${d.pos}</span></div>
        </div>
        <div class="section-header"><h3>Weekly: Performance & Friction</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">"Squeeze" Report</span><div class="stat-value">${d.squeeze}</div></div>
            <div class="weekly-stat"><span class="stat-label">Diag Accuracy</span><div class="stat-value">${d.accuracy}</div></div>
            <div class="weekly-stat"><span class="stat-label">Software Compliance</span><div class="stat-value">${d.software}</div></div>
            <div class="weekly-stat"><span class="stat-label">Navigation Speed</span><div class="stat-value">${d.speed}</div></div>
        </div>
        <div class="section-header"><h3>Monthly: The Value Proposition</h3></div>
        <table class="table-custom">
            <tbody>
                <tr><td><b>Net Savings Per Head</b></td><td>${d.savings}</td><td style="color:green; font-weight:800;">PASS</td></tr>
                <tr><td><b>Functional Trends</b></td><td>${d.success}</td><td>Aggregate Outcome</td></tr>
                <tr><td><b>Payer Mix / A/R</b></td><td>${d.aging}</td><td>Clearinghouse Status</td></tr>
                <tr><td><b>Network Utilization</b></td><td>${d.utilization}</td><td>Efficiency Index</td></tr>
            </tbody>
        </table>
        <div class="section-header"><h3>Rarely: Strategic Evolution</h3></div>
        <div style="font-size:0.9rem; opacity:0.8; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div><b>Innovation Adoption:</b> ${d.innovation}</div>
            <div><b>Expansion Viability:</b> ${d.expansion}</div>
            <div><b>System Integrity:</b> ${d.integrity}</div>
            <div><b>Contractual Drift:</b> ${d.drift}</div>
        </div>`,

    practice: (d) => `
        <div class="section-header"><h3>Daily Operations</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Slot Density</span><span class="stat-value">${d.density}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Unsigned Charts</span><span class="stat-value">${d.charts}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Critical Labs</span><span class="stat-value">${d.labs}</span></div>
            <div class="daily-stat"><span class="stat-label">POS Collected</span><span class="stat-value">${d.pos}</span></div>
        </div>
        <div class="section-header"><h3>Weekly Performance</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">wRVUs</span><div class="stat-value">${d.rvu}</div></div>
            <div class="weekly-stat"><span class="stat-label">Billing Lag</span><div class="stat-value">${d.lag}</div></div>
            <div class="weekly-stat"><span class="stat-label">Referrals</span><div class="stat-value">${d.referrals}</div></div>
        </div>
        <div class="section-header"><h3>Monthly Revenue Cycle</h3></div>
        <table class="table-custom">
            <tbody>
                <tr><td><b>A/R Aging</b></td><td>${d.ar}</td><td style="color:red;">Action Req</td></tr>
                <tr><td><b>Collection Ratio</b></td><td>${d.collection}</td><td style="color:green;">Healthy</td></tr>
                <tr><td><b>Net Revenue</b></td><td>${d.revenue}</td><td>Budget Met</td></tr>
            </tbody>
        </table>`,

    patient: (p) => `
        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Chief Complaint</span><span class="stat-value" style="font-size:1.4rem;">${p.complaint}</span></div>
            <div class="daily-stat alert" style="background:#fff5f5;"><span class="stat-label" style="color:red;">ALLERGIES</span><span class="stat-value" style="font-size:1.4rem; color:red;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Current Vitals</span><span class="stat-value" style="font-size:1.4rem;">${p.vitals}</span></div>
        </div>
        <div class="section-header"><h3>Weekly Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat" style="grid-column: span 2;"><span class="stat-label">Active Problems</span><div class="stat-value" style="font-size:1.1rem;">${p.problems}</div></div>
            <div class="weekly-stat"><span class="stat-label">Pain Trending</span><div class="stat-value">${p.pain}</div></div>
        </div>`
};
