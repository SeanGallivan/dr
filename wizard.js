/* --- ADX Wizard: Styled & Logical --- */
const WIZARD = {
    step: 1,
    open: () => {
        const m = document.createElement('div');
        m.id = 'wizMod'; m.className = 'modal-overlay';
        m.innerHTML = `<div class="modal-content high-density"><div class="wizard-sidebar"><div class="wizard-progress-item active" id="s1">1. Practice</div><div class="wizard-progress-item" id="s2">2. Identity</div><div class="wizard-progress-item" id="s3">3. Access</div></div><div class="wizard-main"><div id="wizBody" style="padding:2.5rem; flex:1; overflow-y:auto;"></div><div class="wizard-footer"><button class="btn btn-outline" onclick="WIZARD.close()">Cancel</button><button class="btn btn-primary" onclick="WIZARD.next()">Next Step</button></div></div></div>`;
        document.body.appendChild(m); WIZARD.render();
    },
    render: () => {
        const b = document.getElementById('wizBody');
        if(WIZARD.step===1) b.innerHTML = `<h3>Location Inheritance</h3><div class="form-grid"><div class="form-group span-2"><label>Branch Selection</label><select onchange="WIZARD.inherit(this.value)"><option value="">-- Choose Option --</option><option value="new">+ Add New Branch</option><option value="PR1">Summit Musculoskeletal</option></select></div><div id="inhBox" class="inherited-data-box span-2">Select a branch or create a new location.</div></div>`;
        if(WIZARD.step===2) b.innerHTML = `<h3>Physician Identity</h3><div class="form-grid"><div class="form-group"><label>First Name</label><input type="text"></div><div class="form-group"><label>Last Name</label><input type="text"></div></div>`;
        if(WIZARD.step===3) b.innerHTML = `<h3>Staff Access</h3><textarea style="width:100%; height:120px; padding:12px;" placeholder="admin1@summit.com, nurse1@summit.com"></textarea>`;
    },
    inherit: (val) => {
        const box = document.getElementById('inhBox');
        if(val === 'new') box.innerHTML = `<b>New Branch Creation</b><br><input type="text" placeholder="Branch Name" style="width:100%; padding:10px; margin-top:10px;">`;
        else if(val) box.innerHTML = `<b>Inherited:</b> XX-XXX4492 (Tax ID) | Level 1 MSK`;
    },
    next: () => { if(WIZARD.step < 3) { WIZARD.step++; WIZARD.render(); } else { WIZARD.close(); alert('Onboarding Triggered'); } },
    close: () => { document.getElementById('wizMod').remove(); WIZARD.step = 1; }
};
