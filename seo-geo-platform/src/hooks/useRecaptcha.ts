"use client";

import { useCallback, useEffect } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

/**
 * Google reCAPTCHA v3 フック
 * スクリプトの読み込みとトークン取得を管理
 */
export function useRecaptcha() {
  useEffect(() => {
    if (!SITE_KEY) return;

    // 既にスクリプトが読み込まれている場合はスキップ
    if (document.querySelector(`script[src*="recaptcha"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string> => {
      if (!SITE_KEY) return "";

      return new Promise((resolve) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(SITE_KEY, { action });
            resolve(token);
          } catch {
            resolve("");
          }
        });
      });
    },
    []
  );

  return { executeRecaptcha, isEnabled: !!SITE_KEY };
}
