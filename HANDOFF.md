# Green Hackathon (formerly "Green Tech Futures") — Handoff Brief

**For:** a fresh agent session with no prior context.
**Read this first, in full, before touching anything.**

Last updated: 2026-08-23, ~23:10 UTC. Supersedes the 2026-08-20 23:50 UTC version.

The event was renamed **"Green Hackathon"** on 2026-08-23 (push 6, §5). The GitHub repo,
Vercel project, Google Sheet, and this file's own filename all still say some variant of
"green-tech-futures" / "nyc-hackathon-sign-up" internally — that's just infrastructure
naming inertia, not a bug. Don't rename the repo/sheet/project on the strength of this alone;
ask first if that ever seems in scope.

> ### Read this box before anything else
>
> The recovered work is now **pushed and live** on the repo Vercel actually deploys from
> (`Mawuli-mp4/NYC-Hackathon-sign-up`), across **six commits**: the recovery itself, an
> accessibility fix, two hero-typography iterations, a content/copy batch (venue swap, date
> shift, dimmed-label fix), and a rebrand (§5). The stale, lying-success build is gone.
> `HOPAMINE/ZIMA` was deliberately **not** touched — its bundle couldn't apply (§5) and the
> owner chose to skip it; that's still true, unrelated to everything below.
>
> **Current live state, as of this update:**
> - Event name: **Green Hackathon** (title/meta/reg-bar/footer all consistent, verified —
>   zero leftover "Green Tech Futures" mentions on the live page)
> - Applications close **Sept 7**, teams announced **Sept 14**
> - Day 2/3 venue: **Hunter College campus**
> - Hero eyebrow line no longer mentions "NYU Campus" (the timeline itself still correctly
>   shows NYU Campus for Day 1 — only the one-line summary was trimmed)
> - New: a partner-logo bar (Hopamine × Green Jobs Board × Seeding Sovereignty) repeated at
>   the very top of the page, above the hero
> - New: a 4th hero step linking to the Green Jobs Pavilion Luma event page
>
> **If you're picking this up fresh: there is very little left to do.** Read §10.

---

## 1. What this project is

A single-page hackathon registration site — **Green Tech Futures**, Climate Week NYC,
Sept 20–23 2026. Built to the **Hopamine Visual Language v1.0** spec (available as the
`hopamine-design-lang` skill — load it before making any visual change).

- The whole page is one self-contained `index.html` (~64KB): inline CSS, inline JS, no build step.

### The two URLs

| URL | Anonymous visitor gets | Notes |
|---|---|---|
| `nyc-hackathon-sign-up.vercel.app` | 200, page renders | **This is the link that gets sent out.** Confirmed by the owner 2026-08-20: past applicant Nyota Parker was sent this one, and it's the one that will be used going forward. |
| `nyc-hackathon-sign-up-hopamine.vercel.app` | 302 → `vercel.com/sso-api` | Team-scoped alias, gated by Vercel Authentication. **Not used for outreach — this is moot for applicants**, but it's still gated if anyone ever reuses it. Not fixed, not urgent. |

### The two repos (do not confuse them)

| Repo | Role | Notes |
|---|---|---|
| `HOPAMINE/ZIMA` | Main project repo | Public, `Mawuli-mp4` has admin. Site was meant to live at `site/nyc-hackathon-sign-up/` but **that path does not currently exist on `main`** — see §5. Deliberately left untouched this session. |
| `Mawuli-mp4/NYC-Hackathon-sign-up` | The repo **Vercel actually deploys from** | Public, `Mawuli-mp4` has admin (verified via `gh api repos/.../collaborators/Mawuli-mp4/permission` → `"admin"`). `index.html` at its root. **This is the one that matters.** |

Both repos are **public** (contrary to an earlier read in this same brief — that was either a
stale state or a transient network issue; moot now that `gh` is authenticated).

`gh` is authenticated as `Mawuli-mp4` (token scopes: `gist`, `read:org`, `repo`, `workflow`) —
confirmed via `gh auth status`. Pushing works directly; no further auth setup needed.

---

## 2. Data flow (how a registration is stored)

No database. The form POSTs to a **Google Apps Script Web App**, which appends a row to a
Google Sheet.

```
index.html form  ──POST JSON──►  Apps Script /exec  ──appendRow──►  Google Sheet
```

- **Sheet:** "Green Tech Futures — Registrations"
  https://docs.google.com/spreadsheets/d/1e1hlcfkeRyPwxvRaOdgiiriiq6NuY21sLwc7taUvGag/edit
