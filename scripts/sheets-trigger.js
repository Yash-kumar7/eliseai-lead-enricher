/**
 * EliseAI Lead Enricher — Google Sheets trigger
 *
 * One-time setup (GTM engineer):
 *  1. Create a Google Sheet with columns:
 *     A: Name | B: Email | C: Company | D: Property Address | E: City | F: State
 *  2. Extensions → Apps Script → paste this file
 *  3. Set WEBHOOK_URL and WEBHOOK_SECRET below
 *  4. File → Save → publish as template (File → Make a copy, share that link)
 *
 * SDR setup (each rep, one time):
 *  1. Open their copy of the sheet
 *  2. Click "Lead Enricher" menu → "Enable auto-enrichment"
 *  3. Approve the permissions prompt — done forever
 *
 * After setup, SDR just types a lead row. Enrichment fires automatically.
 * Score / Tier / Email Subject / Email Body appear in columns G-J.
 */

const WEBHOOK_URL = "https://YOUR_RENDER_URL/api/webhooks/enrich";
const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

const COL = {
  name: 1, email: 2, company: 3, address: 4, city: 5, state: 6,
  score: 7, tier: 8, emailSubject: 9, emailBody: 10,
};

// ── Menu ──────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Lead Enricher")
    .addItem("Enable auto-enrichment", "setupTrigger")
    .addItem("Enrich this row now", "enrichCurrentRow")
    .addToUi();
}

// ── One-time trigger install (called by SDR via menu) ─────────────────

function setupTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove any existing triggers for this script to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "onLeadAdded")
    .forEach((t) => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("onLeadAdded")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  SpreadsheetApp.getUi().alert(
    "Auto-enrichment enabled! Add a lead row and enrichment will fire automatically."
  );
}

// ── Manual enrichment for current row (via menu) ──────────────────────

function enrichCurrentRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert("Select a lead row (not the header).");
    return;
  }
  enrichRow(sheet, row);
}

// ── Auto trigger ──────────────────────────────────────────────────────

function onLeadAdded(e) {
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  if (row <= 1) return;
  enrichRow(sheet, row);
}

// ── Core enrichment call ──────────────────────────────────────────────

function enrichRow(sheet, row) {
  const values = sheet.getRange(row, 1, 1, 6).getValues()[0];
  const [name, email, company, address, city, state] = values;

  if (!name || !email || !company || !address || !city || !state) return;

  // Skip rows already enriched
  if (sheet.getRange(row, COL.score).getValue()) return;

  // Show "enriching..." placeholder while request is in flight
  sheet.getRange(row, COL.score).setValue("...");

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      headers: { "x-webhook-secret": WEBHOOK_SECRET },
      payload: JSON.stringify({
        name: String(name),
        email: String(email),
        company: String(company),
        propertyAddress: String(address),
        city: String(city),
        state: String(state),
      }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      sheet.getRange(row, COL.score).setValue("Error " + code);
      Logger.log("Webhook error " + code + ": " + response.getContentText());
      return;
    }

    const data = JSON.parse(response.getContentText());

    sheet.getRange(row, COL.score).setValue(data.score);
    sheet.getRange(row, COL.tier).setValue(data.tier);
    sheet.getRange(row, COL.emailSubject).setValue(data.emailSubject);
    sheet.getRange(row, COL.emailBody).setValue(data.emailBody);

    const tierCell = sheet.getRange(row, COL.tier);
    if (data.tier === "Hot")        tierCell.setBackground("#fde8e8").setFontColor("#c0392b");
    else if (data.tier === "Warm")  tierCell.setBackground("#fef3cd").setFontColor("#b7770d");
    else                            tierCell.setBackground("#e8f4f8").setFontColor("#2980b9");

  } catch (err) {
    sheet.getRange(row, COL.score).setValue("Error");
    Logger.log("Enrichment failed: " + err.toString());
  }
}
