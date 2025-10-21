/**
 * Endpoint: /api/trends
 * Objetivo: Retornar vídeos em alta do YouTube via instâncias Invidious
 * Correção: Adaptado para Vercel Serverless Functions
 */

// Importações necessárias
const fetch = require('node-fetch');

// Cache em memória com TTL de 5 minutos
const CACHE_TTL_MS = 1000 * 60 * 5;
let cache = { ts: 0, data: null };

// Obter lista de instâncias Invidious
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
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
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
    throw err;
  }
}

// Fallback: retorna dados mockados
function getMockData() {
  return [
    {
      id: "mock-1",
      title: "Como criar conteúdo viral no YouTube",
      channel: "Canal Exemplo",
      format: "short"
    },
    {
      id: "mock-2", 
      title: "As 5 tendências tecnológicas de 2024",
      channel: "Tech News",
      format: "long"
    },
    {
      id: "mock-3",
      title: "Tutorial: Edição de vídeo para iniciantes",
      channel: "Video Editor Pro",
      format: "short"
    }
  ];
}

// Handler principal
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const now = Date.now();
    const instances = getInstances();
    let topics = [];

    // Verifica cache
    if (cache.data && now - cache.ts < CACHE_TTL_MS) {
      console.log("✅ Servindo tendências do cache");
      return res.status(200).json(cache.data);
    }

    // Tenta buscar tendências reais
    for (const inst of instances) {
      try {
        console.log("🔍 Tentando instância:", inst);
        topics = await tryInvidious(inst);
        if (topics.length) break;
      } catch (err) {
        console.warn("⚠️ Falha em", inst, "-", err.message);
      }
    }

    // Se falhar, usa dados mockados
    if (!topics.length) {
      console.log("🌀 Usando dados mockados como fallback");
      topics = getMockData();
    }

    const selected = topics.slice(0, 3);
    cache = { ts: now, data: selected };

    res.status(200).json(selected);
  } catch (err) {
    console.error("🔥 Erro trends:", err);
    res.status(500).json({ error: "Erro interno ao buscar tendências" });
  }
};
