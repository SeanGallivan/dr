/* --- ADX Prototype: Hierarchical UI Engine --- */
const TEMPLATES = {
    practice: (data) => `
        <a onclick="clearSelection()" class="back-link">← Back to dashboard</a>
        <div class="section-header"><h3>Daily Operations (Clinical Focus)</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Slot Density</span><span class="stat-value">92%</span><span class="stat-sub">Utilization</span></div>
            <div class="daily-stat alert"><span class="stat-label">Unsigned Charts</span><span class="stat-value">12</span><span class="stat-sub">Action Required</span></div>
            <div class="daily-stat alert"><span class="stat-label">Critical Labs</span><span class="stat-value">3</span><span class="stat-sub">Review Pending</span></div>
            <div class="daily-stat"><span class="stat-label">POS Collected</span><span class="stat-value">$1,250</span><span class="stat-sub">Daily Cash</span></div>
        </div>
        <div class="section-header"><h3>Weekly Performance</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Work RVUs</span><span class="stat-value">450</span><span class="stat-sub">Target: 420</span></div>
            <div class="weekly-stat"><span class="stat-label">Billing Lag</span><span class="stat-value">1.2d</span><span class="stat-sub">Avg Days</span></div>
            <div class="weekly-stat"><span class="stat-label">New Referrals</span><span class="stat-value">24</span><span class="stat-sub">Healthy Pipeline</span></div>
        </div>
        <div class="table-container">
            <div class="section-header"><h3>Monthly Revenue Cycle (Admin Focus)</h3></div>
            <table class="table-custom">
                <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Health</th></tr></thead>
                <tbody>
                    <tr><td>A/R Aging (>90)</td><td>$14,200</td><td>< $10k</td><td style="color:var(--secondary-red); font-weight:700;">Critical</td></tr>
                    <tr><td>Net Collection Ratio</td><td>96.2%</td><td>95.0%</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                </tbody>
            </table>
        </div>`,

    patient: (p) => `
        <a onclick="clearSelection()" class="back-link">← Back to dashboard</a>
        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Chief Complaint</span><span class="stat-value" style="font-size:1.5rem;">${p.complaint}</span></div>
            <div class="daily-stat alert"><span class="stat-label">Allergies</span><span class="stat-value" style="font-size:1.5rem;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Vitals</span><span class="stat-value" style="font-size:1.5rem;">${p.vitals}</span></div>
        </div>
        <div class="section-header"><h3>Weekly Care Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat" style="grid-column: span 2;"><span class="stat-label">Active Problem List</span><p style="font-weight:700; margin-top:10px;">${p.adx} - MSK Diagnosis</p></div>
            <div class="weekly-stat"><span class="stat-label">Pain Trending</span><span class="stat-value">7/10</span></div>
        </div>
        <div class="table-container">
            <div class="section-header"><h3>Outcome Assessment & History</h3></div>
            <table class="table-custom">
                <thead><tr><th>Category</th><th>Details</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>Medication Adherence</td><td>${p.meds} - Consistent</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                    <tr><td>Last Visit Summary</td><td>${p.summary}</td><td>Complete</td></tr>
                </tbody>
            </table>
        </div>`
};
