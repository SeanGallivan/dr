/* =====================================================================
   PIF Survey — Data & Scoring module
   ---------------------------------------------------------------------
   The redesigned PIF (Patient-Individualized Functional Score) survey.
   Patient-reported functional outcome adapted from the Patient-Specific
   Functional Scale (PSFS). Measures function at baseline vs. at maximum
   benefit from therapy, scored per patient-diagnosis pair.

   This file holds ONLY data + pure scoring logic (mirrors adx-data.js).
   All UI lives in pif-app.js. Everything a clinician/analyst would revise
   (regions, example prompts, mRPQ items, scoring constants, the v2 lookup,
   sample patients) is an editable data object here, not in UI code.

   Two instruments; region selection decides which:
     Instrument A — PSFS 0–10 functional scale, every MSK region.
     Instrument B — mRPQ-20 (0–4), only when Brain/Concussion is selected.

   PRODUCTION: real entry validates a signed, single-use emailed token
   (no login / 2FA here); scores persist to DR; the acuity engine, bonus
   math, and note date-of-service population are out of scope (Step 9).
   ===================================================================== */

/* ===========================================================================
   TUNABLE CONSTANTS  (Sean / Dr. Vilims can revise without touching UI code)
   =========================================================================== */

/* Minimum detectable change for Instrument A (PSFS). Flag changes >= this. */
var MDC_POINTS = 3;

/* Max patient-defined activities per MSK region (PSFS "target up to five"). */
var MAX_ACTIVITIES = 5;

/* mRPQ-20 threshold-item behavior (items #17–19).
     false (default, "page 3" reading): counts only when rated >= 3, at face
            value  (0/1/2 -> 0, 3 -> 3, 4 -> 4).
     true  (stricter "only 4 counts" reading): 0/1/2/3 -> 0, 4 -> 4.
   Flip this single constant to switch the interpretation. */
var SUPP_COUNT_THRESHOLD = false;

/* mRPQ-20 totals. */
var MRPQ_MAX = 76;      // 16 std items x4 (=64) + 3 threshold x4 (=12); negative item only subtracts.
var MRPQ_CUTOFF = 25;   // total > 25 flags likely post-concussion syndrome (see conflict note below).

/* mRPQ-20 SCORING CONFLICT NOTE (page 2 vs page 3 of the source PDF) — UNRESOLVED,
   pending Dr. Vilims + Sean:
   The Rivermead validation pages (PDF page 2 / page 4+) describe the classic RPQ
   where a HIGHER total = MORE symptom burden and there is no single fixed
   "post-concussion syndrome" cutoff. Sean's redesign annotations (PDF page 3)
   instead specify the ADX-modified scoring used here: threshold items suppressed
   below 3, one negatively-scored item, max 76, and a total > 25 flags likely PCS.
   The build doc phrases the cutoff as "a total BELOW the stated cutoff flags,"
   the opposite direction from the page-3 annotation. Per the resolved build spec
   we implement the page-3 rule: total > 25 => flag. If the source PDF is later
   read to mean the reverse, invert MRPQ_CUTOFF_DIRECTION below. Kept as flippable
   constants so they can be set after Dr. Vilims' review. */
var MRPQ_CUTOFF_DIRECTION = "above"; // "above" => total > cutoff flags PCS.

/* ---------------------------------------------------------------------------
   v2 ENDPOINT-WEIGHTED PIF SCORE LOOKUP  ("PifsScores v2" sheet)
   PRODUCTION source of record: domains/GPL/ADX projects/Derived Results/assets/
     "PifsScores v2 revised formula and negative scores.xlsx", sheet
     "PifsScores v2", column "New Score".
   Maps (baseline band, RXMedStart, follow-up band, RXMedEnd) -> New Score,
   including negative scores when function regresses. Bands are 0–10; band index
   = Math.round(value) capped to 0..10. All 484 rows (11 x 11 x 4) embedded
   verbatim. Structure: V2_LOOKUP[medStart+medEnd][startBand][endBand] = score,
   where medStart/medEnd are "0" (without medication) or "1" (with medication).
   --------------------------------------------------------------------------- */