- **Columns:** `Timestamp, Name, Email, Phone, Entry Type, Team Members, Portfolio Link,
  Social Platform, Social Link, Video Pitch Link`
- **Endpoint** (`SHEET_ENDPOINT` in `index.html`):
  `https://script.google.com/macros/s/AKfycbwuDcqJCHSoQefFOIFWZgIFuo-EM7jvEkbTHlErsFBEAiJgMg3aW__JDfsudp4AWPpM/exec`
- The Apps Script is **bound to that sheet** (Extensions → Apps Script). **Never overwrite
  the sheet file wholesale** — edit cells, never the file, or you risk severing the binding.
- The script maps fields **by header name**, so reordering sheet columns is safe.
- **The Apps Script backend is already correctly deployed.** Confirmed 2026-08-20: a clean
  POST → follow the `Location` redirect → GET returns `{"status":"ok"}`, HTTP 200. No Apps
  Script deployment action is needed. (An earlier diagnostic using `curl -L -X POST` showed a
  confusing 405 — that was a `curl` artifact from forcing POST on the redirect instead of
  downgrading to GET the way real browser `fetch()` does. Not a real problem.)

---

## 3. The original bug — root cause, resolved

**Original symptom:** the owner sent a registration link out; applications did not appear in
the sheet. A later manual test by the owner did land.

**Cause, as understood at the time:** the `-hopamine` URL (gated by Vercel Authentication)
was believed to be the one sent out, which would explain "works for the owner, fails for
everyone else" — the owner is logged into Vercel and passes invisibly; anonymous visitors get
bounced to a login page and never reach the form.

**Update, 2026-08-20:** the owner confirmed the actual link sent to past applicants (including
Nyota Parker, who successfully registered) was the **public**, ungated URL — not `-hopamine`.
So the SSO wall was never actually the thing costing registrations. What *was* live and
serving every visitor on the public URL, until this session's push, was the older build with:

```js
fetch(SHEET_ENDPOINT, { method: "POST", mode: "no-cors", … })
  .then(function () { finish(true); });
```

Under `no-cors` the browser can't read the response, so `finish(true)` fired unconditionally —
every visitor saw "Application received" regardless of whether the row was actually written.
This is why the owner "wasn't 100% sure" it went through. **This build is no longer live** —
see §5.

Nothing was actually being lost in transit — the write path itself was confirmed working via
direct, unauthenticated test POSTs during this session, both before and independent of any
code changes.

---

## 4. Current state of the registrations sheet

As of 2026-08-20 ~22:15 UTC:

| Timestamp (UTC) | Name | Note |
|---|---|---|
| 2026-08-20T20:53:50.695Z | Mawuli Campbell | owner's own test |
| 2026-08-20T20:57:51.006Z | Nyota Parker | real registration, sent the public link |
| 2026-08-20T22:11:02.741Z | `ZZ DIAGNOSTIC TEST - safe to delete` | diagnostic POST — **delete this row** |
| 2026-08-20T22:1X:XX.XXXZ | `ZZ DIAGNOSTIC TEST 2 - safe to delete` | second diagnostic POST — **delete this row too** |

⚠️ **Housekeeping still outstanding:** both `ZZ DIAGNOSTIC TEST` rows need manual deletion.
The Drive connector available to agent sessions is read-only for cell content (its `update_file`
tool only handles title/parent), so no agent session can remove them — this needs a human in
the sheet UI.

---

## 5. Recovery — DONE, pushed, and verified live

### `Mawuli-mp4/NYC-Hackathon-sign-up` — pushed successfully

Two pushes this session, both confirmed live via direct byte-for-byte comparison against the
deployed URL (not just "push succeeded" — the actual served bytes were checked):

**Push 1** — fast-forward, no conflicts:
```
53e2614 (old prod)  →  e2bf01d8
  bd806b2  Add landing page with built-in application form
  1234343  Wire in real brand fonts, fix payload bug, update copy
  77cf17c  Add real-status confirmation modal, stop lying about submission success
  e2bf01d  Add handoff brief and version the Apps Script doPost
```
Brought in the fixed `index.html` (real status modal, `teamMembers` in payload), all four
fonts (`fonts/*.woff2`, committed as real binaries, no base64 corruption), `apps-script/doPost.gs`,
and docs.

**Push 2** — new commit, small and isolated:
```
9e7bf84  Fix confirmation modal blocking assistive tech from the whole page
```
See §6.

