/**
 * Endpoint: /api/trends
 * Objetivo: Retornar vídeos em alta do YouTube via instâncias Invidious (ou fallback direto do site).
 * Observação: Corrigido para funcionar no ambiente Serverless da Vercel (Next.js API Routes).
 */

import fetch from "node-fetch";

// Cache em memória com TTL de 5 minutos
const CACHE_TTL_MS = 1000 * 60 * 5;
let cache = { ts: 0, data: null };

// Obter lista de instâncias Invidious (ou padrão)
function getInstances() {
  const env = process.env.INVIDIOUS_INSTANCES || "";
  const arr = env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (arr.length > 0) return arr;
  return [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
    "https://invidious.f5.si",
    "https://invidious.reallyaweso.me",
    "https://invidious.tiekoetter.com",
    "https://invidious.lunar.icu",
  ];
}

// Tenta buscar via Invidious
async function tryInvidious(instance) {
  const url = `${instance.replace(/\/$/, "")}/api/v1/trending`;
  // O 'timeout' não é suportado nativamente no fetch da Vercel, então usamos AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) throw new Error(`Erro ${r.status} em ${instance}`);
    const json = await r.json();
    return (json || []).map((v, i) => ({
      id: v.videoId || `vid-${i}`,
      title: v.title || "Sem título",
      channel: v.author || v.uploader || "Canal desconhecido",
      format: Math.random() > 0.5 ? "short" : "long",
    }));
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Fallback: scrape da página de tendências do YouTube
async function scrapeFallback() {
  const res = await fetch("https://www.youtube.com/feed/trending", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) throw new Error("Falha ao acessar YouTube Trending");

  const html = await res.text();
  const matches = [...html.matchAll(/"title":"([^"]+)"/g)];
  const titles = matches.map((m) => m[1]).filter(Boolean);
  const unique = [...new Set(titles)].slice(0, 10);
  return unique.map((t, i) => ({
    id: `yt-${i}`,
    title: t,
    channel: "YouTube",
    format: Math.random() > 0.5 ? "short" : "long",
  }));
}

// Handler da rota (padrão Next.js API Route)
export default async function handler(req, res) {
  try {
    // Apenas GET é permitido
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const now = Date.now();

    // Verifica cache
    if (cache.data && now - cache.ts < CACHE_TTL_MS) {
      console.log("✅ Servindo tendências do cache");
      return res.status(200).json(cache.data);
    }

    const instances = getInstances();
    let topics = [];

    // Tenta em sequência as instâncias Invidious
    for (const inst of instances) {
      try {
        console.log("🔍 Tentando instância:", inst);
        topics = await tryInvidious(inst);
        if (topics.length) break;
      } catch (err) {
        console.warn("⚠️ Falha em", inst, "-", err.message);
      }
    }

    // Fallback se todas falharem
    if (!topics.length) {
      try {
        console.log("🌀 Tentando fallback via scrape");
        topics = await scrapeFallback();
      } catch (err) {
        console.error("❌ Fallback falhou:", err.message);
      }
    }

    // Se ainda assim não houver dados
    if (!topics.length) {
      return res
        .status(502)
        .json({ error: "Não foi possível obter tendências" });
    }

    const selected = topics.slice(0, 3);
    cache = { ts: now, data: selected };

    console.log("✅ Tendências atualizadas:", selected.length, "itens");

    res.status(200).json(selected);
  } catch (err) {
    console.error("🔥 Erro trends:", err);
    res.status(500).json({ error: "Erro interno ao buscar tendências" });
  }
}
