import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryAllEngines, type EngineType } from "@/server/services/aiEngines";
import { callClaude } from "@/server/services/anthropicAi";

/**
 * POST /api/geo/check
 * Runs GEO monitoring for keywords in a project.
 * Queries each AI engine directly and checks for domain mentions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, keywordIds } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { keywords: keywordIds ? { where: { id: { in: keywordIds } } } : true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const results = [];

    for (const kw of project.keywords) {
      const engineResponses = await queryAllEngines(kw.keyword);
      const engineResults = await Promise.all(
        engineResponses.map((resp) => analyzeResponse(resp.engine, resp.responseText, project.domain, resp.success))
      );

      for (const er of engineResults) {
        await prisma.keywordGeoCheck.create({
          data: {
            keywordId: kw.id,
            engine: er.engine,
            isMentioned: er.isMentioned,
            mentionType: er.mentionType,
            sentiment: er.sentiment,
            shareOfVoice: er.shareOfVoice,
            aiResponseText: er.responseText,
            competitorsMentioned: er.competitors,
          },
        });
      }

      // Calculate GEO score for this keyword
      const mentionedCount = engineResults.filter((r) => r.isMentioned).length;
      const directCount = engineResults.filter((r) => r.mentionType === "DIRECT").length;
      const avgSov = engineResults.reduce((s, r) => s + (r.shareOfVoice || 0), 0) / engineResults.length;
      const geoScore = Math.round(
        (mentionedCount / engineResults.length) * 40 +
        (directCount / engineResults.length) * 30 +
        avgSov * 0.3
      );

      await prisma.keyword.update({
        where: { id: kw.id },
        data: { geoScore },
      });

      results.push({
        keyword: kw.keyword,
        geoScore,
        engines: engineResults.map((r) => ({
          engine: r.engine,
          isMentioned: r.isMentioned,
          mentionType: r.mentionType,
          success: r.success,
        })),
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("GEO check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type MentionType = "DIRECT" | "INDIRECT" | "NOT_MENTIONED";
type SentimentType = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NONE";

interface AnalyzedResult {
  engine: EngineType;
  isMentioned: boolean;
  mentionType: MentionType;
  sentiment: SentimentType;
  shareOfVoice: number;
  responseText: string;
  competitors: string[];
  success: boolean;
}

/**
 * AIエンジンの応答テキストを分析して、ドメインの言及状況を判定する。
 * まずテキストベースで高速判定し、詳細分析にはClaudeを使用。
 */
async function analyzeResponse(
  engine: EngineType,
  responseText: string,
  domain: string,
  success: boolean
): Promise<AnalyzedResult> {
  if (!success || !responseText) {
    return {
      engine,
      isMentioned: false,
      mentionType: "NOT_MENTIONED",
      sentiment: "NONE",
      shareOfVoice: 0,
      responseText: "",
      competitors: [],
      success,
    };
  }

  // ドメイン名のバリエーションで高速テキストチェック
  const domainLower = domain.toLowerCase();
  const domainWithoutTld = domainLower.replace(/\.\w+$/, "");
  const textLower = responseText.toLowerCase();
  const quickMention = textLower.includes(domainLower) || textLower.includes(domainWithoutTld);

  // Claude で詳細分析
  try {
    const analysisPrompt = `以下のAI検索エンジン応答テキストを分析して、ドメイン「${domain}」の言及状況をJSON形式で返してください。

応答テキスト:
${responseText.slice(0, 3000)}

以下の形式のJSONのみを返してください:
{
  "is_mentioned": true/false,
  "mention_type": "DIRECT" | "INDIRECT" | "NOT_MENTIONED",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "share_of_voice": 0-100,
  "competitor_domains": ["example.com"]
}

判定基準:
- DIRECT: ドメイン名やサービス名が直接記載
- INDIRECT: サービスの特徴や内容が暗示的に言及
- share_of_voice: 応答全体における対象ドメインの存在感（%）`;

    const analysisText = await callClaude(analysisPrompt);
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        engine,
        isMentioned: parsed.is_mentioned ?? quickMention,
        mentionType: parsed.mention_type ?? (quickMention ? "INDIRECT" : "NOT_MENTIONED"),
        sentiment: parsed.sentiment ?? "NONE",
        shareOfVoice: parsed.share_of_voice ?? 0,
        responseText,
        competitors: (parsed.competitor_domains ?? []).filter((d: string) => !d.includes(domain)),
        success: true,
      };
    }
  } catch (error) {
    console.error(`[GEO] Analysis failed for ${engine}:`, error);
  }

  // Claude分析失敗時はテキストベースのフォールバック
  return {
    engine,
    isMentioned: quickMention,
    mentionType: quickMention ? "INDIRECT" : "NOT_MENTIONED",
    sentiment: quickMention ? "NEUTRAL" : "NONE",
    shareOfVoice: quickMention ? 10 : 0,
    responseText,
    competitors: [],
    success: true,
  };
}
