export type SearchIntent = "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";
export type AiEngine = "CHATGPT" | "GEMINI" | "PERPLEXITY" | "COPILOT" | "CLAUDE";
export type MentionType = "DIRECT" | "INDIRECT" | "NOT_MENTIONED";
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NONE";
export type Severity = "ERROR" | "WARNING" | "NOTICE";
export type ArticleStatus = "DRAFT" | "WRITING" | "PROOFREADING" | "REVIEWING" | "PUBLISHED";
export type CheckType = "PROOFREAD" | "FACTCHECK" | "COPYCHECK" | "AI_DETECT";
export type Plan = "STARTER" | "BUSINESS" | "AGENCY";
export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" | "WRITER";
export type Tone = "DESU_MASU" | "DA_DEARU" | "MIXED";
export type ReportType = "TECHNICAL_SEO" | "MONTHLY" | "KEYWORD" | "GEO";
export type NotificationChannel = "EMAIL" | "SLACK" | "CHATWORK";

export interface RankingData {
  date: string;
  positionGoogle?: number | null;
  positionYahoo?: number | null;
  positionMobile?: number | null;
  positionDesktop?: number | null;
  hasAiOverview: boolean;
  aiOverviewPosition?: number | null;
}

export interface KeywordSummary {
  id: string;
  keyword: string;
  searchVolume?: number | null;
  keywordDifficulty?: number | null;
  currentPosition?: number | null;
  bestPosition?: number | null;
  geoScore?: number | null;
  previousPosition?: number | null;
}

export interface GeoCheckResult {
  engine: AiEngine;
  isMentioned: boolean;
  mentionType?: MentionType | null;
  sentiment?: Sentiment | null;
  shareOfVoice?: number | null;
  aiResponseText?: string | null;
  competitorsMentioned?: Record<string, boolean>;
}

export interface RankDistribution {
  top3: number;
  top10: number;
  top50: number;
  top100: number;
  outOfRange: number;
}
