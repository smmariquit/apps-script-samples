// Run with: node test.js
const assert = require('assert');
const mod = { exports: {} };
new Function('module', require('fs').readFileSync(__dirname + '/Code.gs', 'utf8'))(mod);
const { cleanContacts, titleCase, normalizePhone } = mod.exports;

assert.strictEqual(titleCase('  mary-ann   o\'neil '), "Mary-Ann O'Neil");
assert.strictEqual(normalizePhone('(555) 123-4567'), '+15551234567');
assert.strictEqual(normalizePhone('+63 917 123 4567'), '+639171234567');
assert.strictEqual(normalizePhone('123'), null);
assert.strictEqual(normalizePhone(''), '');

const header = ['Name', 'Email', 'Phone', 'Company'];
const rows = [
  ['jane DOE', ' Jane@Acme.com ', '555 123 4567', 'Acme  Inc'],
  ['Jane Doe', 'jane@acme.com', '', 'Acme'],
  ['bob', '', '555 000 1111', 'Bobco'],
  ['', '', '', ''],
  ['Ann Lee', 'ann@x', '', ''],
  ['Raj', 'raj@site.io', '12', 'Site'],
];
const r = cleanContacts(header, rows);
assert.deepStrictEqual(r.clean, [['Jane Doe', 'jane@acme.com', '+15551234567', 'Acme Inc']]);
assert.deepStrictEqual(r.duplicates, [['Jane Doe', 'jane@acme.com', '', 'Acme', 2]]);
assert.deepStrictEqual(r.review.map(x => x[x.length - 1]), ['Missing email', 'Invalid email', 'Invalid phone']);
assert.strictEqual(r.review[2][2], '12');
console.log('ok');