**Push 3 & 4** — one-line CSS tweak, iterated twice, owner-requested:
```
6702dd7  Reduce hero emphasis word's overlap into the line above     (margin-top: 0.15em)
fce5c85  Dial hero emphasis overlap back to a slight graze           (margin-top: 0.22em)
```
The cursive "Hired" swash was originally crossing all the way back through "That gets you".
`margin-top` on `.emph` pushes it down to control how far the swash's loop pokes into the
line above. `0.15em` (push 3) still cut solidly through "GETS"; the owner asked for a
lighter touch, so push 4 moved it to `0.22em`, which now just grazes the bottom of "GETS"
rather than crossing through it. **This is a subjective, visually-tuned value — if it ever
looks wrong again, this is the one property to adjust** (`.emph { margin-top: ... }`,
currently `0.22em`). Larger = less overlap, smaller = more.

Tuned empirically against real canvas ink metrics (`measureText().actualBoundingBox*`, which
capture swash overshoot that a plain CSS box measurement misses) and cross-checked visually
once the browser tool's screenshot compositor came back from an intermittent outage.
Confirmed live via screenshot after each deploy.

**Push 5** — content/copy batch, owner-requested:
```
959853c  Swap day 2/3 venue, shift key dates, fix dimmed Bootzy labels
```
Three unrelated changes bundled into one commit at the owner's request:
- **Venue:** Day 2 and 3 (`Sept 21`/`Sept 22`) venue changed from "Human VC Headquarters" to
  "Hunter College campus" — 3 spots (`.t-venue` ×2, plus the day-2 body paragraph mentioning
  it by name).
- **Dates:** "Applications close" `Sept 1` → `Sept 7` (3 spots); "Teams announced" `Sept 7` →
  `Sept 14` (5 spots, including the confirmation modal's live JS-set text and its `aria-live`
  status announcement — easy to miss if only grepping the static HTML).
- **Dimmed Bootzy labels:** `.hero__deadline`, `.apply__note`, and `.reg-bar__label` were all
  `color: rgba(242,239,232,0.55)` (i.e. `--cream` at 55% alpha) on `var(--t1)` (Bootzy) with
  tight `-3.0%` tracking. At anything less than full opacity, overlapping glyph strokes from
  tight/negative letter-spacing show a visible density seam where they cross — full opacity
  eliminates that since overlapping solid ink is indistinguishable from non-overlapping ink.
  Set to solid `var(--cream)`, tracking loosened to `-1.5%` to keep it from feeling too dense
  now that it reads as fully solid.

**Two elements with the identical rgba value were deliberately left alone**: `.hint` (uses
AppleGaramond, not Bootzy — this is reading-tier body text, not a header) and `footer`'s base
text color (general footer copy, not a header). Only genuinely Bootzy *header-styled* text was
in scope.

