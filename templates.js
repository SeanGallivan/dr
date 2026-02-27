/* --- ADX Hierarchical UI Engine --- */
const TEMPLATES = {
    practice: (d) => `
        <a onclick="clearSelection()" class="back-link">← Back to dashboard</a>
        
        <div class="section-header"><h3>Daily Operations (Clinical & Cash Flow)</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Slot Density</span><span class="stat-value">${d.density}</span></div>
            <div class="daily-stat"><span class="stat-label">No-Shows</span><span class="stat-value">${d.noShow}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Unsigned Charts</span><span class="stat-value">${d.charts}</span></div>
            <div class="daily-stat"><span class="stat-label">POS Collected</span><span class="stat-value">${d.pos}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Critical Labs</span><span class="stat-value">${d.labs}</span></div>
        </div>

        <div class="section-header"><h3>Weekly Coordination & Productivity</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Total wRVUs</span><span class="stat-value">${d.rvu}</span></div>
            <div class="weekly-stat"><span class="stat-label">Billing Lag</span><span class="stat-value">${d.lag}</span></div>
            <div class="weekly-stat"><span class="stat-label">Referrals</span><span class="stat-value">${d.referrals}</span></div>
            <div class="weekly-stat"><span class="stat-label">Staffing Ratio</span><span class="stat-value">${d.hours}</span></div>
        </div>

        <div class="table-container">
            <div class="section-header"><h3>Monthly Revenue Cycle (Administrative)</h3></div>
            <table class="table-custom">
                <thead><tr><th>Metric</th><th>Current Status</th><th>Trend</th></tr></thead>
                <tbody>
                    <tr><td>A/R Aging (>90 Days)</td><td>${d.ar}</td><td style="color:red">Needs Action</td></tr>
                    <tr><td>Net Collection Ratio</td><td>${d.collection}</td><td style="color:green">Above Target</td></tr>
                    <tr><td>Claim Denials</td><td>${d.denials}</td><td style="color:green">Healthy</td></tr>
                    <tr><td>Payer Mix</td><td>${d.mix}</td><td>Stable</td></tr>
                    <tr><td>Revenue vs Overhead</td><td>${d.revenue}</td><td style="color:green">+12% Profit</td></tr>
                </tbody>
            </table>
        </div>

        <div class="table-container" style="opacity: 0.8; font-size: 0.9rem;">
            <div class="section-header"><h3>Rare strategic Data</h3></div>
            <table class="table-custom">
                <tbody>
                    <tr><td><b>NPS / Satisfaction:</b> ${d.nps}</td><td><b>Growth:</b> ${d.growth}</td></tr>
                    <tr><td><b>Credentialing:</b> ${d.compliance}</td><td><b>Equipment:</b> ${d.equipment}</td></tr>
                </tbody>
            </table>
        </div>`,

    patient: (p) => `
        <a onclick="clearSelection()" class="back-link">← Back to dashboard</a>

        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Chief Complaint</span><span class="stat-value" style="font-size:1.6rem;">${p.complaint}</span></div>
            <div class="daily-stat alert" style="background:#fff5f5;"><span class="stat-label" style="color:red;">ALLERGIES</span><span class="stat-value" style="font-size:1.4rem; color:red;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Current Vitals</span><span class="stat-value" style="font-size:1.6rem;">${p.vitals}</span></div>
        </div>
        <div class="weekly-grid" style="margin-bottom:4rem;">
            <div class="weekly-stat" style="grid-column: span 2;"><span class="stat-label">Active Problem List</span><p style="font-weight:800; font-size:1.1rem; color:var(--primary-navy); margin-top:10px;">${p.problems}</p></div>
            <div class="weekly-stat" style="grid-column: span 2;"><span class="stat-label">Current Medications</span><p style="font-weight:700; margin-top:10px;">${p.meds}</p></div>
        </div>
        <div class="table-container" style="background:#fcfcfc; padding:2rem; border-radius:8px; border:1px solid #eee; margin-bottom:4rem;">
            <p><b>Last Visit Summary:</b> ${p.lastVisit}</p>
            <p><b>Recent Results:</b> ${p.results}</p>
        </div>

        <div class="section-header"><h3>Weekly Care Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Functional Status</span><span class="stat-value" style="font-size:1.1rem;">${p.functional}</span></div>
            <div class="weekly-stat"><span class="stat-label">Pain Trending</span><span class="stat-value">${p.pain}</span></div>
            <div class="weekly-stat"><span class="stat-label">Pending Orders</span><span class="stat-value">${p.orders}</span></div>
            <div class="weekly-stat alert"><span class="stat-label">Care Gaps</span><span class="stat-value" style="font-size:1.1rem;">${p.gaps}</span></div>
        </div>

        <div class="table-container">
            <div class="section-header"><h3>Monthly Outcome Assessment</h3></div>
            <table class="table-custom">
                <thead><tr><th>Area</th><th>Update</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>Medication Adherence</td><td>${p.adherence}</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                    <tr><td>Treatment Response</td><td>${p.response}</td><td style="color:red; font-weight:700;">Review Needed</td></tr>
                    <tr><td>Billing Status</td><td>${p.billing}</td><td style="color:green;">Clean</td></tr>
                </tbody>
            </table>
        </div>

        <div class="table-container" style="opacity: 0.7; font-size: 0.85rem;">
            <div class="section-header"><h3>Rare deep History</h3></div>
            <table class="table-custom">
                <tbody>
                    <tr><td><b>Surgical:</b> ${p.surgery}</td><td><b>Family:</b> ${p.family}</td></tr>
                    <tr><td><b>Archives:</b> ${p.archive}</td><td><b>Social:</b> ${p.social}</td></tr>
                </tbody>
            </table>
        </div>`
};
