import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Carrega as chaves do .env
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_API_KEY;
const PORT = process.env.PORT || 3000;

// =========================
// 1️⃣ Rota de tendências
// =========================
app.get("/api/trends", async (req, res) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=BR&maxResults=10&key=${YOUTUBE_KEY}`;
    const r = await fetch(url);
    const data = await r.json();

    const topics = (data.items || [])
      .map((item) => ({
        id: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        format: Math.random() > 0.5 ? "short" : "long",
      }))
      .slice(0, 3);

    res.json(topics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar tendências" });
  }
});

// =========================
// 2️⃣ Rota de geração GPT
// =========================
app.post("/api/generate", async (req, res) => {
  try {
    const { topicTitle, format } = req.body;

    const prompt = `
Você é um roteirista especialista em vídeos virais do YouTube.
Crie um roteiro COMPLETO sobre o tema: "${topicTitle}".
Formato: ${format === "short" ? "Short (15-60s)" : "Vídeo longo (5-10 min)"}.

Retorne APENAS um JSON com os seguintes campos:
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

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar roteiro" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
