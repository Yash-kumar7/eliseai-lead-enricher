# EliseAI Lead Enricher

Automated top-of-funnel SDR tool for EliseAI. Takes an inbound lead (name, email, company, property address), enriches it with **5 public APIs**, scores it against the multifamily ICP across **7 signals**, and drafts a personalized outreach email - all in under 30 seconds.

Built for the GTM Engineer practical assignment.

## What it does

1. **Input** - single lead form, CSV batch (≤50 rows), scheduled inbox (daily cron), or Google Sheets trigger
2. **Enrich** - 5 free APIs fire in parallel per lead:
   - **US Census Geocoder + ACS 5-year** - population, renter %, median rent, median HH income (no key required)
   - **NewsAPI** - 3 most recent headlines about the company
   - **Wikipedia REST** - company page existence + summary
   - **OpenWeather** - current conditions at city (icebreaker, not scored)
   - **FRED** (Federal Reserve) - national rental vacancy rate
3. **Score** - 0–100 weighted for multifamily AI fit:

   | Signal | Points |
   |---|---|
   | Renter occupied share | 25 |
   | City/metro population | 20 |
   | Median rent | 14 |
   | Wikipedia presence | 13 |
   | Recent news (≤90d) | 12 |
   | Median HH income | 8 |
   | FRED rental vacancy | 8 |
   | **Total** | **100** |

   Tiers: **Hot ≥75 · Warm 50–74 · Cold <50**

4. **Draft email** - deterministic template by default; upgrades to any OpenAI-compatible LLM via three env vars
5. **Output** - scored table, per-lead drawer with breakdown + editable email + copy button, CSV export

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example backend/.env
# Fill in NEWSAPI_KEY + OPENWEATHER_KEY (Census and Wikipedia are keyless)

# 3. Start (two terminals)
npm run dev --workspace=@eliseai/backend    # http://localhost:8000
npm run dev --workspace=@eliseai/frontend   # http://localhost:5200
```

Open `http://localhost:5200`, click **Try the demo**, then **Load sample leads** → **Run now**.

## API keys

| API | Required | Signup |
|---|---|---|
| NewsAPI | Yes | https://newsapi.org/register |
| OpenWeather | Yes | https://home.openweathermap.org/users/sign_up |
| FRED | Optional | https://fred.stlouisfed.org/docs/api/api_key.html |
| Census | No - keyless | https://api.census.gov/data/key_signup.html |
| Wikipedia | No - keyless | - |

## LLM email drafting (optional)

Template email used by default (no API cost). To upgrade, set three env vars:

```bash
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

Works with any OpenAI-compatible endpoint:

| Provider | `LLM_BASE_URL` | Model example |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-5.4` |
| Anthropic | `https://api.anthropic.com/v1` | `claude-sonnet-4-6` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| Fireworks.ai | `https://api.fireworks.ai/inference/v1` | `fireworks/qwen3p6-plus` |
| Ollama (local) | `http://localhost:11434/v1` | `llama3.1` |
| Ollama (cloud) | `https://ollama.com/v1` | `gemma4:31b-cloud` |

On any LLM failure the pipeline silently falls back to the template - leads always get a drafted email.

## Scheduled (cron) mode

Via the **Scheduled** tab in the UI:
- Drop CSVs into the inbox
- Click **Run now** or wait for the daily 9 AM cron
- Enriched output appears in the outbox with download links

Or via CLI:

```bash
npm run cron --workspace=@eliseai/backend
```

## Google Sheets integration

See the **Integrations** tab in the UI for ready-to-paste Apps Script snippets:

- **Per-SDR sheet** - `onEdit` trigger fires when a new row is added, enrichment writes scores + email draft back to the same row
- **Team form** - `onFormSubmit` trigger processes Google Form submissions automatically

## Architecture

```
.
├── shared/      TS types shared by frontend + backend
├── backend/     Fastify API (src/server.ts) + cron (src/scheduled-run.ts)
│               Both call the same src/pipeline.ts
└── frontend/    Vite + React + Tailwind SPA
```

Key files:

| File | Purpose |
|---|---|
| `backend/src/pipeline.ts` | Orchestrator - 5 API calls in parallel per lead |
| `backend/src/score.ts` | All scoring logic + signal weights |
| `backend/src/outreach.ts` | Template email + LLM path |
| `backend/src/llm/` | Provider factory (any OpenAI-compatible endpoint) |
| `backend/src/enrich/` | One file per API, fail-soft on errors |
| `frontend/src/App.tsx` | UI entry point |
| `frontend/src/components/` | Tabs, drawer, results table, pipeline progress |

## Operational notes

- **Fail-soft** - if one API is down, pipeline continues; affected fields are `null`; score uses remaining signals
- **Caching** - responses cached 24h in `.cache/` keyed by request hash; reruns during demo are instant
- **Rate limits** - NewsAPI free tier 100 req/day; batch capped at 50 leads
- **PII** - no email bodies logged; enriched output stays on local disk
- **Deployment** - single Render service: backend serves the built frontend in production (`NODE_ENV=production`)

## Deploy to Render

```bash
# Build command
npm install && npm run build --workspace=@eliseai/frontend

# Start command
NODE_ENV=production npm run start --workspace=@eliseai/backend
```

Set env vars in Render dashboard: `NEWSAPI_KEY`, `OPENWEATHER_KEY`, `FRED_KEY`, and optionally `LLM_BASE_URL` + `LLM_API_KEY` + `LLM_MODEL`.