**One explicitly checked and NOT changed:** `.t-body h3` — the actual `<h3>` headers sitting
under each date in the "How it runs" timeline ("Applications close," "Teams announced," "Day
one: build begins," etc.) — was already `rgb(255,255,255)`, fully solid, no alpha, confirmed
via `getComputedStyle` before touching anything. If a future session is asked about this again
and finds it still solid, that's correct — don't "fix" it, there's nothing wrong with it.

**Tooling note:** the browser tool's screenshot compositor was unreliable for a stretch during
this push — returning inconsistent frame dimensions (826px vs 450px for an unchanged 1280×720
viewport) and visibly torn/stale composites across a fresh tab, a full reload, and multiple
scroll-position retries. Verification for this push relied on `getComputedStyle` reads (color,
letter-spacing) and direct `textContent` checks instead, which is sound for this kind of
change — deterministic CSS property values, not a subjective visual magnitude like push 3/4's
overlap tuning. If a future session hits the same compositor flakiness, this is a reasonable
fallback verification strategy for non-subjective changes; for anything where the exact visual
result genuinely can't be predicted from the CSS alone, wait it out or open a fresh tab first.

**Separate, unrelated finding — not fixed, flagging for awareness:** `emphFit()` (the
function right above `EMPH_MAX_OVERLAP = 0.25`, meant to nudge `.emph` by up to 25% of one
adjacent glyph's width using real canvas-measured character widths) is **dead code** — it's
defined but never called anywhere in the file. The code comment above it documents the
actual original design intent clearly: *"allowed to bite into its neighbours, but never by
more than 25% of the adjacent glyph... past that it reads as clutter rather than accent."*
The dramatic full-phrase overlap this session found and reduced (§ above) came from
`line-height`/`font-size` interactions, not from this dead function — the two are unrelated
mechanisms. Left as-is since it wasn't part of what was asked; worth wiring up
(`document.fonts.ready.then(function(){ emphFit(); run(); })` or similar) if anyone wants
the original fine-grained kerning-bite behavior restored.

All four fonts verified serving correctly on prod (`curl` → 200, exact expected byte sizes),
and the page's own console self-check (`[Hopamine faces]`) reports Bootzy and AppleGaramond
both `OK`. Grotalism and Glamour report `MISSING` — expected, those files were never supplied
(§9).

**Push 6** — the rebrand, from a separate parallel session:
```
6cb55a4  Rename to Green Hackathon, add top partner lockup, pavilion link
a860b66  Fix the handoff brief's deployment section
```
This did **not** come from this session. A different Claude session (Opus 5, session
`01Ae1VQSbDhbo9FgckXC4Q2B`) pulled the already-live repo — everything through push 5 above —
and layered new work on top, then handed off a folder (`~/Desktop/deploy-this/`) containing
`index.html`, `apps-script/doPost.gs`, `APPS_SCRIPT_SETUP.md`, its own `HANDOFF.md`, and a
`rebased-onto-origin-main.bundle`. **Before touching anything from a folder like that again**:
diff it against the live site first. This one turned out to be safe and additive — every one
of pushes 1–5's changes was verified still present and correct (venue, dates, the accessibility
fix, both overlap-tuning values, all three de-dimmed labels) — but that had to be confirmed,
not assumed. The bundle's own stated prerequisite commit was `959853c` (this session's push 5
tip), which is what made it possible to verify: a clean fast-forward, not a fork of stale
content.

What it actually changed:
- **Rename:** "Green Tech Futures [Hackathon]" → "Green Hackathon" — title, `og:title`,
  `.reg-bar__label`, footer sign-off. Verified consistent: 0 leftover old-name mentions, 4
  correct new-name mentions on the live page.
- **New partner-logo bar** (`.brandbar`) repeating the footer's Hopamine × Green Jobs Board ×
  Seeding Sovereignty lockup at the top of the page, above the hero. Hero `min-height` trimmed
  94vh → 86vh to compensate so the combined block still lands near one screen. Scaled down
  under 700px via a scoped `--size-micro`/`--logo-h` override so the three marks don't wrap to
  three lines and push the hero off the fold.
- **New 4th hero step**: "And present at the Green Jobs Pavilion," linking to
  `https://luma.com/5s1rg5ng` (external, opens in a new tab). This is the one part of push 6
  that adds a live external link this session never saw or vetted beyond confirming it's
  present and well-formed — if that Luma page ever needs to change, this is where it's wired.
- **Dropped "· NYU Campus"** from the hero's one-line date/location summary only. The
  timeline's Day 1 entry is untouched and still correctly says NYU Campus — this was a
  deliberate declutter of the summary line, per that session's own commit message, not a data
  error.

**A landmine in that folder, not deployed, but worth knowing about:**
`APPS_SCRIPT_SETUP.md` (in `~/Desktop/deploy-this/`, and possibly still on the user's Desktop)
describes a completely different, generic `doPost` implementation — still using
`mode: "no-cors"` (the exact silent-failure bug §3 documents), a `{result:'ok'}` response
shape the real frontend doesn't check for, no `teamMembers` handling at all, and a different
sheet name (`'Applications'` vs the real "Green Tech Futures — Registrations" sheet). It
directly contradicts the real `apps-script/doPost.gs` sitting right next to it in the same
folder, which **is** byte-identical to what's actually deployed. This doc was never committed
to the repo and isn't live anywhere — it's just a stray local file — but if anyone ever follows
it literally, it would reintroduce the exact bug this project spent real effort fixing. Worth
deleting or rewriting next time it comes up; not urgent since nothing currently points at it.

That other session's `HANDOFF.md` (byte-identical between the `deploy-this` folder and what's
actually committed to the repo at `a860b66`) is real, git-tracked content — not a stray file —
but it's noticeably less detailed than this document and was already caught being wrong once
(its own §6 originally claimed no git linkage existed; `a860b66` is that session correcting
itself). **This file — the one you're reading — is the authoritative one.** It gets pushed to
the repo too (below), so the two should converge; if they ever diverge again, prefer whichever
one was more recently verified against the live site over whichever sounds more confident.

### `HOPAMINE/ZIMA` — bundle cannot apply, skipped by owner's choice