var V2_LOOKUP = {"00":[[0,0,0,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75],[0,0,0,1,1.5,2,2.5,3,3.5,4,4.5],[0,0,0,0,1,1.5,2,2.5,3,3.5,4],[-1.25,-1,0,0,0,1,1.5,2,2.5,3,3.5],[-1.75,-1.5,-1,0,0,0,1,1.5,2,2.5,3],[-2.25,-2,-1.5,-1,0,0,0,1,1.5,2,2.5],[-2.75,-2.5,-2,-1.5,-1,0,0,0,1,1.5,2],[-3.25,-3,-2.5,-2,-1.5,-1,0,0,0,1,1.5],[-3.75,-3.5,-3,-2.5,-2,-1.5,-1,0,0,0,1],[-4.25,-4,-3.5,-3,-2.5,-2,-1.5,-1,0,0,0],[-4.75,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,0,0]],"01":[[-1,-1,-1,0.25,0.75,1.25,1.75,2.25,2.75,3.25,3.75],[-1,-1,-1,0,0.5,1,1.5,2,2.5,3,3.5],[-1,-1,-1,-1,0,0.5,1,1.5,2,2.5,3],[-2.25,-2,-1,-1,-1,0,0.5,1,1.5,2,2.5],[-2.75,-2.5,-2,-1,-1,-1,0,0.5,1,1.5,2],[-3.25,-3,-2.5,-2,-1,-1,-1,0,0.5,1,1.5],[-3.75,-3.5,-3,-2.5,-2,-1,-1,-1,0,0.5,1],[-4.25,-4,-3.5,-3,-2.5,-2,-1,-1,-1,0,0.5],[-4.75,-4.5,-4,-3.5,-3,-2.5,-2,-1,-1,-1,0],[-5.25,-5,-4.5,-4,-3.5,-3,-2.5,-2,-1,-1,-1],[-5.75,-5.5,-5,-4.5,-4,-3.5,-3,-2.5,-2,-1,-1]],"10":[[1,1,1,2.25,2.75,3.25,3.75,4.25,4.75,5.25,5.75],[1,1,1,2,2.5,3,3.5,4,4.5,5,5.5],[1,1,1,1,2,2.5,3,3.5,4,4.5,5],[-0.25,0,1,1,1,2,2.5,3,3.5,4,4.5],[-0.75,-0.5,0,1,1,1,2,2.5,3,3.5,4],[-1.25,-1,-0.5,0,1,1,1,2,2.5,3,3.5],[-1.75,-1.5,-1,-0.5,0,1,1,1,2,2.5,3],[-2.25,-2,-1.5,-1,-0.5,0,1,1,1,2,2.5],[-2.75,-2.5,-2,-1.5,-1,-0.5,0,1,1,1,2],[-3.25,-3,-2.5,-2,-1.5,-1,-0.5,0,1,1,1],[-3.75,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,1,1]],"11":[[0,0,0,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75],[0,0,0,1,1.5,2,2.5,3,3.5,4,4.5],[0,0,0,0,1,1.5,2,2.5,3,3.5,4],[-1.25,-1,0,0,0,1,1.5,2,2.5,3,3.5],[-1.75,-1.5,-1,0,0,0,1,1.5,2,2.5,3],[-2.25,-2,-1.5,-1,0,0,0,1,1.5,2,2.5],[-2.75,-2.5,-2,-1.5,-1,0,0,0,1,1.5,2],[-3.25,-3,-2.5,-2,-1.5,-1,0,0,0,1,1.5],[-3.75,-3.5,-3,-2.5,-2,-1.5,-1,0,0,0,1],[-4.25,-4,-3.5,-3,-2.5,-2,-1.5,-1,0,0,0],[-4.75,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,0,0]]};

function pifBandIndex(v) { return Math.max(0, Math.min(10, Math.round(v))); }

/* Endpoint-weighted "New Score" from the v2 table.
   medStart/medEnd: 0 = without-medication reading, 1 = with-medication reading. */
