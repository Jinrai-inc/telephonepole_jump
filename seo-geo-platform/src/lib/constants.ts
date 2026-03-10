export const COLORS = {
  bg: "#080E17",
  bgSoft: "#0D1520",
  card: "#141E2C",
  cardAlt: "#1A2738",
  accent: "#00E4B8",
  accentSoft: "rgba(0,228,184,0.12)",
  warn: "#FF5C5C",
  warnSoft: "rgba(255,92,92,0.12)",
  blue: "#4CA4FF",
  blueSoft: "rgba(76,164,255,0.12)",
  orange: "#FFAA40",
  orangeSoft: "rgba(255,170,64,0.12)",
  purple: "#B07CFF",
  purpleSoft: "rgba(176,124,255,0.12)",
  green: "#3DD68C",
  greenSoft: "rgba(61,214,140,0.12)",
  text: "#F0F4F8",
  textMid: "#9BAABB",
  textDim: "#5C6F82",
  border: "#1E2D3D",
};

export const PLANS = {
  STARTER: {
    name: "スターター",
    maxProjects: 1,
    maxKeywords: 100,
    maxGeoChecks: 50,
  },
  BUSINESS: {
    name: "ビジネス",
    maxProjects: 5,
    maxKeywords: 500,
    maxGeoChecks: 200,
  },
  AGENCY: {
    name: "エージェンシー",
    maxProjects: 20,
    maxKeywords: 2000,
    maxGeoChecks: 1000,
  },
} as const;
