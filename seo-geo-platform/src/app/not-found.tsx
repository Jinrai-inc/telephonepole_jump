import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-accent mb-4">404</div>
        <h1 className="text-xl font-bold text-text mb-2">
          ページが見つかりません
        </h1>
        <p className="text-sm text-text-dim mb-6">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-accent text-bg rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          ダッシュボードへ
        </Link>
      </div>
    </div>
  );
}