function pifV2Score(startAvg, medStart, endAvg, medEnd) {
    var m = V2_LOOKUP[String(medStart) + String(medEnd)];
    if (!m) return null;
    return m[pifBandIndex(startAvg)][pifBandIndex(endAvg)];
}

/* ---------------------------------------------------------------------------
   PER-REGION EXAMPLE ACTIVITIES  (prompts only; NOT the scored items).
   Editable so examples can be revised without touching UI code. Keyed by
   region id; shown to spark the patient's own activity choices.
   --------------------------------------------------------------------------- */
var EXAMPLE_ACTIVITIES = {
    brain:       [], // Brain uses Instrument B (mRPQ-20); no patient-defined activities.
    headface:    ["Chewing tougher foods", "Wearing glasses or a hat comfortably", "Reading without eye strain"],
    neck:        ["Turning your head to check a blind spot", "Looking up at a high shelf", "Sleeping through the night", "Working at a computer"],
    shoulder:    ["Reaching an overhead shelf", "Putting on a jacket", "Sleeping on that side", "Lifting a grocery bag"],
    arm:         ["Carrying a bag of groceries", "Lifting a gallon of milk", "Reaching across a table"],
    wristhand:   ["Opening a jar", "Typing or writing", "Buttoning a shirt", "Holding a coffee cup"],
    upperback:   ["Sitting upright at a desk", "Reaching behind your back", "Taking a deep breath"],
    midback:     ["Bending to load the dishwasher", "Twisting to reach the back seat", "Standing for a long time"],
    chest:       ["Taking a deep breath", "Lifting a light box", "Reaching overhead"],
    lowback:     ["Putting on socks and shoes", "Standing to cook a meal", "Lifting a laundry basket", "Getting out of a car"],
    pelvabd:     ["Bending to pick something up", "Sitting through a long meal", "Rolling over in bed"],
    pelvgen:     ["Sitting comfortably", "Walking for exercise", "Sleeping through the night"],
    hipleg:      ["Climbing a flight of stairs", "Getting up from a low chair", "Walking around the block"],
    knee:        ["Going down stairs", "Kneeling in the garden", "Getting up from the floor", "Walking on uneven ground"],
    footankle:   ["Walking on uneven ground", "Standing to cook a meal", "Rising up onto your toes"],
    psych:       ["Concentrating on a task", "Being in a crowded place", "Keeping to your daily routine"],
    systemic:    ["Doing daily chores without tiring", "Walking for exercise", "Getting through the workday"],
    unspecified: ["A daily task that is hard right now", "An activity you had to give up", "Something you want to get back to"]
};

/* ---------------------------------------------------------------------------
   REGIONS  (exact Step 4 order + display labels + laterality).
   lat: null | "LR" (Left/Right) | "LRM" (Left/Right/Middle).
   instrument: "A" (PSFS) for every region except Brain, which uses "B" (mRPQ-20).
   plain: friendly short name used in the personal title "How is your ___?".
   --------------------------------------------------------------------------- */
