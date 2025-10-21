module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Mock data para teste
  const mockResponse = {
    title: "Roteiro Gerado",
    format: "short",
    opening: "Introdução cativante sobre o tema",
    development: "Desenvolvimento do conteúdo com pontos principais",
    closing: "Conclusão impactante com call to action",
    scenes: [
      {
        sceneIndex: 1,
        description: "Cena de abertura com hook",
        narration: "Texto narrativo para primeira cena",
        imagePrompt: "Prompt para gerar imagem da primeira cena"
      }
    ]
  };

  res.status(200).json(mockResponse);
};