The recovery bundle (`ZIMA-branch.bundle`) requires a prerequisite commit, `e0c06e0f`
("Remove hackathon landing page files"), as its base. That commit **does not exist anywhere**:
not on any branch in a full clone, not dangling, not in reflogs, and confirmed via
`gh api repos/HOPAMINE/ZIMA/commits/e0c06e0f...` → `422 No commit found for SHA`. The branch
the bundle was built from (`claude/green-tech-futures-sop-yfytck`) is not in the remote branch
list either. It was never pushed, or was pushed and deleted before GitHub's retention window.

ZIMA's current `main` (HEAD `b192fc0`) is a large, actively-evolving, unrelated-looking
project history (Bootzy WOFF2 builds, a "Monologue" visual spec, quiz/dashboard features) —
`site/nyc-hackathon-sign-up/` does not currently exist in its tree.

**The content is not lost** — every file (`index.html`, `apps-script/doPost.gs`, all 4 fonts,
docs) is byte-verified and sitting in `~/Desktop/greentech-recovery/` and in the pushed `nyc`
repo. If ZIMA needs this content later, it has to be added as a **fresh commit** on top of
current `main` (or a new branch) — the original commit history cannot be recovered, only the
final file contents. The owner chose to skip this for now since `nyc-hackathon-sign-up` is
what's actually live and deploying.

---

## 6. The accessibility fix — pushed, but read the caveat

### What was found

`#confirmModal` had `role="dialog" aria-modal="true"` hard-coded in static markup, with no JS
anywhere toggling it — only a CSS class (`is-open`) controlled visual appearance
(`opacity`/`pointer-events`). Per the ARIA spec, `aria-modal="true"` tells assistive tech "a
dialog is open, treat the rest of the page as inert" — this should only be present while the
dialog is actually shown, not unconditionally from page load.

### The fix (commit `9e7bf84`, pushed and confirmed live)

- Markup: `aria-modal="true"` → `aria-hidden="true"` as the closed-state default.
- `openModal()`: now also does `modal.removeAttribute("aria-hidden"); modal.setAttribute("aria-modal", "true");`
- `closeModal()`: now also does `modal.removeAttribute("aria-modal"); modal.setAttribute("aria-hidden", "true");`

This matches the pattern the file already uses elsewhere for `aria-checked` on the entry-type
toggle. 8-line diff, isolated to this one concern. Confirmed present on the live URL after
deploy (`grep` for `aria-hidden="true"` on `#confirmModal`, and the toggle calls, both present
in the served HTML).

### ⚠️ Caveat — the real-world severity was not cleanly verified

This session used a browser automation tool to test the live page. Its "interactive" element
filter showed **only the modal's Done button** — as if the whole rest of the page, including
the registration form, were inaccessible. That's what motivated the fix. But after pushing the
fix, the **same tool showed the exact same result** — only the Done button — which shouldn't
happen if the tool's filter were purely reflecting ARIA semantics. A full, unfiltered
accessibility-tree dump (a different mode of the same tool) *did* show the entire form present
and correctly labeled, both before checking further. This is contradictory enough that neither
result should be trusted as a clean read of real screen-reader behavior.

**What's solid:** the code change itself is a correct, standard fix for a real, verifiable ARIA
spec violation — worth having regardless.
**What's not confirmed:** whether the original bug actually locked real screen-reader users out
of the form in practice, or whether that was partly a testing-tool artifact.

**If you want certainty:** do a real check with an actual screen reader — on Mac, `Cmd+F5`
toggles VoiceOver; navigate the live page with Tab/VO keys and confirm the form fields are
reachable. No available tool in this session could substitute for that.

### A separate, unrelated observation (not a fix, not urgent)

While testing, simulated mouse-wheel scroll actions in the browser tool hung for 30 seconds,
twice, including on a bare local copy of the file with no network involved. Keyboard scrolling
(`End` key) worked instantly. A full source grep found **zero** scroll/wheel event listeners,
`requestAnimationFrame`, or `setInterval` calls anywhere in the page — there is no code path
that could cause this from the page's own JS. Most likely explanation: the tool's own error
message named "modal dialog" as a suspected cause of pane hangs, and this page permanently
carries a full-viewport `role="dialog"` element (now correctly `aria-hidden` when closed, but
still `position: fixed; inset: 0` at all times) — plausibly triggering some caution heuristic
in the tool itself. Real users scrolling with a mouse/trackpad are very unlikely to be affected
(their browsers just respect `pointer-events: none` and move on), but this wasn't independently
confirmed on a real device either. Low priority; mentioned so it isn't a mystery if noticed again.

