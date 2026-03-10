"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, Plus, Calendar, Building } from "lucide-react";

const DEMO_REPORTS = [
  { id: "1", reportType: "MONTHLY", generatedAt: "2026-03-01", fileUrl: "#", whiteLabel: false },
  { id: "2", reportType: "KEYWORD", generatedAt: "2026-02-28", fileUrl: "#", whiteLabel: false },
  { id: "3", reportType: "GEO", generatedAt: "2026-02-25", fileUrl: "#", whiteLabel: true },
  { id: "4", reportType: "TECHNICAL_SEO", generatedAt: "2026-02-20", fileUrl: "#", whiteLabel: false },
  { id: "5", reportType: "MONTHLY", generatedAt: "2026-02-01", fileUrl: "#", whiteLabel: true },
];

const typeConfig: Record<string, { label: string; color: "accent" | "blue" | "purple" | "orange" }> = {
  MONTHLY: { label: "月次レポート", color: "accent" },
  KEYWORD: { label: "キーワードレポート", color: "blue" },
  GEO: { label: "GEOレポート", color: "purple" },
  TECHNICAL_SEO: { label: "テクニカルSEO", color: "orange" },
};

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レポート</h1>
        <Button
          loading={generating}
          onClick={() => {
            setGenerating(true);
            setTimeout(() => setGenerating(false), 2000);
          }}
        >
          <Plus size={16} className="mr-1.5" />
          レポート生成
        </Button>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(typeConfig).map(([key, config]) => (
          <Card key={key} hover className="cursor-pointer text-center py-6">
            <FileText size={24} className={`mx-auto mb-2 text-${config.color}`} />
            <p className="text-sm font-medium text-text">{config.label}</p>
            <p className="text-xs text-text-dim mt-1">
              {DEMO_REPORTS.filter((r) => r.reportType === key).length}件
            </p>
          </Card>
        ))}
      </div>

      {/* Report List */}
      <Card className="!p-0">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-mid">レポート履歴</h3>
        </div>
        <div className="divide-y divide-border/50">
          {DEMO_REPORTS.map((report) => {
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
                      {report.generatedAt}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download size={14} className="mr-1" />
                  PDF
                </Button>
              </div>
            );
          })}
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
