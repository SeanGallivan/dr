/* --- ADX Hierarchical UI Engine --- */
const TEMPLATES = {
    network: (d) => `
        <div class="section-header"><h3>Daily: Operational Pulse</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Network Referrals</span><span class="stat-value">${d.referrals}</span></div>
            <div class="daily-stat"><span class="stat-label">Throughput</span><span class="stat-value">${d.throughput}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Task Alerts</span><span class="stat-value">${d.alerts}</span></div>
            <div class="daily-stat"><span class="stat-label">Daily POS</span><span class="stat-value">${d.pos}</span></div>
        </div>
        <div class="section-header"><h3>Weekly: Performance & Friction</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Squeeze Report</span><div class="stat-value">${d.squeeze}</div></div>
            <div class="weekly-stat"><span class="stat-label">Accuracy</span><div class="stat-value">${d.accuracy}</div></div>
            <div class="weekly-stat"><span class="stat-label">Software Compliance</span><div class="stat-value">${d.software}</div></div>
            <div class="weekly-stat"><span class="stat-label">Speed to Treatment</span><div class="stat-value">${d.speed}</div></div>
        </div>
        <div class="section-header"><h3>Monthly: The Value Proposition</h3></div>
        <table class="table-custom">
            <tbody>
                <tr><td><b>Savings Per Head</b></td><td>${d.savings}</td><td style="color:green; font-weight:800;">PASS</td></tr>
                <tr><td><b>Functional Trends</b></td><td>${d.success}</td><td>Aggregate Outcome</td></tr>
                <tr><td><b>A/R / Aging</b></td><td>${d.aging}</td><td>Solvent</td></tr>
                <tr><td><b>Utilization</b></td><td>${d.utilization}</td><td>Efficiency Index</td></tr>
            </tbody>
        </table>
        <div class="section-header"><h3>Rarely: Strategic Evolution</h3></div>
        <div style="font-size:0.85rem; opacity:0.7; display:grid; grid-template-columns:1fr 1fr; gap:15px;">
            <div>Innovation: ${d.innovation}</div><div>Expansion: ${d.expansion}</div>
            <div>Integrity: ${d.integrity}</div><div>Drift: ${d.drift}</div>
        </div>`,

    practice: (d) => `
        <a onclick="clearSelection()" class="back-link">← BACK TO DASHBOARD</a>
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
        <div class="section-header"><h3>Monthly & Rarely</h3></div>
        <table class="table-custom">
            <tbody>
                <tr><td><b>A/R Aging</b></td><td>${d.ar}</td><td><b>Collection:</b> ${d.collection}</td></tr>
                <tr><td><b>Revenue:</b></td><td>${d.revenue}</td><td><b>NPS Score:</b> ${d.nps}</td></tr>
                <tr><td><b>Compliance:</b></td><td>${d.compliance}</td><td><b>Equip:</b> ${d.equipment}</td></tr>
            </tbody>
        </table>`,

    patient: (p) => `
        <a onclick="clearSelection()" class="back-link">← BACK TO DASHBOARD</a>
        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Complaint</span><span class="stat-value" style="font-size:1.3rem;">${p.complaint}</span></div>
            <div class="daily-stat alert"><span class="stat-label">ALLERGIES</span><span class="stat-value" style="font-size:1.3rem; color:red;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Vitals</span><span class="stat-value" style="font-size:1.3rem;">${p.vitals}</span></div>
        </div>
        <div class="section-header"><h3>Weekly Care Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Pain</span><div class="stat-value">${p.pain}</div></div>
            <div class="weekly-stat"><span class="stat-label">Orders</span><div class="stat-value">${p.orders}</div></div>
            <div class="weekly-stat"><span class="stat-label">Gaps</span><div class="stat-value">${p.gaps}</div></div>
        </div>
        <div class="section-header"><h3>Monthly & Rarely</h3></div>
        <table class="table-custom">
            <tbody>
                <tr><td><b>Adherence:</b> ${p.adherence}</td><td><b>Response:</b> ${p.response}</td></tr>
                <tr><td><b>Surgical:</b> ${p.surgery}</td><td><b>Family:</b> ${p.family}</td></tr>
                <tr><td><b>Social:</b> ${p.social}</td><td><b>Archives:</b> ${p.archive}</td></tr>
            </tbody>
        </table>`
};
