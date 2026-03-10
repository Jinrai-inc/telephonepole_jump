import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPerformance, refreshAccessToken, decryptToken } from "@/server/services/googleSearchConsole";

/**
 * GET /api/gsc/performance?projectId=xxx&days=30
 * Returns GSC performance data for a project.
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !project.gscAccessToken || !project.gscPropertyUrl) {
    return NextResponse.json({ error: "GSC not connected for this project" }, { status: 404 });
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  let accessToken = decryptToken(project.gscAccessToken);

  try {
    // Try with current access token
    const data = await getPerformance(accessToken, project.gscPropertyUrl, startDate, endDate);
    return NextResponse.json(data);
  } catch {
    // Token expired, try refresh
    if (!project.gscRefreshToken) {
      return NextResponse.json({ error: "Refresh token not available" }, { status: 401 });
    }

    try {
      const refreshToken = decryptToken(project.gscRefreshToken);
      accessToken = await refreshAccessToken(refreshToken);

      // Save new access token
      const { encryptToken } = await import("@/server/services/googleSearchConsole");
      await prisma.project.update({
        where: { id: projectId },
        data: { gscAccessToken: encryptToken(accessToken) },
      });

      const data = await getPerformance(accessToken, project.gscPropertyUrl, startDate, endDate);
      return NextResponse.json(data);
    } catch (refreshError) {
      console.error("GSC refresh failed:", refreshError);
      return NextResponse.json({ error: "Authentication expired. Please reconnect GSC." }, { status: 401 });
    }
  }
}
