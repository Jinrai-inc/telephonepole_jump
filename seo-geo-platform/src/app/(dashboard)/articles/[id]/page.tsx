"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Save,
  Wand2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Bot,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const statusOptions = [
  { value: "DRAFT", label: "下書き" },
  { value: "WRITING", label: "執筆中" },
  { value: "PROOFREADING", label: "校正中" },
  { value: "REVIEWING", label: "レビュー中" },
  { value: "PUBLISHED", label: "公開済み" },
] as const;

const checkTypeLabels: Record<string, string> = {
  PROOFREAD: "校正チェック",
  FACTCHECK: "ファクトチェック",
  AI_DETECT: "AI検出",
};

export default function ArticleEditPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const articleQuery = trpc.articles.getById.useQuery(
    { id: articleId },
    { enabled: !!articleId }
  );

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => articleQuery.refetch(),
  });
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => router.push("/articles"),
  });
  const generateStructureMutation = trpc.articles.generateStructure.useMutation({
    onSuccess: () => articleQuery.refetch(),
  });
  const generateContentMutation = trpc.articles.generateContent.useMutation({
    onSuccess: () => articleQuery.refetch(),
  });
  const runCheckMutation = trpc.articles.runCheck.useMutation({
    onSuccess: () => articleQuery.refetch(),
  });

  const article = articleQuery.data;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [initialized, setInitialized] = useState(false);

  // 初期値をセット
  if (article && !initialized) {
    setTitle(article.title);
    setContent(article.contentText || "");
    setStatus(article.status);
    setInitialized(true);
  }

  const handleSave = useCallback(() => {
    updateMutation.mutate({
      id: articleId,
      title,
      contentText: content,
      status: status as "DRAFT" | "WRITING" | "PROOFREADING" | "REVIEWING" | "PUBLISHED",
      wordCount: content.length,
    });
  }, [articleId, title, content, status, updateMutation]);

  if (articleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-dim">
        読み込み中...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-text-dim">記事が見つかりませんでした</p>
        <Button onClick={() => router.push("/articles")}>
          <ArrowLeft size={16} className="mr-1.5" />
          一覧に戻る
        </Button>
      </div>
    );
  }

  const keyword = article.targetKeyword || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/articles")}
          className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          記事一覧
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm("この記事を削除しますか？")) {
                deleteMutation.mutate({ id: articleId });
              }
            }}
          >
            <Trash2 size={16} className="text-warn" />
          </Button>
          <Button onClick={handleSave} loading={updateMutation.isLoading}>
            <Save size={16} className="mr-1.5" />
            保存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事タイトル"
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-text placeholder:text-text-dim"
          />

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim">ステータス:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs bg-card border border-border rounded-md px-2 py-1 text-text"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {keyword && (
              <Badge color="blue" size="sm">
                KW: {keyword}
              </Badge>
            )}
            <span className="text-xs text-text-dim ml-auto">
              {content.length.toLocaleString()}文字
            </span>
          </div>

          {/* Content Editor */}
          <Card className="!p-0">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="記事本文を入力してください..."
              className="w-full min-h-[500px] p-4 bg-transparent border-none outline-none text-sm text-text placeholder:text-text-dim resize-y leading-relaxed"
            />
          </Card>

          {/* Structure Preview */}
          {article.structureJson && (
            <Card>
              <h3 className="text-sm font-medium text-text-mid mb-3">
                <FileText size={14} className="inline mr-1.5" />
                構成案
              </h3>
              <pre className="text-xs text-text-dim whitespace-pre-wrap overflow-auto max-h-64">
                {typeof article.structureJson === "string"
                  ? article.structureJson
                  : JSON.stringify(article.structureJson, null, 2)}
              </pre>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Actions */}
          <Card>
            <h3 className="text-sm font-medium text-text-mid mb-3">
              <Wand2 size={14} className="inline mr-1.5" />
              AI機能
            </h3>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() =>
                  keyword &&
                  generateStructureMutation.mutate({
                    articleId,
                    keyword,
                  })
                }
                loading={generateStructureMutation.isLoading}
                disabled={!keyword}
              >
                <FileText size={14} className="mr-2" />
                構成案を生成
              </Button>
              <Button
                className="w-full justify-start"
                variant="ghost"
                onClick={() =>
                  keyword &&
                  generateContentMutation.mutate({
                    articleId,
                    keyword,
                  })
                }
                loading={generateContentMutation.isLoading}
                disabled={!keyword}
              >
                <Bot size={14} className="mr-2" />
                本文を生成
              </Button>
            </div>
            {!keyword && (
              <p className="text-xs text-text-dim mt-2">
                AI機能を使うにはキーワードの設定が必要です
              </p>
            )}
          </Card>

          {/* Checks */}
          <Card>
            <h3 className="text-sm font-medium text-text-mid mb-3">
              <CheckCircle size={14} className="inline mr-1.5" />
              品質チェック
            </h3>
            <div className="space-y-2">
              {(["PROOFREAD", "FACTCHECK", "AI_DETECT"] as const).map((checkType) => (
                <Button
                  key={checkType}
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() =>
                    runCheckMutation.mutate({ articleId, checkType })
                  }
                  loading={
                    runCheckMutation.isLoading &&
                    runCheckMutation.variables?.checkType === checkType
                  }
                  disabled={!content}
                >
                  <AlertTriangle size={14} className="mr-2" />
                  {checkTypeLabels[checkType]}
                </Button>
              ))}
            </div>
          </Card>

          {/* Check Results */}
          {article.checks && article.checks.length > 0 && (
            <Card>
              <h3 className="text-sm font-medium text-text-mid mb-3">
                チェック結果
              </h3>
              <div className="space-y-3">
                {article.checks.map((check) => (
                  <div
                    key={check.id}
                    className="border border-border/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text">
                        {checkTypeLabels[check.checkType] || check.checkType}
                      </span>
                      <Badge
                        color={check.issuesCount > 0 ? "orange" : "accent"}
                        size="sm"
                      >
                        {check.issuesCount > 0
                          ? `${check.issuesCount}件`
                          : "OK"}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-dim">
                      {new Date(check.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
