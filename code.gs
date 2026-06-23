/**
 * ============================================================
 * VDK COLLECTIVE — GOOGLE APPS SCRIPT BACKEND
 * ============================================================
 * This file stays in your GAS project (separate from GitHub).
 * It saves enquiries to Google Sheets and can be triggered
 * by a Netlify outgoing webhook.
 *
 * SETUP:
 *  1. Deploy as Web App → Execute as: Me → Anyone
 *  2. Copy the /exec URL
 *  3. In Netlify: Forms → enquiry → Add notification →
 *     Outgoing Webhook → paste the URL
 *  4. Netlify will POST form data here on every submission
 * ============================================================
 */

const SHEET_PROPERTY_KEY = 'VDK_LEADS_SHEET_ID';
const SHEET_NAME = 'Enquiries';

const HEADERS = [
  'Timestamp',
  'Full Name',
  'Email Address',
  'Phone Number',
  'Business Name',
  'Business Website or Social Media',
  'Industry',
  'Tell Us About Your Business'
];

/**
 * Netlify outgoing webhook sends a POST with JSON body.
 * GAS web apps receive this via doPost(e).
 */
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    // Netlify wraps field values inside a `data` property
    var fields = data.data || data;

    var result = saveEnquiry({
      fullName:     fields.fullName     || fields['Full Name']     || '',
      email:        fields.email        || fields['Email Address'] || '',
      phone:        fields.phone        || fields['Phone Number']  || '',
      businessName: fields.businessName || fields['Business Name'] || '',
      website:      fields.website      || fields['Business Website or Social Media'] || '',
      industry:     fields.industry     || fields['Industry']      || '',
      details:      fields.details      || fields['Tell Us About Your Business'] || ''
    });

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Returns (or creates) the Sheets spreadsheet.
 * ID is cached in Script Properties so the same sheet
 * is always reused rather than a new one being made.
 */
function getOrCreateLeadSheet() {
  var props   = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty(SHEET_PROPERTY_KEY);
  var ss;

  if (sheetId) {
    try { ss = SpreadsheetApp.openById(sheetId); }
    catch (err) { sheetId = null; }
  }
  if (!sheetId) {
    ss = SpreadsheetApp.create('VDK Collective — Enquiries');
    props.setProperty(SHEET_PROPERTY_KEY, ss.getId());
  }

  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.setName(SHEET_NAME);

  if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}

/**
 * Guards against double-submissions: same email within 30s = duplicate.
 */
function isDuplicateSubmission(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var lastData      = sheet.getRange(lastRow, 1, 1, 3).getValues()[0];
  var lastTimestamp = new Date(lastData[0]).getTime();
  var lastEmail     = (lastData[2] || '').toString().toLowerCase().trim();

  return lastEmail === (email || '').toLowerCase().trim() &&
         (Date.now() - lastTimestamp) < 30000;
}

/**
 * Validates and saves one enquiry row.
 */
function saveEnquiry(data) {
  if (!data.fullName || data.fullName.trim().length < 2) {
    return { success: false, error: 'Missing full name.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email || '').trim())) {
    return { success: false, error: 'Invalid email.' };
  }

  var sheet = getOrCreateLeadSheet();

  if (isDuplicateSubmission(sheet, data.email)) {
    return { success: true, note: 'Duplicate skipped.' };
  }

  sheet.appendRow([
    new Date(),
    data.fullName.trim(),
    data.email.trim(),
    (data.phone || '').trim(),
    (data.businessName || '').trim(),
    (data.website || '').trim(),
    (data.industry || '').trim(),
    (data.details || '').trim()
  ]);

  // ── FUTURE INTEGRATIONS ──────────────────────────────────
  //
  // EMAIL NOTIFICATION
  // MailApp.sendEmail({
  //   to: 'vdkcollective@outlook.com',
  //   subject: 'New Enquiry — ' + data.businessName,
  //   body: data.fullName + '\n' + data.email + '\n\n' + data.details
  // });
  //
  // CRM WEBHOOK
  // UrlFetchApp.fetch('YOUR_CRM_URL', {
  //   method: 'post',
  //   contentType: 'application/json',
  //   payload: JSON.stringify(data)
  // });
  //
  // CALENDLY — redirect or embed handled client-side
  // ────────────────────────────────────────────────────────

  return { success: true };
}
