# NYC Green Tech Futures Hackathon — landing page

Single-file, dependency-free landing page (`index.html`) for the Green Tech
Futures Hackathon (Climate Week NYC 2026), with a built-in application form
that posts submissions to a Google Sheet.

- **Application form** lives at the bottom of the page (`#apply`). Both
  "Apply to build" CTAs scroll to it.
- **Google Sheets wiring:** see `APPS_SCRIPT_SETUP.md`. Paste your Apps Script
  Web App URL into the `SHEET_ENDPOINT` config line near the bottom of
  `index.html`.

No build step. Deploy the repo root as a static site (Vercel framework preset:
Other).
