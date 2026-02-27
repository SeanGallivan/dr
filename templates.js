/* --- ADX Hierarchical UI Engine: Clean Edition --- */
const TEMPLATES = {
    practice: (d) => `
        <a onclick="clearSelection()" class="back-link">← BACK TO DASHBOARD</a>
        <div class="section-header"><h3>Daily Operations</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Slot Density</span><span class="stat-value">${d.density}</span></div>
            <div class="daily-stat"><span class="stat-label">No-Shows</span><span class="stat-value">${d.noShow}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Unsigned Charts</span><span class="stat-value">${d.charts}</span></div>
            <div class="daily-stat"><span class="stat-label">POS Collected</span><span class="stat-value">${d.pos}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Critical Labs</span><span class="stat-value">${d.labs}</span></div>
        </div>
        <div class="section-header"><h3>Weekly Performance</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">wRVUs</span><span class="stat-value">${d.rvu}</span></div>
            <div class="weekly-stat"><span class="stat-label">Billing Lag</span><span class="stat-value">${d.lag}</span></div>
            <div class="weekly-stat"><span class="stat-label">Referrals</span><span class="stat-value">${d.referrals}</span></div>
            <div class="weekly-stat"><span class="stat-label">Staffing Ratio</span><span class="stat-value">${d.hours}</span></div>
        </div>
        <div class="table-container">
            <div class="section-header"><h3>Monthly Revenue Cycle</h3></div>
            <table class="table-custom">
                <thead><tr><th>Metric</th><th>Status</th><th>Value</th></tr></thead>
                <tbody>
                    <tr><td>A/R Aging (>90)</td><td style="color:red; font-weight:700;">Action Req</td><td>${d.ar}</td></tr>
                    <tr><td>Net Collection Ratio</td><td style="color:green;">Healthy</td><td>${d.collection}</td></tr>
                    <tr><td>Claim Denials</td><td>Healthy</td><td>${d.denials}</td></tr>
                    <tr><td>Payer Mix</td><td>Stable</td><td>${d.mix}</td></tr>
                    <tr><td>Revenue vs Overhead</td><td style="color:green;">+12% Profit</td><td>${d.revenue}</td></tr>
                </tbody>
            </table>
        </div>
        <div class="table-container" style="opacity: 0.8; font-size: 0.85rem;">
            <div class="section-header"><h3>Rare Strategic Data</h3></div>
            <table class="table-custom">
                <tbody>
                    <tr><td><b>NPS Score:</b> ${d.nps}</td><td><b>Growth:</b> ${d.growth}</td></tr>
                    <tr><td><b>Annual Compliance:</b> ${d.compliance}</td><td><b>Equipment Life:</b> ${d.equipment}</td></tr>
                </tbody>
            </table>
        </div>`,

    patientHierarchy: (p) => `
        <a onclick="clearSelection()" class="back-link">← BACK TO DASHBOARD</a>
        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Chief Complaint</span><span class="stat-value" style="font-size:1.5rem;">${p.complaint}</span></div>
            <div class="daily-stat alert" style="background:#fff5f5;"><span class="stat-label" style="color:red;">ALLERGIES</span><span class="stat-value" style="font-size:1.5rem; color:red;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Current Vitals</span><span class="stat-value" style="font-size:1.5rem;">${p.vitals}</span></div>
        </div>
        <div class="table-container" style="background:#fcfcfc; padding:1.5rem; border-radius:8px; border:1px solid #eee; margin-bottom:3rem;">
            <p style="margin:0 0 10px 0;"><b>Active Problems:</b> ${p.problems}</p>
            <p style="margin:0 0 10px 0;"><b>Medications:</b> ${p.meds}</p>
            <p style="margin:0 0 10px 0;"><b>Last Visit:</b> ${p.lastVisit}</p>
            <p style="margin:0;"><b>Recent Results:</b> ${p.results}</p>
        </div>
        <div class="section-header"><h3>Weekly Care Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Functional</span><span class="stat-value" style="font-size:1rem;">${p.functional}</span></div>
            <div class="weekly-stat"><span class="stat-label">Pain</span><span class="stat-value">${p.pain}</span></div>
            <div class="weekly-stat"><span class="stat-label">Pending Orders</span><span class="stat-value">${p.orders}</span></div>
            <div class="weekly-stat alert"><span class="stat-label">Care Gaps</span><span class="stat-value" style="font-size:1rem;">${p.gaps}</span></div>
        </div>
        <div class="table-container">
            <div class="section-header"><h3>Monthly Outcome Assessment</h3></div>
            <table class="table-custom">
                <tbody>
                    <tr><td><b>Medication Adherence:</b> ${p.adherence}</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                    <tr><td><b>Treatment Response:</b> ${p.response}</td><td style="color:red; font-weight:700;">Review Needed</td></tr>
                    <tr><td><b>Billing Status:</b> ${p.billing}</td><td style="color:green;">Clean</td></tr>
                </tbody>
            </table>
        </div>
        <div class="table-container" style="opacity: 0.7; font-size: 0.85rem;">
            <div class="section-header"><h3>Rare Deep History</h3></div>
            <table class="table-custom">
                <tbody>
                    <tr><td><b>Surgical:</b> ${p.surgery}</td><td><b>Family:</b> ${p.family}</td></tr>
                    <tr><td><b>Archives:</b> ${p.archive}</td><td><b>Social:</b> ${p.social}</td></tr>
                </tbody>
            </table>
        </div>`
};
