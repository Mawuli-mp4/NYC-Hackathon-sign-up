# Green Tech Futures — Handoff Brief

**For:** a fresh agent session with no prior context.
**Read this first, in full, before touching anything.**

Last updated: 2026-08-20.

---

## 0. Start your session correctly (this matters)

The previous session was **permanently blocked** from pushing any work because of how it
was started. Do not repeat this.

**Start the new session with `HOPAMINE/ZIMA` as the initial source repo.**

Why: a session can only attach repos owned by the owner(s) it started with. The previous
session started with `mawuli-mp4` repos, so `add_repo` for `HOPAMINE/ZIMA` failed with:

```
cross-tier adds are not supported in v1: requested "hopamine/zima" but session already
has repos from owner(s) [mawuli-mp4]. Start a new session with the requested repo as
the initial source.
```

This is not a permissions setting anyone can toggle. It is fixed only by session start-up choice.

---

## 1. What this project is

A single-page hackathon registration site — **Green Tech Futures**, Climate Week NYC,
Sept 20–23 2026. Built to the **Hopamine Visual Language v1.0** spec (available as the
`hopamine-design-lang` skill — load it before making any visual change).

- **Live site:** https://nyc-hackathon-sign-up-hopamine.vercel.app
- **Vercel project:** `nyc-hackathon-sign-up` under the `HOPAMINE` team
  (`team_W1eMKtKkBAn0HF7YTQJH74S4`)
- The whole page is one self-contained `index.html` (~64KB): inline CSS, inline JS, no build step.

### The two repos (do not confuse them)

| Repo | Role | Notes |
|---|---|---|
| `HOPAMINE/ZIMA` | Main project repo | Was `Mawuli-mp4/zima`, **moved to the HOPAMINE org**. The old URL 404s. Site lives at `site/nyc-hackathon-sign-up/`. |
| `mawuli-mp4/nyc-hackathon-sign-up` | The repo **Vercel actually deploys from** | Separate standalone repo. `index.html` at its root. |

**Both copies of `index.html` must be kept identical.** They drifted before; that caused
real confusion about what was actually live.

---

## 2. Data flow (how a registration is stored)

There is no database. The form POSTs to a **Google Apps Script Web App**, which appends a
row to a Google Sheet.

```
index.html form  ──POST JSON──►  Apps Script /exec  ──appendRow──►  Google Sheet
```

- **Sheet:** "Green Tech Futures — Registrations"
  https://docs.google.com/spreadsheets/d/1e1hlcfkeRyPwxvRaOdgiiriiq6NuY21sLwc7taUvGag/edit
- **Columns:** `Timestamp, Name, Email, Phone, Entry Type, Team Members, Portfolio Link,
  Social Platform, Social Link, Video Pitch Link`
