# Automation samples

These are small Google Apps Script builds that show the kind of work I deliver. Each folder has a `Code.gs` to paste into the Apps Script editor and a `test.js` that runs the logic with `node test.js`.

- `sheets-contact-cleanup` adds a Cleanup menu to a sheet. It fixes name, email and phone formats, then splits the rows into clean contacts, duplicates and rows that need review. The original sheet stays untouched.
- `lead-webhook` is a web app URL that any form or tool can post to. It checks the email, skips repeat leads, adds the lead to a sheet and posts it to Slack.
