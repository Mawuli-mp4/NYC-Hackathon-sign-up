// Paste this in over the existing doPost() in the Apps Script project bound
// to "Green Tech Futures — Registrations". After pasting, redeploy:
// Deploy -> Manage deployments -> pencil icon -> Version: New version -> Deploy.
// (Editing the code alone does NOT update the live /exec URL.)
//
// This returns real JSON status the page can check, instead of the old
// version which (if it threw) would just fail silently under no-cors.

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var fieldMap = {
      'Timestamp': new Date(),
      'Name': payload.name || '',
      'Email': payload.email || '',
      'Phone': payload.phone || '',
      'Entry Type': payload.entryType || '',
      'Team Members': payload.teamMembers || '',
      'Portfolio Link': payload.portfolio || '',
      'Social Platform': payload.socialPlatform || '',
      'Social Link': payload.socialLink || '',
      'Video Pitch Link': payload.video || ''
    };

    var row = headers.map(function (h) {
      return fieldMap.hasOwnProperty(h) ? fieldMap[h] : '';
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
