import fetch from "node-fetch";

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos
let cache = { ts: 0, data: null };

function getInstances() {
  const env = process.env.INVIDIOUS_INSTANCES || "";
  const arr = env.split(",").map(s => s.trim()).filter(Boolean);
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

async function tryInvidious(instance) {
  const url = `${instance.replace(/\/$/, "")}/api/v1/trending`;
  const r = await fetch(url, { timeout: 10000 });
  if (!r.ok) throw new Error(`Erro ${r.status} em ${instance}`);
  const json = await r.json();
  return (json || []).map((v, i) => ({
    id: v.videoId || `vid-${i}`,
    title: v.title || "Sem título",
    channel: v.author || v.uploader || "Canal desconhecido",
    format: Math.random() > 0.5 ? "short" : "long",
  }));
}

async function scrapeFallback() {
  // Fallback simples via HTML scraping
  const res = await fetch("https://www.youtube.com/feed/trending", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const matches = [...html.matchAll(/"title":"([^"]+)"/g)];
  const titles = matches.map(m => m[1]).filter(Boolean);
  const unique = [...new Set(titles)].slice(0, 10);
  return unique.map((t, i) => ({
    id: `yt-${i}`,
    title: t,
    channel: "YouTube",
    format: Math.random() > 0.5 ? "short" : "long",
  }));
}

export default function handler(req, res) {
  res.status(200).json({ message: 'Trends endpoint funcionando!' });
}


    const instances = getInstances();
    let topics = [];
    for (const inst of instances) {
      try {
        topics = await tryInvidious(inst);
        if (topics.length) break;
      } catch (err) {
        console.warn("Invidious falhou em:", inst, err.message);
      }
    }

    if (!topics.length) {
      try {
        topics = await scrapeFallback();
      } catch (err) {
        console.error("Fallback falhou:", err.message);
      }
    }

    if (!topics.length) {
      return res.status(502).json({ error: "Não foi possível obter tendências" });
    }

    const selected = topics.slice(0, 3);
    cache = { ts: now, data: selected };

    res.status(200).json(selected);
  } catch (err) {
    console.error("Erro trends:", err);
    res.status(500).json({ error: "Erro interno ao buscar tendências" });
  }
}

