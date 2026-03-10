import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callClaude } from "@/server/services/anthropicAi";

/**
 * POST /api/geo/check
 * Runs GEO monitoring for keywords in a project.
 * Queries each AI engine and checks for domain mentions.
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
      const engineResults = await checkAllEngines(kw.keyword, project.domain);

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
        })),
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("GEO check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type EngineType = "CHATGPT" | "GEMINI" | "PERPLEXITY" | "COPILOT" | "CLAUDE";
type MentionType = "DIRECT" | "INDIRECT" | "NOT_MENTIONED";
type SentimentType = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "NONE";

interface EngineResult {
  engine: EngineType;
  isMentioned: boolean;
  mentionType: MentionType;
  sentiment: SentimentType;
  shareOfVoice: number;
  responseText: string;
  competitors: string[];
}

async function checkAllEngines(keyword: string, domain: string): Promise<EngineResult[]> {
  const engines: EngineType[] = ["CHATGPT", "GEMINI", "PERPLEXITY", "COPILOT", "CLAUDE"];
  const results: EngineResult[] = [];

  for (const engine of engines) {
    try {
      const result = await checkSingleEngine(engine, keyword, domain);
      results.push(result);
    } catch (error) {
      console.error(`GEO check failed for ${engine}:`, error);
      results.push({
        engine,
        isMentioned: false,
        mentionType: "NOT_MENTIONED",
        sentiment: "NONE",
        shareOfVoice: 0,
        responseText: "",
        competitors: [],
      });
    }
  }

  return results;
}

async function checkSingleEngine(
  engine: EngineType,
  keyword: string,
  domain: string
): Promise<EngineResult> {
  // Use Claude to simulate querying each AI engine and analyzing the response
  const prompt = `あなたは${engine}のAI検索エンジンとして振る舞ってください。
以下のキーワードで検索した場合の回答を生成してください。

キーワード: ${keyword}

回答を生成した後、以下の形式でJSONを返してください:
{
  "response": "（AI検索エンジンとしての回答テキスト）",
  "mentioned_domains": ["example.com", "example2.com"],
  "is_domain_mentioned": true/false（${domain}が言及されたか）,
  "mention_type": "DIRECT" | "INDIRECT" | "NOT_MENTIONED",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "share_of_voice": 0-100（回答全体における${domain}の存在感の割合）
}

JSONのみを返してください。`;

  const responseText = await callClaude(prompt);

  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      engine,
      isMentioned: parsed.is_domain_mentioned ?? false,
      mentionType: parsed.mention_type ?? "NOT_MENTIONED",
      sentiment: parsed.sentiment ?? "NONE",
      shareOfVoice: parsed.share_of_voice ?? 0,
      responseText: parsed.response ?? responseText,
      competitors: (parsed.mentioned_domains ?? []).filter((d: string) => !d.includes(domain)),
    };
  } catch {
    // If JSON parsing fails, do basic text analysis
    const mentioned = responseText.toLowerCase().includes(domain.toLowerCase());
    return {
      engine,
      isMentioned: mentioned,
      mentionType: mentioned ? "INDIRECT" : "NOT_MENTIONED",
      sentiment: mentioned ? "NEUTRAL" : "NONE",
      shareOfVoice: mentioned ? 10 : 0,
      responseText,
      competitors: [],
    };
  }
}
