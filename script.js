const topicsContainer = document.getElementById("topicsContainer");
const resultContainer = document.getElementById("resultContainer");
const fetchBtn = document.getElementById("fetchTrends");

fetchBtn.addEventListener("click", fetchTrends);

async function fetchTrends() {
  topicsContainer.innerHTML = "<p>🔄 Buscando tendências...</p>";
  try {
    const res = await fetch("/api/trends");
    const topics = await res.json();
    renderTopics(topics);
  } catch (err) {
    topicsContainer.innerHTML = "<p>❌ Erro ao buscar tendências.</p>";
  }
}

function renderTopics(topics) {
  topicsContainer.innerHTML = "";
  topics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.innerHTML = `
      <h3>${topic.title}</h3>
      <p>Canal: ${topic.channel}</p>
      <p>Formato sugerido: <strong>${topic.format}</strong></p>
      <button class="generate">Gerar Roteiro</button>
      <button class="remove">Remover</button>
    `;

    card.querySelector(".generate").addEventListener("click", () =>
      generateScript(topic)
    );

    card.querySelector(".remove").addEventListener("click", () =>
      card.remove()
    );

    topicsContainer.appendChild(card);
  });
}

async function generateScript(topic) {
  resultContainer.innerHTML = `<p>✍️ Gerando roteiro para: <b>${topic.title}</b>...</p>`;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicTitle: topic.title,
      format: topic.format,
    }),
  });

  const data = await res.json();
  renderResult(data);
}

function renderResult(data) {
  resultContainer.innerHTML = `
    <div class="topic-card">
      <h2>${data.title || "Roteiro Gerado"}</h2>
      <h4>Formato: ${data.format}</h4>
      <p><strong>Abertura:</strong> ${data.opening}</p>
      <p><strong>Desenvolvimento:</strong> ${data.development}</p>
      <p><strong>Conclusão:</strong> ${data.closing}</p>
      <h3>Cenas:</h3>
      ${data.scenes
        ?.map(
          (s) => `
        <div class="scene">
          <p><strong>Cena ${s.sceneIndex}:</strong> ${s.description}</p>
          <p><em>Narração:</em> ${s.narration}</p>
          <p><em>Prompt de imagem:</em> ${s.imagePrompt}</p>
        </div>`
        )
        .join("")}
    </div>
  `;
}
