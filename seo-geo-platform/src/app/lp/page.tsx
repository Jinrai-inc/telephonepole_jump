import Link from "next/link";
import { COLORS } from "@/lib/constants";

const features = [
  {
    title: "SEO順位トラッキング",
    description: "Google・Yahoo!の検索順位を毎日自動取得。AI Overview対応も含めた包括的なランキング監視。",
    icon: "M3 3v18h18V3H3zm16 16H5V5h14v14zm-7-2l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z",
  },
  {
    title: "GEOモニタリング",
    description: "ChatGPT・Gemini・Perplexity等のAI検索エンジンでの言及状況をスコア化。AI時代のSEO対策。",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  },
  {
    title: "AI記事作成",
    description: "Claude Opus 4による高精度な構成案生成・記事執筆。校正・校閲・ファクトチェックもAIで自動実行。",
    icon: "M14.06 9.94L12 9l2.06-.94L15 6l.94 2.06L18 9l-2.06.94L15 12l-.94-2.06zM4 14l.94-2.06L7 11l-2.06-.94L4 8l-.94 2.06L1 11l2.06.94L4 14zm4.5-5l1.09-2.41L12 5.5 9.59 4.41 8.5 2 7.41 4.41 5 5.5l2.41 1.09L8.5 9zM4.5 20.5l6-6.01h4l6 6.01",
  },
  {
    title: "テクニカルSEO監査",
    description: "サイト全体の技術的問題を自動検出。メタタグ・構造化データ・Core Web Vitalsをまとめて分析。",
    icon: "M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z",
  },
  {
    title: "ホワイトラベルレポート",
    description: "御社ブランドでPDFレポートを自動生成。クライアントへの報告書作成を完全自動化。",
    icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
  },
  {
    title: "Slack / Chatwork通知",
    description: "順位変動・GEO変動・エラーをリアルタイムで通知。チームのワークフローにシームレスに統合。",
    icon: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  },
];

const plans = [
  {
    name: "スターター",
    price: "12,000",
    features: ["プロジェクト1件", "キーワード100件", "GEOチェック 50回/月", "AI記事チェック", "メール通知"],
    highlighted: false,
  },
  {
    name: "ビジネス",
    price: "39,800",
    features: ["プロジェクト5件", "キーワード500件", "GEOチェック 200回/月", "AI記事チェック", "ホワイトラベルレポート", "Slack / Chatwork通知"],
    highlighted: true,
  },
  {
    name: "エージェンシー",
    price: "79,800",
    features: ["プロジェクト20件", "キーワード2,000件", "GEOチェック 1,000回/月", "AI記事チェック", "ホワイトラベルレポート", "APIアクセス", "専用サポート"],
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: COLORS.border }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold" style={{ color: COLORS.accent }}>
            SEO-GEO Platform
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:opacity-80" style={{ color: COLORS.textMid }}>
              ログイン
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          SEO + AI検索最適化を
          <br />
          <span style={{ color: COLORS.accent }}>ひとつのプラットフォーム</span>で
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: COLORS.textMid }}>
          従来のSEO順位トラッキングに加え、ChatGPT・Gemini・Perplexityなど
          AI検索エンジンでの言及状況を監視。AI記事作成・校正もワンストップで。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-lg font-medium text-lg"
            style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
          >
            7日間無料トライアル
          </Link>
          <Link
            href="#features"
            className="px-8 py-3 rounded-lg font-medium text-lg border"
            style={{ borderColor: COLORS.border, color: COLORS.textMid }}
          >
            機能を見る
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20" style={{ backgroundColor: COLORS.bgSoft }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.accentSoft }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={COLORS.accent}>
                    <path d={feature.icon} />
                  </svg>
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm" style={{ color: COLORS.textMid }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">料金プラン</h2>
          <p className="text-center mb-12" style={{ color: COLORS.textMid }}>
            全プラン7日間無料トライアル付き
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="p-6 rounded-xl border relative"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: plan.highlighted ? COLORS.accent : COLORS.border,
                }}
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
                  >
                    おすすめ
                  </div>
                )}
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">¥{plan.price}</span>
                  <span className="text-sm" style={{ color: COLORS.textDim }}>/月</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: COLORS.textMid }}>
                      <span style={{ color: COLORS.accent }}>&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-2.5 rounded-lg text-sm font-medium border"
                  style={{
                    backgroundColor: plan.highlighted ? COLORS.accent : "transparent",
                    color: plan.highlighted ? COLORS.bg : COLORS.text,
                    borderColor: plan.highlighted ? COLORS.accent : COLORS.border,
                  }}
                >
                  無料で始める
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: COLORS.bgSoft }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">AI時代のSEO対策を始めましょう</h2>
          <p className="mb-8" style={{ color: COLORS.textMid }}>
            7日間無料トライアルで全機能をお試しいただけます。クレジットカード不要。
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 rounded-lg font-medium text-lg"
            style={{ backgroundColor: COLORS.accent, color: COLORS.bg }}
          >
            無料トライアルを開始
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: COLORS.border }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm" style={{ color: COLORS.textDim }}>
            &copy; 2026 SEO-GEO Platform. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm" style={{ color: COLORS.textDim }}>
            <a href="#" className="hover:opacity-80">利用規約</a>
            <a href="#" className="hover:opacity-80">プライバシーポリシー</a>
            <a href="#" className="hover:opacity-80">特定商取引法</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
