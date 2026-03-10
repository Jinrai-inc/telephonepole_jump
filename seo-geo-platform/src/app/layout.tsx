import type { Metadata } from "next";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO×GEO Platform",
  description: "SEO×GEO 統合プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-bg text-text antialiased">
        <TrpcProvider>{children}</TrpcProvider>
      </body>
    </html>
  );
}
