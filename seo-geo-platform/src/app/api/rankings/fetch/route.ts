import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSerpResults } from "@/server/services/dataForSeo";

/**
 * API Route: POST /api/rankings/fetch
 * Fetches current SERP positions for keywords in a project from DataForSEO.
 * Called by the daily cron job or manually from the dashboard.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { keywords: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];

    for (const kw of project.keywords) {
      // Check if we already have data for today
      const existing = await prisma.keywordRanking.findUnique({
        where: { keywordId_date: { keywordId: kw.id, date: today } },
      });

      if (existing) {
        results.push({ keyword: kw.keyword, status: "skipped", reason: "already_fetched" });
        continue;
      }

      // Fetch SERP data from DataForSEO
      const serp = await getSerpResults(kw.keyword);
      if (!serp) {
        results.push({ keyword: kw.keyword, status: "error", reason: "api_failed" });
        continue;
      }

      // Find our domain in results
      let positionGoogle: number | null = null;
      let hasAiOverview = false;
      const aiOverviewPosition: number | null = null;

      if (serp.items) {
        for (const item of serp.items) {
          if (item.url && item.url.includes(project.domain)) {
            positionGoogle = item.rank_absolute ?? item.position ?? null;
            break;
          }
        }
      }

      // Check for AI Overview
      if ("hasAiOverview" in serp) {
        hasAiOverview = !!serp.hasAiOverview;
      }

      // Save ranking
      await prisma.keywordRanking.create({
        data: {
          keywordId: kw.id,
          date: today,
          positionGoogle,
          positionDesktop: positionGoogle,
          hasAiOverview,
          aiOverviewPosition,
        },
      });

      // Update keyword's current & best position
      const updateData: { currentPosition: number | null; bestPosition?: number } = {
        currentPosition: positionGoogle,
      };
      if (positionGoogle && (!kw.bestPosition || positionGoogle < kw.bestPosition)) {
        updateData.bestPosition = positionGoogle;
      }
      await prisma.keyword.update({
        where: { id: kw.id },
        data: updateData,
      });

      results.push({
        keyword: kw.keyword,
        status: "success",
        position: positionGoogle,
        hasAiOverview,
      });
    }

    return NextResponse.json({
      project: project.name,
      domain: project.domain,
      keywordsProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error("Rankings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
