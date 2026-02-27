/* --- ADX Prototype: Hierarchical UI Engine (Data-Mapped Edition) --- */
const TEMPLATES = {
    // 1. PRACTICE VIEW: Clinical & Revenue Cycle Hierarchy
    practice: (data) => `
        <a onclick="clearSelection()" class="back-link">← Back to Dashboard</a>
        
        <div class="section-header"><h3>Daily Operations (Clinical Focus)</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Slot Density</span><span class="stat-value">${data.density}</span><span class="stat-sub">Utilization</span></div>
            
            <div class="daily-stat ${parseInt(data.charts) > 10 ? 'alert' : ''}">
                <span class="stat-label">Unsigned Charts</span>
                <span class="stat-value">${data.charts}</span>
                <span class="stat-sub">Action Required</span>
            </div>
            
            <div class="daily-stat ${parseInt(data.labs) > 0 ? 'alert' : ''}">
                <span class="stat-label">Critical Labs</span>
                <span class="stat-value">${data.labs}</span>
                <span class="stat-sub">Pending Review</span>
            </div>
            
            <div class="daily-stat"><span class="stat-label">POS Collected</span><span class="stat-value">${data.pos}</span><span class="stat-sub">Daily Cash</span></div>
        </div>

        <div class="section-header"><h3>Weekly Performance</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat"><span class="stat-label">Work RVUs</span><span class="stat-value">${data.rvu}</span><span class="stat-sub">Target: 420</span></div>
            <div class="weekly-stat"><span class="stat-label">Billing Lag</span><span class="stat-value">${data.lag}</span><span class="stat-sub">Avg Days</span></div>
            <div class="weekly-stat"><span class="stat-label">New Referrals</span><span class="stat-value">${data.referrals}</span><span class="stat-sub">Pipeline Growth</span></div>
        </div>

        <div class="table-container">
            <div class="section-header"><h3>Monthly Revenue Cycle (Admin Focus)</h3></div>
            <table class="table-custom">
                <thead><tr><th>Metric</th><th>Current</th><th>Target</th><th>Health</th></tr></thead>
                <tbody>
                    <tr><td>A/R Aging (>90)</td><td>${data.ar}</td><td>< $10,000</td><td style="color:${parseFloat(data.ar.replace(/[^0-9.-]+/g,"")) > 10000 ? 'var(--secondary-red)' : 'green'}; font-weight:700;">${parseFloat(data.ar.replace(/[^0-9.-]+/g,"")) > 10000 ? 'Critical' : 'Healthy'}</td></tr>
                    <tr><td>Net Collection Ratio</td><td>${data.collection}</td><td>95.0%</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                    <tr><td>Claim Denial Rate</td><td>${data.denials}</td><td>< 5.0%</td><td style="color:green; font-weight:700;">Healthy</td></tr>
                </tbody>
            </table>
        </div>`,

    // 2. PATIENT VIEW: Clinical Encounter & History Hierarchy
    patientHierarchy: (p) => `
        <a onclick="clearSelection()" class="back-link">← Back to Dashboard</a>

        <div class="section-header"><h3>Daily Clinical Encounter</h3></div>
        <div class="daily-grid">
            <div class="daily-stat"><span class="stat-label">Chief Complaint</span><span class="stat-value" style="font-size:1.4rem;">${p.complaint}</span></div>
            <div class="daily-stat ${p.allergies !== 'None' ? 'alert' : ''}"><span class="stat-label">Allergies</span><span class="stat-value" style="font-size:1.4rem;">${p.allergies}</span></div>
            <div class="daily-stat"><span class="stat-label">Current Vitals</span><span class="stat-value" style="font-size:1.4rem;">${p.vitals}</span><span class="stat-sub">BMI: ${p.bmi}</span></div>
        </div>

        <div class="section-header"><h3>Weekly Care Coordination</h3></div>
        <div class="weekly-grid">
            <div class="weekly-stat" style="grid-column: span 2;"><span class="stat-label">Active Problem List</span><p style="font-weight:700; font-size:1.2rem; margin-top:10px; color:var(--primary-navy);">${p.adx}</p></div>
            <div class="weekly-stat"><span class="stat-label">Pain Trending</span><span class="stat-value">${p.pain}</span><span class="stat-sub">Score History</span></div>
            <div class="weekly-stat"><span class="stat-label">Pending Orders</span><span class="stat-value">${p.orders}</span><span class="stat-sub">Referrals/Imaging</span></div>
        </div>

        <div class="table-container">
            <div class="section-header"><h3>Monthly & Rare Assessment</h3></div>
            <table class="table-custom">
                <thead><tr><th>Category</th><th>Details</th><th>Status</th></tr></thead>
                <tbody>
                    <tr><td>Medication Adherence</td><td>${p.meds}</td><td style="font-weight:700;">${p.adherence} Refill Rate</td></tr>
                    <tr><td>Last Visit Summary</td><td>${p.summary}</td><td>Complete</td></tr>
                    <tr><td>Surgical History (Rare)</td><td>${p.surgery}</td><td>Archived</td></tr>
                    <tr><td>Billing Status</td><td>Claims Processed</td><td style="color:green; font-weight:700;">Paid</td></tr>
                </tbody>
            </table>
        </div>`
};
