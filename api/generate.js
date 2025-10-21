import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { topicTitle, format } = req.body;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const prompt = `
Você é um roteirista especialista em vídeos virais do YouTube.
Crie um roteiro completo sobre o tema: "${topicTitle}".
Formato: ${format === "short" ? "Short (15-60s)" : "Vídeo longo (5-10 min)"}.

Retorne APENAS um JSON válido com as chaves:
{
  "title": "",
  "format": "short|long",
  "opening": "Texto de abertura (máx. 2 frases)",
  "development": "Desenvolvimento detalhado com início, meio e fim",
  "closing": "Conclusão ou chamada para ação",
  "scenes": [
    {
      "sceneIndex": 1,
      "description": "Descrição da cena",
      "narration": "Texto para narração da cena",
      "imagePrompt": "Prompt detalhado para gerar imagem da cena"
    }
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { raw: text };
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Erro generate:", err);
    res.status(500).json({ error: "Erro ao gerar roteiro" });
  }
}
