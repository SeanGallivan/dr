/* =====================================================================
   PIF Survey — Application / Rendering engine
   ---------------------------------------------------------------------
   Patient-facing flow: intro → region selection → one screen per MSK
   region (Instrument A) → Brain path (Instrument B, if selected) →
   review & edit → score readout (for the care team).
   No auto-advance anywhere; the patient always advances; back is allowed.
   Reads data + scoring from pif-data.js. State is in memory only.
   ===================================================================== */

var PIFApp = (function () {
    "use strict";

    var state = null;   // current working state
    var stepIndex = 0;  // index into screenList()

    /* ---- small DOM + math helpers ---- */
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function avg(nums) { var v = nums.filter(function (n) { return n != null; }); if (!v.length) return null; return v.reduce(function (a, b) { return a + b; }, 0) / v.length; }
    function fmt1(n) { return (n == null) ? "—" : (Math.round(n * 10) / 10).toFixed(1); }
    function fmtSigned(n) { if (n == null) return "—"; var r = Math.round(n * 10) / 10; return (r > 0 ? "+" : "") + r.toFixed(1); }
    function blankActivity() { return { name: "", locked: false, prior: null, cur: { wo: null, wm: null } }; }

    /* =================================================================
       THEME (patient-facing: light by default; toggle to dark; persisted)
    ================================================================= */
    function theme() { try { return localStorage.getItem("pif_theme") || "light"; } catch (e) { return "light"; } }
    function applyTheme(t) {
        document.documentElement.setAttribute("data-theme", t);
        try { localStorage.setItem("pif_theme", t); } catch (e) {}
        var btn = document.getElementById("pifThemeToggle");
        if (btn) {
            btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
            var knob = btn.querySelector(".knob");
            if (knob) knob.textContent = t === "dark" ? "☾" : "☀";
        }
    }
    function toggleTheme() { applyTheme(theme() === "dark" ? "light" : "dark"); }

    /* =================================================================
       STATE
    ================================================================= */
    function initPatient(pid) {
        pid = String(pid);
        var src = PIF_SAMPLE_PATIENTS[pid] || PIF_SAMPLE_PATIENTS["1"];

        // Selection map for all regions (checked = note-seeded or brain flag).
        var selected = {};
        src.regions.forEach(function (r) { selected[r.id] = { checked: true, lat: r.lat || null, fromNote: true }; });
        if (src.brain) selected["brain"] = { checked: true, lat: null, fromNote: true };

        // MSK region working objects (Instrument A).
        var regions = src.regions.map(function (r) {
            var def = REGION_BY_ID[r.id];
            var acts = (r.activities || []).map(function (a) {
                return {
                    name: a.name,
                    locked: !!r.repeat,               // repeat visit => activity names locked
                    prior: a.prior ? { wo: a.prior.wo, wm: a.prior.wm } : null,
                    cur: { wo: (a.cur ? a.cur.wo : null), wm: (a.cur ? a.cur.wm : null) }
                };
            });
            return { id: r.id, label: def.label, plain: def.plain, lat: r.lat || null, instrument: "A", repeat: !!r.repeat, activities: acts };
        });

        state = {
            patientId: pid,
            name: src.name,
            selection: selected,
            regions: regions,
            brainPresent: !!src.brain,
            mrpq: { responses: (src.brain && src.mrpq) ? src.mrpq.slice() : MRPQ_ITEMS.map(function () { return null; }) },
            submitted: false,
            feedback: ""
        };
        stepIndex = 0;
        render();
    }

    /* NOTE: the per-diagnosis clinician scoring (baseline/follow-up/change,
       3-point MDC, v2 endpoint-weighted New Score) lives in the dashboard's
       case-detail view. The patient survey no longer renders a results screen;
       the scoring functions stay available in pif-data.js. */

    /* =================================================================
       SCREEN LIST + NAVIGATION  (no auto-advance)
    ================================================================= */
    function screenList() {
        var list = [{ k: "intro" }, { k: "regions" }];
        state.regions.forEach(function (r) { if (r.instrument === "A") list.push({ k: "msk", id: r.id }); });
        if (state.brainPresent) list.push({ k: "brain" });
        list.push({ k: "review" });
        list.push({ k: "thankyou" });
        return list;
    }
    function contentList() { return screenList().filter(function (s) { return s.k !== "intro" && s.k !== "thankyou"; }); }

    // Rebuild MSK working objects + brain flag from region-selection checkboxes,
    // preserving any activities already captured for a region.
    function syncRegionsFromSelection() {
        var existing = {}; state.regions.forEach(function (r) { existing[r.id] = r; });
        var next = [];
        REGIONS.forEach(function (def) {
            var sel = state.selection[def.id];
            if (!sel || !sel.checked) return;
            if (def.id === "brain") return; // Brain routes to Instrument B via brainPresent
            var r = existing[def.id];
            if (!r) r = { id: def.id, label: def.label, plain: def.plain, lat: sel.lat || null, instrument: "A", repeat: false, activities: [] };
            r.lat = sel.lat || null;
            next.push(r);
        });
        state.regions = next;
        state.brainPresent = !!(state.selection["brain"] && state.selection["brain"].checked);
    }

    function onNext() {
        var list = screenList();
        var cur = list[stepIndex];
        if (cur.k === "regions") {
            syncRegionsFromSelection();
            if (state.regions.length === 0 && !state.brainPresent) {
                announce("Please select at least one area to continue.");
                return;
            }
        }
        if (cur.k === "review") { state.submitted = true; }
        if (cur.k === "thankyou") { initPatient(state.patientId); return; } // "Start over"
        stepIndex++;
        render();
    }
    function onBack() { if (stepIndex > 0) { stepIndex--; render(); } }

    function goToScreen(pred) {
        var list = screenList();
        for (var i = 0; i < list.length; i++) { if (pred(list[i])) { stepIndex = i; render(); return; } }
    }

    function updateNav(cur) {
        var back = document.getElementById("btnBack");
        var next = document.getElementById("btnNext");
        back.style.visibility = (stepIndex === 0) ? "hidden" : "visible";
        if (cur.k === "intro")         next.textContent = "Begin";
        else if (cur.k === "review")   next.textContent = "Submit";
        else if (cur.k === "thankyou") next.textContent = "Start over";
        else                           next.textContent = "Next";
    }

    function announce(msg) {
        var live = document.getElementById("pifLive");
        if (live) { live.textContent = ""; setTimeout(function () { live.textContent = msg; }, 30); }
    }

    /* =================================================================
       ACCESSIBLE SLIDER (Instrument A): vertical stack, endpoints
       Unable/Able, handle starts OFF the track in a grayed "not answered"
       state (no default). Keyboard operable; pointer/touch draggable.
    ================================================================= */
    function makeSlider(cfg) {
        var value = (cfg.value == null ? null : cfg.value);
        var wrap = el("div", "pif-slider-wrap");
        var ends = el("div", "pif-ends");
        ends.appendChild(el("span", null, "Unable (0)"));
        ends.appendChild(el("span", null, "Able (10)"));
        var slider = el("div", "pif-slider");
        slider.setAttribute("role", "slider");
        slider.setAttribute("tabindex", "0");
        slider.setAttribute("aria-valuemin", "0");
        slider.setAttribute("aria-valuemax", "10");
        slider.setAttribute("aria-label", cfg.ariaLabel || "Ability rating from 0 unable to 10 able");
        var track = el("div", "pif-track");
        var fill = el("div", "pif-fill");
        var thumb = el("div", "pif-thumb");
        track.appendChild(fill); track.appendChild(thumb);
        slider.appendChild(track);
        var scale = el("div", "pif-scale");
        for (var i = 0; i <= 10; i++) scale.appendChild(el("span", null, String(i)));
        var valOut = el("div", "pif-val");

        function paint() {
            if (value == null) {
                slider.classList.add("unanswered");
                thumb.style.left = "-22px"; fill.style.width = "0%";
                slider.removeAttribute("aria-valuenow");
                slider.setAttribute("aria-valuetext", "Not answered");
                valOut.textContent = "Not answered — drag or use arrow keys";
            } else {
                slider.classList.remove("unanswered");
                var pct = value / 10 * 100;
                thumb.style.left = "calc(" + pct + "% - 13px)";
                fill.style.width = pct + "%";
                slider.setAttribute("aria-valuenow", String(value));
                slider.setAttribute("aria-valuetext", value + " of 10");
                valOut.textContent = value + " / 10";
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
        paint();
        wrap.appendChild(ends); wrap.appendChild(slider); wrap.appendChild(scale); wrap.appendChild(valOut);
        return wrap;
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

        // Progress "Section X of Y" for content screens (not intro / thank-you).
        if (cur.k !== "intro" && cur.k !== "thankyou") {
            var content = contentList();
            var pos = 0;
            for (var i = 0; i < content.length; i++) {
                if (content[i].k === cur.k && (content[i].id || null) === (cur.id || null)) { pos = i + 1; break; }
            }
            var p = el("div", "progress", "Section " + pos + " of " + content.length);
            p.setAttribute("aria-label", "Section " + pos + " of " + content.length);
            app.appendChild(p);
        }

        if (cur.k === "intro")        renderIntro(app);
        else if (cur.k === "regions") renderRegions(app);
        else if (cur.k === "msk")     renderMSK(app, cur.id);
        else if (cur.k === "brain")   renderBrain(app);
        else if (cur.k === "review")   renderReview(app);
        else if (cur.k === "thankyou") renderThankYou(app);

        updateNav(cur);
        window.scrollTo(0, 0);
        var main = document.getElementById("pifMain"); if (main) main.scrollTo(0, 0);
    }

    /* ---- Screen 1: Entry / intro (simulated emailed-link arrival) ---- */
    function renderIntro(app) {
        var c = el("div", "card");
        c.appendChild(el("h1", null, "Welcome to your Follow Up Assessment"));
        c.appendChild(el("p", "intro-lead", "Thanks for taking a few minutes to check in. Your answers help your care team understand how you are doing and tailor your care to what matters most to you."));
        c.appendChild(el("p", null, "There is nothing to log in to — you arrived here from the secure link in your email. Please answer honestly; there are no right or wrong answers. You can go back and change anything before you submit."));
        var who = el("p", "muted");
        who.innerHTML = "You are viewing sample <strong>" + esc(state.name) + "</strong>. Use the <em>Sample patient</em> menu at the top to switch demos.";
        c.appendChild(who);
        // PRODUCTION: real entry validates a signed, single-use emailed token; no
        // login / 2FA in this prototype (Step 3 entry, Step 9 out of scope).
        app.appendChild(c);
    }

    /* ---- Screen 2: Area selection ----
       Shows only the areas the care team noted (checked) up top; the rest live
       in a collapsed "New pain areas?" section so the patient can add more
       without being shown the full list. */
    function renderRegions(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "Select the areas where you are experiencing pain"));
        c.appendChild(el("p", "muted", "These are the areas your care team noted. You can remove any that don't apply, and choose a side where it applies. Having pain somewhere else? Open “New pain areas?” at the bottom to add it."));
        var listWrap = el("div"); listWrap.id = "regionList";
        c.appendChild(listWrap);
        app.appendChild(c);

        var expandNew = false;

        function buildRow(def, container) {
            var sel = state.selection[def.id] || (state.selection[def.id] = { checked: false, lat: null, fromNote: false });
            var row = el("div", "region-row" + (sel.checked ? " checked" : ""));
            var lab = el("label", "region-check");
            var cb = el("input"); cb.type = "checkbox"; cb.checked = !!sel.checked;
            cb.setAttribute("aria-label", def.label);
            cb.addEventListener("change", function () { sel.checked = cb.checked; if (cb.checked) expandNew = true; refresh(); });
            var nameWrap = el("div");
            var nm = el("div", "region-name", def.label);
            if (sel.fromNote) { nm.appendChild(el("span", "tag", "from your care team")); }
            nameWrap.appendChild(nm);
            if (def.id === "brain") { nameWrap.appendChild(el("div", "muted", "Selecting this shows the concussion symptom questionnaire.")); }
            lab.appendChild(cb); lab.appendChild(nameWrap);
            row.appendChild(lab);

            if (sel.checked && def.lat) {
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
                row.appendChild(lg);
            }
            (container || listWrap).appendChild(row);
        }

        function refresh() {
            listWrap.innerHTML = "";
            var checkedDefs = [], uncheckedDefs = [];
            REGIONS.forEach(function (def) {
                var sel = state.selection[def.id];
                if (sel && sel.checked) checkedDefs.push(def); else uncheckedDefs.push(def);
            });

            if (checkedDefs.length) {
                checkedDefs.forEach(function (def) { buildRow(def, listWrap); });
            } else {
                listWrap.appendChild(el("p", "muted", "No areas selected yet. Open “New pain areas?” below to choose where you're having pain."));
            }

            if (uncheckedDefs.length) {
                var det = el("details", "new-areas");
                det.open = expandNew;
                det.addEventListener("toggle", function () { expandNew = det.open; });
                det.appendChild(el("summary", "new-areas-summary", "New pain areas?"));
                det.appendChild(el("div", "new-areas-hint muted", "Only the areas your care team noted appear above. If you're having pain somewhere else, choose it here and it will move up to your list."));
                uncheckedDefs.forEach(function (def) { buildRow(def, det); });
                listWrap.appendChild(det);
            }
        }
        refresh();
    }

    /* ---- Screen 3: Per-MSK-region activity definition + rating (Instrument A) ---- */
    function renderMSK(app, regionId) {
        var region = state.regions.find(function (r) { return r.id === regionId; });
        if (!region) { app.appendChild(el("div", "card", "This region is no longer selected.")); return; }
        var c = el("div", "card");
        var latTxt = region.lat ? " (" + region.lat + ")" : "";
        c.appendChild(el("h2", null, "How is your " + region.plain + "?" + latTxt));   // personal screen title
        c.appendChild(el("div", "muted", region.label + (region.lat ? " — " + region.lat : "")));
        if (region.repeat) {
            c.appendChild(el("p", null, "These are the activities you told us about at your first visit. They are locked so we measure the same things over time. Please re-rate each one now — first without your medication, then with it. Your last score is shown for each."));
        } else {
            c.appendChild(el("p", null, "Name up to five everyday activities that are hard for you because of your " + region.plain + ", in your own words. Then rate each one — first without your medication, then with it."));
        }

        var medHelp = el("div", "med-help");
        medHelp.appendChild(el("strong", null, "About medication:"));
        medHelp.appendChild(document.createTextNode(" Answer the scale that fits you and you can leave the other blank. If you " +
            "don't take any medication for this, rate “without medication” and skip “with medication.” If you're only ever on " +
            "medication and can't judge how you'd do without it, rate “with medication” and skip “without medication.” If you use " +
            "medication some of the time, answer both."));
        c.appendChild(medHelp);

        if (!region.repeat) {
            var ex = EXAMPLE_ACTIVITIES[regionId] || [];
            if (ex.length) {
                var box = el("div", "examples");
                box.appendChild(el("div", "ex-title", "Examples to spark ideas — these are prompts only, not answers. Tap one to use it, or type your own:"));
                ex.forEach(function (txt) {
                    var chip = el("button", "chip"); chip.type = "button"; chip.textContent = txt;
                    chip.addEventListener("click", function () {
                        var target = region.activities.find(function (a) { return !a.name.trim(); });
                        if (!target && region.activities.length < MAX_ACTIVITIES) { target = blankActivity(); region.activities.push(target); }
                        if (target) { target.name = txt; buildActs(); }
                    });
                    box.appendChild(chip);
                });
                c.appendChild(box);
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
                    var nm = el("div", "locked-name", a.name);
                    nm.appendChild(el("span", "lockicon", " (locked from your first visit)"));
                    head.appendChild(nm);
                    var prior = a.prior ? a.prior.wo : null;
                    head.appendChild(el("span", "last-score", "Last score: " + (prior == null ? "—" : prior + "/10")));
                } else {
                    var inp = el("input"); inp.type = "text"; inp.value = a.name;
                    inp.placeholder = "e.g. " + ((EXAMPLE_ACTIVITIES[regionId] || ["an activity you struggle with"])[0]);
                    inp.setAttribute("aria-label", "Activity " + (idx + 1) + " for " + region.plain);
                    inp.addEventListener("input", function () { a.name = inp.value; });
                    head.appendChild(inp);
                    var rm = el("button", "btn-remove"); rm.type = "button"; rm.textContent = "Remove";
                    rm.addEventListener("click", function () {
                        region.activities.splice(idx, 1);
                        if (region.activities.length === 0) region.activities.push(blankActivity());
                        buildActs();
                    });
                    head.appendChild(rm);
                }
                box.appendChild(head);

                var woBlk = el("div", "med-block");
                woBlk.appendChild(el("div", "med-label", "Without medication"));
                woBlk.appendChild(makeSlider({ value: a.cur.wo, ariaLabel: "Without medication, " + (a.name || ("activity " + (idx + 1))) + ", 0 unable to 10 able", onChange: function (v) { a.cur.wo = v; } }));
                box.appendChild(woBlk);

                var wmBlk = el("div", "med-block");
                wmBlk.appendChild(el("div", "med-label", "With medication"));
                wmBlk.appendChild(makeSlider({ value: a.cur.wm, ariaLabel: "With medication, " + (a.name || ("activity " + (idx + 1))) + ", 0 unable to 10 able", onChange: function (v) { a.cur.wm = v; } }));
                box.appendChild(wmBlk);

                actsWrap.appendChild(box);
            });
            if (!region.repeat && region.activities.length < MAX_ACTIVITIES) {
                var add = el("button", "btn-add"); add.type = "button"; add.textContent = "+ Add another activity";
                add.addEventListener("click", function () { region.activities.push(blankActivity()); buildActs(); });
                actsWrap.appendChild(add);
            }
        }
        buildActs();
        app.appendChild(c);
    }

    /* ---- Screen 4: Brain path (Instrument B, mRPQ-20). No medication split. ---- */
    function renderBrain(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "Concussion symptom check"));
        c.appendChild(el("p", null, "Compared with before your injury, please rate each symptom over the last 24 hours. There is no medication question in this section."));
        c.appendChild(el("p", "muted", "0 = Not experienced  ·  1 = No more than before  ·  2 = Mild  ·  3 = Moderate  ·  4 = Severe"));
        MRPQ_ITEMS.forEach(function (it, i) {
            var box = el("div", "mrpq-item");
            box.appendChild(el("div", "mrpq-q", it.n + ". " + it.text));
            var opts = el("div", "mrpq-opts");
            opts.setAttribute("role", "radiogroup"); opts.setAttribute("aria-label", it.text);
            for (var k = 0; k <= 4; k++) {
                (function (k) {
                    var o = el("div", "mrpq-opt" + (state.mrpq.responses[i] === k ? " on" : ""));
                    o.setAttribute("role", "radio"); o.setAttribute("tabindex", "0");
                    o.setAttribute("aria-checked", state.mrpq.responses[i] === k ? "true" : "false");
                    o.setAttribute("aria-label", MRPQ_LABELS[k] + " (" + k + ")");
                    o.appendChild(el("div", "num", String(k)));
                    o.appendChild(el("div", null, MRPQ_LABELS[k]));
                    var choose = function () {
                        state.mrpq.responses[i] = k;
                        Array.prototype.forEach.call(opts.children, function (ch, idx) {
                            ch.classList.toggle("on", idx === k);
                            ch.setAttribute("aria-checked", idx === k ? "true" : "false");
                        });
                    };
                    o.addEventListener("click", choose);
                    o.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); choose(); } });
                    opts.appendChild(o);
                })(k);
            }
            box.appendChild(opts);
            c.appendChild(box);
        });
        app.appendChild(c);
    }

    /* ---- Screen 5: Review and edit before submit (no auto-advance) ----
       Uses the same card + metric-row layout as the old results readout so
       everything is easy to scan before submitting. */
    function reviewCard(app, title, pill, editPred) {
        var rc = el("div", "result-region");
        var h = el("div", "act-head");
        var left = el("div", "rr-title");
        left.appendChild(el("strong", null, title));
        if (pill) left.appendChild(el("span", "pill", pill));
        h.appendChild(left);
        var ed = el("button", "btn-edit", "Edit"); ed.type = "button";
        ed.addEventListener("click", function () { goToScreen(editPred); });
        h.appendChild(ed);
        rc.appendChild(h);
        app.appendChild(rc);
        return rc;
    }
    function renderReview(app) {
        var c = el("div", "card");
        c.appendChild(el("h2", null, "Review your answers"));
        c.appendChild(el("p", "muted", "Please check everything below. Tap Edit to change a section, then press Submit when you are ready."));
        app.appendChild(c);

        // Areas selected
        var chosen = [];
        REGIONS.forEach(function (def) { var s = state.selection[def.id]; if (s && s.checked) chosen.push(def.label + (s.lat ? " (" + s.lat + ")" : "")); });
        var rcAreas = reviewCard(app, "Areas selected", null, function (s) { return s.k === "regions"; });
        rcAreas.appendChild(el("div", "review-line", chosen.length ? chosen.join(", ") : "None"));

        // Each MSK area
        state.regions.forEach(function (region) {
            var rc = reviewCard(app, "How is your " + region.plain + "?" + (region.lat ? " (" + region.lat + ")" : ""),
                "Instrument A · PSFS", function (s) { return s.k === "msk" && s.id === region.id; });
            var named = region.activities.filter(function (a) { return a.name.trim(); });
            if (!named.length) {
                rc.appendChild(el("div", "review-line muted", "No activities entered yet."));
            } else {
                named.forEach(function (a) {
                    var val = "without " + (a.cur.wo == null ? "—" : a.cur.wo + "/10") + "   ·   with " + (a.cur.wm == null ? "—" : a.cur.wm + "/10") +
                        (region.repeat && a.prior ? "   ·   last " + a.prior.wo + "/10" : "");
                    metricRow(rc, a.name, val);
                });
            }
        });

        // Brain
        if (state.brainPresent) {
            var rcB = reviewCard(app, "Concussion symptom check", "Instrument B · mRPQ-20", function (s) { return s.k === "brain"; });
            var answered = state.mrpq.responses.filter(function (v) { return v != null; }).length;
            metricRow(rcB, "Symptoms rated", answered + " of " + MRPQ_ITEMS.length);
        }
    }

    /* ---- metric row (shared by the review cards) ---- */
    function metricRow(parent, lab, val, cls) {
        var m = el("div", "metric");
        m.appendChild(el("span", "lab", lab));
        m.appendChild(el("span", "num" + (cls ? " " + cls : ""), val));
        parent.appendChild(m);
    }

    /* ---- Screen 6: Thank you + free-text message to the care team ----
       PRODUCTION: the per-diagnosis score readout (baseline/follow-up/change,
       3-point MDC flag, v2 endpoint-weighted New Score, mRPQ-20 total + cutoff)
       is a CLINICIAN view — it renders in the dashboard case-detail, not to the
       patient. The patient's last screen is this thank-you + feedback box. The
       scoring functions remain in pif-data.js (pifV2Score, mrpqTotal, …). */
    function renderThankYou(app) {
        var c = el("div", "card pif-thanks");
        c.appendChild(el("h1", null, "Thank you!"));
        c.appendChild(el("p", "intro-lead", "Your answers have been sent to your care team. They'll use them to see how you're doing and tailor your care to what matters most to you."));
        c.appendChild(el("p", "muted", "There's nothing else you need to do — you can close this page whenever you're ready."));

        var fb = el("div", "feedback-box");
        var lab = el("label", "fb-label", "Any questions, or anything you'd like your care team to know? (optional)");
        lab.setAttribute("for", "pifFeedback");
        fb.appendChild(lab);
        var ta = el("textarea", "fb-textarea"); ta.id = "pifFeedback"; ta.rows = 5;
        ta.setAttribute("aria-label", "Questions or feedback for your care team");
        ta.placeholder = "Type your questions or feedback here…";
        ta.value = state.feedback || "";
        ta.addEventListener("input", function () { state.feedback = ta.value; });
        fb.appendChild(ta);
        var send = el("button", "pif-btn primary fb-send", "Send to my care team"); send.type = "button";
        var confirm = el("div", "fb-confirm"); confirm.style.display = "none";
        send.addEventListener("click", function () {
            // PRODUCTION: posts the free-text message to DR alongside the assessment.
            send.textContent = "Sent ✓"; send.disabled = true; ta.disabled = true;
            confirm.textContent = "Thanks — your message has been sent to your care team.";
            confirm.style.display = "block";
            announce("Your message has been sent to your care team.");
        });
        fb.appendChild(send);
        fb.appendChild(confirm);
        c.appendChild(fb);
        app.appendChild(c);
    }

    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

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
        var pid = params.get("patient");
        if (pid !== "1" && pid !== "2" && pid !== "3") pid = "1";
        sel.value = pid;
        initPatient(pid);
    }

    return { boot: boot, toggleTheme: toggleTheme };
})();

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", PIFApp.boot);
else PIFApp.boot();
