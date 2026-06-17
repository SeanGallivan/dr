/* =====================================================================
   ADX Dashboard — Application / Rendering Engine
   ---------------------------------------------------------------------
   Reads ?view=<providerId> & ?tier=<daily|weekly|monthly> from the URL,
   resolves the role, and renders the view-as nav, tier nav, alert
   surface, and the active tier. No backend — all data from adx-data.js.
   ===================================================================== */

var ADXApp = (function () {

    /* ---- state ---- */
    var state = {
        sortKey: "flags",          // default: red → orange → yellow, then aging desc
        sortDir: "desc",
        statusFilter: "Active"     // BRD 5.4: default to Active
    };

    /* ---- URL helpers ---- */
    function params() { return new URLSearchParams(window.location.search); }
    function getProviderId() { return params().get("view") || "DR_BRAD"; }
    function getProvider() { return adxProvider(getProviderId()) || adxProvider("DR_BRAD"); }
    function getRoleKey() { return getProvider().role; }
    function getRole() { return ADX_ROLES[getRoleKey()]; }
    function getTier() {
        var t = params().get("tier") || "daily";
        var allowed = getRole().tiers;
        return allowed.indexOf(t) >= 0 ? t : allowed[0];
    }
    function urlFor(providerId, tier) {
        return "dashboard.html?view=" + providerId + (tier ? "&tier=" + tier : "");
    }

    /* ---- formatters ---- */
    function money(n) { return "$" + Number(n).toLocaleString(); }
    function moneyK(n) { return "$" + Math.round(n / 1000) + "k"; }
    function signedMoney(n) { return (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toLocaleString(); }
    function signedDays(n) { return (n >= 0 ? "+" : "−") + Math.abs(n); }
    function fmtDate(d) {
        if (!d) return "—";
        var parts = d.split("-");
        var mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return mo[parseInt(parts[1], 10) - 1] + " " + parseInt(parts[2], 10);
    }
    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

    /* ---- case selection by role (BRD 3.2) ---- */
    function visibleCases() {
        var role = getRoleKey(), pid = getProviderId(), all = ADX_CASES;
        if (role === "admin") return all.slice();
        if (role === "ipm") return all.filter(function (c) { return c.ipmId === pid; });
        // network / specialty: cases where this provider is on the team
        return all.filter(function (c) { return (c.teamProviderIds || []).indexOf(pid) >= 0; });
    }

    function statusFiltered(cases) {
        if (state.statusFilter === "__all__") return cases;
        return cases.filter(function (c) { return c.status === state.statusFilter; });
    }

    function visibleColumns() {
        var role = getRoleKey();
        return ADX_COLUMNS.filter(function (col) { return col.roles.indexOf(role) >= 0; });
    }

    /* ---- sort value extraction ---- */
    function sortValue(c, key) {
        switch (key) {
            case "beneficiary": return c.beneficiary.toLowerCase();
            case "diagnosis":   return c.diagnosis.toLowerCase();
            case "runningTotal":return c.runningTotal;
            case "ipmName":     return adxProvider(c.ipmId).name.toLowerCase();
            case "payer":       return adxPayer(c.payerId).name.toLowerCase();
            case "agingDays":   return c.agingDays;
            case "scheduling":  return c.scheduling.toLowerCase();
            case "nextVisit":   return c.nextVisit || "9999-99-99";
            case "vsNetworkDays": return c.vsNetworkDays;
            case "vsNetworkCost": return c.vsNetworkCost;
            case "pif":         return c.pifCurrent - c.pifStart;
            case "lienOnFile":  return c.lienOnFile ? 1 : 0;
            default: return 0;
        }
    }

    function caseSeverity(c) {
        return (c.flags || []).reduce(function (m, f) {
            return Math.max(m, (ADX_FLAGS[f] || {}).rank || 0);
        }, 0);
    }

    function sortCases(cases) {
        var key = state.sortKey, dir = state.sortDir === "desc" ? -1 : 1;
        if (key === "flags") {
            // Severity (red → orange → yellow) then aging large → small.
            return cases.slice().sort(function (a, b) {
                var sa = caseSeverity(a), sb = caseSeverity(b);
                if (sa !== sb) return (sa - sb) * dir;
                return b.agingDays - a.agingDays;
            });
        }
        return cases.slice().sort(function (a, b) {
            var av = sortValue(a, key), bv = sortValue(b, key);
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
    }

    /* ---- flag chips (no color-only meaning: icon + text), sorted by severity ---- */
    function flagChips(c) {
        var chips = (c.flags || []).slice().sort(function (a, b) {
            return ((ADX_FLAGS[b] || {}).rank || 0) - ((ADX_FLAGS[a] || {}).rank || 0);
        }).map(function (f) {
            var m = ADX_FLAGS[f];
            if (!m) return "";
            return '<span class="adx-flag adx-flag-' + m.sev + '" title="' + esc(m.label) + '">' +
                   '<span aria-hidden="true">' + m.icon + '</span>' +
                   '<span class="adx-flag-text">' + esc(m.short) + '</span></span>';
        });
        return chips.length ? '<span class="adx-flags-cell">' + chips.join("") + '</span>' : '<span class="adx-muted">—</span>';
    }

    /* ---- cell renderer ---- */
    function cell(c, col) {
        switch (col.type) {
            case "text":
                return '<a class="adx-link" href="' + caseDetailUrl(c) + '">' + esc(c.beneficiary) + '</a>' +
                       (c.newIntake ? ' <span class="adx-pill adx-pill-new" title="New intake">NEW</span>' : '');
            case "diagnosis":
                return '<div class="adx-dx">' + esc(c.diagnosis) + '</div>' +
                       '<div class="adx-dx-status">' + esc(c.diagnosisStatus) + '</div>';
            case "money":
                return '<span class="adx-money">' + money(c.runningTotal) + '</span>';
            case "provider":
                return '<a class="adx-link" href="' + providerDetailUrl(c.ipmId) + '">' + esc(adxProvider(c.ipmId).shortName) + '</a>';
            case "payer":
                var pay = adxPayer(c.payerId);
                return '<a class="adx-link" href="' + referralDetailUrl(c.clientId) + '">' + esc(pay.name) + '</a>' +
                       (pay.reminderRequired ? ' <span class="adx-pill adx-pill-warn" title="Slow payer">SLOW</span>' : '');
            case "agingNum":
                return '<span class="' + (c.agingDays > 90 ? "adx-warn-text" : "") + '">' + c.agingDays + '</span>';
            case "scheduling":
                return schedulingBadge(c.scheduling);
            case "nextVisit":
                return c.nextVisit
                    ? '<span class="' + (c.nextVisitFlag ? "adx-warn-text" : "") + '">' + fmtDate(c.nextVisit) +
                      (c.nextVisitFlag ? ' <span aria-hidden="true">⌛</span>' : '') + '</span>'
                    : (c.unscheduledAgeDays > 0
                        ? '<span class="adx-warn-text">Unscheduled ' + c.unscheduledAgeDays + 'd</span>'
                        : '<span class="adx-muted">—</span>');
            case "deltaDays":
                return deltaBadge(c.vsNetworkDays, signedDays(c.vsNetworkDays) + "d");
            case "deltaMoney":
                return deltaBadge(c.vsNetworkCost, signedMoney(c.vsNetworkCost));
            case "pif":
                var gain = c.pifCurrent - c.pifStart;
                var dir = gain > 0 ? "up" : gain < 0 ? "down" : "flat";
                return '<span class="adx-pif">' + c.pifStart + '<span aria-hidden="true">→</span>' + c.pifCurrent +
                       ' <span class="adx-pif-' + dir + '">' + (gain > 0 ? "▲" : gain < 0 ? "▼" : "▬") + ' ' + (gain > 0 ? "+" : "") + gain + '</span></span>' +
                       '<span class="sr-only"> PIF improved from ' + c.pifStart + ' to ' + c.pifCurrent + '</span>';
            case "lien":
                return c.lienOnFile
                    ? '<span class="adx-lien adx-lien-ok"><span aria-hidden="true">✓</span> On file</span>'
                    : '<span class="adx-lien adx-lien-missing"><span aria-hidden="true">⚠</span> Missing</span>';
            case "flags":
                return flagChips(c);
            case "actions":
                var acts = '<button class="adx-actlink" onclick="ADXApp.action(\'message\',\'' + c.id + '\')" aria-label="Message doc about ' + esc(c.beneficiary) + '">Message Doc</button>';
                acts += (c.scheduling === "No-show"
                    ? '<span class="adx-act-sep" aria-hidden="true">·</span><button class="adx-actlink adx-actlink-alert" onclick="ADXApp.action(\'notify-adx\',\'' + c.id + '\')" aria-label="Notify ADX of no-show for ' + esc(c.beneficiary) + '">Notify ADX</button>'
                    : '<span class="adx-act-sep" aria-hidden="true">·</span><button class="adx-actlink" onclick="ADXApp.action(\'message-brad\',\'' + c.id + '\')" aria-label="Message Brad about ' + esc(c.beneficiary) + '">Message Brad</button>');
                return '<span class="adx-row-actions">' + acts + '</span>';
            default: return "";
        }
    }

    function schedulingBadge(s) {
        var map = { "Scheduled": "navy", "Seen": "green", "No-show": "red", "Unscheduled": "yellow" };
        return '<span class="ctx-badge ' + (map[s] || "muted") + '">' + esc(s) + '</span>';
    }
    function deltaBadge(n, text) {
        if (n === 0) return '<span class="adx-muted">on par</span>';
        var good = n < 0; // below network norm (days/cost) is good
        return '<span class="adx-delta ' + (good ? "adx-delta-good" : "adx-delta-bad") + '">' +
               '<span aria-hidden="true">' + (good ? "▼" : "▲") + '</span> ' + esc(text) + '</span>';
    }

    /* ---- detail URLs (carry current view for back-nav) ---- */
    function caseDetailUrl(c)     { return "case-detail.html?id=" + c.id + "&view=" + getProviderId(); }
    function providerDetailUrl(p) { return "provider-detail.html?id=" + p + "&view=" + getProviderId(); }
    function referralDetailUrl(c) { return "referral-detail.html?id=" + c + "&view=" + getProviderId(); }

    /* =================================================================
       NAV
    ================================================================= */
    function renderViewAsNav() {
        var current = getProviderId();
        var groups = [
            { label: "Administrator / Overseer", role: "admin" },
            { label: "IPM Physicians", role: "ipm" },
            { label: "Network Physicians", role: "network" }
        ];
        var html = '<div class="adx-nav-intro">View as</div>';
        groups.forEach(function (g) {
            var people = ADX_PROVIDERS.filter(function (p) { return p.role === g.role; });
            if (!people.length) return;
            html += '<div class="adx-nav-group"><div class="adx-nav-group-label">' + g.label + '</div>';
            people.forEach(function (p) {
                var active = p.id === current ? " active" : "";
                html += '<a class="adx-nav-item' + active + '" href="' + urlFor(p.id, getTier()) + '"' +
                        (active ? ' aria-current="page"' : '') + '>' +
                        '<span class="adx-nav-name">' + esc(p.name) + '</span>' +
                        '<span class="adx-nav-spec">' + esc(p.specialty) + '</span>' +
                        (p.org ? '<span class="adx-nav-org">' + esc(p.org) + '</span>' : '') + '</a>';
            });
            html += '</div>';
        });
        document.getElementById("adxNav").innerHTML = html;
    }

    function renderTierNav() {
        var role = getRole(), tier = getTier(), pid = getProviderId();
        var nav = document.getElementById("topNav");
        nav.innerHTML = role.tiers.map(function (t) {
            var meta = ADX_TIERS[t];
            return '<a href="' + urlFor(pid, t) + '" id="tier-' + t + '" class="' + (t === tier ? "active" : "") + '"' +
                   (t === tier ? ' aria-current="page"' : '') + '>' + meta.label +
                   '<span class="tier-sub">' + meta.sub + '</span></a>';
        }).join("");
    }

    /* =================================================================
       DAILY TIER — the active-cases table (BRD 5)
    ================================================================= */
    function renderDaily() {
        var role = getRole();
        var cols = visibleColumns();
        var cases = sortCases(statusFiltered(visibleCases()));

        var statusSel = '<label class="adx-status-select"><span class="adx-status-label">Status</span>' +
            '<select onchange="ADXApp.setStatus(this.value)">' +
            ADX_STATUS_OPTIONS.map(function (o) {
                return '<option value="' + o.value + '"' + (o.value === state.statusFilter ? " selected" : "") + '>' + o.label + '</option>';
            }).join("") + '</select></label>';

        /* summary stat strip — "by the numbers" */
        var all = statusFiltered(visibleCases());
        var totalCost = all.reduce(function (s, c) { return s + c.runningTotal; }, 0);
        var newIntakes = all.filter(function (c) { return c.newIntake; }).length;

        var strip = '<div class="daily-grid adx-strip">' +
            stat("Active Cases", all.length, false) +
            (role.costEmphasis ? stat("Running Total — All Cases", money(totalCost), false) : "") +
            stat("New Intakes", newIntakes, false) +
            '</div>';

        var header = '<div class="adx-daily-head">' +
            '<h2 class="adx-h2">Active Cases</h2>' +
            statusSel + '</div>' +
            '<p class="adx-sub">' + esc(role.subtitle) + '</p>';

        var table = buildTable(cols, cases);

        document.getElementById("adxMain").innerHTML = header + strip +
            '<div class="adx-table-wrap">' + table + '</div>';
    }

    function stat(label, value, alert) {
        return '<div class="daily-stat' + (alert ? " alert" : "") + '">' +
               '<span class="stat-label">' + label + '</span>' +
               '<span class="stat-value" style="font-size:1.8rem;">' + value + '</span></div>';
    }

    function buildTable(cols, cases) {
        var head = cols.map(function (col) {
            if (!col.sortable) return '<th scope="col">' + col.label + '</th>';
            var isSort = state.sortKey === col.key;
            var ariaSort = isSort ? (state.sortDir === "desc" ? "descending" : "ascending") : "none";
            return '<th scope="col" aria-sort="' + ariaSort + '">' +
                   '<button class="adx-sort" onclick="ADXApp.sortBy(\'' + col.key + '\')">' + col.label +
                   '<span class="adx-sort-ind" aria-hidden="true">' + (isSort ? (state.sortDir === "desc" ? " ▼" : " ▲") : " ⇅") + '</span>' +
                   '</button></th>';
        }).join("");

        var body = cases.length
            ? cases.map(function (c) {
                var rowCls = caseSeverity(c) === 3 ? " adx-row-urgent" : "";
                return '<tr class="' + rowCls.trim() + '">' + cols.map(function (col) {
                    return '<td data-label="' + esc(col.label) + '">' + cell(c, col) + '</td>';
                }).join("") + '</tr>';
            }).join("")
            : '<tr><td colspan="' + cols.length + '" class="adx-empty">No cases match this status filter.</td></tr>';

        return '<table class="adx-table"><caption class="sr-only">Active cases, sortable by column.</caption>' +
               '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
    }

    /* =================================================================
       WEEKLY TIER (BRD 6)
    ================================================================= */
    function renderWeekly() {
        var role = getRoleKey();
        if (role === "network") return renderNetworkWeekly();

        var revTrend = ADX_WEEKLY.revenueThisWeek - ADX_WEEKLY.revenueLastWeek;
        var html = '<h2 class="adx-h2">Weekly — Management</h2><p class="adx-sub">Reviewed about weekly. Several items originate in Salesforce, surfaced here read-only.</p>';

        html += '<div class="daily-grid adx-strip">' +
            stat("Revenue This Week", money(ADX_WEEKLY.revenueThisWeek), false) +
            stat("vs Last Week", signedMoney(revTrend), revTrend < 0) +
            stat("New Referrals", ADX_WEEKLY.newReferrals, false) +
            stat("Cases Reaching MBT", ADX_WEEKLY.casesToMBT, false) +
            '</div>';

        /* Revenue & volume by client */
        html += sectionHead("Revenue & Volume by Client", "Salesforce");
        html += '<table class="adx-table"><thead><tr>' +
            '<th scope="col">Client (Referral Source)</th><th scope="col">Type</th>' +
            '<th scope="col">Volume</th><th scope="col">Active</th>' +
            '<th scope="col">Revenue YTD</th><th scope="col">Lien Co. / Payer</th><th scope="col">Partner Cash Value</th></tr></thead><tbody>' +
            ADX_CLIENTS.map(function (cl) {
                return '<tr><td data-label="Client"><a class="adx-link" href="' + referralDetailUrl(cl.id) + '">' + esc(cl.name) + '</a></td>' +
                    '<td data-label="Type">' + esc(cl.type) + '</td>' +
                    '<td data-label="Volume">' + cl.volume + '</td>' +
                    '<td data-label="Active">' + cl.activeVolume + '</td>' +
                    '<td data-label="Revenue YTD"><span class="adx-money">' + money(cl.revenueYTD) + '</span></td>' +
                    '<td data-label="Lien / Payer">' + esc(cl.payer) + '</td>' +
                    '<td data-label="Cash Value">' + money(cl.cashValue) + '</td></tr>';
            }).join("") + '</tbody></table>';

        /* Provider productivity composite (RAS) */
        html += sectionHead("Provider Productivity — Composite Score", "DR");
        html += '<p class="adx-sub" style="margin-top:-0.5rem;">Composite (RAS-style) score: PIF improvement (weighted heaviest), return-to-work, cost, and time. Computed at MBT; formula is isolated &amp; swappable.</p>';
        html += providerScoreTable(["ipm", "network"]);

        document.getElementById("adxMain").innerHTML = html;
    }

    function renderNetworkWeekly() {
        var p = getProvider();
        var comp = computeComposite(p);
        var pct = p.composite;
        var eligible = pct >= ADX_BONUS_THRESHOLD;
        var rank = rankAmong(p, "network");

        var html = '<h2 class="adx-h2">Your Weekly Standing</h2><p class="adx-sub">How you compare to the network, and your bonus eligibility.</p>';
        html += '<div class="clinical-scorecard">' +
            scoreCard("Your Composite Score", pct, "Network avg: " + ADX_NETWORK_NORMS.composite) +
            scoreCard("Network Rank", rank.pos + " of " + rank.total, "Among network physicians") +
            scoreCard("Bonus Eligibility", eligible ? "Eligible" : "Not yet", "Threshold: " + ADX_BONUS_THRESHOLD) +
            '</div>';

        html += sectionHead("Where You're Doing Well vs Poorly", "DR");
        var mine = visibleCases();
        var well = mine.filter(function (c) { return (c.pifCurrent - c.pifStart) >= 3; });
        var poorly = mine.filter(function (c) { return (c.pifCurrent - c.pifStart) <= 1 || c.scheduling === "No-show"; });
        html += '<div class="deep-grid">' +
            '<div class="deep-card" style="border-left:4px solid #0a8f2c;"><h4>Doing Well (' + well.length + ')</h4><p>' +
            (well.map(function (c) { return esc(c.beneficiary) + " — PIF +" + (c.pifCurrent - c.pifStart); }).join("<br>") || "—") + '</p></div>' +
            '<div class="deep-card alert-card"><h4>Needs Attention (' + poorly.length + ')</h4><p>' +
            (poorly.map(function (c) { return esc(c.beneficiary) + " — " + (c.scheduling === "No-show" ? "no-show" : "PIF +" + (c.pifCurrent - c.pifStart)); }).join("<br>") || "—") + '</p></div>' +
            '</div>';
        document.getElementById("adxMain").innerHTML = html;
    }

    function providerScoreTable(roles) {
        var rows = ADX_PROVIDERS.filter(function (p) { return roles.indexOf(p.role) >= 0 && p.composite != null; })
            .sort(function (a, b) { return b.composite - a.composite; });
        return '<table class="adx-table"><thead><tr>' +
            '<th scope="col">Provider</th><th scope="col">Role</th>' +
            '<th scope="col">Composite</th><th scope="col">PIF Median Gain</th>' +
            '<th scope="col">Return to Work</th><th scope="col">Avg Cost / Case</th>' +
            '<th scope="col">Avg Days in ADX</th><th scope="col">Bonus</th></tr></thead><tbody>' +
            rows.map(function (p, i) {
                var tag = i === 0 ? ' <span class="adx-pill adx-pill-good">TOP</span>' : (i === rows.length - 1 ? ' <span class="adx-pill adx-pill-warn">BOTTOM</span>' : '');
                return '<tr><td data-label="Provider"><a class="adx-link" href="' + providerDetailUrl(p.id) + '">' + esc(p.name) + '</a>' + tag + '</td>' +
                    '<td data-label="Role">' + roleLabel(p.role) + '</td>' +
                    '<td data-label="Composite"><strong>' + p.composite + '</strong></td>' +
                    '<td data-label="PIF Gain">+' + p.pifMedianGain.toFixed(1) + '</td>' +
                    '<td data-label="RTW">' + Math.round(p.returnToWork * 100) + '%</td>' +
                    '<td data-label="Cost">' + money(p.avgCostPerCase) + '</td>' +
                    '<td data-label="Days">' + p.avgDaysInADX + '</td>' +
                    '<td data-label="Bonus">' + (p.bonusEligible ? '<span class="adx-lien-ok">✓ Eligible</span>' : '<span class="adx-muted">—</span>') + '</td></tr>';
            }).join("") + '</tbody></table>';
    }

    function rankAmong(provider, role) {
        var peers = ADX_PROVIDERS.filter(function (p) { return p.role === role; })
            .sort(function (a, b) { return b.composite - a.composite; });
        return { pos: peers.findIndex(function (p) { return p.id === provider.id; }) + 1, total: peers.length };
    }

    /* =================================================================
       MONTHLY TIER (BRD 7) — admin only
    ================================================================= */
    function renderMonthly() {
        var e = ADX_MONTHLY.efficacy;
        var html = '<h2 class="adx-h2">Monthly / Quarterly — Strategic</h2><p class="adx-sub">Reviewed less often. Cadence, not a strict schedule.</p>';

        /* Demonstrated efficacy banner */
        html += '<div class="adx-efficacy">' +
            '<div class="adx-efficacy-head">Demonstrated Systems Efficacy <span>— why ADX is better</span></div>' +
            '<div class="adx-efficacy-grid">' +
            effItem("PIF Median Gain", "+" + e.pifMedianGain.toFixed(1), e.pifTrend, "pts", true) +
            effItem("Return to Work", Math.round(e.returnToWork * 100) + "%", e.rtwTrend * 100, "pts", true) +
            effItem("Avg Cost / Case", moneyK(e.avgCostPerCase), e.costTrend, "", false) +
            effItem("Avg Days to MBT", e.avgDaysToMBT, e.daysTrend, "d", false) +
            '</div></div>';

        /* Payment aging — admin only */
        html += sectionHead("Payment Aging — Are Our Payers Paying On Time?", "Salesforce");
        html += '<table class="adx-table"><thead><tr><th scope="col">Payer (Lien Company)</th><th scope="col">Outstanding</th><th scope="col">Avg Days to Pay</th><th scope="col">Status</th></tr></thead><tbody>' +
            ADX_MONTHLY.paymentAging.map(function (a) {
                var slow = a.avgDays > 60;
                return '<tr class="' + (slow ? "adx-row-urgent" : "") + '"><td data-label="Payer">' + esc(a.payer) + '</td>' +
                    '<td data-label="Outstanding"><span class="adx-money">' + money(a.outstanding) + '</span></td>' +
                    '<td data-label="Avg Days"><span class="' + (slow ? "adx-warn-text" : "") + '">' + a.avgDays + '</span></td>' +
                    '<td data-label="Status">' + (slow ? '<span class="adx-warn-text">' + esc(a.status) + '</span>' : esc(a.status)) + '</td></tr>';
            }).join("") + '</tbody></table>';

        /* Portfolio valuation (kept light) */
        var pf = ADX_MONTHLY.portfolio;
        html += sectionHead("Portfolio Valuation", "Salesforce");
        html += '<div class="deep-grid" style="grid-template-columns:1fr 1fr 1fr;">' +
            '<div class="deep-card"><h4>Face Value</h4><p class="adx-big">' + money(pf.faceValue) + '</p></div>' +
            '<div class="deep-card"><h4>Realization Rate</h4><p class="adx-big">' + Math.round(pf.realizationRate * 100) + '%</p></div>' +
            '<div class="deep-card" style="border-left:4px solid var(--primary-navy);"><h4>Weighted Expected Value</h4><p class="adx-big" style="color:var(--primary-navy);">' + money(pf.weightedValue) + '</p></div>' +
            '</div>' +
            '<p class="adx-sub" style="font-style:italic;">' + esc(pf.note) + '</p>';

        /* Case-mix profitability (low priority breakdown) */
        html += sectionHead("Case-Mix Profitability", "DR");
        html += '<table class="adx-table"><thead><tr><th scope="col">Injury Type</th><th scope="col">Active Cases</th><th scope="col">Avg Margin</th></tr></thead><tbody>' +
            ADX_MONTHLY.caseMix.map(function (m) {
                return '<tr><td data-label="Type">' + esc(m.type) + '</td><td data-label="Cases">' + m.cases + '</td><td data-label="Margin">' + Math.round(m.avgMargin * 100) + '%</td></tr>';
            }).join("") + '</tbody></table>';

        document.getElementById("adxMain").innerHTML = html;
    }

    function effItem(label, value, trend, unit, upGood) {
        var good = upGood ? trend >= 0 : trend <= 0;
        var arrow = trend === 0 ? "▬" : trend > 0 ? "▲" : "▼";
        var tval = (trend > 0 ? "+" : "") + (Math.abs(trend) < 1 && trend !== 0 ? trend.toFixed(2).replace("0.", ".") : Math.round(trend));
        return '<div class="adx-eff-item"><div class="adx-eff-value">' + value + '</div>' +
               '<div class="adx-eff-label">' + label + '</div>' +
               '<div class="adx-eff-trend ' + (good ? "adx-delta-good" : "adx-delta-bad") + '"><span aria-hidden="true">' + arrow + '</span> ' + tval + unit + ' vs prior</div></div>';
    }

    function sectionHead(title, source) {
        return '<div class="section-header adx-section-head"><h3>' + title + '</h3>' +
               (source ? '<span class="adx-src-tag">[' + source + ']</span>' : '') + '</div>';
    }
    function scoreCard(label, value, sub) {
        return '<div class="scorecard-card"><div class="scorecard-label">' + label + '</div>' +
               '<div class="scorecard-value">' + value + '</div><div class="scorecard-sub">' + sub + '</div></div>';
    }
    function roleLabel(r) { return { admin: "Admin", ipm: "IPM", network: "Network", specialty: "Specialist" }[r] || r; }

    /* =================================================================
       PUBLIC ACTIONS
    ================================================================= */
    function sortBy(key) {
        if (state.sortKey === key) {
            state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
        } else {
            state.sortKey = key;
            state.sortDir = "desc";
        }
        renderDaily();
    }
    function setStatus(v) { state.statusFilter = v; renderDaily(); }

    function action(type, caseId) {
        var c = adxCase(caseId);
        var msg = {
            "message": "Message sent to " + adxProvider(c.ipmId).name + " re: " + c.beneficiary + ".",
            "message-brad": "Message sent to Dr. Brad re: " + c.beneficiary + " — “Get this moving.”",
            "notify-adx": "ADX notified of no-show for " + c.beneficiary + "."
        }[type] || "Action recorded.";
        toast(msg);
    }
    function toast(msg) {
        var t = document.getElementById("adxToast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200);
    }

    /* =================================================================
       BOOT
    ================================================================= */
    function init() {
        var p = getProvider();
        var role = getRole();
        document.title = "ADX | " + role.title + " — " + p.name;

        document.getElementById("adxRoleTitle").textContent = role.title;
        document.getElementById("adxRoleWho").textContent = p.name + " · " + p.specialty;

        renderViewAsNav();
        renderTierNav();

        var tier = getTier();
        if (tier === "weekly") renderWeekly();
        else if (tier === "monthly") renderMonthly();
        else renderDaily();
    }

    return {
        init: init,
        sortBy: sortBy,
        setStatus: setStatus,
        action: action
    };
})();

document.addEventListener("DOMContentLoaded", ADXApp.init);
