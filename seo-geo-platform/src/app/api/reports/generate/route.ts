import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

/**
 * POST /api/reports/generate
 * Generates a PDF report for a project.
 */
export async function POST(request: NextRequest) {
  try {
    const { reportId } = await request.json();
    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: report.projectId },
      include: {
        keywords: {
          include: {
            rankings: { orderBy: { createdAt: "desc" }, take: 1 },
            geoChecks: { orderBy: { checkedAt: "desc" }, take: 5 },
          },
        },
      },
    });
    const org = await prisma.organization.findUnique({
      where: { id: report.orgId },
    });

    if (!project || !org) {
      return NextResponse.json({ error: "Project or organization not found" }, { status: 404 });
    }

    const doc = new jsPDF();
    let y = 20;

    // Header
    if (report.whiteLabel && report.customCompanyName) {
      doc.setFontSize(10);
      doc.text(report.customCompanyName, 14, y);
      y += 8;
    }

    doc.setFontSize(20);
    doc.text("SEO / GEO Report", 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Project: ${project.domain}`, 14, y);
    y += 7;
    doc.text(`Organization: ${org.name}`, 14, y);
    y += 7;
    doc.text(`Generated: ${new Date().toISOString().split("T")[0]}`, 14, y);
    y += 7;
    doc.text(`Type: ${report.reportType}`, 14, y);
    y += 15;

    // Keywords Summary
    doc.setFontSize(16);
    doc.text("Keywords Summary", 14, y);
    y += 10;

    doc.setFontSize(9);
    // Table header
    doc.setFillColor(20, 30, 44);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(240, 244, 248);
    doc.text("Keyword", 16, y + 5.5);
    doc.text("Position", 100, y + 5.5);
    doc.text("GEO Score", 135, y + 5.5);
    doc.text("Volume", 170, y + 5.5);
    y += 8;

    doc.setTextColor(0, 0, 0);
    for (const kw of project.keywords.slice(0, 30)) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const position = kw.rankings[0]?.positionGoogle ? Number(kw.rankings[0].positionGoogle) : "-";
      const geoScore = kw.geoScore ? Number(kw.geoScore) : "-";
      const volume = kw.searchVolume ? Number(kw.searchVolume).toLocaleString() : "-";

      doc.text(kw.keyword.substring(0, 30), 16, y + 5.5);
      doc.text(String(position), 100, y + 5.5);
      doc.text(String(geoScore), 135, y + 5.5);
      doc.text(String(volume), 170, y + 5.5);
      y += 7;
    }

    y += 10;

    // GEO Summary (if GEO report)
    if (report.reportType === "GEO" || report.reportType === "MONTHLY") {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(16);
      doc.text("GEO Engine Coverage", 14, y);
      y += 10;

      const engines = ["CHATGPT", "GEMINI", "PERPLEXITY", "COPILOT", "CLAUDE"];
      doc.setFontSize(9);
      for (const engine of engines) {
        const checks = project.keywords.flatMap((kw) =>
          kw.geoChecks.filter((c) => c.engine === engine)
        );
        const mentioned = checks.filter((c) => c.isMentioned).length;
        const total = checks.length || 1;
        const rate = Math.round((mentioned / total) * 100);

        doc.text(`${engine}: ${rate}% mentioned (${mentioned}/${total})`, 16, y + 5.5);
        y += 7;
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Convert to base64 data URL
    const pdfBase64 = doc.output("datauristring");

    // Update report with PDF data URL
    await prisma.report.update({
      where: { id: reportId },
      data: { fileUrl: pdfBase64 },
    });

    return NextResponse.json({ success: true, fileUrl: pdfBase64 });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
