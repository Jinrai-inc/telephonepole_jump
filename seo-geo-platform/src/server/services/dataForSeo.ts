const DATAFORSEO_BASE = "https://api.dataforseo.com/v3";

function getAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return "";
  return Buffer.from(`${login}:${password}`).toString("base64");
}

function isConfigured(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

async function apiRequest(endpoint: string, body: unknown) {
  if (!isConfigured()) {
    return null; // Fallback to dummy data
  }

  const res = await fetch(`${DATAFORSEO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getAuth()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`DataForSEO API error: ${res.status}`);
  return res.json();
}

export async function getSearchVolume(keywords: string[]) {
  const result = await apiRequest("/keywords_data/google_ads/search_volume/live", [
    { keywords, location_code: 2392, language_code: "ja" },
  ]);

  if (!result) {
    // Dummy data fallback
    return keywords.map((kw) => ({
      keyword: kw,
      searchVolume: Math.floor(Math.random() * 10000) + 100,
      competition: Math.random(),
      cpc: +(Math.random() * 500).toFixed(2),
    }));
  }

  return result.tasks?.[0]?.result ?? [];
}

export async function getSerpResults(keyword: string, location: string = "Japan") {
  const result = await apiRequest("/serp/google/organic/live/regular", [
    { keyword, location_name: location, language_code: "ja", device: "desktop", depth: 100 },
  ]);

  if (!result) {
    // Dummy data fallback
    return {
      items: Array.from({ length: 10 }, (_, i) => ({
        rank_absolute: i + 1,
        url: `https://example${i}.com`,
        title: `Result ${i + 1} for ${keyword}`,
        description: `Description for result ${i + 1}`,
      })),
      hasAiOverview: Math.random() > 0.5,
    };
  }

  return result.tasks?.[0]?.result?.[0] ?? null;
}

export async function getDomainRating(domain: string) {
  const result = await apiRequest("/backlinks/summary/live", [
    { target: domain, internal_list_limit: 0, backlinks_filters: ["dofollow", "=", "live"] },
  ]);

  if (!result) {
    return { domainRating: Math.floor(Math.random() * 80) + 10, backlinkCount: Math.floor(Math.random() * 5000), referringDomains: Math.floor(Math.random() * 500) };
  }

  const data = result.tasks?.[0]?.result?.[0];
  return {
    domainRating: data?.rank ?? 0,
    backlinkCount: data?.backlinks ?? 0,
    referringDomains: data?.referring_domains ?? 0,
  };
}

export async function getKeywordDifficulty(keyword: string) {
  const result = await apiRequest("/dataforseo_labs/google/keyword_suggestions/live", [
    { keyword, location_code: 2392, language_code: "ja", limit: 1 },
  ]);

  if (!result) {
    return { difficulty: Math.floor(Math.random() * 100) };
  }

  return { difficulty: result.tasks?.[0]?.result?.[0]?.keyword_difficulty ?? 0 };
}
