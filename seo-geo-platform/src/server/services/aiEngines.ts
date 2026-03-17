/**
 * AI検索エンジン直接API呼び出しサービス
 *
 * 各AIエンジン（ChatGPT, Gemini, Perplexity, Claude）のAPIを直接叩き、
 * 実際の応答を取得する。Copilotは公開APIがないためBing Search APIで代替。
 */

export type EngineType = "CHATGPT" | "GEMINI" | "PERPLEXITY" | "COPILOT" | "CLAUDE";

interface EngineResponse {
  engine: EngineType;
  responseText: string;
  success: boolean;
  error?: string;
}

// --- ChatGPT (OpenAI API) ---
async function queryChatGPT(keyword: string): Promise<EngineResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { engine: "CHATGPT", responseText: "", success: false, error: "OPENAI_API_KEY not configured" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "あなたはAI検索アシスタントです。ユーザーの質問に対して、関連するウェブサイトやサービスを具体的に名前・ドメイン付きで紹介しながら回答してください。",
        },
        { role: "user", content: keyword },
      ],
    }),
  });

  if (!res.ok) {
    return { engine: "CHATGPT", responseText: "", success: false, error: `OpenAI API error: ${res.status}` };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return { engine: "CHATGPT", responseText: text, success: true };
}

// --- Gemini (Google Generative AI API) ---
async function queryGemini(keyword: string): Promise<EngineResponse> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return { engine: "GEMINI", responseText: "", success: false, error: "GOOGLE_GEMINI_API_KEY not configured" };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `以下の質問に対して、関連するウェブサイトやサービスを具体的に名前・ドメイン付きで紹介しながら回答してください。\n\n${keyword}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    return { engine: "GEMINI", responseText: "", success: false, error: `Gemini API error: ${res.status}` };
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { engine: "GEMINI", responseText: text, success: true };
}

// --- Perplexity ---
async function queryPerplexity(keyword: string): Promise<EngineResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { engine: "PERPLEXITY", responseText: "", success: false, error: "PERPLEXITY_API_KEY not configured" };
  }

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "あなたはAI検索アシスタントです。ユーザーの質問に対して、関連するウェブサイトやサービスを具体的に名前・ドメイン付きで紹介しながら回答してください。",
        },
        { role: "user", content: keyword },
      ],
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    return { engine: "PERPLEXITY", responseText: "", success: false, error: `Perplexity API error: ${res.status}` };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return { engine: "PERPLEXITY", responseText: text, success: true };
}

// --- Claude (Anthropic API) ---
async function queryClaude(keyword: string): Promise<EngineResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { engine: "CLAUDE", responseText: "", success: false, error: "ANTHROPIC_API_KEY not configured" };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: "あなたはAI検索アシスタントです。ユーザーの質問に対して、関連するウェブサイトやサービスを具体的に名前・ドメイン付きで紹介しながら回答してください。",
      messages: [{ role: "user", content: keyword }],
    }),
  });

  if (!res.ok) {
    return { engine: "CLAUDE", responseText: "", success: false, error: `Claude API error: ${res.status}` };
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return { engine: "CLAUDE", responseText: text, success: true };
}

// --- Copilot (公開APIなし → Claude でシミュレーション) ---
async function queryCopilot(keyword: string): Promise<EngineResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { engine: "COPILOT", responseText: "", success: false, error: "ANTHROPIC_API_KEY not configured (Copilot simulation)" };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: "あなたはMicrosoft Copilot（Bing AI検索）として振る舞ってください。Bingの検索結果を参照する形で、関連するウェブサイトやサービスを具体的に名前・ドメイン付きで紹介しながら回答してください。",
      messages: [{ role: "user", content: keyword }],
    }),
  });

  if (!res.ok) {
    return { engine: "COPILOT", responseText: "", success: false, error: `Claude API error (Copilot sim): ${res.status}` };
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return { engine: "COPILOT", responseText: text, success: true };
}

// --- エンジンディスパッチャー ---
const engineHandlers: Record<EngineType, (keyword: string) => Promise<EngineResponse>> = {
  CHATGPT: queryChatGPT,
  GEMINI: queryGemini,
  PERPLEXITY: queryPerplexity,
  CLAUDE: queryClaude,
  COPILOT: queryCopilot,
};

export async function queryEngine(engine: EngineType, keyword: string): Promise<EngineResponse> {
  const handler = engineHandlers[engine];
  try {
    return await handler(keyword);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[GEO] ${engine} query failed:`, message);
    return { engine, responseText: "", success: false, error: message };
  }
}

export async function queryAllEngines(keyword: string): Promise<EngineResponse[]> {
  const engines: EngineType[] = ["CHATGPT", "GEMINI", "PERPLEXITY", "COPILOT", "CLAUDE"];
  return Promise.all(engines.map((engine) => queryEngine(engine, keyword)));
}
