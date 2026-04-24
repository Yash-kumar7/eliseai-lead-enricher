import type {
  CensusData,
  FredData,
  NewsData,
  Score,
  ScoreBreakdown,
  Tier,
  WikipediaData,
} from "@eliseai/shared";

/**
 * Scoring model: EliseAI ICP for multifamily AI leasing assistant.
 *
 * Signals weighted by how much they predict a good fit:
 *   • Renter occupied share: strongest multifamily TAM signal (25pts)
 *   • City/metro population: more units likely under mgmt (20pts)
 *   • Median rent: class A/B stock proxy (14pts)
 *   • Wikipedia presence: scale / established company (13pts)
 *   • Recent news (<=90d): activity + timing hook (12pts)
 *   • Median HH income: affordability of AI tools (8pts)
 *   • FRED rental vacancy: market tightness indicator (8pts)
 *
 * Total 100. Tiers: Hot >=75, Warm >=50, Cold <50.
 * Missing signals contribute 0: does not auto penalize; reasons[] notes gaps.
 */

function tierFromScore(score: number): Tier {
  if (score >= 75) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}

function scorePopulation(pop: number | null): ScoreBreakdown {
  const max = 20;
  if (pop === null) {
    return {
      signal: "Population",
      points: 0,
      maxPoints: max,
      reason: "Population unknown (Census lookup failed)",
    };
  }
  let pts = 0;
  let reason: string;
  if (pop >= 1_000_000) {
    pts = max;
    reason = `Large metro (pop ${Math.round(pop / 1000)}k), strong unit volume`;
  } else if (pop >= 500_000) {
    pts = 16;
    reason = `Mid size metro (pop ${Math.round(pop / 1000)}k)`;
  } else if (pop >= 150_000) {
    pts = 9;
    reason = `Smaller metro (pop ${Math.round(pop / 1000)}k)`;
  } else if (pop >= 50_000) {
    pts = 4;
    reason = `Small city (pop ${Math.round(pop / 1000)}k), limited TAM`;
  } else {
    pts = 0;
    reason = `Rural/small town (pop ${pop}), low priority`;
  }
  return { signal: "Population", points: pts, maxPoints: max, reason };
}

function scoreRenter(pct: number | null): ScoreBreakdown {
  const max = 25;
  if (pct === null) {
    return {
      signal: "Renter share",
      points: 0,
      maxPoints: max,
      reason: "Renter % unknown",
    };
  }
  let pts = 0;
  let reason: string;
  if (pct >= 50) {
    pts = max;
    reason = `${pct.toFixed(0)}% renter occupied, dense multifamily market`;
  } else if (pct >= 40) {
    pts = 17;
    reason = `${pct.toFixed(0)}% renter occupied, good multifamily mix`;
  } else if (pct >= 30) {
    pts = 10;
    reason = `${pct.toFixed(0)}% renter occupied, moderate renter share`;
  } else {
    pts = 2;
    reason = `${pct.toFixed(0)}% renter occupied, predominantly owner occupied`;
  }
  return { signal: "Renter share", points: pts, maxPoints: max, reason };
}

function scoreMedianRent(rent: number | null): ScoreBreakdown {
  const max = 14;
  if (rent === null) {
    return {
      signal: "Median rent",
      points: 0,
      maxPoints: max,
      reason: "Median rent unknown",
    };
  }
  let pts = 0;
  let reason: string;
  if (rent >= 2000) {
    pts = max;
    reason = `$${rent}/mo median rent, class A market`;
  } else if (rent >= 1500) {
    pts = 10;
    reason = `$${rent}/mo median rent, class A/B market`;
  } else if (rent >= 1000) {
    pts = 7;
    reason = `$${rent}/mo median rent, workforce housing`;
  } else {
    pts = 2;
    reason = `$${rent}/mo median rent, budget market`;
  }
  return { signal: "Median rent", points: pts, maxPoints: max, reason };
}

