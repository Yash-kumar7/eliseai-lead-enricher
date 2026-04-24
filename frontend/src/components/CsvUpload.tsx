import { ArrowRight, FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { COLOR, tint } from "../theme.ts";

interface Props {
  disabled?: boolean;
  onEnrich: (csv: string, isSample: boolean) => void;
}

const SAMPLE_URL = "/sample_leads.csv";
const SAMPLE_FILENAME = "sample_leads.csv";

function countRows(csv: string): number {
  const lines = csv.trim().split(/\r?\n/);
  return Math.max(0, lines.length - 1);
}

interface Staged {
  csv: string;
  filename: string;
  isSample: boolean;
  rows: number;
}

export function CsvUpload({ disabled, onEnrich }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<Staged | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    setStaged({
      csv: text,
      filename: file.name,
      isSample: false,
      rows: countRows(text),
    });
  }

  async function loadSample() {
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) throw new Error(`fetch ${SAMPLE_URL} → ${res.status}`);
      const text = await res.text();
      setStaged({
        csv: text,
        filename: SAMPLE_FILENAME,
        isSample: true,
        rows: countRows(text),
      });
    } catch (err) {
      console.error("[sample load]", err);
    }
  }

  function clearStaged() {
    setStaged(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function fireEnrich() {
    if (!staged || disabled) return;
    onEnrich(staged.csv, staged.isSample);
  }

  function openPicker() {
    if (!disabled) fileRef.current?.click();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }

  const zoneClass = [
    "relative rounded-2xl border-2 border-dashed p-12 text-center",
    "transition-colors duration-200",
    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
    dragging
      ? "border-[#7638fa] bg-[#7638fa]/5"
      : "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-brand-50/40 hover:border-[#7638fa]/60 dark:border-zinc-700 dark:from-zinc-950 dark:via-zinc-900 dark:to-brand-950/20",
  ].join(" ");

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Batch upload</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            CSV with columns{" "}
            <code className="mono text-xs bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 px-1.5 py-0.5 rounded">
              name, email, company, propertyAddress, city, state
            </code>
            . Up to 50 leads per batch.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1.5 shrink-0"
          onClick={loadSample}
          disabled={disabled}
        >
          Load sample leads
        </button>
      </div>

      {staged ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: tint(COLOR.emerald) }}
            >
              <FileSpreadsheet size={24} style={{ color: COLOR.emerald }} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-base font-medium text-slate-900 dark:text-zinc-100 truncate">
                  {staged.filename}
                </p>
                {staged.isSample && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wide">
                    sample
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                <span className="mono font-semibold text-slate-700 dark:text-zinc-300">
                  {staged.rows}
                </span>{" "}
                {staged.rows === 1 ? "lead" : "leads"} ready to enrich
              </p>
            </div>
            <button
              type="button"
              onClick={clearStaged}
              disabled={disabled}
              aria-label="Clear staged file"
              className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors shrink-0"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={fireEnrich}
            disabled={disabled}
            className="btn-primary w-full mt-5 justify-center"
          >
            Enrich {staged.rows} {staged.rows === 1 ? "lead" : "leads"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload CSV file"
          aria-disabled={disabled || undefined}
          className={zoneClass}
          onClick={openPicker}
          onKeyDown={onKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (disabled) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: tint(COLOR.brand) }}
          >
            <Upload size={28} style={{ color: COLOR.brand }} aria-hidden="true" />
          </div>
          <p className="text-base font-medium text-slate-900 dark:text-zinc-100">
            {dragging ? "Drop it here" : "Drop a CSV, or click to browse"}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1.5">
            Supports .csv files up to 5 MB
          </p>
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLOR.brand }} aria-hidden="true" />
              Up to 50 leads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLOR.brand }} aria-hidden="true" />
              Auto-scored
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLOR.brand }} aria-hidden="true" />
              Email drafted
            </span>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
