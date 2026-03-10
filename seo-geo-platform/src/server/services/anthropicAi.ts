export async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ error: "ANTHROPIC_API_KEY not configured", dummy: true });
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
      max_tokens: 4096,
      system: systemPrompt || "あなたはSEO・GEOの専門家アシスタントです。",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function analyzeSearchIntent(keyword: string) {
  const prompt = `${keyword}の検索意図を分析して、情報収集型/比較検討型/購入行動型に分類し、それぞれの代表的なクエリと推定検索ボリュームシェアをJSON形式で返してください。`;
  return callClaude(prompt);
}

export async function generateArticleStructure(keyword: string) {
  const prompt = `${keyword}で検索上位を狙う記事の見出し構成案をJSON（tag, text, ai_suggested のarray）で作成してください。推奨文字数も含めてください。`;
  return callClaude(prompt);
}

export async function generateArticleContent(keyword: string, structure: string) {
  const prompt = `以下の構成案に基づいて、${keyword}についての記事本文を生成してください。SEO最適化された高品質な記事にしてください。\n\n構成案:\n${structure}`;
  return callClaude(prompt);
}

export async function proofreadArticle(text: string) {
  const prompt = `以下の文章を校正してください。誤字脱字、文法エラー、表記ゆれ、句読点の問題を検出し、JSONで返してください。\n\n${text}`;
  return callClaude(prompt);
}

export async function factCheckArticle(text: string) {
  const prompt = `以下の記事に含まれる事実、数値、引用を検証してください。各主張について、confirmed/needs_supplement/unverified のステータスをJSONで返してください。\n\n${text}`;
  return callClaude(prompt);
}

export async function checkAiDetection(text: string) {
  const prompt = `以下の記事がAI生成と判定される可能性を0-100のスコアで評価し、人間らしさを高めるための改善提案を4つ以上JSONで返してください。\n\n${text}`;
  return callClaude(prompt);
}

export async function generateGeoImprovement(keyword: string, currentStatus: string) {
  const prompt = `キーワード「${keyword}」に対するAI検索での言及状況: ${currentStatus}\n\nGEOスコアを改善するための具体的な施策を5つ以上提案してください。`;
  return callClaude(prompt);
}