function scoreIncome(income: number | null): ScoreBreakdown {
  const max = 8;
  if (income === null) {
    return {
      signal: "Median income",
      points: 0,
      maxPoints: max,
      reason: "Median income unknown",
    };
  }
  let pts = 0;
  let reason: string;
  if (income >= 90_000) {
    pts = max;
    reason = `$${Math.round(income / 1000)}k median HH income, affluent market`;
  } else if (income >= 65_000) {
    pts = 6;
    reason = `$${Math.round(income / 1000)}k median HH income`;
  } else if (income >= 45_000) {
    pts = 3;
    reason = `$${Math.round(income / 1000)}k median HH income`;
  } else {
    pts = 1;
    reason = `$${Math.round(income / 1000)}k median HH income, lower purchasing power`;
  }
  return { signal: "Median income", points: pts, maxPoints: max, reason };
}

function scoreWikipedia(wiki: WikipediaData | null): ScoreBreakdown {
  const max = 13;
  if (!wiki?.companyPage.exists) {
    return {
      signal: "Wikipedia",
      points: 0,
      maxPoints: max,
      reason: "No Wikipedia page (smaller/newer company)",
    };
  }
  return {
    signal: "Wikipedia",
    points: max,
    maxPoints: max,
    reason: "Has Wikipedia page (established brand)",
  };
}

function scoreNews(news: NewsData | null): ScoreBreakdown {
  const max = 12;
  if (!news || news.headlines.length === 0) {
    return {
      signal: "Recent news",
      points: 0,
      maxPoints: max,
      reason: "No recent news found",
    };
  }
  const days = news.mostRecentDaysAgo ?? 999;
  if (days <= 30) {
    return {
      signal: "Recent news",
      points: max,
      maxPoints: max,
      reason: `News in last 30 days, strong timing hook: "${news.headlines[0].title.slice(0, 80)}"`,
    };
  }
  if (days <= 90) {
    return {
      signal: "Recent news",
      points: 9,
      maxPoints: max,
      reason: `News in last 90 days: "${news.headlines[0].title.slice(0, 80)}"`,
    };
  }
  return {
    signal: "Recent news",
    points: 2,
    maxPoints: max,
    reason: `Only stale news (${days}d old)`,
  };
}

function scoreFred(fred: FredData | null): ScoreBreakdown {
  const max = 8;
  const rate = fred?.rentalVacancyRate ?? null;
  if (rate === null) {
    return {
      signal: "Rental vacancy",
      points: 0,
      maxPoints: max,
      reason: "National rental vacancy data unavailable",
    };
  }
  let pts = 0;
  let reason: string;
  if (rate < 5) {
    pts = max;
    reason = `National rental vacancy ${rate}%,very tight market, strong demand`;
  } else if (rate < 7) {
    pts = 5;
    reason = `National rental vacancy ${rate}%,balanced market`;
  } else if (rate < 9) {
    pts = 2;
    reason = `National rental vacancy ${rate}%,softening market`;
  } else {
    pts = 0;
    reason = `National rental vacancy ${rate}%,high vacancy, weak demand`;
  }
  return { signal: "Rental vacancy", points: pts, maxPoints: max, reason };
}

export function scoreLead(
  census: CensusData | null,
  news: NewsData | null,
  wiki: WikipediaData | null,
  fred: FredData | null,
): Score {
  const breakdown: ScoreBreakdown[] = [
    scoreRenter(census?.renterOccupiedPct ?? null),
    scorePopulation(census?.population ?? null),
    scoreMedianRent(census?.medianRent ?? null),
    scoreIncome(census?.medianHouseholdIncome ?? null),
    scoreWikipedia(wiki),
    scoreNews(news),
    scoreFred(fred),
  ];
  const total = Math.round(
    breakdown.reduce((sum, b) => sum + b.points, 0),
  );
  const tier = tierFromScore(total);
  const reasons = breakdown
    .filter((b) => b.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((b) => b.reason);
  return { total, tier, breakdown, reasons };
}
