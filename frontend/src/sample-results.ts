import type { EnrichedLead } from "@eliseai/shared";

/**
 * Pre-baked enriched results for the "Load sample leads" demo path.
 * Used so the demo looks realistic without requiring Census/News/Weather API keys.
 * Real CSV uploads still hit the backend pipeline.
 */
export const SAMPLE_ENRICHED: EnrichedLead[] = [
  {
    lead: {
      name: "Sarah Chen",
      email: "sarah.chen@greystar.com",
      company: "Greystar",
      propertyAddress: "600 Congress Ave",
      city: "Austin",
      state: "TX",
    },
    enrichment: {
      census: {
        population: 961_855,
        renterOccupiedPct: 58.3,
        medianRent: 1680,
        medianHouseholdIncome: 85_400,
        geography: { state: "TX", county: "Travis", tract: "001100" },
      },
      news: {
        headlines: [
          {
            title: "Greystar expands Austin portfolio with 2,400-unit acquisition",
            url: "https://example.com/greystar-austin",
            source: "Multifamily Dive",
            publishedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        mostRecentDaysAgo: 12,
      },
      wikipedia: {
        companyPage: {
          exists: true,
          summary: "Greystar Real Estate Partners is an American multifamily real estate operator.",
          url: "https://en.wikipedia.org/wiki/Greystar",
        },
        cityPage: {
          exists: true,
          summary: "Austin is the capital of Texas.",
          url: "https://en.wikipedia.org/wiki/Austin,_Texas",
        },
      },
      weather: { description: "clear sky", tempF: 78 },
      fred: { rentalVacancyRate: 6.4, period: "2024-10-01" },
    },
    score: {
      total: 87,
      tier: "Hot",
      breakdown: [
        { signal: "Renter share", points: 25, maxPoints: 25, reason: "58% renter occupied, dense multifamily market" },
        { signal: "Population", points: 16, maxPoints: 20, reason: "Mid size metro (pop 962k)" },
        { signal: "Median rent", points: 10, maxPoints: 14, reason: "$1680/mo median rent, class A/B market" },
        { signal: "Median income", points: 6, maxPoints: 8, reason: "$85k median HH income" },
        { signal: "Wikipedia", points: 13, maxPoints: 13, reason: "Has Wikipedia page (established brand)" },
        { signal: "Recent news", points: 12, maxPoints: 12, reason: 'News in last 30 days: "Greystar expands Austin portfolio with 2,400-unit acquisition"' },
        { signal: "Rental vacancy", points: 5, maxPoints: 8, reason: "National rental vacancy 6.4%, balanced market" },
      ],
      reasons: [
        "58% renter occupied, dense multifamily market",
        "Has Wikipedia page (established brand)",
        'News in last 30 days: "Greystar expands Austin portfolio with 2,400-unit acquisition"',
        "Mid size metro (pop 962k)",
        "$1680/mo median rent, class A/B market",
      ],
    },
    email: {
      subject: "Quick idea for Greystar leasing in Austin",
      body: "Hi Sarah,\n\nNoticed the Austin portfolio expansion announcement. With 58% renter occupied housing in Austin and 2,400 new units coming online, leasing throughput is about to get real.\n\nEliseAI's AI leasing assistant handles 24/7 inbound across SMS, email, and phone, so your on-site teams can focus on tours instead of first-touch responses. Worth a quick 15 minutes this week?\n\nBest,\n[Your name]",
      source: "template",
    },
    errors: [],
    enrichedAt: new Date().toISOString(),
  },
  {
    lead: {
      name: "Marcus Johnson",
      email: "marcus.j@equityapartments.com",
      company: "Equity Residential",
      propertyAddress: "1717 Rhode Island Ave NW",
      city: "Washington",
      state: "DC",
    },
    enrichment: {
      census: {
        population: 712_816,
        renterOccupiedPct: 61.2,
        medianRent: 2180,
        medianHouseholdIncome: 101_700,
        geography: { state: "DC", county: "District of Columbia", tract: "005200" },
      },
      news: {
        headlines: [
          {
            title: "Equity Residential posts Q3 rent growth above consensus",
            url: "https://example.com/eqr-q3",
            source: "Seeking Alpha",
            publishedAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        mostRecentDaysAgo: 45,
      },
      wikipedia: {
        companyPage: {
          exists: true,
          summary: "Equity Residential is a publicly traded REIT specializing in multifamily.",
          url: "https://en.wikipedia.org/wiki/Equity_Residential",
        },
        cityPage: {
          exists: true,
          summary: "Washington, D.C. is the capital of the United States.",
          url: "https://en.wikipedia.org/wiki/Washington,_D.C.",
        },
      },
      weather: { description: "light rain", tempF: 54 },
      fred: { rentalVacancyRate: 6.4, period: "2024-10-01" },
    },
    score: {
      total: 90,
      tier: "Hot",
      breakdown: [
        { signal: "Renter share", points: 25, maxPoints: 25, reason: "61% renter occupied, dense multifamily market" },
        { signal: "Population", points: 16, maxPoints: 20, reason: "Mid size metro (pop 713k)" },
        { signal: "Median rent", points: 14, maxPoints: 14, reason: "$2180/mo median rent, class A market" },
        { signal: "Median income", points: 8, maxPoints: 8, reason: "$102k median HH income, affluent market" },
        { signal: "Wikipedia", points: 13, maxPoints: 13, reason: "Has Wikipedia page (established brand)" },
        { signal: "Recent news", points: 9, maxPoints: 12, reason: 'News in last 90 days: "Equity Residential posts Q3 rent growth above consensus"' },
        { signal: "Rental vacancy", points: 5, maxPoints: 8, reason: "National rental vacancy 6.4%, balanced market" },
      ],
      reasons: [
        "61% renter occupied, dense multifamily market",
        "$2180/mo median rent, class A market",
        "Has Wikipedia page (established brand)",
        "$102k median HH income, affluent market",
        "Mid size metro (pop 713k)",
      ],
    },
    email: {
      subject: "Equity Residential · DC leasing funnel",
      body: "Hi Marcus,\n\nCaught the Q3 rent growth note, congrats on beating consensus. With 61% renter share in DC and a $2,180 median, the demand side is clearly there. The bottleneck for most operators now is first-touch speed.\n\nEliseAI responds to every inbound in under 60 seconds across channels, books tours directly into calendars, and flags ready-to-lease prospects to your team. Open to a short walkthrough next week?\n\nBest,\n[Your name]",
      source: "template",
    },
    errors: [],
    enrichedAt: new Date().toISOString(),
  },
  {
    lead: {
      name: "Priya Patel",
      email: "priya@avaloncommunities.com",
      company: "AvalonBay Communities",
      propertyAddress: "101 W Broadway",
      city: "San Diego",
      state: "CA",
    },
    enrichment: {
      census: {
        population: 1_386_932,
        renterOccupiedPct: 52.8,
        medianRent: 2050,
        medianHouseholdIncome: 89_900,
        geography: { state: "CA", county: "San Diego", tract: "005500" },
      },
      news: {
        headlines: [
          {
            title: "AvalonBay CEO mentions AI tooling on Q1 earnings call",
            url: "https://example.com/avb-q1",
            source: "Bisnow",
            publishedAt: new Date(Date.now() - 68 * 24 * 3600 * 1000).toISOString(),
          },
        ],
        mostRecentDaysAgo: 68,
      },
      wikipedia: {
        companyPage: {
          exists: true,
          summary: "AvalonBay Communities is an American REIT investing in apartments.",
          url: "https://en.wikipedia.org/wiki/AvalonBay_Communities",
        },
        cityPage: {
          exists: true,
          summary: "San Diego is a city in California.",
          url: "https://en.wikipedia.org/wiki/San_Diego",
        },
      },
      weather: { description: "sunny", tempF: 72 },
      fred: { rentalVacancyRate: 6.4, period: "2024-10-01" },
    },
    score: {
      total: 92,
      tier: "Hot",
      breakdown: [
        { signal: "Renter share", points: 25, maxPoints: 25, reason: "53% renter occupied, dense multifamily market" },
        { signal: "Population", points: 20, maxPoints: 20, reason: "Large metro (pop 1387k), strong unit volume" },
        { signal: "Median rent", points: 14, maxPoints: 14, reason: "$2050/mo median rent, class A market" },
        { signal: "Median income", points: 6, maxPoints: 8, reason: "$90k median HH income" },
        { signal: "Wikipedia", points: 13, maxPoints: 13, reason: "Has Wikipedia page (established brand)" },
        { signal: "Recent news", points: 9, maxPoints: 12, reason: 'News in last 90 days: "AvalonBay CEO mentions AI tooling on Q1 earnings call"' },
        { signal: "Rental vacancy", points: 5, maxPoints: 8, reason: "National rental vacancy 6.4%, balanced market" },
      ],
      reasons: [
        "53% renter occupied, dense multifamily market",
        "Large metro (pop 1387k), strong unit volume",
        "$2050/mo median rent, class A market",
        "Has Wikipedia page (established brand)",
        'News in last 90 days: "AvalonBay CEO mentions AI tooling on Q1 earnings call"',
      ],
    },
    email: {
      subject: "AvalonBay · following up on the Q1 AI mention",
      body: "Hi Priya,\n\nListened to the Q1 call. Interesting to hear AI tooling flagged as a focus area. On the leasing side specifically, EliseAI is running across Equity Residential, Greystar, and a handful of others with measurable lift on lead-to-tour conversion.\n\nHappy to share the San Diego-specific case study if that's useful. 20 minutes next week?\n\nBest,\n[Your name]",
      source: "template",
    },
    errors: [],
    enrichedAt: new Date().toISOString(),
  },
  {
    lead: {
      name: "Jessica Wong",
      email: "jwong@camdenliving.com",
      company: "Camden Property Trust",
      propertyAddress: "2 Greenway Plaza",
      city: "Houston",
      state: "TX",
    },
    enrichment: {
      census: {
        population: 2_304_580,
        renterOccupiedPct: 44.1,
        medianRent: 1320,
        medianHouseholdIncome: 56_000,
        geography: { state: "TX", county: "Harris", tract: "410300" },
      },
      news: { headlines: [], mostRecentDaysAgo: null },
      wikipedia: {
        companyPage: {
          exists: true,
          summary: "Camden Property Trust is a multifamily REIT based in Houston.",
          url: "https://en.wikipedia.org/wiki/Camden_Property_Trust",
        },
        cityPage: {
          exists: true,
          summary: "Houston is the most populous city in Texas.",
          url: "https://en.wikipedia.org/wiki/Houston",
        },
      },
      weather: { description: "humid", tempF: 88 },
      fred: { rentalVacancyRate: 6.4, period: "2024-10-01" },
    },
    score: {
      total: 65,
      tier: "Warm",
      breakdown: [
        { signal: "Renter share", points: 17, maxPoints: 25, reason: "44% renter occupied, good multifamily mix" },
        { signal: "Population", points: 20, maxPoints: 20, reason: "Large metro (pop 2305k), strong unit volume" },
        { signal: "Median rent", points: 7, maxPoints: 14, reason: "$1320/mo median rent, workforce housing" },
        { signal: "Median income", points: 3, maxPoints: 8, reason: "$56k median HH income" },
        { signal: "Wikipedia", points: 13, maxPoints: 13, reason: "Has Wikipedia page (established brand)" },
        { signal: "Recent news", points: 0, maxPoints: 12, reason: "No recent news found" },
        { signal: "Rental vacancy", points: 5, maxPoints: 8, reason: "National rental vacancy 6.4%, balanced market" },
      ],
      reasons: [
        "Large metro (pop 2305k), strong unit volume",
        "Has Wikipedia page (established brand)",
        "44% renter occupied, good multifamily mix",
        "National rental vacancy 6.4%, balanced market",
        "$1320/mo median rent, workforce housing",
      ],
    },
    email: {
      subject: "Camden · Houston leasing volume",
      body: "Hi Jessica,\n\nHouston leasing volume is a different animal than coastal metros: workforce housing at scale, high turnover, thin on-site staffing. That profile is exactly where EliseAI tends to show the biggest ops lift.\n\nWe handle 24/7 inbound across phone, SMS, and email and route qualified prospects to tours without adding headcount. 20 minutes to see if it fits your Houston properties?\n\nBest,\n[Your name]",
      source: "template",
    },
    errors: [],
    enrichedAt: new Date().toISOString(),
  },
  {
    lead: {
      name: "Tom Rivera",
      email: "tom.rivera@smallprop.com",
      company: "Rivera Property Group",
      propertyAddress: "42 Main St",
      city: "Tupelo",
      state: "MS",
    },
    enrichment: {
      census: {
        population: 37_923,
        renterOccupiedPct: 38.5,
        medianRent: 760,
        medianHouseholdIncome: 42_100,
        geography: { state: "MS", county: "Lee", tract: "950300" },
      },
      news: { headlines: [], mostRecentDaysAgo: null },
      wikipedia: {
        companyPage: { exists: false, summary: null, url: null },
        cityPage: {
          exists: true,
          summary: "Tupelo is a city in Mississippi.",
          url: "https://en.wikipedia.org/wiki/Tupelo,_Mississippi",
        },
      },
      weather: { description: "overcast", tempF: 64 },
      fred: { rentalVacancyRate: 6.4, period: "2024-10-01" },
    },
    score: {
      total: 18,
      tier: "Cold",
      breakdown: [
        { signal: "Renter share", points: 10, maxPoints: 25, reason: "39% renter occupied, moderate renter share" },
        { signal: "Population", points: 0, maxPoints: 20, reason: "Rural/small town (pop 37923), low priority" },
        { signal: "Median rent", points: 2, maxPoints: 14, reason: "$760/mo median rent, budget market" },
        { signal: "Median income", points: 1, maxPoints: 8, reason: "$42k median HH income, lower purchasing power" },
        { signal: "Wikipedia", points: 0, maxPoints: 13, reason: "No Wikipedia page (smaller/newer company)" },
        { signal: "Recent news", points: 0, maxPoints: 12, reason: "No recent news found" },
        { signal: "Rental vacancy", points: 5, maxPoints: 8, reason: "National rental vacancy 6.4%, balanced market" },
      ],
      reasons: [
        "39% renter occupied, moderate renter share",
        "National rental vacancy 6.4%, balanced market",
        "$760/mo median rent, budget market",
        "$42k median HH income, lower purchasing power",
      ],
    },
    email: {
      subject: "Rivera Property Group · Tupelo",
      body: "Hi Tom,\n\nEliseAI typically fits operators running 500+ units where 24/7 inbound coverage pays back quickly. For a Tupelo-sized portfolio, the economics usually don't pencil. Wanted to be upfront rather than waste your time.\n\nIf the portfolio grows or you expand into larger metros, happy to revisit. Good luck with everything.\n\nBest,\n[Your name]",
      source: "template",
    },
    errors: [],
    enrichedAt: new Date().toISOString(),
  },
];