---

## 7. Deployment mechanics

Vercel deploys from `Mawuli-mp4/NYC-Hackathon-sign-up`, branch `main`. Push there and it goes
live — confirmed twice this session, each time verified by polling the live URL until its
served byte-content changed to match the new commit.

This project is **not visible via the Vercel MCP connector** available in this session — both
`list_projects` and `get_project` require a `teamId`, and this project lives outside the one
team (`HOPAMINE`) the connector can see. `git push` is the only working path; don't burn time
on the Vercel MCP tools for this specific project.

Do **not** send font binaries through `deploy_to_vercel` or the GitHub contents API as inline
base64 — a previous session corrupted a file that way. Fonts travel through git as real blobs.

---

## 8. Open design decisions (deliberately unresolved)

- **`--track-t1` is at −2.0%**, a directed deviation from the guide's §1.2 spec of **−5.5%**.
  Loosened when Bootzy wasn't loading and the `I`-collision problem (§1.3) couldn't be
  tested. Worth revisiting now that real Bootzy ships — the per-pair `I` kerning solver in
  the page JS is designed to handle the tighter track.
- **Bootzy is subset to caps + digits + punctuation only.** Every Bootzy-set element is
  `text-transform: uppercase`, so lowercase can never render — but this forecloses §1.3's
  lowercase-`i` signature move until the full file ships.
- Series marks **"N 01"** (hero) and **"N 06 / 06"** (registration bar) look like
  placeholders. Confirm intentional before wider launch.
- Logo images (`logos/hopamine.png`, `logos/green-jobs-board.png`,
  `logos/seeding-sovereignty.png`) never supplied; footer falls back to text marks via `onerror`.
- Background photo plates (`assets/dendrite.jpg`, `mycelial.jpg`, `roots.jpg`) not supplied;
  they no-op harmlessly (confirmed: 404s for these on the live page are expected, not new).

---

## 9. Corrections to earlier versions of this brief — do not re-derive these

| Old claim | Reality |
|---|---|
| "Apps Script Web App access is not set to Anyone — check this first" | **False.** Access was always fine. Confirmed via anonymous GET/POST tests. |
| "The sheet contains only the header row — zero submissions" | **False**, and outdated — see §4. |
| "`teamMembers` was collected but never included in the POST payload" | **Already fixed**, and was already live before this session started. |
| "Submissions are being lost between browser and script" | **False.** The write path works. |
| "Both repos are private" | **False** — both are public. Either a stale read or a transient network issue when first checked. |
| "The `-hopamine` link is the confirmed root cause" | **Superseded, 2026-08-20.** The owner confirmed the *public* link is what actually gets sent to applicants (Nyota Parker included) and what will be used going forward. The `-hopamine` SSO gate is real but was never in the actual outreach path — see §3. The build quality issue (stale, lying-success code) on the *public* link was the thing that mattered, and that's now fixed (§5). |
| "Apps Script needs `doPost.gs` pasted in and redeployed (§5/§7 in the 22:15 version)" | **False as of this session.** It was already correctly deployed — confirmed via a clean `{"status":"ok"}` response. No action needed. |

---

## 10. Suggested order of work (very little left)

1. Delete both `ZZ DIAGNOSTIC TEST` rows from the sheet (§4). Manual, 30 seconds.
2. Optional: do a real screen-reader spot check on the live form (§6 caveat) if you want
   certainty beyond what this session could verify.
3. Optional: decide if/when to reconcile `HOPAMINE/ZIMA` — requires writing the recovered
   content as a fresh commit, not a bundle apply (§5).
4. Optional: revisit the `-hopamine` URL's SSO gate if there's ever a reason to use that link
   again — currently harmless since it's not the one being distributed.
5. Everything else in §8 (design decisions) is pre-existing and deliberately unresolved —
   not urgent, not new.
6. Optional: delete or rewrite `APPS_SCRIPT_SETUP.md` if it resurfaces anywhere (§5, push 6) —
   it describes a stale, buggy implementation that contradicts the real `doPost.gs`.
7. If another local folder like `~/Desktop/deploy-this/` shows up with its own `HANDOFF.md`:
   don't trust it at face value. Diff its `index.html` against the live site first (§5, push
   6, has the exact method used). It may be stale, or it may be ahead — the only way to know
   is to check, not to guess from which one sounds more confident.
