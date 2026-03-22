"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/components/providers/ProjectProvider";

export default function NewArticlePage() {
  const router = useRouter();
  const { projectId } = useProject();
  const [title, setTitle] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: (data) => {
      router.push(`/articles/${data.id}`);
    },
  });

  const handleCreate = () => {
    if (!projectId || !title.trim()) return;
    createMutation.mutate({
      projectId,
      title: title.trim(),
      targetKeyword: targetKeyword.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/articles")}
        className="flex items-center gap-1.5 text-sm text-text-dim hover:text-text transition-colors"
      >
        <ArrowLeft size={16} />
        記事一覧
      </button>

      <h1 className="text-2xl font-bold">新規記事作成</h1>

      <Card className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-mid mb-1.5">
            記事タイトル <span className="text-warn">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: SEO対策の完全ガイド"
            className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-sm text-text placeholder:text-text-dim outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-mid mb-1.5">
            ターゲットキーワード
          </label>
          <input
            type="text"
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
            placeholder="例: SEO対策"
            className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-sm text-text placeholder:text-text-dim outline-none focus:border-accent"
          />
          <p className="text-xs text-text-dim mt-1">
            AI構成案・本文生成に使用されます
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleCreate}
            loading={createMutation.isLoading}
            disabled={!title.trim() || !projectId}
          >
            <Plus size={16} className="mr-1.5" />
            記事を作成
          </Button>
        </div>
      </Card>
    </div>
  );
}
