"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, PenTool, FileText, CheckCircle, Clock, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

const statusConfig: Record<string, { label: string; color: "accent" | "blue" | "orange" | "purple" | "dim"; icon: React.ReactNode }> = {
  DRAFT: { label: "下書き", color: "dim", icon: <FileText size={12} /> },
  WRITING: { label: "執筆中", color: "blue", icon: <PenTool size={12} /> },
  PROOFREADING: { label: "校正中", color: "orange", icon: <Clock size={12} /> },
  REVIEWING: { label: "レビュー中", color: "purple", icon: <Eye size={12} /> },
  PUBLISHED: { label: "公開済み", color: "accent", icon: <CheckCircle size={12} /> },
};

export default function ArticlesPage() {
  const { projectId } = useProject();
  const [filter, setFilter] = useState<string>("ALL");

  const articlesQuery = trpc.articles.getAll.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => articlesQuery.refetch(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawArticles = (articlesQuery.data ?? []) as any[];
  const articles = rawArticles.map((a) => ({
    id: a.id as string,
    title: a.title as string,
    targetKeyword: a.targetKeyword as string | null,
    status: a.status as string,
    wordCount: (a.wordCount ?? 0) as number,
    seoScore: a.seoScore ? Number(a.seoScore) : null,
    geoScore: a.geoScore ? Number(a.geoScore) : null,
    createdAt: new Date(a.createdAt).toISOString().split("T")[0],
    publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().split("T")[0] : null,
  }));

  const filtered = filter === "ALL"
    ? articles
    : articles.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事作成</h1>
        <Button onClick={() => {
          if (!projectId) return;
          const title = prompt("記事タイトルを入力してください");
          if (title) createMutation.mutate({ projectId, title });
        }}>
          <Plus size={16} className="mr-1.5" />
          新規記事
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "すべて" },
          { key: "DRAFT", label: "下書き" },
          { key: "WRITING", label: "執筆中" },
          { key: "PROOFREADING", label: "校正中" },
          { key: "REVIEWING", label: "レビュー" },
          { key: "PUBLISHED", label: "公開済み" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-accent-soft text-accent"
                : "bg-card text-text-dim hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Article Cards */}
      <div className="space-y-3">
        {filtered.map((article) => {
          const sc = statusConfig[article.status] || statusConfig.DRAFT;
          return (
            <Card key={article.id} hover className="cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge color={sc.color} size="sm">
                      {sc.icon}
                      <span className="ml-1">{sc.label}</span>
                    </Badge>
                    {article.targetKeyword && (
                      <span className="text-xs text-text-dim">KW: {article.targetKeyword}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-text truncate">{article.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-dim">
                    <span>{article.createdAt}</span>
                    {article.wordCount > 0 && <span>{article.wordCount.toLocaleString()}文字</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {article.seoScore !== null && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${article.seoScore >= 80 ? "text-accent" : article.seoScore >= 60 ? "text-orange" : "text-warn"}`}>
                        {article.seoScore}
                      </div>
                      <div className="text-text-dim">SEO</div>
                    </div>
                  )}
                  {article.geoScore !== null && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${article.geoScore >= 70 ? "text-accent" : article.geoScore >= 40 ? "text-orange" : "text-warn"}`}>
                        {article.geoScore}
                      </div>
                      <div className="text-text-dim">GEO</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
