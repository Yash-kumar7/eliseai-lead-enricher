/**
 * EliseAI Lead Enricher — Google Form trigger (team / scalable)
 *
 * Architecture:
 *   SDR fills Google Form → response lands in Sheet → this script fires
 *   → enrichment runs → Score / Tier / Email written back to same row
 *
 * Setup (GTM engineer, one time for the whole team):
 *  1. Create a Google Form with exactly these questions (Short answer):
 *       - Name
 *       - Email
 *       - Company
 *       - Property Address
 *       - City
 *       - State
 *  2. Form → Responses tab → Link to Sheets → create a new sheet
 *  3. In that sheet: Extensions → Apps Script → paste this file
 *  4. Set WEBHOOK_URL and WEBHOOK_SECRET below
 *  5. Triggers → Add trigger:
 *       Function: onFormSubmit | Event source: From spreadsheet | Event type: On form submit
 *  6. Share the Form URL with all SDRs — nothing else needed per rep
 *
 * Result columns written back (after the form response columns):
 *   Score | Tier | Email Subject | Email Body
 */

const WEBHOOK_URL = "https://YOUR_RENDER_URL/api/webhooks/enrich";
const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

// Map form question titles to lead fields.
// Must match your Google Form question text exactly.
const FORM_FIELDS = {
  name: "Name",
  email: "Email",
  company: "Company",
  address: "Property Address",
  city: "City",
  state: "State",
};

// ── Form submit trigger ───────────────────────────────────────────────

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const named = e.namedValues;

  function get(key) {
    const val = named[key];
    return val ? String(val[0]).trim() : "";
  }

  const name    = get(FORM_FIELDS.name);
  const email   = get(FORM_FIELDS.email);
  const company = get(FORM_FIELDS.company);
  const address = get(FORM_FIELDS.address);
  const city    = get(FORM_FIELDS.city);
  const state   = get(FORM_FIELDS.state);

  if (!name || !email || !company || !address || !city || !state) {
    Logger.log("Incomplete form submission, skipping row " + row);
    return;
  }

  // Find the last column in the header row and write result headers if missing
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let scoreCol = headers.indexOf("Score") + 1;
  if (scoreCol === 0) {
    scoreCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, scoreCol).setValue("Score");
    sheet.getRange(1, scoreCol + 1).setValue("Tier");
    sheet.getRange(1, scoreCol + 2).setValue("Email Subject");
    sheet.getRange(1, scoreCol + 3).setValue("Email Body");
  }

  // Show "enriching..." while request is in flight
  sheet.getRange(row, scoreCol).setValue("...");

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-webhook-secret": WEBHOOK_SECRET },
      payload: JSON.stringify({ name, email, company, propertyAddress: address, city, state }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      sheet.getRange(row, scoreCol).setValue("Error " + code);
      Logger.log("Webhook error " + code + ": " + response.getContentText());
      return;
    }

    const data = JSON.parse(response.getContentText());

    sheet.getRange(row, scoreCol).setValue(data.score);
    sheet.getRange(row, scoreCol + 1).setValue(data.tier);
    sheet.getRange(row, scoreCol + 2).setValue(data.emailSubject);
    sheet.getRange(row, scoreCol + 3).setValue(data.emailBody);

    const tierCell = sheet.getRange(row, scoreCol + 1);
    if (data.tier === "Hot")        tierCell.setBackground("#fde8e8").setFontColor("#c0392b");
    else if (data.tier === "Warm")  tierCell.setBackground("#fef3cd").setFontColor("#b7770d");
    else                            tierCell.setBackground("#e8f4f8").setFontColor("#2980b9");

    // Send email to SDR with the draft (optional — remove if not needed)
    const submitterEmail = get(FORM_FIELDS.email);
    if (submitterEmail && data.emailBody) {
      sendDraftToSdr(submitterEmail, name, data);
    }

  } catch (err) {
    sheet.getRange(row, scoreCol).setValue("Error");
    Logger.log("Enrichment failed: " + err.toString());
  }
}

// ── Optional: email the draft back to whoever submitted the form ───────

function sendDraftToSdr(sdrEmail, leadName, data) {
  try {
    GmailApp.sendEmail(
      sdrEmail,
      "[EliseAI] Draft ready: " + data.emailSubject,
      "Lead: " + leadName + "\nScore: " + data.score + " (" + data.tier + ")\n\n" + data.emailBody
    );
  } catch (err) {
    Logger.log("Email send failed: " + err.toString());
  }
}
