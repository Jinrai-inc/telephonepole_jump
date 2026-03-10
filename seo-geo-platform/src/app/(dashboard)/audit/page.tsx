"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { CircleScore } from "@/components/ui/CircleScore";
import { Stethoscope, AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

const severityConfig: Record<string, { label: string; color: "warn" | "orange" | "blue"; icon: React.ReactNode }> = {
  ERROR: { label: "エラー", color: "warn", icon: <AlertCircle size={14} /> },
  WARNING: { label: "警告", color: "orange", icon: <AlertTriangle size={14} /> },
  NOTICE: { label: "情報", color: "blue", icon: <Info size={14} /> },
};

export default function AuditPage() {
  const { projectId } = useProject();
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [showResolved, setShowResolved] = useState(false);

  const auditQuery = trpc.audit.getLatest.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const resolveMutation = trpc.audit.resolveIssue.useMutation({
    onSuccess: () => auditQuery.refetch(),
  });

  const audit = auditQuery.data;
  const allIssues = audit?.issues ?? [];
  const errorCount = allIssues.filter((i) => i.severity === "ERROR" && !i.isResolved).length;
  const warningCount = allIssues.filter((i) => i.severity === "WARNING" && !i.isResolved).length;
  const noticeCount = allIssues.filter((i) => i.severity === "NOTICE" && !i.isResolved).length;

  const issues = allIssues.filter((issue) => {
    if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;
    if (!showResolved && issue.isResolved) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">サイト監査</h1>
        <Button disabled>
          <RefreshCw size={16} className="mr-1.5" />
          再クロール
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Stethoscope size={16} />} label="ヘルススコア" value={audit?.healthScore?.toString() ?? "-"} color="accent" />
        <MetricCard icon={<AlertCircle size={16} />} label="エラー" value={errorCount.toString()} color="warn" />
        <MetricCard icon={<AlertTriangle size={16} />} label="警告" value={warningCount.toString()} color="orange" />
        <MetricCard icon={<Info size={16} />} label="情報" value={noticeCount.toString()} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Score */}
        <Card className="text-center">
          <h3 className="text-sm font-medium text-text-mid mb-4">総合スコア</h3>
          <div className="flex justify-center">
            <CircleScore score={Number(audit?.healthScore ?? 0)} size={120} />
          </div>
          <p className="text-xs text-text-dim mt-3">{audit?.pagesCrawled ?? 0}ページをクロール</p>
        </Card>

        {/* Core Web Vitals */}
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">Core Web Vitals</h3>
          <div className="space-y-3">
            <CwvRow label="LCP" value={audit?.cwvLcp ? `${Number(audit.cwvLcp).toFixed(1)}s` : "-"} good={audit?.cwvLcp ? Number(audit.cwvLcp) <= 2.5 : false} />
            <CwvRow label="INP" value={audit?.cwvInp ? `${Number(audit.cwvInp)}ms` : "-"} good={audit?.cwvInp ? Number(audit.cwvInp) <= 200 : false} />
            <CwvRow label="CLS" value={audit?.cwvCls ? Number(audit.cwvCls).toString() : "-"} good={audit?.cwvCls ? Number(audit.cwvCls) <= 0.1 : false} />
          </div>
        </Card>

        {/* Mobile/Desktop Scores */}
        <Card>
          <h3 className="text-sm font-medium text-text-mid mb-4">パフォーマンス</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-mid">モバイル</span>
                <span className="font-medium text-text">{audit?.mobileScore ?? "-"}</span>
              </div>
              <div className="h-2 bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${audit?.mobileScore ?? 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-mid">デスクトップ</span>
                <span className="font-medium text-text">{audit?.desktopScore ?? "-"}</span>
              </div>
              <div className="h-2 bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-blue rounded-full" style={{ width: `${audit?.desktopScore ?? 0}%` }} />
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
          {issues.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-dim text-sm">
              {audit ? "該当する問題はありません" : "サイト監査を実行すると結果が表示されます"}
            </div>
          ) : (
            issues.map((issue) => {
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
                    {issue.isResolved ? (
                      <CheckCircle size={14} className="text-accent" />
                    ) : (
                      <button
                        onClick={() => resolveMutation.mutate({ id: issue.id })}
                        className="text-xs text-text-dim hover:text-accent transition-colors"
                        title="解決済みにする"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
