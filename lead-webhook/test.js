// Run with: node test.js
const assert = require('assert');
const mod = { exports: {} };
new Function('module', require('fs').readFileSync(__dirname + '/Code.gs', 'utf8'))(mod);
const { buildLead, slackText } = mod.exports;

const now = new Date('2026-11-19T00:00:00Z');
assert.deepStrictEqual(buildLead({ email: 'nope' }, now), { error: 'valid email required' });

const a = buildLead({ first_name: 'Ana', last_name: 'Cruz', Email: ' Ana@Shop.COM ', utm_source: 'ads' }, now);
assert.strictEqual(a.email, 'ana@shop.com');
assert.strictEqual(a.name, 'Ana Cruz');
assert.deepStrictEqual(a.row, [now, 'Ana Cruz', 'ana@shop.com', '', '', 'ads']);
assert.strictEqual(slackText(a), 'New lead from ads: *Ana Cruz* (ana@shop.com)');

const b = buildLead({ name: 'Bo', email: 'bo@x.io', phone: '555', message: 'hi' }, now);
assert.strictEqual(b.source, 'website');
assert.strictEqual(slackText(b), 'New lead from website: *Bo* (bo@x.io, 555)\n> hi');
console.log('ok');
