import type { Lead } from "@eliseai/shared";
import { useId, useState } from "react";

interface Props {
  disabled?: boolean;
  onSubmit: (lead: Lead) => void;
}

const EMPTY: Lead = {
  name: "",
  email: "",
  company: "",
  propertyAddress: "",
  city: "",
  state: "",
  country: "US",
};

export function LeadForm({ disabled, onSubmit }: Props) {
  const [lead, setLead] = useState<Lead>(EMPTY);

  function update<K extends keyof Lead>(key: K, value: Lead[K]) {
    setLead((prev) => ({ ...prev, [key]: value }));
  }

  const valid = !!(
    lead.name &&
    lead.email &&
    lead.company &&
    lead.propertyAddress &&
    lead.city &&
    lead.state
  );

  return (
    <form
      className="card p-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(lead);
      }}
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Single lead</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Enter an inbound lead to run through the enrichment pipeline.
        </p>
      </div>

      <fieldset>
        <legend className="section-title">Contact</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Full name" value={lead.name} onChange={(v) => update("name", v)} placeholder="Sarah Chen" autoComplete="name" />
          <Field label="Email" value={lead.email} onChange={(v) => update("email", v)} placeholder="sarah@greystar.com" type="email" autoComplete="email" />
          <Field label="Company" value={lead.company} onChange={(v) => update("company", v)} placeholder="Greystar" autoComplete="organization" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="section-title">Property</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Street address" value={lead.propertyAddress} onChange={(v) => update("propertyAddress", v)} placeholder="600 Congress Ave" autoComplete="street-address" />
          <Field label="City" value={lead.city} onChange={(v) => update("city", v)} placeholder="Austin" autoComplete="address-level2" />
          <Field label="State" value={lead.state} onChange={(v) => update("state", v)} placeholder="TX" autoComplete="address-level1" />
          <Field label="Country" value={lead.country ?? ""} onChange={(v) => update("country", v)} placeholder="US" autoComplete="country" />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={() => setLead(EMPTY)} disabled={disabled}>
          Clear
        </button>
        <button type="submit" className="btn-primary" disabled={!valid || disabled}>
          {disabled ? "Enriching…" : "Enrich lead"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}
