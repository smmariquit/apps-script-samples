// Lead capture webhook for Google Sheets and Slack.
// Deploy as a web app, then point any form or tool (Webflow, Typeform, Zapier) at its URL.
// Script properties: SHEET_ID, SLACK_WEBHOOK_URL (optional).

const HEADER = ['Received', 'Name', 'Email', 'Phone', 'Message', 'Source'];

function doPost(e) {
  const body = e.postData && e.postData.type === 'application/json'
    ? JSON.parse(e.postData.contents) : e.parameter;
  const lead = buildLead(body, new Date());
  if (lead.error) return reply({ ok: false, error: lead.error });

  const props = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const emails = sheet.getLastRow() > 1
      ? sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues().map(r => r[0]) : [];
    if (emails.includes(lead.email)) return reply({ ok: true, duplicate: true });
    sheet.appendRow(lead.row);
  } finally {
    lock.releaseLock();
  }

  const slack = props.getProperty('SLACK_WEBHOOK_URL');
  if (slack) UrlFetchApp.fetch(slack, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ text: slackText(lead) }), muteHttpExceptions: true,
  });
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function buildLead(body, now) {
  const pick = (...keys) => String(keys.map(k => body[k]).find(v => v != null && v !== '') || '').trim();
  const email = pick('email', 'Email', 'email_address').toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return { error: 'valid email required' };
  const name = pick('name', 'Name', 'full_name') || [pick('first_name'), pick('last_name')].join(' ').trim();
  const phone = pick('phone', 'Phone', 'phone_number');
  const message = pick('message', 'Message', 'notes').slice(0, 2000);
  const source = pick('source', 'utm_source') || 'website';
  return { email, name, phone, message, source, row: [now, name, email, phone, message, source] };
}

function slackText(lead) {
  return `New lead from ${lead.source}: *${lead.name || 'No name'}* (${lead.email}${lead.phone ? ', ' + lead.phone : ''})`
    + (lead.message ? `\n> ${lead.message.slice(0, 300)}` : '');
}

if (typeof module !== 'undefined') module.exports = { buildLead, slackText };
