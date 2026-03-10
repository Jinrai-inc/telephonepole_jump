"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, Plus, Calendar, Building } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

const typeConfig: Record<string, { label: string; color: "accent" | "blue" | "purple" | "orange" }> = {
  MONTHLY: { label: "月次レポート", color: "accent" },
  KEYWORD: { label: "キーワードレポート", color: "blue" },
  GEO: { label: "GEOレポート", color: "purple" },
  TECHNICAL_SEO: { label: "テクニカルSEO", color: "orange" },
};

export default function ReportsPage() {
  const { projectId, orgId } = useProject();

  const utils = trpc.useUtils();
  const reportsQuery = trpc.reports.getAll.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: () => utils.reports.getAll.invalidate(),
  });

  const reports = reportsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レポート</h1>
        <Button
          loading={generateMutation.isPending}
          onClick={() => {
            if (!projectId || !orgId) return;
            generateMutation.mutate({ projectId, orgId, reportType: "MONTHLY" });
          }}
        >
          <Plus size={16} className="mr-1.5" />
          レポート生成
        </Button>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(typeConfig).map(([key, config]) => (
          <div key={key} onClick={() => {
            if (!projectId || !orgId) return;
            generateMutation.mutate({ projectId, orgId, reportType: key as "MONTHLY" | "KEYWORD" | "GEO" | "TECHNICAL_SEO" });
          }}>
            <Card hover className="cursor-pointer text-center py-6">
              <FileText size={24} className={`mx-auto mb-2 text-${config.color}`} />
              <p className="text-sm font-medium text-text">{config.label}</p>
              <p className="text-xs text-text-dim mt-1">
                {reports.filter((r) => r.reportType === key).length}件
              </p>
            </Card>
          </div>
        ))}
      </div>

      {/* Report List */}
      <Card className="!p-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-mid">レポート履歴</h3>
        </div>
        <div className="divide-y divide-border/50">
          {reports.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-dim text-sm">
              レポートがありません。上のカードをクリックして生成してください。
            </div>
          ) : (
            reports.map((report) => {
              const tc = typeConfig[report.reportType] || typeConfig.MONTHLY;
              return (
                <div key={report.id} className="flex items-center justify-between px-4 py-3 hover:bg-card-alt/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className={`text-${tc.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text">{tc.label}</span>
                        {report.whiteLabel && (
                          <Badge color="purple" size="sm">
                            <Building size={8} className="mr-0.5" />
                            ホワイトラベル
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-dim mt-0.5">
                        <Calendar size={10} />
                        {new Date(report.generatedAt).toISOString().split("T")[0]}
                      </div>
                    </div>
                  </div>
                  {report.fileUrl ? (
                    <Button size="sm" variant="outline" onClick={() => window.open(report.fileUrl!, "_blank")}>
                      <Download size={14} className="mr-1" />
                      PDF
                    </Button>
                  ) : (
                    <Badge color="dim" size="sm">生成中</Badge>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* White Label Settings */}
      <Card>
        <h3 className="text-sm font-medium text-text-mid mb-4">ホワイトラベル設定</h3>
        <p className="text-xs text-text-dim mb-4">
          レポートに御社のロゴと社名を表示できます。クライアントへの提出に活用してください。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-mid mb-1.5">会社名</label>
            <input
              type="text"
              placeholder="株式会社○○"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm text-text-mid mb-1.5">ロゴURL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
        <Button className="mt-4" size="sm">保存</Button>
      </Card>
    </div>
  );
}
