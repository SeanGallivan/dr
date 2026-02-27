/* --- ADX Physician Onboarding Wizard: Step 4 Complete --- */
const WIZARD = {
    step: 1,
    data: { practice: '', physician: '', npi: '', staff: [] },

    open: () => {
        const m = document.createElement('div');
        m.id = 'wizMod'; m.className = 'modal-overlay';
        m.innerHTML = `
            <div class="modal-content high-density">
                <div class="wizard-sidebar">
                    <div class="wizard-progress-item active" id="s1">1. Practice</div>
                    <div class="wizard-progress-item" id="s2">2. Identity</div>
                    <div class="wizard-progress-item" id="s3">3. Staff</div>
                    <div class="wizard-progress-item" id="s4">4. Audit</div>
                </div>
                <div class="wizard-main">
                    <div id="wizBody" style="padding:3rem; flex:1; overflow-y:auto;"></div>
                    <div class="wizard-footer">
                        <button class="btn btn-outline" onclick="WIZARD.close()">Cancel</button>
                        <button class="btn btn-primary" id="wizActionBtn" onclick="WIZARD.next()">Next Step</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(m);
        WIZARD.render();
    },

    render: () => {
        const b = document.getElementById('wizBody');
        const btn = document.getElementById('wizActionBtn');
        document.querySelectorAll('.wizard-progress-item').forEach((el, i) => {
            el.classList.toggle('active', i + 1 === WIZARD.step);
        });

        if (WIZARD.step === 1) {
            b.innerHTML = `<h3>Step 1: Location Inheritance</h3>
                <div class="form-grid">
                    <div class="form-group span-2">
                        <label>Select Company Branch</label>
                        <select id="pSel" onchange="WIZARD.inherit(this.value)">
                            <option value="">-- Search Network --</option>
                            <option value="Summit Musculoskeletal">Summit MSK (HQ)</option>
                            <option value="Northside Chiropractic">Northside Chiropractic</option>
                        </select>
                    </div>
                    <div id="inhBox" class="inherited-data-box span-2">Select a branch to pull regulatory data...</div>
                </div>`;
        } else if (WIZARD.step === 2) {
            b.innerHTML = `<h3>Step 2: Physician Credentials</h3>
                <div class="form-grid">
                    <div class="form-group"><label>First Name</label><input type="text" id="fName" value="Elizabeth"></div>
                    <div class="form-group"><label>Last Name</label><input type="text" id="lName" value="Blackwell"></div>
                    <div class="form-group span-2"><label>NPI Number</label><input type="text" id="npiNum" placeholder="10-digit NPI"></div>
                </div>`;
        } else if (WIZARD.step === 3) {
            b.innerHTML = `<h3>Step 3: Support Staff Batch</h3>
                <p class="text-muted">Enter administrative emails for batch credentialing.</p>
                <textarea id="staffList" style="width:100%; height:120px; padding:15px;" placeholder="nurse@practice.com, admin@practice.com"></textarea>`;
        } else {
            btn.innerText = "Confirm & Complete";
            b.innerHTML = `<h3>Step 4: Audit & Confirm</h3>
                <div class="table-container">
                    <table class="table-custom dense">
                        <tbody>
                            <tr><td><b>Practice:</b></td><td>${WIZARD.data.practice || 'Summit MSK'}</td></tr>
                            <tr><td><b>Physician:</b></td><td>Dr. Blackwell</td></tr>
                            <tr><td><b>Credentials:</b></td><td>NPI Verified</td></tr>
                            <tr><td><b>Staff Users:</b></td><td>4 Pending Invites</td></tr>
                        </tbody>
                    </table>
                </div>`;
        }
    },

    inherit: (val) => {
        WIZARD.data.practice = val;
        const box = document.getElementById('inhBox');
        if (val) box.innerHTML = `<div class="inheritance-grid">
            <div><span class="stat-label">Tax ID</span><br><b>XX-XXX4492</b></div>
            <div><span class="stat-label">Address</span><br><b>123 Clinical Way</b></div>
            <div><span class="stat-label">Tier</span><br><b>Level 1 MSK</b></div>
        </div>`;
    },

    next: () => {
        if (WIZARD.step < 4) {
            WIZARD.step++;
            WIZARD.render();
        } else {
            WIZARD.close();
            alert('Physician Successfully Onboarded.');
        }
    },

    close: () => {
        document.getElementById('wizMod').remove();
        WIZARD.step = 1;
    }
};
