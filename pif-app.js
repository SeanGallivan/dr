/* =====================================================================
   PIF Survey — Application / Rendering engine  (Rev 1, Dr. Vilims review)
   ---------------------------------------------------------------------
   Patient-facing flow: intro → quick intake questions → your pain areas →
   one screen per doc-assigned MSK area → concussion check (if assigned) →
   thank-you. No review/summary screen. No auto-advance; back is allowed.
   Converged onto the production PIFS behavior:
     - prior response shown as a slider POSITION (ghost marker), never a number
     - the response scale uses FACES, no numerals visible to the patient
     - a yes/no medication question gates a paired with/without two-slider set
     - doc-assigned areas are locked; the patient adds extras (unassigned)
   Reads data + scoring from pif-data.js. State is in memory only.
   ===================================================================== */

var PIFApp = (function () {
    "use strict";

    var state = null;
    var stepIndex = 0;
    var staffMode = false;   // ?staff=1 — a doctor/admin completing it WITH the patient in DR
    var patientName = "";    // ?name=
    var _qseq = 0;           // unique radio-group names

    /* ---- helpers ---- */
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function blankActivity() { return { name: "", locked: false, prior: null, cur: { wo: null, wm: null } }; }
    function faceSVG(kind) {
        var mouth = kind === "happy" ? "M8 14.5 Q12 18.8 16 14.5" : "M8 16.8 Q12 12.5 16 16.8";
        return '<svg viewBox="0 0 24 24" width="30" height="30" focusable="false" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
            '<circle cx="8.6" cy="10" r="1.15" fill="currentColor"/><circle cx="15.4" cy="10" r="1.15" fill="currentColor"/>' +
            '<path d="' + mouth + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
    }

    /* =================================================================
       THEME (patient-facing: light by default; toggle to dark; persisted)
    ================================================================= */
    function theme() { try { return localStorage.getItem("pif_theme") || "light"; } catch (e) { return "light"; } }
    function applyTheme(t) {
        document.documentElement.setAttribute("data-theme", t);
        try { localStorage.setItem("pif_theme", t); } catch (e) {}
        var btn = document.getElementById("pifThemeToggle");
        if (btn) { btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false"); var k = btn.querySelector(".knob"); if (k) k.textContent = t === "dark" ? "☾" : "☀"; }
    }
    function toggleTheme() { applyTheme(theme() === "dark" ? "light" : "dark"); }

    /* Staff-assisted mode banner (clinician completing it with the patient in DR).
       PRODUCTION: real staff mode seeds areas/activities/priors from the DR record. */
    function setupMode() {
        var banner = document.getElementById("pifStaffBanner");
        if (staffMode) {
            document.body.classList.add("pif-staff");
            if (banner) {
                banner.hidden = false;
                banner.innerHTML = "<strong>Staff-assisted mode</strong> — complete this together with " +
                    (patientName ? esc(patientName) : "the patient") +
                    " in Derived Results. No patient internet or login needed; record the patient’s own answers.";
            }
        } else if (banner) { banner.hidden = true; }
    }
    function assessmentLabel() { return (state && state.isFollowUp) ? "Follow Up Assessment" : "Assessment"; }
    function updateChrome() {
        var eyebrow = document.querySelector(".adx-eyebrow");
        if (eyebrow) eyebrow.textContent = staffMode ? "Staff-Assisted Assessment" : assessmentLabel();
        document.title = "Derived Results | " + assessmentLabel();
    }

    /* =================================================================
       STATE
    ================================================================= */
    function initPatient(pid) {
        pid = String(pid);
        var src = PIF_SAMPLE_PATIENTS[pid] || PIF_SAMPLE_PATIENTS["1"];

        var selected = {};
        src.regions.forEach(function (r) { selected[r.id] = { checked: true, lat: r.lat || null, fromNote: true, added: false, locked: true }; });
        if (src.brain) selected["brain"] = { checked: true, lat: null, fromNote: true, added: false, locked: true };

        var regions = src.regions.map(function (r) {
            var def = REGION_BY_ID[r.id];
            var acts = (r.activities || []).map(function (a) {
                return { name: a.name, locked: !!r.repeat, prior: a.prior ? { wo: a.prior.wo, wm: a.prior.wm } : null, cur: { wo: (a.cur ? a.cur.wo : null), wm: (a.cur ? a.cur.wm : null) } };
            });
            return { id: r.id, label: def.label, plain: def.plain, lat: r.lat || null, instrument: "A", repeat: !!r.repeat, medication: (r.medication === undefined ? null : r.medication), activities: acts };
        });

        state = {
            patientId: pid, name: src.name,
            isFollowUp: regions.some(function (r) { return r.repeat; }),
            intake: { workRelated: src.intake ? src.intake.workRelated : null, attorney: src.intake ? src.intake.attorney : null, workStatus: src.intake ? src.intake.workStatus : null },
            selection: selected,
            regions: regions,
            brainPresent: !!src.brain,
            mrpq: { responses: (src.brain && src.mrpq) ? src.mrpq.slice() : MRPQ_ITEMS.map(function () { return null; }) },
            addedRegions: [],
            feedback: "", submitted: false
        };
        stepIndex = 0;
        updateChrome();
        render();
    }

    /* =================================================================
       SCREEN LIST + NAVIGATION  (no auto-advance; no review screen)
    ================================================================= */
    function screenList() {
        var list = [{ k: "intro" }, { k: "intake" }, { k: "regions" }];
        state.regions.forEach(function (r) { if (r.instrument === "A") list.push({ k: "msk", id: r.id }); });
        if (state.brainPresent) list.push({ k: "brain" });
        list.push({ k: "thankyou" });
        return list;
    }
    function contentList() { return screenList().filter(function (s) { return s.k !== "intro" && s.k !== "thankyou"; }); }

    // Rebuild MSK working objects, brain flag, and the patient-added (unassigned)
    // areas from the selection. Doc-assigned areas get activity screens; patient
    // additions are recorded as unassigned and never overwrite doc-assigned ones (B5).
    function syncRegionsFromSelection() {
        var existing = {}; state.regions.forEach(function (r) { existing[r.id] = r; });
        var next = [], added = [];
        REGIONS.forEach(function (def) {
            var sel = state.selection[def.id];
            if (!sel || !sel.checked) return;
            if (def.id === "brain") { if (!sel.fromNote) added.push({ id: "brain", label: def.label, lat: null }); return; }
            if (sel.fromNote) {
                var r = existing[def.id] || { id: def.id, label: def.label, plain: def.plain, lat: sel.lat || null, instrument: "A", repeat: false, medication: null, activities: [] };
                r.lat = sel.lat || null;
                next.push(r);
            } else {
                added.push({ id: def.id, label: def.label, lat: sel.lat || null }); // unassigned — no activity screen
            }
        });
        state.regions = next;
        state.addedRegions = added;
        state.brainPresent = !!(state.selection["brain"] && state.selection["brain"].checked && state.selection["brain"].fromNote);
    }

    function onNext() {
        var list = screenList();
        var cur = list[stepIndex];
        if (cur.k === "regions") syncRegionsFromSelection();
        if (list[stepIndex + 1] && list[stepIndex + 1].k === "thankyou") state.submitted = true; // submit on the last content screen
        if (cur.k === "thankyou") { initPatient(state.patientId); return; } // "Start over"
        stepIndex++;
        render();
    }
    function onBack() { if (stepIndex > 0) { stepIndex--; render(); } }
    function goToScreen(pred) { var list = screenList(); for (var i = 0; i < list.length; i++) { if (pred(list[i])) { stepIndex = i; render(); return; } } }

    function updateNav(cur) {
        var list = screenList();
        var back = document.getElementById("btnBack");
        var next = document.getElementById("btnNext");
        back.style.visibility = (stepIndex === 0) ? "hidden" : "visible";
        if (cur.k === "intro") next.textContent = "Begin";
        else if (cur.k === "thankyou") next.textContent = "Start over";
        else if (list[stepIndex + 1] && list[stepIndex + 1].k === "thankyou") next.textContent = "Submit";
        else next.textContent = "Next";
    }
    function announce(msg) { var live = document.getElementById("pifLive"); if (live) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); } }

    /* =================================================================
       ACCESSIBLE SLIDER (B1 ghost prior position, B2 faces + no numbers)
    ================================================================= */
    function makeSlider(cfg) {
        var value = (cfg.value == null ? null : cfg.value);
        var prior = (cfg.prior == null ? null : cfg.prior);
        var wrap = el("div", "pif-slider-wrap");
        var ends = el("div", "pif-ends");
        var sad = el("span", "pif-face pif-face-sad"); sad.innerHTML = faceSVG("sad");
        var happy = el("span", "pif-face pif-face-happy"); happy.innerHTML = faceSVG("happy");
        ends.appendChild(sad); ends.appendChild(happy);
        var slider = el("div", "pif-slider");
        slider.setAttribute("role", "slider");
        slider.setAttribute("tabindex", "0");
        slider.setAttribute("aria-valuemin", "0");
        slider.setAttribute("aria-valuemax", "10");
        slider.setAttribute("aria-label", cfg.ariaLabel || "Rate from most difficulty to no difficulty");
        var track = el("div", "pif-track");
        var fill = el("div", "pif-fill");
        var ghost = el("div", "pif-ghost"); ghost.setAttribute("aria-hidden", "true"); ghost.title = "Where you placed yourself last time";
        var thumb = el("div", "pif-thumb");
        track.appendChild(fill); track.appendChild(ghost); track.appendChild(thumb);
        slider.appendChild(track);
        var valOut = el("div", "pif-val");

        function band(v) {
            if (v <= 1) return "a lot of difficulty";
            if (v <= 3) return "quite a bit of difficulty";
            if (v <= 5) return "moderate difficulty";
            if (v <= 7) return "a little difficulty";
            if (v <= 9) return "almost no difficulty";
            return "no difficulty";
        }
        function paintGhost() {
            if (prior == null) { ghost.style.display = "none"; }
            else { ghost.style.display = "block"; ghost.style.left = "calc(" + (prior / 10 * 100) + "% - 9px)"; }
        }
        function paint() {
            if (value == null) {
                slider.classList.add("unanswered");
                thumb.style.left = "-24px"; fill.style.width = "0%";
                slider.removeAttribute("aria-valuenow");
                slider.setAttribute("aria-valuetext", "Not answered");
                valOut.textContent = (prior != null) ? "Slide to answer — the outline shows where you were last time" : "Slide to answer";
            } else {
                slider.classList.remove("unanswered");
                var pct = value / 10 * 100;
                thumb.style.left = "calc(" + pct + "% - 14px)";
                fill.style.width = pct + "%";
                slider.setAttribute("aria-valuenow", String(value));         // for assistive tech only
                slider.setAttribute("aria-valuetext", band(value));          // no numeral shown visually (B2)
                valOut.textContent = (prior != null) ? "The outline shows where you were last time" : "";
            }
        }
        function setVal(v) { v = Math.max(0, Math.min(10, Math.round(v))); value = v; paint(); if (cfg.onChange) cfg.onChange(v); }
        function fromClientX(clientX) { var rect = track.getBoundingClientRect(); if (rect.width <= 0) return; setVal((clientX - rect.left) / rect.width * 10); }
        track.addEventListener("pointerdown", function (e) {
            e.preventDefault(); slider.focus(); fromClientX(e.clientX);
            var mv = function (ev) { fromClientX(ev.clientX); };
            var up = function () { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
            document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
        });
        slider.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") { setVal(value == null ? 5 : value + 1); e.preventDefault(); }
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setVal(value == null ? 5 : value - 1); e.preventDefault(); }
            else if (e.key === "Home") { setVal(0); e.preventDefault(); }
            else if (e.key === "End") { setVal(10); e.preventDefault(); }
        });
        paintGhost(); paint();
        wrap.appendChild(ends); wrap.appendChild(slider); wrap.appendChild(valOut);
        return wrap;
    }

    /* Shared yes/no + select question builders (intake, medication gate) */
    function yesNoQuestion(labelText, val, onChange) {
        var q = el("div", "intake-q");
        q.appendChild(el("div", "intake-label", labelText));
        var group = el("div", "seg-group"); group.setAttribute("role", "radiogroup"); group.setAttribute("aria-label", labelText);
        var name = "ynq" + (++_qseq);
        [["Yes", true], ["No", false]].forEach(function (pair) {
            var seg = el("label", "seg" + (val === pair[1] ? " on" : ""));
            var r = el("input"); r.type = "radio"; r.name = name; r.checked = (val === pair[1]);
            r.setAttribute("aria-label", labelText + " " + pair[0]);
            r.addEventListener("change", function () { onChange(pair[1]); Array.prototype.forEach.call(group.children, function (ch) { ch.classList.remove("on"); }); seg.classList.add("on"); });
            seg.appendChild(r); seg.appendChild(document.createTextNode(pair[0]));
            group.appendChild(seg);
        });
        q.appendChild(group);
        return q;
    }
    function selectQuestion(labelText, options, val, onChange) {
        var q = el("div", "intake-q");
        var id = "selq" + (++_qseq);
        var lab = el("label", "intake-label", labelText); lab.setAttribute("for", id);
        q.appendChild(lab);
        var sel = el("select", "intake-select"); sel.id = id;
        var ph = el("option", null, "Choose one…"); ph.value = ""; sel.appendChild(ph);
        options.forEach(function (o) { var op = el("option", null, o); op.value = o; if (val === o) op.selected = true; sel.appendChild(op); });
        sel.addEventListener("change", function () { onChange(sel.value || null); });
        q.appendChild(sel);
        return q;
    }

    /* =================================================================
       RENDER DISPATCHER
    ================================================================= */
    function render() {
        var list = screenList();
        if (stepIndex < 0) stepIndex = 0;
        if (stepIndex >= list.length) stepIndex = list.length - 1;
        var cur = list[stepIndex];
        var app = document.getElementById("app");
        app.innerHTML = "";

        if (cur.k !== "intro" && cur.k !== "thankyou") {
            var content = contentList();
            var pos = 0;
            for (var i = 0; i < content.length; i++) { if (content[i].k === cur.k && (content[i].id || null) === (cur.id || null)) { pos = i + 1; break; } }
            var p = el("div", "progress", "Step " + pos + " of " + content.length);
            p.setAttribute("aria-label", "Step " + pos + " of " + content.length);
            app.appendChild(p);
        }

        if (cur.k === "intro")         renderIntro(app);
        else if (cur.k === "intake")   renderIntake(app);
        else if (cur.k === "regions")  renderRegions(app);
        else if (cur.k === "msk")      renderMSK(app, cur.id);
        else if (cur.k === "brain")    renderBrain(app);
        else if (cur.k === "thankyou") renderThankYou(app);

        updateNav(cur);
        window.scrollTo(0, 0);
        var main = document.getElementById("pifMain"); if (main) main.scrollTo(0, 0);
    }

    /* ---- Intro ---- */
    function renderIntro(app) {
        var c = el("div", "card");
        if (staffMode) {
            var whoName = patientName || "the patient";
            c.appendChild(el("h1", null, assessmentLabel() + (patientName ? " — " + patientName : "")));
            c.appendChild(el("p", "intro-lead", "You're completing this together with " + whoName + ". Read each item with them and record their own answers — the ratings should reflect the patient's view of their function, not yours."));
            c.appendChild(el("p", null, "Use it when they're in front of you or don't have internet access. Nothing to log in to; you can go back and change anything."));
            c.appendChild(el("p", "muted", "Demo: sample answers are pre-filled so you can see the flow. Use the Sample patient menu at the top to switch demos."));
        } else if (state.isFollowUp) {
            c.appendChild(el("h1", null, "Welcome back — a quick check-in"));
            c.appendChild(el("p", "intro-lead", "Thanks for taking a few minutes. Your answers help your care team see how you're doing and tailor your care to what matters most to you."));
            c.appendChild(el("p", null, "There's nothing to log in to — you came here from the secure link in your email. There are no right or wrong answers. You can go back and change anything before you finish."));
        } else {
            c.appendChild(el("h1", null, "Welcome — let's get started"));
            c.appendChild(el("p", "intro-lead", "Thanks for taking a few minutes. Your answers help your care team understand how you're doing and tailor your care to what matters most to you."));
            c.appendChild(el("p", null, "There's nothing to log in to — you came here from the secure link in your email. There are no right or wrong answers. You can go back and change anything before you finish."));
        }
        // PRODUCTION: patient entry validates a signed, single-use emailed token;
        // staff entry is launched from within DR (no login / 2FA in this prototype).
        app.appendChild(c);
    }

    /* ---- Quick intake questions (B7) ---- */
    function renderIntake(app) {
        var c = el("div", "card");
        var iv = state.intake;
        if (state.isFollowUp) {
            c.appendChild(el("h2", null, "Has anything changed?"));
            c.appendChild(el("p", "muted", "Here's what we have on file. If anything has changed since your last visit — for example, you haven't returned to work — update it below. If nothing has changed, just continue."));
        } else {
            c.appendChild(el("h2", null, "A few quick questions"));
            c.appendChild(el("p", "muted", "These help your care team understand your situation. There are no right or wrong answers."));
        }
        c.appendChild(yesNoQuestion("Was this a work-related injury?", iv.workRelated, function (v) { iv.workRelated = v; }));
        c.appendChild(yesNoQuestion("Do you have an attorney for this?", iv.attorney, function (v) { iv.attorney = v; }));
        c.appendChild(selectQuestion("What was your work status before the pain or symptoms started?", WORK_STATUS_OPTIONS, iv.workStatus, function (v) { iv.workStatus = v; }));
        app.appendChild(c);
    }

    /* ---- Your pain areas (B5): locked doc-assigned + collapsible add drawer ---- */
    function renderRegions(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "Your pain areas"));
        c.appendChild(el("p", "muted", "These are the areas your care team is treating. Having pain in a new area too? Open “New or other pain areas” below to add it — your care team will review anything you add."));

        var lockedWrap = el("div", "locked-areas");
        var anyLocked = false;
        REGIONS.forEach(function (def) {
            var sel = state.selection[def.id];
            if (!(sel && sel.checked && sel.fromNote)) return;
            anyLocked = true;
            var row = el("div", "region-row locked");
            var nm = el("div", "region-name", def.label + (sel.lat ? " — " + sel.lat : ""));
            nm.appendChild(el("span", "lock-badge", "assigned by your care team"));
            row.appendChild(nm);
            if (def.id === "brain") row.appendChild(el("div", "muted", "We'll ask about concussion symptoms in a later step."));
            lockedWrap.appendChild(row);
        });
        if (anyLocked) c.appendChild(lockedWrap);

        var addedWrap = el("div", "added-areas");
        c.appendChild(addedWrap);

        var expandNew = false;
        var drawer = el("details", "new-areas");
        drawer.addEventListener("toggle", function () { expandNew = drawer.open; });
        drawer.appendChild(el("summary", "new-areas-summary", "New or other pain areas"));
        drawer.appendChild(el("div", "new-areas-hint muted", "Only add an area if you're having pain your care team hasn't listed. They'll review anything you add and follow up — it won't change the areas above, and it isn't scored until they set it up."));
        var drawerBody = el("div", "new-areas-body");
        drawer.appendChild(drawerBody);
        c.appendChild(drawer);
        app.appendChild(c);

        function latPicker(def, sel) {
            var opts = def.lat === "LRM" ? ["Left", "Right", "Middle"] : ["Left", "Right"];
            var lg = el("div", "lat-group");
            lg.appendChild(el("div", "lat-label", "Which side?"));
            opts.forEach(function (o) {
                var seg = el("label", "seg" + (sel.lat === o ? " on" : ""));
                var r = el("input"); r.type = "radio"; r.name = "lat_" + def.id; r.checked = (sel.lat === o);
                r.setAttribute("aria-label", def.label + " " + o);
                r.addEventListener("change", function () { sel.lat = o; refresh(); });
                seg.appendChild(r); seg.appendChild(document.createTextNode(o));
                lg.appendChild(seg);
            });
            return lg;
        }
        function refresh() {
            addedWrap.innerHTML = "";
            REGIONS.forEach(function (def) {
                var sel = state.selection[def.id];
                if (!(sel && sel.checked && !sel.fromNote)) return;
                var row = el("div", "region-row added");
                var top = el("div", "act-head");
                var nm = el("div", "region-name", def.label);
                nm.appendChild(el("span", "added-badge", "added — care team will review"));
                top.appendChild(nm);
                var rm = el("button", "btn-remove", "Remove"); rm.type = "button";
                rm.addEventListener("click", function () { sel.checked = false; refresh(); });
                top.appendChild(rm);
                row.appendChild(top);
                if (def.lat) row.appendChild(latPicker(def, sel));
                row.appendChild(el("div", "muted", "This isn't scored yet — your care team will set it up at your next visit."));
                addedWrap.appendChild(row);
            });
            drawerBody.innerHTML = "";
            REGIONS.forEach(function (def) {
                var sel = state.selection[def.id] || (state.selection[def.id] = { checked: false, lat: null, fromNote: false, added: false, locked: false });
                if (sel.fromNote || sel.checked) return; // doc-assigned never here; already-added lives above
                var row = el("div", "region-row");
                var lab = el("label", "region-check");
                var cb = el("input"); cb.type = "checkbox"; cb.checked = false; cb.setAttribute("aria-label", "Add " + def.label);
                cb.addEventListener("change", function () { sel.checked = true; sel.added = true; expandNew = true; refresh(); });
                lab.appendChild(cb); lab.appendChild(el("div", "region-name", def.label));
                row.appendChild(lab);
                drawerBody.appendChild(row);
            });
            drawer.open = expandNew;
        }
        refresh();
    }

    /* ---- Per MSK area: medication gate + activities (B3, B6, B1, B2) ---- */
    function renderMSK(app, regionId) {
        var region = state.regions.find(function (r) { return r.id === regionId; });
        if (!region) { app.appendChild(el("div", "card", "This area is no longer selected.")); return; }
        var c = el("div", "card");
        c.appendChild(el("h2", null, "How is your " + region.plain + "?" + (region.lat ? " (" + region.lat + ")" : "")));
        c.appendChild(el("div", "muted", region.label + (region.lat ? " — " + region.lat : "")));

        // Medication gate (B3)
        var medQ = el("div", "med-gate");
        medQ.appendChild(el("div", "med-gate-q", "Are you taking any medication for your " + region.plain + "?"));
        medQ.appendChild(el("div", "muted", "This helps us tell your true function from the relief your medication gives."));
        var group = el("div", "seg-group"); group.setAttribute("role", "radiogroup"); group.setAttribute("aria-label", "Taking medication for your " + region.plain);
        [["Yes", true], ["No", false]].forEach(function (pair) {
            var seg = el("label", "seg" + (region.medication === pair[1] ? " on" : ""));
            var r = el("input"); r.type = "radio"; r.name = "med_" + region.id; r.checked = (region.medication === pair[1]);
            r.setAttribute("aria-label", pair[0]);
            r.addEventListener("change", function () { region.medication = pair[1]; Array.prototype.forEach.call(group.children, function (ch) { ch.classList.remove("on"); }); seg.classList.add("on"); buildActs(); });
            seg.appendChild(r); seg.appendChild(document.createTextNode(pair[0]));
            group.appendChild(seg);
        });
        medQ.appendChild(group);
        c.appendChild(medQ);

        if (region.repeat) {
            c.appendChild(el("p", null, "These are the activities you told us about before. Slide each one to show how you're doing now. The outline on each slider shows where you were last time."));
        } else {
            c.appendChild(el("p", null, "Tell us up to five everyday activities that are hard for you because of your " + region.plain + ". Use an example to start, or type your own."));
            var ex = EXAMPLE_ACTIVITIES[regionId] || [];
            if (ex.length) {
                var prow = el("div", "prompt-row");
                var plab = el("label", "prompt-label", "Examples to spark ideas — these are prompts, not answers. Pick one to use it, or type your own below."); plab.setAttribute("for", "exSel_" + regionId);
                var psel = el("select", "prompt-select"); psel.id = "exSel_" + regionId;
                var ph = el("option", null, "Choose an example…"); ph.value = ""; psel.appendChild(ph);
                ex.forEach(function (t) { var o = el("option", null, t); o.value = t; psel.appendChild(o); });
                psel.addEventListener("change", function () {
                    var t = psel.value; if (!t) return;
                    var target = region.activities.find(function (a) { return !a.name.trim(); });
                    if (!target && region.activities.length < MAX_ACTIVITIES) { target = blankActivity(); region.activities.push(target); }
                    if (target) { target.name = t; buildActs(); }
                    psel.value = "";
                });
                prow.appendChild(plab); prow.appendChild(psel);
                c.appendChild(prow);
            }
            if (region.activities.length === 0) region.activities.push(blankActivity());
        }

        var actsWrap = el("div"); c.appendChild(actsWrap);

        function buildActs() {
            actsWrap.innerHTML = "";
            region.activities.forEach(function (a, idx) {
                var box = el("div", "activity");
                var head = el("div", "act-head");
                if (region.repeat) {
                    head.appendChild(el("div", "locked-name", a.name)); // no prior number shown (B1)
                } else {
                    var inp = el("input"); inp.type = "text"; inp.value = a.name;
                    inp.placeholder = "e.g. " + ((EXAMPLE_ACTIVITIES[regionId] || ["an activity you struggle with"])[0]);
                    inp.setAttribute("aria-label", "Activity " + (idx + 1) + " for " + region.plain);
                    inp.addEventListener("input", function () { a.name = inp.value; });
                    head.appendChild(inp);
                    var ctr = el("div", "act-controls");
                    var up = el("button", "act-move", "↑"); up.type = "button"; up.setAttribute("aria-label", "Move activity up"); if (idx === 0) up.disabled = true;
                    up.addEventListener("click", function () { if (idx > 0) { var t = region.activities[idx - 1]; region.activities[idx - 1] = region.activities[idx]; region.activities[idx] = t; buildActs(); } });
                    var down = el("button", "act-move", "↓"); down.type = "button"; down.setAttribute("aria-label", "Move activity down"); if (idx === region.activities.length - 1) down.disabled = true;
                    down.addEventListener("click", function () { if (idx < region.activities.length - 1) { var t = region.activities[idx + 1]; region.activities[idx + 1] = region.activities[idx]; region.activities[idx] = t; buildActs(); } });
                    var rm = el("button", "btn-remove", "Remove"); rm.type = "button";
                    rm.addEventListener("click", function () { region.activities.splice(idx, 1); if (region.activities.length === 0) region.activities.push(blankActivity()); buildActs(); });
                    ctr.appendChild(up); ctr.appendChild(down); ctr.appendChild(rm);
                    head.appendChild(ctr);
                }
                box.appendChild(head);

                if (region.medication === true) {
                    var woBlk = el("div", "med-block");
                    woBlk.appendChild(el("div", "med-label", "Without your medication"));
                    woBlk.appendChild(makeSlider({ value: a.cur.wo, prior: (a.prior ? a.prior.wo : null), ariaLabel: "Without medication, " + (a.name || ("activity " + (idx + 1))), onChange: function (v) { a.cur.wo = v; } }));
                    box.appendChild(woBlk);
                    var wmBlk = el("div", "med-block");
                    wmBlk.appendChild(el("div", "med-label", "With your medication"));
                    wmBlk.appendChild(makeSlider({ value: a.cur.wm, prior: (a.prior ? a.prior.wm : null), ariaLabel: "With medication, " + (a.name || ("activity " + (idx + 1))), onChange: function (v) { a.cur.wm = v; } }));
                    box.appendChild(wmBlk);
                } else if (region.medication === false) {
                    var blk = el("div", "med-block");
                    blk.appendChild(makeSlider({ value: a.cur.wo, prior: (a.prior ? a.prior.wo : null), ariaLabel: (a.name || ("activity " + (idx + 1))), onChange: function (v) { a.cur.wo = v; a.cur.wm = null; } }));
                    box.appendChild(blk);
                } else {
                    box.appendChild(el("div", "med-wait muted", "Please answer the medication question above to rate this activity."));
                }
                actsWrap.appendChild(box);
            });
            if (!region.repeat && region.activities.length < MAX_ACTIVITIES) {
                var add = el("button", "btn-add", "+ Add another activity"); add.type = "button";
                add.addEventListener("click", function () { region.activities.push(blankActivity()); buildActs(); });
                actsWrap.appendChild(add);
            }
        }
        buildActs();
        app.appendChild(c);
    }

    /* ---- Concussion check (Instrument B, mRPQ-20 on a 1–4 scale) (B9) ---- */
    function renderBrain(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "Concussion symptom check"));
        c.appendChild(el("p", null, "Compared with before your injury, please rate each symptom over the last 24 hours."));
        c.appendChild(el("p", "muted", MRPQ_LABELS.map(function (l, i) { return (i + 1) + " = " + l; }).join("   ·   ")));
        MRPQ_ITEMS.forEach(function (it, i) {
            var box = el("div", "mrpq-item");
            box.appendChild(el("div", "mrpq-q", it.n + ". " + it.text));
            var opts = el("div", "mrpq-opts"); opts.setAttribute("role", "radiogroup"); opts.setAttribute("aria-label", it.text);
            MRPQ_SCALE.forEach(function (val, ki) {
                var o = el("div", "mrpq-opt" + (state.mrpq.responses[i] === val ? " on" : ""));
                o.setAttribute("role", "radio"); o.setAttribute("tabindex", "0");
                o.setAttribute("aria-checked", state.mrpq.responses[i] === val ? "true" : "false");
                o.setAttribute("aria-label", MRPQ_LABELS[ki]);
                o.appendChild(el("div", "num", String(val)));
                o.appendChild(el("div", null, MRPQ_LABELS[ki]));
                var choose = function () { state.mrpq.responses[i] = val; Array.prototype.forEach.call(opts.children, function (ch, ci) { ch.classList.toggle("on", ci === ki); ch.setAttribute("aria-checked", ci === ki ? "true" : "false"); }); };
                o.addEventListener("click", choose);
                o.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); choose(); } });
                opts.appendChild(o);
            });
            box.appendChild(opts);
            c.appendChild(box);
        });
        app.appendChild(c);
    }

    /* ---- Thank you (B4 no review, B8 route to care team not the chart) ---- */
    function renderThankYou(app) {
        var c = el("div", "card pif-thanks");
        if (staffMode) {
            c.appendChild(el("h1", null, "Assessment saved"));
            c.appendChild(el("p", "intro-lead", "The assessment" + (patientName ? " for " + patientName : "") + " has been saved to the patient's record in Derived Results."));
            c.appendChild(el("p", "muted", "You can start another assessment or close this tab to return to the chart."));
        } else {
            c.appendChild(el("h1", null, "Thank you!"));
            c.appendChild(el("p", "intro-lead", "Your answers were sent to your care team. There's nothing else you need to do — you can close this page whenever you're ready."));
        }

        if (state.addedRegions && state.addedRegions.length) {
            var box = el("div", "added-summary");
            box.appendChild(el("strong", null, "You also told us about new pain in:"));
            var ul = el("ul", null);
            state.addedRegions.forEach(function (a) { ul.appendChild(el("li", null, a.label + (a.lat ? " — " + a.lat : ""))); });
            box.appendChild(ul);
            box.appendChild(el("div", "muted", "Your care team will review these and follow up with you."));
            c.appendChild(box);
        }

        var fb = el("div", "feedback-box");
        var lab = el("label", "fb-label", staffMode ? "Any notes to add for the care team? (optional)" : "Anything confusing, or any pain you didn't get to mention? (optional)");
        lab.setAttribute("for", "pifFeedback");
        fb.appendChild(lab);
        var ta = el("textarea", "fb-textarea"); ta.id = "pifFeedback"; ta.rows = 5;
        ta.setAttribute("aria-label", "Message for your care team");
        ta.placeholder = "Type your questions or anything you'd like to add here…";
        ta.value = state.feedback || "";
        ta.addEventListener("input", function () { state.feedback = ta.value; });
        fb.appendChild(ta);
        fb.appendChild(el("div", "fb-note muted", "This goes to your care team, not your medical chart."));
        var send = el("button", "pif-btn primary fb-send", staffMode ? "Save note for the care team" : "Send to my care team"); send.type = "button";
        var confirm = el("div", "fb-confirm"); confirm.style.display = "none";
        send.addEventListener("click", function () {
            // PRODUCTION (B8): route to the assigned case manager + the doctor's
            // management team; persist as a Salesforce customer-service event tagged
            // patient-reported on a date. NEVER written into the clinical note / chart.
            send.textContent = staffMode ? "Saved ✓" : "Sent ✓"; send.disabled = true; ta.disabled = true;
            confirm.textContent = "Thanks — this was sent to your care team, not your medical chart.";
            confirm.style.display = "block";
            announce("Your message was sent to your care team.");
        });
        fb.appendChild(send);
        fb.appendChild(confirm);
        c.appendChild(fb);
        app.appendChild(c);
    }

    /* =================================================================
       BOOT
    ================================================================= */
    function boot() {
        applyTheme(theme());
        var tgl = document.getElementById("pifThemeToggle");
        if (tgl) tgl.addEventListener("click", toggleTheme);

        document.getElementById("btnBack").addEventListener("click", onBack);
        document.getElementById("btnNext").addEventListener("click", onNext);

        var sel = document.getElementById("patientSelect");
        sel.addEventListener("change", function (e) {
            var url = new URL(window.location.href);
            url.searchParams.set("patient", e.target.value);
            history.replaceState(null, "", url);
            initPatient(e.target.value);
        });

        var params = new URLSearchParams(window.location.search);
        staffMode = (params.get("staff") === "1" || params.get("mode") === "clinic");
        patientName = params.get("name") || "";
        setupMode();
        var pid = params.get("patient");
        if (pid !== "1" && pid !== "2" && pid !== "3") pid = "1";
        sel.value = pid;
        initPatient(pid);
    }

    return { boot: boot, toggleTheme: toggleTheme };
})();

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", PIFApp.boot);
else PIFApp.boot();
