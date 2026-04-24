export interface Lead {
  name: string;
  email: string;
  company: string;
  propertyAddress: string;
  city: string;
  state: string;
  country?: string;
}

export interface CensusData {
  population: number | null;
  renterOccupiedPct: number | null;
  medianRent: number | null;
  medianHouseholdIncome: number | null;
  geography: {
    state: string | null;
    county: string | null;
    tract: string | null;
  };
}

export interface NewsHeadline {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsData {
  headlines: NewsHeadline[];
  mostRecentDaysAgo: number | null;
}

export interface WikipediaData {
  companyPage: {
    exists: boolean;
    summary: string | null;
    url: string | null;
  };
  cityPage: {
    exists: boolean;
    summary: string | null;
    url: string | null;
  };
}

export interface WeatherData {
  description: string | null;
  tempF: number | null;
}

export interface FredData {
  rentalVacancyRate: number | null; // percentage, e.g. 6.4
  period: string | null;            // e.g. "2024-10-01"
}

export type Tier = "Hot" | "Warm" | "Cold";

export interface ScoreBreakdown {
  signal: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface Score {
  total: number;
  tier: Tier;
  breakdown: ScoreBreakdown[];
  reasons: string[];
}

/** "template" when the deterministic fallback was used, else the LLM provider name (anthropic|openai|fireworks|groq|…). */
export type EmailSource = string;

export interface OutreachEmail {
  subject: string;
  body: string;
  source: EmailSource;
  model?: string;
}

export interface EnrichedLead {
  lead: Lead;
  enrichment: {
    census: CensusData | null;
    news: NewsData | null;
    wikipedia: WikipediaData | null;
    weather: WeatherData | null;
    fred: FredData | null;
  };
  score: Score;
  email: OutreachEmail;
  errors: string[];
  enrichedAt: string;
}
