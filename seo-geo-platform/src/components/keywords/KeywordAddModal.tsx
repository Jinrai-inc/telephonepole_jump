"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface KeywordAddModalProps {
  onAdd: (data: { keyword: string; targetUrl?: string }) => void;
  onClose: () => void;
}

export function KeywordAddModal({ onAdd, onClose }: KeywordAddModalProps) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [keyword, setKeyword] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [bulkText, setBulkText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "single") {
      if (!keyword.trim()) return;
      onAdd({ keyword: keyword.trim(), targetUrl: targetUrl.trim() || undefined });
    } else {
      const lines = bulkText.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        onAdd({ keyword: line.trim() });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">キーワード追加</h2>
          <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex bg-bg-soft rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "single" ? "bg-card text-text shadow-sm" : "text-text-dim hover:text-text"
              }`}
            >
              単体追加
            </button>
            <button
              type="button"
              onClick={() => setMode("bulk")}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === "bulk" ? "bg-card text-text shadow-sm" : "text-text-dim hover:text-text"
              }`}
            >
              一括追加
            </button>
          </div>

          {mode === "single" ? (
            <>
              <div>
                <label className="block text-sm text-text-mid mb-1.5">キーワード *</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="例: SEO対策 やり方"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-text-mid mb-1.5">ターゲットURL（任意）</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm text-text-mid mb-1.5">
                キーワード（1行1キーワード）
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"SEO対策 やり方\nGEO対策とは\n検索順位チェックツール"}
                rows={8}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 resize-none"
                autoFocus
              />
              <p className="text-xs text-text-dim mt-1">
                {bulkText.split("\n").filter((l) => l.trim()).length} 件のキーワード
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">追加</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
