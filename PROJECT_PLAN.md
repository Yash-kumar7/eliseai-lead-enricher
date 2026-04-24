# Rollout Plan: EliseAI Lead Enricher

## Goal

Replace 20 to 30 minutes of manual SDR research per inbound lead with an automated pipeline that produces a tiered score, sales insights, and a first draft outreach email, while keeping the rep in the loop for the final send.

## Success metrics

| Metric | Target | Measure |
|---|---|---|
| Research time per lead | down ≥ 40% | SDR self report + observed timing in pilot |
| Draft email reuse | ≥ 60% of Hot tier drafts sent with <30% edits | Git style diff on SDR sent version |
| Hot tier → SQL rate | ≥ 1.5× baseline | CRM conversion dashboard |
| Reply rate (tool vs manual) | ≥ parity | A/B within pilot pod |
| Tool latency | < 30s per lead end to end | Server logs |

If Hot tier doesn't outperform baseline in pilot, the **scoring weights are wrong** and we retune, not the tool.

## Timeline (6 weeks)

### Week 1: MVP validation (internal, zero risk)

- Freeze MVP (this repo). Deployed at https://eliseai-lead-enricher.onrender.com.
- Pull 50 historic inbound leads from CRM (~3 months old, so we know the outcomes).
- Run tool on all 50 offline.
- **Compare against ground truth:**
  - Did Hot tier leads actually convert to SQL at a higher rate?
  - For leads that closed won, did the tool's draft email match what the SDR actually sent?
- Output: a calibration report showing tier vs outcome correlation. If weak, retune weights before moving on.
- **Stakeholders:** me + 1 RevOps partner + 1 senior SDR for spot checking drafts.

### Week 2: Closed pilot (2 friendly SDRs)

- 2 SDRs use the tool on **live inbound leads**, parallel to their normal process.
- Daily: 15 min sync on what worked, what was wrong, what's missing.
- Weights + email template tuned daily based on real feedback.
- Deliberately keep it to 2 reps, small enough to iterate fast, honest signal.
- **Exit criterion:** both SDRs say it saves ≥ 10 min per lead and they'd keep using it.

### Weeks 3 to 4: Team pilot (one SDR pod, ~5 reps)

- Onboard the whole pod. 30 min training + written runbook.
- **Integration work (parallel track with RevOps):**
  - Wire Salesforce/HubSpot webhook → `scheduled-run.ts` → CRM write back of score + tier (read only to the rep).
  - Logging of adoption (drafts opened, copied, sent).
  - Google Sheets auto-enrichment already shipped: onEdit trigger fires when all 6 fields are filled, writes score + tier + email draft back to the row.
- Weekly retro. Manager gets a dashboard showing per rep usage and draft send rates.
- **Exit criterion:** pod adoption > 70%, latency stable, no data handling issues flagged.

### Weeks 5 to 6: GA rollout

- All SDRs onboarded. Training is now a recorded video + runbook.
- Post GA, tool runs on cron: every new CRM lead gets pre enriched overnight so reps see the score in the CRM at 9am.
- Public dashboard: adoption, average score to SQL conversion, minutes per lead saved.
- Next quarter: scope CRM native integration (e.g., Salesforce Lightning card) if adoption holds.

## Stakeholders

| Role | Involvement |
|---|---|
| **SDR manager** | Sponsor, unblocks pilot reps, owns adoption metric |
| **SDR team (2 pilot, then pod, then all)** | Primary users, give feedback, own draft quality judgment |
| **RevOps / Sales Ops** | Scoring calibration against historical conversion, CRM integration, reporting dashboards |
| **Sales leadership** | Executive sponsor, approves GA, unblocks budget (Anthropic key, hosting if needed) |
| **IT / Security** | Key management (.env → secret manager before GA), PII/data handling review, lead emails and property addresses are PII |
| **Marketing** | Reviews email copy for brand/tone consistency, owns the positioning block injected into Claude prompt |
| **Engineering (for GA)** | Containerize, deploy, auth, on call rotation |

## Testing the MVP

1. **Unit level**: each enrich module has a fail soft contract: bad key → returns empty data. Verified manually by running with one key missing at a time.
2. **Historical replay**: run tool on 50 known leads, compare tiers to actual outcomes (Week 1 above). This is the most important test.
3. **Draft quality**: 10 random Hot tier leads, senior SDR rates each email 1 to 5 on usefulness. Target: median ≥ 4.
4. **Load**: 50 lead batch finishes in < 3 min with 5-worker concurrency (tested; NewsAPI free tier is the bottleneck at scale).
5. **Failure injection**: break each API key in turn, verify UI still shows graceful "N/A" + enrichment warnings section.

## Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scoring weights don't match reality | High | High | Week 1 historical replay **before** any SDR sees the tool |
| SDRs over trust Hot tier, ignore Warm/Cold | Medium | Medium | Show score breakdown, not just the tier; manager coaches against "Hot only cherry picking" |
| Draft emails sound LLM generated | Medium | High | Template is the default (deterministic); Claude path has explicit anti fluff rules; manual spot check in pilot |
| NewsAPI free tier (100/day) blocks batch | Low | Medium | Cache 24h; batch cap at 50; upgrade plan budgeted before GA if needed |
| Lead PII leaks (CSVs on disk, logs) | Low | High | No email body logging; `.cache/` in `.gitignore`; IT review at end of Week 2 before pod pilot |
| Census county level granularity misses dense tracts | Low | Low | Acceptable for MVP; swap to tract level in v1.1 if RevOps asks |

## What's explicitly out of scope for MVP

- **CRM write back**: added in Weeks 3 to 4 pilot.
- **Authentication on the web UI**: it's local only during pilot. Add SSO for GA.
- **Paid data (Clearbit, ZoomInfo, Apollo)**: the assignment mandates free APIs and this validates the model before we pay. Can layer in later.
- **Mobile / Slack integration**: SDRs work in CRM + browser; revisit if requests come in.
