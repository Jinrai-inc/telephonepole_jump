"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { CircleScore } from "@/components/ui/CircleScore";
import { Stethoscope, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DEMO_AUDIT = {
  healthScore: 78,
  pagesCrawled: 142,
  errors: 5,
  warnings: 12,
  notices: 23,
  cwv: { lcp: 2.1, inp: 180, cls: 0.08 },
  mobileScore: 85,
  desktopScore: 92,
  issues: [
    { id: "1", pageUrl: "/blog/old-post", issueType: "BROKEN_LINK", severity: "ERROR", description: "リンク先が404エラーを返しています", isResolved: false },
    { id: "2", pageUrl: "/products", issueType: "META_DESCRIPTION_MISSING", severity: "ERROR", description: "meta descriptionが設定されていません", isResolved: false },
    { id: "3", pageUrl: "/about", issueType: "H1_MISSING", severity: "ERROR", description: "H1タグが見つかりません", isResolved: false },
    { id: "4", pageUrl: "/blog/seo-guide", issueType: "TITLE_TOO_LONG", severity: "WARNING", description: "タイトルが70文字を超えています（82文字）", isResolved: false },
    { id: "5", pageUrl: "/contact", issueType: "ALT_MISSING", severity: "WARNING", description: "画像のalt属性が設定されていません（3件）", isResolved: false },
    { id: "6", pageUrl: "/blog/ai-search", issueType: "REDIRECT_CHAIN", severity: "WARNING", description: "3段階のリダイレクトチェーンがあります", isResolved: false },
    { id: "7", pageUrl: "/", issueType: "SLOW_PAGE", severity: "WARNING", description: "ページ読み込みが3.5秒（推奨: 2.5秒以内）", isResolved: true },
    { id: "8", pageUrl: "/blog", issueType: "CANONICAL_MISSING", severity: "NOTICE", description: "canonicalタグが設定されていません", isResolved: false },
  ],
};

const severityConfig: Record<string, { label: string; color: "warn" | "orange" | "blue"; icon: React.ReactNode }> = {
  ERROR: { label: "エラー", color: "warn", icon: <AlertCircle size={14} /> },
  WARNING: { label: "警告", color: "orange", icon: <AlertTriangle size={14} /> },
  NOTICE: { label: "情報", color: "blue", icon: <Info size={14} /> },
};

export default function AuditPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [showResolved, setShowResolved] = useState(false);

  const issues = DEMO_AUDIT.issues.filter((issue) => {
    if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;
    if (!showResolved && issue.isResolved) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">サイト監査</h1>
        <Button>
          <RefreshCw size={16} className="mr-1.5" />
          再クロール
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Stethoscope size={16} />} label="ヘルススコア" value={DEMO_AUDIT.healthScore.toString()} color="accent" />
        <MetricCard icon={<AlertCircle size={16} />} label="エラー" value={DEMO_AUDIT.errors.toString()} color="warn" />
        <MetricCard icon={<AlertTriangle size={16} />} label="警告" value={DEMO_AUDIT.warnings.toString()} color="orange" />
        <MetricCard icon={<Info size={16} />} label="情報" value={DEMO_AUDIT.notices.toString()} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="text-center">
          <h3 className="text-sm font-medium text-text-mid mb-4">総合スコア</h3>
          <div className="flex justify-center">
            <CircleScore score={DEMO_AUDIT.healthScore} size={120} />
          </div>
          <p className="text-xs text-text-dim mt-3">{DEMO_AUDIT.pagesCrawled}ページをクロール</p>
        </Card>

        {/* Core Web Vitals */}
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">Core Web Vitals</h3>
          <div className="space-y-3">
            <CwvRow label="LCP" value={`${DEMO_AUDIT.cwv.lcp}s`} good={DEMO_AUDIT.cwv.lcp <= 2.5} />
            <CwvRow label="INP" value={`${DEMO_AUDIT.cwv.inp}ms`} good={DEMO_AUDIT.cwv.inp <= 200} />
            <CwvRow label="CLS" value={DEMO_AUDIT.cwv.cls.toString()} good={DEMO_AUDIT.cwv.cls <= 0.1} />
          </div>
        </Card>

        {/* Mobile/Desktop Scores */}
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">パフォーマンス</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-mid">モバイル</span>
                <span className="font-medium text-text">{DEMO_AUDIT.mobileScore}</span>
              </div>
              <div className="h-2 bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${DEMO_AUDIT.mobileScore}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-mid">デスクトップ</span>
                <span className="font-medium text-text">{DEMO_AUDIT.desktopScore}</span>
              </div>
              <div className="h-2 bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-blue rounded-full" style={{ width: `${DEMO_AUDIT.desktopScore}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Issues Table */}
      <Card className="!p-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex gap-2">
            {["ALL", "ERROR", "WARNING", "NOTICE"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  severityFilter === s ? "bg-accent-soft text-accent" : "text-text-dim hover:text-text"
                }`}
              >
                {s === "ALL" ? "すべて" : severityConfig[s]?.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="rounded" />
            解決済みも表示
          </label>
        </div>
        <div className="divide-y divide-border/50">
          {issues.map((issue) => {
            const sc = severityConfig[issue.severity] || severityConfig.NOTICE;
            return (
              <div key={issue.id} className={`px-4 py-3 flex items-start gap-3 ${issue.isResolved ? "opacity-50" : ""}`}>
                <span className={`mt-0.5 text-${sc.color}`}>{sc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text">{issue.description}</p>
                  <p className="text-xs text-text-dim mt-0.5">{issue.pageUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={sc.color} size="sm">{sc.label}</Badge>
                  {issue.isResolved && (
                    <CheckCircle size={14} className="text-accent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function CwvRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-mid">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${good ? "text-accent" : "text-warn"}`}>{value}</span>
        <span className={`w-2 h-2 rounded-full ${good ? "bg-accent" : "bg-warn"}`} />
      </div>
    </div>
  );
}
