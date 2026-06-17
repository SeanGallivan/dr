# ADX / Derived Results — Physician Dashboard Prototype

A clickable, front-end-only prototype of the **ADX (Accurate Diagnosis)** network
dashboard built on the **Derived Results** design system. Live target URL:
`https://seangallivan.github.io/dr/`.

This is a redesign per the *Physician Dashboard — Business Requirements Document*
(the source of truth). It surfaces ~80% of the answers a user needs at a glance and
links out to detail for the rest — an interactive table of contents, not a data dump.

## Entry & access
- `index.html` → access code **`DR2026`** → `dashboard.html`.

## Roles (view-as, left nav) — BRD §3.2
The main view is **Dr. Bradley Vilims (Administrator / Overseer)**. The left nav
switches the whole dashboard to any provider's view, as they would see it:

| Role | URL | Differences |
|------|-----|-------------|
| Administrator (Brad) | `dashboard.html?view=DR_BRAD` | All cases, all providers, payer + lien columns, performance-vs-network, all three tiers |
| IPM physician | `?view=IPM_HART` / `IPM_IGLE` | Coordinated episodes; running cost central; payer shown; Daily + Weekly |
| Network physician | `?view=NET_RAMAN` / `NET_BRANDT` / `NET_OKAFOR` | Own cases; single payer (no payer/lien column); composite score + bonus eligibility |
| Specialist / surgeon | `?view=SPEC_VOSS` / `SPEC_CHEN` | Lightest view; procedure + functional outcome; Daily only |

## Tiers (header nav) — BRD §4
- **Daily** — operational pulse (default). Sortable active-cases table organized
  around running total per patient per diagnosis. Status filter defaults to *Active*.
- **Weekly** — revenue & volume by client, referral sources, provider productivity
  composite (RAS-style). Network role sees their own standing + bonus eligibility.
- **Monthly** — demonstrated efficacy banner, payment aging, portfolio valuation,
  case-mix (admin only).

The red **alert surface** at the top promotes the most urgent flags (no-visit,
past next-visit window, missing perfected lien for admin).

## Detail pages
`case-detail.html` · `provider-detail.html` · `referral-detail.html` (all take `?id=&view=`).

## Files
| File | Purpose |
|------|---------|
| `adx-data.js` | Mock data, every field source-tagged `[DR]` / `[Salesforce]` / `[FHIR]` (BRD §9) |
| `adx-config.js` | Roles, column visibility, flag metadata, **isolated/swappable** `computeComposite()` score (BRD §10) |
| `adx-app.js` | Rendering engine — sortable table, tiers, role switching, alert surface, mock actions |
| `styles.css` | Shared Derived Results design system + ADX dashboard styles |

## Notes
- Prototype only — no backend. Data shaped so handoff is just pointing calls at live endpoints.
- WCAG 2.1 AA: keyboard navigable, `aria-sort` on sortable headers, skip link, no color-only flag meaning (every flag carries an icon + text), visible focus rings.
- The composite/RAS score formula is deliberately isolated in `computeComposite()` so the
  weighting can change without reworking the UI (open question per BRD §10).

## Local preview
```
python -m http.server 5180
# open http://localhost:5180/
```