var REGIONS = [
    { id: "brain",       label: "Brain and/or Concussion",       plain: "brain",             lat: null,  instrument: "B" },
    { id: "headface",    label: "Head / Face",                   plain: "head and face",     lat: null,  instrument: "A" },
    { id: "neck",        label: "Neck (Cervical)",               plain: "neck",              lat: "LRM", instrument: "A" },
    { id: "shoulder",    label: "Shoulder",                      plain: "shoulder",          lat: "LR",  instrument: "A" },
    { id: "arm",         label: "Arm (Upper Extremity)",         plain: "arm",               lat: "LR",  instrument: "A" },
    { id: "wristhand",   label: "Wrist and Hand",                plain: "wrist and hand",    lat: "LR",  instrument: "A" },
    { id: "upperback",   label: "Upper Back (Thoracic)",         plain: "upper back",        lat: null,  instrument: "A" },
    { id: "midback",     label: "Mid Back (Thoracolumbar)",      plain: "mid back",          lat: null,  instrument: "A" },
    { id: "chest",       label: "Chest",                         plain: "chest",             lat: null,  instrument: "A" },
    { id: "lowback",     label: "Low Back (Lumbosacral)",        plain: "low back",          lat: "LRM", instrument: "A" },
    { id: "pelvabd",     label: "Pelvis / Abdomen",              plain: "pelvis and abdomen",lat: null,  instrument: "A" },
    { id: "pelvgen",     label: "Pelvis / Genital Area",         plain: "pelvic area",       lat: null,  instrument: "A" },
    { id: "hipleg",      label: "Hip and Leg (Lower Extremity)", plain: "hip and leg",       lat: "LR",  instrument: "A" },
    { id: "knee",        label: "Knee",                          plain: "knee",              lat: "LR",  instrument: "A" },
    { id: "footankle",   label: "Foot and Ankle",                plain: "foot and ankle",    lat: "LR",  instrument: "A" },
    { id: "psych",       label: "Psychological",                 plain: "well-being",        lat: null,  instrument: "A" },
    { id: "systemic",    label: "Systemic",                      plain: "overall health",    lat: null,  instrument: "A" },
    { id: "unspecified", label: "Unspecified",                   plain: "affected area",     lat: null,  instrument: "A" }
];
var REGION_BY_ID = {};
REGIONS.forEach(function (r) { REGION_BY_ID[r.id] = r; });

/* ---------------------------------------------------------------------------
   mRPQ-20 ITEMS (Instrument B). Rated 0–4:
     0 = Not experienced, 1 = No more than before, 2 = Mild, 3 = Moderate, 4 = Severe.
   Wording reproduced faithfully from the source PDF (Step 5).
   type:
     "std"       = scored at face value 0–4 (items 1–16; #13 and #15 are ADX-added
                   but, per the resolved spec, scored as standard).
     "threshold" = counts only when rated >= 3 (see SUPP_COUNT_THRESHOLD).
     "negative"  = scored 0,-1,-2,-3,-4 and subtracted from the total.
   The four ADX supplemental items are #17,#18,#19 (threshold) and #20 (negative).
   --------------------------------------------------------------------------- */
var MRPQ_LABELS = ["Not experienced", "No more than before", "Mild", "Moderate", "Severe"];
var MRPQ_ITEMS = [
    { n: 1,  text: "Headaches",                                      type: "std" },
    { n: 2,  text: "Feelings of dizziness",                          type: "std" },
    { n: 3,  text: "Nausea and/or vomiting",                         type: "std" },
    { n: 4,  text: "Noise sensitivity (easily upset by loud noise)", type: "std" },
    { n: 5,  text: "Sleep disturbance",                             type: "std" },
    { n: 6,  text: "Fatigue, tiring more easily",                    type: "std" },
    { n: 7,  text: "Being irritable, easily angered",               type: "std" },
    { n: 8,  text: "Feeling depressed or tearful",                  type: "std" },
    { n: 9,  text: "Feeling frustrated or impatient",               type: "std" },
    { n: 10, text: "Forgetfulness, poor memory",                    type: "std" },
    { n: 11, text: "Poor concentration",                            type: "std" },
    { n: 12, text: "Taking longer to think",                        type: "std" },
    { n: 13, text: "Difficulty reading / near work",                type: "std" },   // ADX-added, scored std
    { n: 14, text: "Light sensitivity (easily upset by bright light)", type: "std" },
    { n: 15, text: "Difficulty judging distances",                  type: "std" },   // ADX-added, scored std
    { n: 16, text: "Restlessness",                                  type: "std" },
    { n: 17, text: "Feeling mentally foggy",                        type: "threshold" },  // ADX-added
    { n: 18, text: "Balance problems",                              type: "threshold" },  // ADX-added
    { n: 19, text: "Drowsiness",                                    type: "threshold" },  // ADX-added
    { n: 20, text: "Neck pain and/or upper extremity weakness",     type: "negative" }    // ADX-added
];

