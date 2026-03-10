"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Supabase auth
    setLoading(false);
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
            <div>
              <label className="block text-sm text-text-mid mb-1">お名前</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-bg-soft border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                placeholder="山田 太郎"
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