- **Endpoint** (in `index.html` as `SHEET_ENDPOINT`, verified live in the deployed site's DevTools):
  `https://script.google.com/macros/s/AKfycbwuDcqJCHSoQefFOIFWZgIFuo-EM7jvEkbTHlErsFBEAiJgMg3aW__JDfsudp4AWPpM/exec`
- The Apps Script is **bound to that sheet** (opened via Extensions → Apps Script).
- The script maps fields **by header name**, so reordering sheet columns is safe.

---

## 3. THE OPEN BUG — read carefully before changing anything

**Symptom:** the owner sent the registration link out. Nobody's applications appeared in the
sheet. A later manual test by the owner *did* land. As of the last check the sheet contains
**only the header row — zero submissions.**

**Confirmed so far:**
- The live site's `SHEET_ENDPOINT` is correct (checked in DevTools on the deployed site).
- No other Drive spreadsheet is catching the data (searched all sheets in the account).
- So submissions are being lost **between browser and script**, not written somewhere else.

**Why it failed silently — the root cause of the confusion:**
The original code used `fetch(..., { mode: "no-cors" })`. Under `no-cors` the browser
refuses to expose the response, so the JS **cannot tell success from failure**. The old
handler called `finish(true)` unconditionally — meaning the page showed
*"Application received"* even when the write never happened. Every user saw success. That
is why the owner "wasn't 100% sure" it went through, and why failures were invisible.

**Still-unverified hypotheses** (the previous session could not test these — its network
egress to `script.google.com` and to the Vercel domain was blocked by proxy policy):

1. **Apps Script Web App access is not set to "Anyone."** If it is "Only myself," anonymous
   POSTs from the public page are rejected/redirected to login. The owner's own test would
   succeed (they are logged in) while everyone else silently fails. **This best fits the
   observed evidence and should be checked first.**
   → Apps Script → Deploy → Manage deployments → edit (pencil) → "Who has access".
2. **Stale deployment.** Editing `doPost()` does *not* update the live `/exec` URL. It
   requires Deploy → Manage deployments → edit → **Version: New version** → Deploy.
3. **Runtime error in `doPost()`.** Check Apps Script → Executions (clock icon) for failed runs.
4. **Mobile Safari / Brave / strict-mode Firefox** blocking the cross-site request under
   tracking protection.

**First diagnostic to run:** submit a test on the live site with DevTools → Network open and
read the real HTTP status of the POST to `/exec`. A 302-to-login or 401 confirms hypothesis 1.

---

## 4. Work that is DONE but NOT PUSHED ANYWHERE

> ⚠️ **All of this exists only in an ephemeral container and in files handed to the owner
> in chat. If those are lost, the work is lost.** Recovering it is your first job.

Three unpushed commits in each repo (same logical changes, mirrored):

`HOPAMINE/ZIMA`, branch `claude/green-tech-futures-sop-yfytck`:
```
3d3a1c6  Mirror confirmation modal + real-status fetch fix into local site copy
5cb2334  Switch header tiers to Bootzy, re-subset font for header punctuation, add task handoff doc
24f6129  Add Green Tech Futures site with licensed brand faces
```

`mawuli-mp4/nyc-hackathon-sign-up`, branch `main`:
```
77cf17c  Add real-status confirmation modal, stop lying about submission success
1234343  Wire in real brand fonts, fix payload bug, update copy
bd806b2  Add landing page with built-in application form
```

### What those commits contain

**Bug fixes**
- **`teamMembers` was collected by the JS but never included in the POST payload** — team
  member names/emails were silently dropped on every team application. Fixed.
- Removed `mode: "no-cors"` so the client reads the real response (see §5).

**Copy / UX**
- Team member fields reduced 5 → 4 (teams are five; the applicant is the fifth).
- Plain-language explanation of the "YC-style" 90-second pitch, quoting the actual question:
  *"Why would I be a good fit for this hackathon?"* plus guidance to mention experience,
  past hackathon wins, and the project they'd ideally build.
- Three-step hero walkthrough: receive a problem statement → build your solution → keep it
  as your startup / portfolio project.
- Added "You do not need a finished idea to apply."

**Visual**
- Fixed the rotated "Hired" emphasis word and inconsistent stacked-headline spacing.
- Removed a duplicate HOPAMINE wordmark from the footer.
- All header-tier elements routed onto **Bootzy** (`--t1`), per the owner's explicit
  instruction: *"Make all the header text bootzy — NEVER USE GOOGLE FONTS."*

**Fonts** — 4 licensed faces converted TTF → WOFF2, subset to only the glyphs the page renders:
| File | Role | Size |
|---|---|---|
| `Bootzy.woff2` | T1 display / all headers | 30,124 B |
| `AppleGaramond.woff2` | reading tier, 400 | 10,612 B |
| `AppleGaramondBold.woff2` | reading tier, 700 (real, not synthesised) | 10,168 B |
| `BillaMount.woff2` | cursive overlay, EN only | 15,496 B |

They belong in `fonts/` next to `index.html`. `@font-face` rules already reference them.
Grotalism Black and Glamour were never supplied; their rules are declared and inert — drop
the files in and they activate with no code change.

---

## 5. Work that is BUILT but NOT YET DEPLOYED — finish this

A confirmation modal, chosen by the owner over a toast/inline option, because *"even when I
was doing my registration, I wasn't a hundred percent sure"* it went through.

**Two halves. They must ship together, in this order.**

### Step 1 — Apps Script FIRST

The new frontend only shows success when the script returns `{"status":"ok"}`. If you deploy
the HTML before updating the script, **every submission will report as failed** even when the
row is written correctly.

Paste `apps-script/doPost.gs` (in the repo) over the existing `doPost()`, then
**Deploy → Manage deployments → pencil → Version: New version → Deploy.**
While in there, set **"Who has access" to "Anyone"** (see §3, hypothesis 1).

### Step 2 — then the HTML

`index.html` changes already written:
- `mode: "no-cors"` removed; `Content-Type: text/plain` retained so it stays a CORS-simple
  request (no preflight the Apps Script cannot answer).
- Response is parsed; success requires `res.ok && data.status === "ok"`.
- On real success: modal with a green circled checkmark, "Application received", body
  *"You're in the queue. Watch your inbox — teams are announced September 7."*
- On real failure: red/coral modal, "Submission failed", and it explicitly says nothing was saved.
- Dismissable via the Done button, backdrop click, or Escape; focus moves to the button;
  transitions respect `prefers-reduced-motion`. Styled from the existing Hopamine tokens
  (`--green`, `--coral`, `--cream`, `--t1`, `--micro`).

### Step 3 — verify for real

Submit a live test, then **confirm the row actually appears in the sheet.** Do not trust the
page's own success message — that is exactly the failure mode that started this.

---

## 6. Deployment

Vercel deploys from `mawuli-mp4/nyc-hackathon-sign-up`. Push there and it goes live.

The previous session tried the `deploy_to_vercel` MCP tool directly and got:
`403 — You don't have permission to create a Production Deployment for this project.`
Its Vercel connection only reached a different project (`zima-build`). **Prefer git push**;
only reach for the MCP deploy tool if the session demonstrably has access to the right project.

Do **not** try to send font binaries through `deploy_to_vercel` or the GitHub contents API
as inline base64. The previous session burned significant effort on this and corrupted the
file — ~40KB of base64 transcribed through model output does not survive intact. Fonts must
travel through git (`git add fonts/`) or a real file upload.

---

## 7. Blockers the previous session hit (so you don't rediscover them)

| Blocker | Detail |
|---|---|
| `git push` to `Mawuli-mp4/zima` | 404 — repo moved to `HOPAMINE/ZIMA`. Not a network flake. |
| `add_repo HOPAMINE/ZIMA` | Cross-owner add refused. **Fix: start the session from that repo (§0).** |
| Write to `mawuli-mp4/nyc-hackathon-sign-up` via GitHub API | `403 Resource not accessible by integration` — the App has read, not write, on that repo. Verify under github.com/settings/installations that Contents = Read **and write**. |
| `curl` to `script.google.com` | 403 from the session's egress proxy — could not test the endpoint server-side. |
| `WebFetch` of the live Vercel URL | Blocked by the same egress policy — could not inspect the live page. |
| Vercel production deploy | 403, wrong project in scope. |

Note the credential itself reports `can_push: true` for `HOPAMINE/ZIMA` — pushing there
should work fine from a correctly-started session.

---

## 8. Open design decisions (flagged, deliberately unresolved)

- **`--track-t1` is at −2.0%**, a directed deviation from the guide's §1.2 spec of **−5.5%**.
  It was loosened when Bootzy wasn't actually loading and the `I`-collision problem (§1.3)
  couldn't be tested. Worth revisiting now that real Bootzy ships — the per-pair `I` kerning
  solver in the page JS is designed to handle the tighter track correctly.
- **Bootzy is subset to caps + digits + punctuation only.** Every Bootzy-set element is
  `text-transform: uppercase`, so lowercase can never render — but this forecloses §1.3's
  lowercase-`i` signature move until the full file ships. Re-subset if lowercase is ever needed.
- Series marks **"N 01"** (hero) and **"N 06 / 06"** (registration bar) look like placeholders.
  Confirm intentional before wider launch.
- Logo images (`logos/hopamine.png`, `logos/green-jobs-board.png`,
  `logos/seeding-sovereignty.png`) were never supplied; the footer falls back to text marks
  automatically via `onerror`.
- Background photo plates (`assets/dendrite.jpg`, `mycelial.jpg`, `roots.jpg`) not supplied;
  they no-op harmlessly.

---

## 9. Suggested order of work

1. Start the session from `HOPAMINE/ZIMA` (§0).
2. Recover the unpushed commits and the four font files from the owner (§4) — ask for the
   git bundle and the zip sent in the previous session's chat.
3. Push the recovered work to both repos.
4. **Diagnose the live submission bug (§3)** — check Apps Script access setting first. This is
   the highest-value item: registrations are actively being lost right now.
5. Deploy the Apps Script update, then the HTML (§5), in that order.
6. Verify end-to-end with a real submission that lands in the sheet.
7. Confirm the four fonts are served (not 404ing) — the page logs a `[Hopamine faces]` report
   to the console showing OK/MISSING per face. Note `font-display: swap` means a missing font
   silently falls back to a system stack rather than looking broken.
