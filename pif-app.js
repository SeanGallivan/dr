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
    /* C8: full lateralized site label from the assigned pain area — "your left
       shoulder", "your middle low back". Data-driven; used by every per-area
       question via the {site} template. */
    function siteLabel(region) { return "your " + (region.lat ? region.lat.toLowerCase() + " " : "") + region.plain; }
    function fillSite(text, region) { return text.replace(/\{site\}/g, siteLabel(region)); }
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
    function assessmentLabel() {
        if (state && state.scenario === "final") return "Final Assessment";
        return (state && state.isFollowUp) ? "Follow Up Assessment" : "Assessment";
    }
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
            var pr = r.problems || {};
            return { id: r.id, label: def.label, plain: def.plain, lat: r.lat || null, instrument: "A", repeat: !!r.repeat, medication: (r.medication === undefined ? null : r.medication),
                problems: { work: pr.work || null, pain: pr.pain || null, physical: pr.physical || null, mental: pr.mental || null },
                activities: acts };
        });

        var si = src.intake || {};
        var sg = src.general || {};
        var sb = src.brainProblems || {};
        state = {
            patientId: pid, name: src.name,
            scenario: src.scenario || null,   // null = normal; "final" = discharge-to-PRN visit (C9)
            isFollowUp: regions.some(function (r) { return r.repeat; }) || !!src.mrpqPrior,
            // Legacy Section 2 (Work) + Additional Questions (attorney, workers' comp)
            intake: {
                workAbility: (si.workAbility === undefined ? null : si.workAbility),
                workBeganDate: si.workBeganDate || null,
                workReturnGoal: (si.workReturnGoal === undefined ? null : si.workReturnGoal),
                prevWorkStatus: si.prevWorkStatus || null,
                currentWorkStatus: si.currentWorkStatus || null,
                attorney: (si.attorney === undefined ? null : si.attorney),
                workersComp: (si.workersComp === undefined ? null : si.workersComp)
            },
            // Legacy Section 3 (General / global health)
            general: { func: sg.func || null, qol: sg.qol || null, painMed: sg.painMed || null, limited: sg.limited || null, heightIn: (sg.heightIn == null ? null : sg.heightIn), weightLb: (sg.weightLb == null ? null : sg.weightLb) },
            // Satisfaction (C6): priorToAdx asked once ever (first visit);
            // adxTreatment is the repeat-flow measure.
            satisfaction: {
                priorToAdx: (src.satisfaction && src.satisfaction.priorToAdx) || null,
                adxTreatment: (src.satisfaction && src.satisfaction.adxTreatment) || null
            },
            selection: selected,
            regions: regions,
            brainPresent: !!src.brain,
            // C7: current responses + prior answers (repeat markers). Brain
            // problem block uses the concussion-reworded question set.
            mrpq: {
                responses: (src.brain && src.mrpq) ? src.mrpq.slice() : MRPQ_ITEMS.map(function () { return null; }),
                prior: (src.brain && src.mrpqPrior) ? src.mrpqPrior.slice() : null
            },
            brainProblems: { symptoms: (sb.symptoms || null), mental: (sb.mental || null) },
            addedRegions: [],
            experience: null, finalComments: "",   // final-visit capture (C9)
            feedback: "", submitted: false
        };
        stepIndex = 0;
        updateChrome();
        render();
    }

    /* =================================================================
       SCREEN LIST + NAVIGATION  (no auto-advance; no review screen)
    ================================================================= */
    // Flow (mirrors the legacy 5-section survey, regrouped for a better experience):
    //   intro → your pain areas → work → this past month → one screen per treated
    //   area (problem block + activities) → concussion (if assigned) → a few last
    //   questions (attorney / workers' comp / satisfaction) → thank-you.
    // C9 final visit strips to the endpoint measurement: intro (congratulatory) →
    //   activity sliders per area → overall experience + comments → thank-you.
    function screenList() {
        if (state.scenario === "final") {
            var fl = [{ k: "intro" }];
            state.regions.forEach(function (r) { if (r.instrument === "A") fl.push({ k: "msk", id: r.id }); });
            fl.push({ k: "experience" });
            fl.push({ k: "thankyou" });
            return fl;
        }
        var list = [{ k: "intro" }, { k: "regions" }, { k: "work" }, { k: "general" }];
        state.regions.forEach(function (r) { if (r.instrument === "A") list.push({ k: "msk", id: r.id }); });
        if (state.brainPresent) list.push({ k: "brain" });
        list.push({ k: "wrapup" });
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
        if (cur.k === "thankyou") { initPatient(state.patientId); return; } // "Start over"
        // Confirmation gate before the final submit (legacy Confirmation modal;
        // a light "ready?" check, not the removed full review screen — B4).
        if (list[stepIndex + 1] && list[stepIndex + 1].k === "thankyou") { confirmSubmit(); return; }
        stepIndex++;
        render();
    }
    function commitSubmit() { state.submitted = true; stepIndex++; render(); }
    function onBack() { if (stepIndex > 0) { stepIndex--; render(); } }

    /* Confirmation modal shown when the patient presses Submit on the last
       content screen (legacy image 9). Go back to keep editing, or submit. */
    function confirmSubmit() {
        var prev = document.getElementById("pifModal"); if (prev) prev.parentNode.removeChild(prev);
        var overlay = el("div", "pif-modal"); overlay.id = "pifModal";
        var cardc = el("div", "pif-modal-card"); cardc.setAttribute("role", "dialog"); cardc.setAttribute("aria-modal", "true"); cardc.setAttribute("aria-labelledby", "pifModalTitle");
        cardc.appendChild(el("div", "pif-modal-icon", "✓"));
        var h = el("h2", "pif-modal-title", staffMode ? "Ready to save?" : "Ready to submit?"); h.id = "pifModalTitle";
        cardc.appendChild(h);
        cardc.appendChild(el("p", "pif-modal-body", staffMode
            ? "That's the whole assessment. Save it to the patient's record, or go back to change any answer."
            : "That's everything. You can submit now, or go back to change any of your answers first."));
        var row = el("div", "pif-modal-actions");
        var back = el("button", "pif-btn ghost", "Go back"); back.type = "button";
        var go = el("button", "pif-btn primary", staffMode ? "Save assessment" : "Submit"); go.type = "button";
        function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
        back.addEventListener("click", close);
        go.addEventListener("click", function () { close(); commitSubmit(); });
        overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
        document.addEventListener("keydown", function esckey(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esckey); } });
        row.appendChild(back); row.appendChild(go);
        cardc.appendChild(row); overlay.appendChild(cardc);
        document.body.appendChild(overlay);
        go.focus();
    }
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
        // Production anchors (C4): faces + the Able / Unable words. Left end =
        // unable (0), right end = able (10) — the PIFS scale is reversed vs a
        // pain score (10 is great); the inversion math happens behind the scenes.
        var ends = el("div", "pif-ends");
        var sadEnd = el("span", "pif-end");
        var sad = el("span", "pif-face pif-face-sad"); sad.innerHTML = faceSVG("sad");
        sadEnd.appendChild(sad); sadEnd.appendChild(el("span", "pif-end-lab", "Unable"));
        var happyEnd = el("span", "pif-end");
        var happy = el("span", "pif-face pif-face-happy"); happy.innerHTML = faceSVG("happy");
        happyEnd.appendChild(happy); happyEnd.appendChild(el("span", "pif-end-lab", "Able"));
        ends.appendChild(sadEnd); ends.appendChild(happyEnd);
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
                valOut.textContent = (prior != null) ? "Slide to answer — the white marker shows where you were last time" : "Slide to answer";
            } else {
                slider.classList.remove("unanswered");
                var pct = value / 10 * 100;
                thumb.style.left = "calc(" + pct + "% - 14px)";
                fill.style.width = pct + "%";
                slider.setAttribute("aria-valuenow", String(value));         // for assistive tech only
                slider.setAttribute("aria-valuetext", band(value));          // no numeral shown visually (B2)
                valOut.textContent = (prior != null) ? "The white marker shows where you were last time" : "";
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
    function numberQuestion(labelText, val, onChange, opts) {
        opts = opts || {};
        var q = el("div", "intake-q");
        var id = "numq" + (++_qseq);
        var lab = el("label", "intake-label", labelText); lab.setAttribute("for", id);
        q.appendChild(lab);
        var wrap = el("div", "num-wrap");
        var inp = el("input", "intake-input num-input"); inp.type = "number"; inp.id = id;
        inp.inputMode = "numeric";
        if (opts.min != null) inp.min = opts.min;
        if (opts.max != null) inp.max = opts.max;
        inp.placeholder = opts.placeholder || "";
        if (val != null) inp.value = val;
        inp.addEventListener("input", function () { onChange(inp.value === "" ? null : Number(inp.value)); });
        wrap.appendChild(inp);
        if (opts.suffix) wrap.appendChild(el("span", "num-suffix", opts.suffix));
        q.appendChild(wrap);
        return q;
    }
    function dateQuestion(labelText, helpText, val, onChange) {
        var q = el("div", "intake-q");
        var id = "dateq" + (++_qseq);
        var lab = el("label", "intake-label", labelText); lab.setAttribute("for", id);
        q.appendChild(lab);
        if (helpText) q.appendChild(el("div", "muted intake-help", helpText));
        var inp = el("input", "intake-input date-input"); inp.type = "date"; inp.id = id;
        if (val) inp.value = val;
        inp.addEventListener("input", function () { onChange(inp.value || null); });
        q.appendChild(inp);
        return q;
    }
    function groupHead(text) { return el("div", "qgroup-head", text); }

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
        else if (cur.k === "regions")  renderRegions(app);
        else if (cur.k === "work")     renderWork(app);
        else if (cur.k === "general")  renderGeneral(app);
        else if (cur.k === "msk")      renderMSK(app, cur.id);
        else if (cur.k === "brain")    renderBrain(app);
        else if (cur.k === "wrapup")   renderWrapup(app);
        else if (cur.k === "experience") renderExperience(app);
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
        } else if (state.scenario === "final") {
            // C9: congratulatory closing framing — the endpoint measurement.
            c.appendChild(el("h1", null, "Congratulations!"));
            c.appendChild(el("p", "intro-lead", "You've reached the maximum benefit from your treatment, and your care team is graduating you from regular visits. That's worth celebrating."));
            c.appendChild(el("p", null, "Before you go, one last quick check-in: show us how you're doing on your activities, and tell us how we did. If symptoms ever return, ADX is here — just reach out."));
        } else if (state.isFollowUp) {
            c.appendChild(el("h1", null, "Welcome back — a quick check-in"));
            c.appendChild(el("p", "intro-lead", "Thanks for taking a few minutes. Your answers help your care team see how you're doing and tailor your care to what matters most to you."));
            c.appendChild(el("p", null, "There's nothing to log in to — you came here from the secure link in your email. You can go back and change anything before you finish."));
        } else {
            c.appendChild(el("h1", null, "Welcome — let's get started"));
            c.appendChild(el("p", "intro-lead", "Thanks for taking a few minutes. Your answers help your care team understand how you're doing and tailor your care to what matters most to you."));
            c.appendChild(el("p", null, "There's nothing to log in to — you came here from the secure link in your email. You can go back and change anything before you finish."));
        }
        // PRODUCTION: patient entry validates a signed, single-use emailed token;
        // staff entry is launched from within DR (no login / 2FA in this prototype).
        app.appendChild(c);
    }

    /* ---- Work questions (legacy Section 2). Conditional: the work block only
           shows if a treated condition affects work. ---- */
    function renderWork(app) {
        var c = el("div", "card");
        var iv = state.intake;
        c.appendChild(el("h2", null, "Work"));
        if (state.isFollowUp) {
            c.appendChild(el("p", "muted", "Here's what we have on file about work. If anything has changed since your last visit, update it below. If nothing has changed, just continue."));
        } else {
            c.appendChild(el("p", "muted", "A few questions about how your health affects your work. There are no right or wrong answers."));
        }
        c.appendChild(yesNoQuestion("Is a health problem we're treating making it hard to work, or keeping you from working?", iv.workAbility, function (v) { iv.workAbility = v; rebuild(); }));

        var sub = el("div", "work-sub"); c.appendChild(sub);
        function rebuild() {
            sub.innerHTML = "";
            if (iv.workAbility === true) {
                sub.appendChild(dateQuestion("When did that start?", "Your best guess is fine if you're not sure of the exact date.", iv.workBeganDate, function (v) { iv.workBeganDate = v; }));
                sub.appendChild(yesNoQuestion("Is getting back to work — or making work easier — one of your goals for treatment?", iv.workReturnGoal, function (v) { iv.workReturnGoal = v; }));
                sub.appendChild(selectQuestion("What was your work status before this started?", WORK_STATUS_OPTIONS, iv.prevWorkStatus, function (v) { iv.prevWorkStatus = v; }));
                sub.appendChild(selectQuestion("What is your work status now?", WORK_STATUS_OPTIONS, iv.currentWorkStatus, function (v) { iv.currentWorkStatus = v; }));
            } else if (iv.workAbility === false) {
                sub.appendChild(selectQuestion("What is your work status now?", WORK_STATUS_OPTIONS, iv.currentWorkStatus, function (v) { iv.currentWorkStatus = v; }));
            }
        }
        rebuild();
        app.appendChild(c);
    }

    /* ---- General / global-health questions (legacy Section 3).
           C1: first-time asks about the pre-ADX baseline directly (patients are
           sometimes seen days after an accident — "the past month" straddles
           the injury); repeat keeps the past-month recall window.
           C5: height/weight are asked ONCE, on the first visit. On repeats they
           are pre-filled and minimized behind an Update control — the patient
           is never prompted to re-enter them. ---- */
    function renderGeneral(app) {
        var c = el("div", "card");
        var g = state.general;
        var initial = !state.isFollowUp;
        if (initial) {
            c.appendChild(el("h2", null, "Before you came to ADX"));
            c.appendChild(el("p", "muted", "Think about how things were before you started care with ADX — a quick picture of your overall health, not any one body part."));
        } else {
            c.appendChild(el("h2", null, "How you've been this past month"));
            c.appendChild(el("p", "muted", "A quick picture of your overall health, not any one body part."));
        }

        c.appendChild(groupHead(initial ? GENERAL_QUESTIONS.changeIntroInitial : GENERAL_QUESTIONS.changeIntroRepeat));
        GENERAL_QUESTIONS.change.forEach(function (q) {
            c.appendChild(selectQuestion(q.text, CHANGE_SCALE, g[q.id], function (v) { g[q.id] = v; }));
        });
        c.appendChild(groupHead(initial ? GENERAL_QUESTIONS.freqIntroInitial : GENERAL_QUESTIONS.freqIntroRepeat));
        GENERAL_QUESTIONS.freq.forEach(function (q) {
            c.appendChild(selectQuestion(q.text, FREQUENCY_SCALE, g[q.id], function (v) { g[q.id] = v; }));
        });

        c.appendChild(groupHead("About you"));
        if (initial || g.heightIn == null || g.weightLb == null) {
            c.appendChild(numberQuestion("Your current height", g.heightIn, function (v) { g.heightIn = v; }, { min: 0, max: 96, suffix: "inches", placeholder: "e.g. 68" }));
            c.appendChild(numberQuestion("Your current weight", g.weightLb, function (v) { g.weightLb = v; }, { min: 0, max: 1000, suffix: "lbs", placeholder: "e.g. 170" }));
        } else {
            // Repeat: shown, not asked. One compact line; Update expands the inputs.
            var row = el("div", "about-row");
            var vals = el("span", "about-vals", "Height " + g.heightIn + " in · Weight " + g.weightLb + " lbs");
            var chg = el("button", "btn-inline", "Update"); chg.type = "button";
            chg.setAttribute("aria-label", "Update height or weight");
            row.appendChild(vals); row.appendChild(chg);
            c.appendChild(row);
            chg.addEventListener("click", function () {
                row.parentNode.removeChild(row);
                var hq = numberQuestion("Your current height", g.heightIn, function (v) { g.heightIn = v; }, { min: 0, max: 96, suffix: "inches" });
                var wq = numberQuestion("Your current weight", g.weightLb, function (v) { g.weightLb = v; }, { min: 0, max: 1000, suffix: "lbs" });
                c.appendChild(hq); c.appendChild(wq);
            });
        }
        app.appendChild(c);
    }

    /* ---- A few last questions (C6). First-time: attorney, workers' comp, and
           the pre-ADX satisfaction Likert (asked once, EVER). Repeat: attorney
           and workers' comp stay — pre-filled with one-click correction, since
           status changes mid-course (e.g. a recurrence at work converts the
           case to workers' comp) — plus the ADX-treatment satisfaction Likert. ---- */
    function renderWrapup(app) {
        var c = el("div", "card");
        var iv = state.intake;
        c.appendChild(el("h2", null, "A few last questions"));
        c.appendChild(el("p", "muted", state.isFollowUp
            ? "We've filled in what we have on file — change anything that's different."
            : "Almost done — these help your care team support you."));
        c.appendChild(yesNoQuestion("Do you have an attorney for this health matter?", iv.attorney, function (v) { iv.attorney = v; }));
        c.appendChild(yesNoQuestion("Are you on workers' compensation right now?", iv.workersComp, function (v) { iv.workersComp = v; }));
        if (state.isFollowUp) {
            c.appendChild(selectQuestion("How satisfied are you with your ADX treatment?", SATISFACTION_SCALE, state.satisfaction.adxTreatment, function (v) { state.satisfaction.adxTreatment = v; }));
        } else {
            // Asked once, ever — never re-rendered after the first submission.
            c.appendChild(selectQuestion("Before you came to ADX, how satisfied were you with your treatment?", SATISFACTION_SCALE, state.satisfaction.priorToAdx, function (v) { state.satisfaction.priorToAdx = v; }));
        }
        app.appendChild(c);
    }

    /* ---- Final-visit experience capture (C9): "How did we do?" ---- */
    function renderExperience(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "How did we do?"));
        c.appendChild(el("p", "muted", "One last thing — tell us about your time with ADX."));
        c.appendChild(selectQuestion("What was your overall experience with ADX?", EXPERIENCE_SCALE, state.experience, function (v) { state.experience = v; }));
        var q = el("div", "intake-q");
        var lab = el("label", "intake-label", "Anything you'd like to share about your care? (optional)");
        lab.setAttribute("for", "pifFinalComments");
        q.appendChild(lab);
        var ta = el("textarea", "fb-textarea"); ta.id = "pifFinalComments"; ta.rows = 5;
        ta.placeholder = "Your comments go to the ADX care team…";
        ta.value = state.finalComments || "";
        ta.addEventListener("input", function () { state.finalComments = ta.value; });
        q.appendChild(ta);
        c.appendChild(q);
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
        var site = siteLabel(region);   // C8: "your left shoulder" — used in every question
        var isFinal = state.scenario === "final";
        var c = el("div", "card");
        c.appendChild(el("h2", null, "How is " + site + "?"));
        c.appendChild(el("div", "muted", region.label + (region.lat ? " — " + region.lat : "")));

        if (!isFinal) {
            // Per-area problem block (legacy Section 4 "Body Area Questions").
            // C8: each question carries the full lateralized site label.
            // C1-adjacent: first-time uses "since your injury" (no month window).
            var probs = el("div", "area-problems");
            probs.appendChild(el("div", "qgroup-head", state.isFollowUp
                ? "In the past month, how much of a problem did you have with…"
                : "Since your injury, how much of a problem have you had with…"));
            AREA_PROBLEM_QUESTIONS.forEach(function (q) {
                probs.appendChild(selectQuestion(fillSite(q.text, region), PROBLEM_SCALE, region.problems[q.id], function (v) { region.problems[q.id] = v; }));
            });
            c.appendChild(probs);

            c.appendChild(el("div", "area-divider"));
            c.appendChild(el("h3", "area-subhead", "Your everyday activities"));

            // Medication gate (C2): PRESCRIPTION-only yes/no. OTC never qualifies,
            // and the drug name is never asked — ADX-prescribed meds are already
            // in DR; the only signal needed is whether a prescription med is in
            // play so function with/without can be compared.
            var medQ = el("div", "med-gate");
            medQ.appendChild(el("div", "med-gate-q", "Are you taking any prescription medication for " + site + "?"));
            medQ.appendChild(el("div", "muted", "Prescription medications are those requiring a healthcare professional's order — not over-the-counter medicines like Tylenol, Motrin, or Advil."));
            var group = el("div", "seg-group"); group.setAttribute("role", "radiogroup"); group.setAttribute("aria-label", "Taking prescription medication for " + site);
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
        }

        // C4a: production PIFS description — the copy that stops patients reading
        // the slider as a pain score (the scale is reversed: able/10 is great).
        if (isFinal) {
            c.appendChild(el("p", "pifs-desc", "Use the sliding bars to show your ability to perform each activity today. The white marker shows where you were last time."));
        } else if (region.repeat) {
            c.appendChild(el("p", "pifs-desc", "Use the sliding bars to indicate your ability to perform these activities — with your prescription medication (if any), and without medication. The white marker on each slider shows where you were last time."));
        } else {
            c.appendChild(el("p", "pifs-desc", "In the boxes below, please enter up to five important activities that have been impacted due to your injury or pain condition. Use the sliding bars to indicate your ability to perform these activities since your injury — with prescription medication (if any), and without medication."));
            var ex = EXAMPLE_ACTIVITIES[regionId] || [];
            if (ex.length) {
                // C11: short, region-appropriate example set (PLACEHOLDER lists —
                // OPEN P1), always paired with the free-text box below.
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
                // C4a: production lead-in phrasing on every activity.
                box.appendChild(el("div", "act-lead", "So, are you more or less able to…"));
                var head = el("div", "act-head");
                if (region.repeat) {
                    head.appendChild(el("div", "locked-name", a.name)); // no prior number shown (B1)
                } else {
                    var inp = el("input"); inp.type = "text"; inp.value = a.name;
                    inp.placeholder = "e.g. " + ((EXAMPLE_ACTIVITIES[regionId] || ["an activity you struggle with"])[0]);
                    inp.setAttribute("aria-label", "Activity " + (idx + 1) + " for " + region.plain);
                    inp.addEventListener("input", function () { a.name = inp.value; });
                    head.appendChild(inp);
                    // C3: add + remove only — no reordering (order carries no meaning).
                    var rm = el("button", "btn-remove", "Remove"); rm.type = "button";
                    rm.addEventListener("click", function () { region.activities.splice(idx, 1); if (region.activities.length === 0) region.activities.push(blankActivity()); buildActs(); });
                    head.appendChild(rm);
                }
                box.appendChild(head);

                if (isFinal) {
                    // C9: endpoint measurement — single slider per activity,
                    // prior marker kept (critical), no medication pairing.
                    var fBlk = el("div", "med-block");
                    fBlk.appendChild(makeSlider({ value: a.cur.wo, prior: (a.prior ? a.prior.wo : null), ariaLabel: (a.name || ("activity " + (idx + 1))), onChange: function (v) { a.cur.wo = v; } }));
                    box.appendChild(fBlk);
                    actsWrap.appendChild(box);
                    return;
                }

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

    /* ---- Brain / concussion check (Instrument B, mRPQ-20 on a 1–4 scale).
           C7: works first-time (no markers) and repeat (prior answers shown as
           "last time" markers — same convention as the sliders). Header is
           "Brain" with "Concussion symptom check" beneath. The precursor-style
           questions are the concussion-reworded set (no headache — near-
           universal here, so uninformative). Scale stays 1–4 (mRPQ-20). ---- */
    function renderBrain(app) {
        var c = el("div", "card");
        var isRepeat = !!state.mrpq.prior;
        c.appendChild(el("h2", null, "Brain"));
        c.appendChild(el("div", "brain-sub", "Concussion symptom check"));

        // Concussion-reworded problem questions (C7d).
        var probs = el("div", "area-problems");
        probs.appendChild(el("div", "qgroup-head", state.isFollowUp
            ? "In the past month, how much of a problem did you have with…"
            : "Since your injury, how much of a problem have you had with…"));
        BRAIN_PROBLEM_QUESTIONS.forEach(function (q) {
            probs.appendChild(selectQuestion(q.text, PROBLEM_SCALE, state.brainProblems[q.id], function (v) { state.brainProblems[q.id] = v; }));
        });
        c.appendChild(probs);

        c.appendChild(el("div", "area-divider"));
        c.appendChild(el("h3", "area-subhead", "Your symptoms"));
        c.appendChild(el("p", null, "Compared with before your injury, please rate each symptom over the last 24 hours."));
        c.appendChild(el("p", "muted", MRPQ_LABELS.map(function (l, i) { return (i + 1) + " = " + l; }).join("   ·   ")));
        if (isRepeat) c.appendChild(el("p", "muted", "The white dot shows your answer from last time."));

        MRPQ_ITEMS.forEach(function (it, i) {
            var box = el("div", "mrpq-item");
            box.appendChild(el("div", "mrpq-q", it.n + ". " + it.text));
            var opts = el("div", "mrpq-opts"); opts.setAttribute("role", "radiogroup"); opts.setAttribute("aria-label", it.text);
            var priorVal = isRepeat ? state.mrpq.prior[i] : null;
            MRPQ_SCALE.forEach(function (val, ki) {
                var o = el("div", "mrpq-opt" + (state.mrpq.responses[i] === val ? " on" : ""));
                o.setAttribute("role", "radio"); o.setAttribute("tabindex", "0");
                o.setAttribute("aria-checked", state.mrpq.responses[i] === val ? "true" : "false");
                o.setAttribute("aria-label", MRPQ_LABELS[ki] + (priorVal === val ? " — your answer last time" : ""));
                o.appendChild(el("div", "num", String(val)));
                o.appendChild(el("div", null, MRPQ_LABELS[ki]));
                if (priorVal === val) {
                    // C7b: previous-answer marker, mirroring the slider's white dot.
                    var dot = el("span", "mrpq-was"); dot.setAttribute("aria-hidden", "true");
                    dot.title = "Your answer last time";
                    o.appendChild(dot);
                    o.classList.add("was");
                }
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
        } else if (state.scenario === "final") {
            c.appendChild(el("h1", null, "Thank you — and congratulations!"));
            c.appendChild(el("p", "intro-lead", "Your final results were sent to your care team. We're proud of the progress you've made."));
            c.appendChild(el("p", null, "You're welcome back any time — if your symptoms return, contact ADX and we'll get you in."));
        } else {
            c.appendChild(el("h1", null, "Thank you!"));
            c.appendChild(el("p", "intro-lead", "Your answers were sent to your care team. There's nothing else you need to do — you can close this page whenever you're ready."));
        }

        if (state.addedRegions && state.addedRegions.length) {
            // C10: a patient-added area generates a care-team alert in addition
            // to the production behaviors (Salesforce event; the added region
            // shows in DR pain regions in a distinct color).
            var box = el("div", "added-summary");
            box.appendChild(el("strong", null, "You also told us about new pain in:"));
            var ul = el("ul", null);
            state.addedRegions.forEach(function (a) { ul.appendChild(el("li", null, a.label + (a.lat ? " — " + a.lat : ""))); });
            box.appendChild(ul);
            box.appendChild(el("div", "alert-note", "✓ An alert was sent to your care team about these new areas."));
            box.appendChild(el("div", "muted", "They'll review them and follow up with you."));
            c.appendChild(box);
            announce("An alert about your new pain areas was sent to your care team.");
        }

        if (state.scenario === "final") { app.appendChild(c); return; } // comments already captured on the experience screen (C9)

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
        if (!PIF_SAMPLE_PATIENTS[pid]) pid = "1";
        sel.value = pid;
        initPatient(pid);
    }

    return { boot: boot, toggleTheme: toggleTheme };
})();

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", PIFApp.boot);
else PIFApp.boot();
