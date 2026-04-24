import { Check, Copy, FileSpreadsheet, Users } from "lucide-react";
import { useState } from "react";
import { COLOR, tint } from "../theme.ts";

const SHEET_SCRIPT = (webhookUrl: string) => `const WEBHOOK_URL = "${webhookUrl}";
const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

const COL = {
  name: 1, email: 2, company: 3, address: 4, city: 5, state: 6,
  score: 7, tier: 8, emailSubject: 9, emailBody: 10,
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Lead Enricher")
    .addItem("Enable auto-enrichment", "setupTrigger")
    .addItem("Enrich this row now", "enrichCurrentRow")
    .addToUi();
}

function setupTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "onLeadAdded")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onLeadAdded").forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert("Auto-enrichment enabled!");
}

function enrichCurrentRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  if (row <= 1) return;
  enrichRow(sheet, row);
}

function onLeadAdded(e) {
  enrichRow(e.source.getActiveSheet(), e.range.getRow());
}

function enrichRow(sheet, row) {
  const [name, email, company, address, city, state] =
    sheet.getRange(row, 1, 1, 6).getValues()[0];
  if (!name || !email || !company || !address || !city || !state) return;
  if (sheet.getRange(row, COL.score).getValue()) return;
  sheet.getRange(row, COL.score).setValue("...");
  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json",
    headers: { "x-webhook-secret": WEBHOOK_SECRET },
    payload: JSON.stringify({ name, email, company, propertyAddress: address, city, state }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    sheet.getRange(row, COL.score).setValue("Error " + res.getResponseCode());
    return;
  }
  const d = JSON.parse(res.getContentText());
  sheet.getRange(row, COL.score).setValue(d.score);
  sheet.getRange(row, COL.tier).setValue(d.tier);
  sheet.getRange(row, COL.emailSubject).setValue(d.emailSubject);
  sheet.getRange(row, COL.emailBody).setValue(d.emailBody);
  const c = sheet.getRange(row, COL.tier);
  if (d.tier === "Hot") c.setBackground("#fde8e8").setFontColor("#c0392b");
  else if (d.tier === "Warm") c.setBackground("#fef3cd").setFontColor("#b7770d");
  else c.setBackground("#e8f4f8").setFontColor("#2980b9");
}`;

const FORM_SCRIPT = (webhookUrl: string) => `const WEBHOOK_URL = "${webhookUrl}";
const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET";

// Form question titles must match exactly:
const FORM_FIELDS = {
  name: "Name", email: "Email", company: "Company",
  address: "Property Address", city: "City", state: "State",
};

function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const named = e.namedValues;
  const get = (k) => named[k] ? String(named[k][0]).trim() : "";

  const name = get(FORM_FIELDS.name), email = get(FORM_FIELDS.email),
    company = get(FORM_FIELDS.company), address = get(FORM_FIELDS.address),
    city = get(FORM_FIELDS.city), state = get(FORM_FIELDS.state);

  if (!name || !email || !company || !address || !city || !state) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let scoreCol = headers.indexOf("Score") + 1;
  if (scoreCol === 0) {
    scoreCol = sheet.getLastColumn() + 1;
    ["Score","Tier","Email Subject","Email Body"].forEach((h, i) =>
      sheet.getRange(1, scoreCol + i).setValue(h));
  }

  sheet.getRange(row, scoreCol).setValue("...");
  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post", contentType: "application/json",
    headers: { "x-webhook-secret": WEBHOOK_SECRET },
    payload: JSON.stringify({ name, email, company, propertyAddress: address, city, state }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    sheet.getRange(row, scoreCol).setValue("Error " + res.getResponseCode());
    return;
  }
  const d = JSON.parse(res.getContentText());
  sheet.getRange(row, scoreCol).setValue(d.score);
  sheet.getRange(row, scoreCol + 1).setValue(d.tier);
  sheet.getRange(row, scoreCol + 2).setValue(d.emailSubject);
  sheet.getRange(row, scoreCol + 3).setValue(d.emailBody);
  const c = sheet.getRange(row, scoreCol + 1);
  if (d.tier === "Hot") c.setBackground("#fde8e8").setFontColor("#c0392b");
  else if (d.tier === "Warm") c.setBackground("#fef3cd").setFontColor("#b7770d");
  else c.setBackground("#e8f4f8").setFontColor("#2980b9");
}`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors duration-150"
    >
      {copied ? <Check size={12} style={{ color: COLOR.emerald }} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2.5 right-2.5 z-10">
        <CopyButton text={code} />
      </div>
      <pre className="text-[11px] leading-relaxed font-mono bg-slate-950 dark:bg-zinc-950 text-slate-300 rounded-xl p-4 pr-20 overflow-x-auto max-h-64 border border-slate-800">
        {code}
      </pre>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-zinc-400">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: tint(COLOR.brand), color: COLOR.brand }}
      >
        {n}
      </span>
      {text}
    </li>
  );
}

export function IntegrationsPanel() {
  const webhookUrl = `${window.location.origin}/api/webhooks/enrich`;

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div className="card p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Webhook endpoint</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          All integrations call this URL. Set <code className="mono text-xs">WEBHOOK_SECRET</code> in your environment to secure it.
        </p>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-2.5">
          <code className="mono text-sm flex-1 text-slate-700 dark:text-zinc-300 truncate">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Per-SDR sheet */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tint(COLOR.blue) }}>
              <FileSpreadsheet size={18} style={{ color: COLOR.blue }} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Per-SDR sheet</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Each rep has their own sheet</p>
            </div>
          </div>
          <ol className="space-y-2">
            <Step n={1} text="Create a Google Sheet with columns: Name | Email | Company | Property Address | City | State" />
            <Step n={2} text="Extensions → Apps Script → paste the script below → Save" />
            <Step n={3} text='Set WEBHOOK_SECRET to match your environment variable' />
            <Step n={4} text="Share the sheet with your SDR. They click Lead Enricher → Enable auto-enrichment once" />
            <Step n={5} text="SDR types a row, enrichment fires automatically" />
          </ol>
          <CodeBlock code={SHEET_SCRIPT(webhookUrl)} />
        </div>

        {/* Team form */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tint(COLOR.emerald) }}>
              <Users size={18} style={{ color: COLOR.emerald }} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Team form</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500">One form, all SDRs, manager visibility</p>
            </div>
          </div>
          <ol className="space-y-2">
            <Step n={1} text="Create a Google Form with: Name, Email, Company, Property Address, City, State (all Short answer)" />
            <Step n={2} text="Responses tab → Link to Sheets → create new sheet" />
            <Step n={3} text="In that sheet: Extensions → Apps Script → paste script below → Save" />
            <Step n={4} text='Triggers → Add trigger → onFormSubmit | From spreadsheet | On form submit' />
            <Step n={5} text="Share the form URL with all SDRs. Zero per-rep setup needed" />
          </ol>
          <CodeBlock code={FORM_SCRIPT(webhookUrl)} />
        </div>
      </div>
    </div>
  );
}
