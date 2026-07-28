# Wiring the application form to Google Sheets

The landing page (`index.html`) has a built-in application form. Submissions
are sent to a **Google Apps Script Web App**, which appends each one as a row
in a Google Sheet. No server, no third-party form service.

## One-time setup (~5 minutes)

1. Create a new Google Sheet (this is where applications land).
2. In the sheet: **Extensions → Apps Script**.
3. Delete the placeholder code and paste this:

   ```js
   function doPost(e) {
     var ss = SpreadsheetApp.getActiveSpreadsheet();
     var sheet = ss.getSheetByName('Applications') || ss.insertSheet('Applications');

     if (sheet.getLastRow() === 0) {
       sheet.appendRow([
         'Submitted At', 'Name', 'Email', 'Phone', 'Portfolio',
         'Solo/Team', 'Social Platform', 'Social Link', 'Video'
       ]);
     }

     var d = JSON.parse(e.postData.contents);
     sheet.appendRow([
       d.submittedAt, d.name, d.email, d.phone, d.portfolio,
       d.entryType, d.socialPlatform, d.socialLink, d.video
     ]);

     return ContentService
       .createTextOutput(JSON.stringify({ result: 'ok' }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

4. **Deploy → New deployment → Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click **Deploy**, authorize when prompted, and **copy the Web App URL**
     (it ends in `/exec`).

5. In `index.html`, paste that URL into the one config line near the bottom:

   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
   ```

6. Redeploy the page. Done — every submission now appends a row.

## Notes

- The browser posts with `mode: "no-cors"`, so the page can't read the
  Apps Script response. That's expected: the row is still written; the form
  just optimistically shows the thank-you message.
- Until `SHEET_ENDPOINT` is set, the form still validates and thanks the
  applicant, but **nothing is recorded**. Set it before you promote/share.
- If you later change the Apps Script code, use **Deploy → Manage deployments
  → Edit → New version** so the same `/exec` URL keeps working.
- The form collects a **video link** (unlisted YouTube or a WeTransfer link),
  not a file upload — so no file storage is needed.
