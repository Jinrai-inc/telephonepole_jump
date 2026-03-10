"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          companyName,
          lastName,
          firstName,
          phone,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
        return;
      }

      window.location.href = "/keywords";
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-blue bg-clip-text text-transparent">
            SEO×GEO
          </h1>
          <p className="text-text-mid mt-2">アカウント作成</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-warn/10 border border-warn/30 rounded-lg px-3 py-2 text-warn text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-text-mid mb-1">会社名</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                placeholder="株式会社〇〇"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-text-mid mb-1">姓</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  placeholder="山田"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-mid mb-1">名</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                  placeholder="太郎"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-mid mb-1">電話番号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                placeholder="03-1234-5678"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-mid mb-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-mid mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                placeholder="8文字以上"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              アカウント作成
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-text-dim">
            既にアカウントをお持ちの場合は{" "}
            <Link href="/login" className="text-accent hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
