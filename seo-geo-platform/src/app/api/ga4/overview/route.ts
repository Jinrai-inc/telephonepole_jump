import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptToken, refreshAccessToken, encryptToken } from "@/server/services/googleSearchConsole";
import { getTrafficOverview, getTopPages, getTrafficSources } from "@/server/services/googleAnalytics";

/**
 * GET /api/ga4/overview?projectId=xxx&days=30
 * Returns GA4 traffic overview, top pages, and traffic sources.
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !project.gscAccessToken || !project.ga4PropertyId) {
    return NextResponse.json({ error: "GA4 not connected for this project" }, { status: 404 });
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  let accessToken = decryptToken(project.gscAccessToken);

  async function fetchData(token: string) {
    const [overview, topPages, sources] = await Promise.all([
      getTrafficOverview(token, project!.ga4PropertyId!, startDate, endDate),
      getTopPages(token, project!.ga4PropertyId!, startDate, endDate),
      getTrafficSources(token, project!.ga4PropertyId!, startDate, endDate),
    ]);
    return { overview, topPages, sources };
  }

  try {
    const data = await fetchData(accessToken);
    return NextResponse.json(data);
  } catch {
    // Token expired, try refresh
    if (!project.gscRefreshToken) {
      return NextResponse.json({ error: "Refresh token not available" }, { status: 401 });
    }

    try {
      const refreshToken = decryptToken(project.gscRefreshToken);
      accessToken = await refreshAccessToken(refreshToken);

      await prisma.project.update({
        where: { id: projectId },
        data: { gscAccessToken: encryptToken(accessToken) },
      });

      const data = await fetchData(accessToken);
      return NextResponse.json(data);
    } catch (refreshError) {
      console.error("GA4 refresh failed:", refreshError);
      return NextResponse.json({ error: "Authentication expired. Please reconnect Google." }, { status: 401 });
    }
  }
}
