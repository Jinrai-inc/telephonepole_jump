"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-warn mb-4">Error</div>
        <h1 className="text-xl font-bold text-text mb-2">
          予期しないエラーが発生しました
        </h1>
        <p className="text-sm text-text-dim mb-6">
          {error.message || "ページの読み込み中にエラーが発生しました。再試行してください。"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            再試行
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-card border border-border text-text rounded-lg text-sm font-medium hover:bg-card-alt transition-colors"
          >
            ダッシュボードへ
          </button>
        </div>
      </div>
    </div>
  );
}
