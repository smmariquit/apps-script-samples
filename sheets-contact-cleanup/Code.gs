// Contact list cleanup for Google Sheets.
// Reads the active sheet (header row + contacts), writes "Clean", "Duplicates"
// and "Needs review" sheets. The original sheet is never changed.

const COLUMNS = { name: 'Name', email: 'Email', phone: 'Phone', company: 'Company' };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Cleanup').addItem('Clean contacts', 'runCleanup').addToUi();
}

function runCleanup() {
  const ss = SpreadsheetApp.getActive();
  const [header, ...rows] = ss.getActiveSheet().getDataRange().getValues();
  const result = cleanContacts(header, rows);
  writeSheet(ss, 'Clean', header, result.clean);
  writeSheet(ss, 'Duplicates', header.concat('Duplicate of row'), result.duplicates);
  writeSheet(ss, 'Needs review', header.concat('Problem'), result.review);
  ss.toast(`${result.clean.length} clean, ${result.duplicates.length} duplicates, ${result.review.length} to review`);
}

function writeSheet(ss, name, header, rows) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  const data = [header].concat(rows);
  sheet.getRange(1, 1, data.length, header.length).setValues(data);
}

function cleanContacts(header, rows) {
  const col = {};
  for (const key in COLUMNS) col[key] = header.indexOf(COLUMNS[key]);
  const seen = {};
  const clean = [], duplicates = [], review = [];

  rows.forEach((raw, i) => {
    const row = raw.slice();
    const sheetRow = i + 2;
    if (row.every(v => String(v).trim() === '')) return;

    if (col.name >= 0) row[col.name] = titleCase(row[col.name]);
    if (col.company >= 0) row[col.company] = String(row[col.company]).trim().replace(/\s+/g, ' ');
    if (col.email >= 0) row[col.email] = String(row[col.email]).trim().toLowerCase();
    if (col.phone >= 0) row[col.phone] = normalizePhone(row[col.phone]);

    const email = col.email >= 0 ? row[col.email] : '';
    const problem = !email ? 'Missing email'
      : !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) ? 'Invalid email'
      : col.phone >= 0 && row[col.phone] === null ? 'Invalid phone'
      : '';
    if (col.phone >= 0 && row[col.phone] === null) row[col.phone] = raw[col.phone];

    if (problem) review.push(row.concat(problem));
    else if (seen[email]) duplicates.push(row.concat(seen[email]));
    else { seen[email] = sheetRow; clean.push(row); }
  });
  return { clean, duplicates, review };
}

function titleCase(value) {
  return String(value).trim().replace(/\s+/g, ' ').toLowerCase()
    .replace(/(^|[\s'-])\p{L}/gu, c => c.toUpperCase());
}

// Returns +<digits> for 8 to 15 digit numbers, '' when empty, null when unusable.
function normalizePhone(value) {
  const text = String(value).trim();
  if (!text) return '';
  const digits = text.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return (text.startsWith('+') || digits.length > 10 ? '+' : '+1') + digits;
}

if (typeof module !== 'undefined') module.exports = { cleanContacts, titleCase, normalizePhone };
