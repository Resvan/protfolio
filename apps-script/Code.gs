/**
 * resvan.in contact form backend.
 * Deploy as Web App: Execute as "Me", Who has access "Anyone".
 * Script Properties (Project Settings → Script Properties):
 *   NOTIFY_EMAIL      where to send notifications (default muhammedresvan@gmail.com)
 *   CALLMEBOT_PHONE   your WhatsApp number with country code, e.g. +916238577673
 *   CALLMEBOT_APIKEY  key CallMeBot sent you
 *   SHEET_ID          optional; defaults to the spreadsheet this script is bound to
 */
var SHEET_NAME = 'responses';
var RATE_LIMIT = 5;          // submissions per email
var RATE_WINDOW_SEC = 3600;  // per hour

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: false, error: 'Rejected' });
    // The site form always sends navigator.userAgent; bots posting straight to this URL don't.
    if (!String(p.userAgent || '').trim()) return json_({ ok: false, error: 'Rejected' });

    var v = validateSubmission(p);
    if (!v.ok) return json_({ ok: false, error: v.error });
    var d = v.data;

    if (isRateLimited_(d.email)) return json_({ ok: false, error: 'Too many messages from this email. Please try again later.' });

    appendRow_(d, p.userAgent || '');
    sendEmail_(d);
    notifyWhatsApp_(d); // best effort
    return json_({ ok: true });
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return json_({ ok: false, error: 'Something went wrong on the server.' });
  }
}

function validateSubmission(p) {
  var name = String(p.name || '').trim();
  var email = String(p.email || '').trim();
  var phone = String(p.phone || '').trim();
  var message = String(p.message || '').trim();
  if (name.length < 2 || name.length > 60) return { ok: false, error: 'Name must be 2–60 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: 'Invalid email address.' };
  if (phone) {
    if (!/^\+?[\d\s().-]+$/.test(phone)) return { ok: false, error: 'Invalid phone number.' };
    var digits = phone.replace(/\D/g, '').length;
    if (digits < 7 || digits > 15) return { ok: false, error: 'Phone must have 7–15 digits.' };
  }
  if (message.length < 10 || message.length > 2000) return { ok: false, error: 'Message must be 10–2000 characters.' };
  if (/https?:\/\/|www\./i.test(message)) return { ok: false, error: 'Please remove links from your message, or email me directly.' };
  return { ok: true, data: { name: name, email: email, phone: phone, message: message } };
}

/** Prevent formula injection: Sheets treats leading = + - @ as formulas. */
function safeCell(value) {
  var s = value === null || value === undefined ? '' : String(value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isRateLimited_(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rl:' + email.toLowerCase();
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), RATE_WINDOW_SEC);
  return n > RATE_LIMIT;
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Message', 'User agent']);
  return sheet;
}

function appendRow_(d, ua) {
  // Serialise concurrent submissions so two requests never target the same row.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    // Timestamp stays a real Date (sortable); only user-supplied strings go through safeCell.
    var row = [new Date()].concat([d.name, d.email, d.phone, d.message, ua].map(safeCell));
    var r = sheet.getLastRow() + 1;
    var range = sheet.getRange(r, 1, 1, row.length);
    range.setNumberFormat('@');
    range.setValues([row]);
    sheet.getRange(r, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  } finally {
    lock.releaseLock();
  }
}

function sendEmail_(d) {
  var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || 'muhammedresvan@gmail.com';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#171a21">' +
    '<h2 style="margin:0 0 16px">New message from resvan.in</h2>' +
    '<table style="border-collapse:collapse;width:100%">' +
    '<tr><td style="padding:6px 0;color:#4f5a73;width:90px">Name</td><td style="padding:6px 0">' + esc(d.name) + '</td></tr>' +
    '<tr><td style="padding:6px 0;color:#4f5a73">Email</td><td style="padding:6px 0"><a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></td></tr>' +
    '<tr><td style="padding:6px 0;color:#4f5a73">Phone</td><td style="padding:6px 0">' + (d.phone ? esc(d.phone) : '—') + '</td></tr>' +
    '</table>' +
    '<p style="white-space:pre-wrap;background:#eef1f5;padding:16px;border-radius:8px">' + esc(d.message) + '</p>' +
    '<p style="color:#4f5a73;font-size:12px">Reply to this email to answer ' + esc(d.name) + ' directly.</p></div>';
  MailApp.sendEmail({
    to: to,
    replyTo: d.email,
    subject: 'Portfolio contact: ' + d.name,
    htmlBody: html,
    body: 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + (d.phone || '-') + '\n\n' + d.message,
  });
}

function notifyWhatsApp_(d) {
  try {
    var props = PropertiesService.getScriptProperties();
    var phone = props.getProperty('CALLMEBOT_PHONE');
    var key = props.getProperty('CALLMEBOT_APIKEY');
    if (!phone || !key) { Logger.log('CallMeBot not configured'); return; }
    var text = 'New portfolio message from ' + d.name + ' <' + d.email + '>' + (d.phone ? ' ' + d.phone : '') + ':\n' + d.message.slice(0, 500);
    var url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone) +
      '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(key);
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() >= 300) Logger.log('CallMeBot failed: ' + res.getResponseCode() + ' ' + res.getContentText());
  } catch (err) {
    Logger.log('CallMeBot error: ' + err);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