/* Per-item contribution to the mRPQ-20 total. Unanswered (null) contributes 0. */
function mrpqItemScore(item, rating) {
    if (rating == null) return 0;
    if (item.type === "std")      return rating;
    if (item.type === "negative") return -rating;
    if (item.type === "threshold") {
        if (SUPP_COUNT_THRESHOLD) return rating >= 4 ? rating : 0;   // stricter: only 4 counts
        return rating >= 3 ? rating : 0;                            // default: 3 and 4 count at face value
    }
    return 0;
}
function mrpqTotal(responses) {
    return MRPQ_ITEMS.reduce(function (s, it, i) { return s + mrpqItemScore(it, responses[i]); }, 0);
}

/* ---------------------------------------------------------------------------
   SAMPLE PATIENTS (Step 7). Switchable via dropdown or ?patient=1|2|3.
   Each defines note-seeded region pre-checks (with laterality) and, for MSK
   regions, activities. A region is "repeat" (activities locked + prior score)
   or "first-time" (patient defines activities).
   Activity fields: prior = {wo, wm} last-visit score (repeat only);
   cur = {wo, wm} current-visit rating (null until answered).
   wo = without medication, wm = with medication.
   PRODUCTION: seeded from the IPM note + prior DR assessments; here it is mocked.
   --------------------------------------------------------------------------- */
var PIF_SAMPLE_PATIENTS = {
    "1": {
        name: "Patient 1 — MSK repeat visit",
        // Neck, Low Back, Shoulder already on file with priors (locked activities).
        regions: [
            { id: "neck", lat: "Middle", repeat: true, activities: [
                { name: "Turning my head to check a blind spot while driving", prior: { wo: 2, wm: 3 }, cur: { wo: 6, wm: 7 } },
                { name: "Looking up to reach a high shelf",                    prior: { wo: 2, wm: 3 }, cur: { wo: 5, wm: 6 } },
                { name: "Sleeping through the night without neck pain",        prior: { wo: 3, wm: 4 }, cur: { wo: 6, wm: 8 } }
            ] },
            { id: "lowback", lat: "Left", repeat: true, activities: [
                { name: "Putting on my socks and shoes",          prior: { wo: 3, wm: 4 }, cur: { wo: 4, wm: 5 } },
                { name: "Standing at the counter to cook a meal",  prior: { wo: 2, wm: 3 }, cur: { wo: 3, wm: 4 } },
                { name: "Lifting a laundry basket",                prior: { wo: 2, wm: 3 }, cur: { wo: 3, wm: 4 } }
            ] },
            { id: "shoulder", lat: "Right", repeat: true, activities: [
                { name: "Reaching a plate from an overhead shelf", prior: { wo: 1, wm: 2 }, cur: { wo: 5, wm: 6 } },
                { name: "Putting on a jacket",                     prior: { wo: 2, wm: 3 }, cur: { wo: 6, wm: 7 } },
                { name: "Sleeping on my right side",               prior: { wo: 1, wm: 2 }, cur: { wo: 4, wm: 5 } }
            ] }
        ],
        brain: false, mrpq: null
    },
    "2": {
        name: "Patient 2 — Brain + MSK",
        // Brain (mRPQ-20 pre-seeded) + one first-time MSK region (Shoulder).
        regions: [
            { id: "shoulder", lat: "Left", repeat: false, activities: [
                { name: "Reaching overhead to a shelf", prior: null, cur: { wo: 4, wm: 5 } },
                { name: "Carrying a bag of groceries",  prior: null, cur: { wo: 5, wm: 6 } }
            ] }
        ],
        brain: true,
        // Pre-seeded mRPQ-20 responses (index 0..19 => items 1..20). Totals to 37 (> 25 => flag).
        mrpq: [3, 2, 1, 3, 2, 3, 2, 1, 2, 3, 3, 2, 1, 2, 1, 2, 3, 2, 3, 2]
    },
    "3": {
        name: "Patient 3 — First-time MSK",
        // Brand-new patient, no priors: patient defines activities with example prompts.
        regions: [
            { id: "knee",    lat: "Right",  repeat: false, activities: [] },
            { id: "lowback", lat: "Middle", repeat: false, activities: [] }
        ],
        brain: false, mrpq: null
    }
};
