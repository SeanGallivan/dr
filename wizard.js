/* --- ADX Prototype: High-Density Physician Wizard --- */
const WIZARD = {
    step: 1,
    open: () => {
        const m = document.createElement('div');
        m.id = 'wizMod'; m.className = 'modal-overlay';
        m.innerHTML = `<div class="modal-content high-density"><div class="wizard-sidebar"><div class="wizard-progress-item active" id="s1">1. Practice</div><div class="wizard-progress-item" id="s2">2. Identity</div><div class="wizard-progress-item" id="s3">3. Staff</div></div><div class="wizard-main"><div id="wizBody" style="padding:3rem; flex:1;"></div><div class="wizard-footer"><button class="btn btn-outline" onclick="WIZARD.close()">Cancel</button><button class="btn btn-primary" onclick="WIZARD.next()">Next Step</button></div></div></div>`;
        document.body.appendChild(m); WIZARD.render();
    },
    render: () => {
        const b = document.getElementById('wizBody');
        if(WIZARD.step===1) b.innerHTML = `<h3>Practice Inheritance</h3><div class="form-grid"><div class="form-group span-2"><label>Select Branch</label><select onchange="WIZARD.inherit(this.value)"><option value="">-- Search --</option><option value="PR1">Summit MSK</option></select></div><div id="inhBox" class="inherited-data-box span-2">Select a branch to pull tax/address data...</div></div>`;
        if(WIZARD.step===2) b.innerHTML = `<h3>Physician Identity</h3><div class="form-grid"><div class="form-group"><label>First Name</label><input type="text"></div><div class="form-group"><label>Last Name</label><input type="text"></div><div class="form-group span-2"><label>NPI Number</label><input type="text"></div></div>`;
        if(WIZARD.step===3) b.innerHTML = `<h3>Batch Staff Access</h3><p class="text-muted">Enter staff emails separated by commas.</p><textarea style="width:100%; height:150px; padding:15px;" placeholder="admin1@summit.com, nurse1@summit.com"></textarea>`;
    },
    inherit: (id) => { if(id) document.getElementById('inhBox').innerHTML = `<div class="inheritance-grid"><div><span class="stat-label">Tax ID</span><br><b>XX-XXX4492</b></div><div><span class="stat-label">Address</span><br><b>123 Clinical Way</b></div></div>`; },
    next: () => { if(WIZARD.step < 3) { WIZARD.step++; WIZARD.render(); } else { WIZARD.close(); alert('Onboarding Complete'); } },
    close: () => { document.getElementById('wizMod').remove(); WIZARD.step = 1; }
};
