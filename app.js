let frases = [];
let vocabulario = {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let palavrasDificeis = JSON.parse(localStorage.getItem("palavrasDificeis")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;

<label for="speed">Velocidade:</label>
<input type="range" id="speed" min="0.5" max="1.5" step="0.1" value="1">
<span id="speedValue">1.0x</span>
const speedControl = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

speedControl.addEventListener('input', () => {
  speedValue.textContent = speedControl.value + 'x';
});

function speakWithSpeed(text) {
  const rate = parseFloat(speedControl.value);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

// 🔹 Carregar arquivos JSON externos
async function carregarDados() {
  try {
    const resFrases = await fetch("data/frases.json");
    frases = await resFrases.json();

    const resVocab = await fetch("data/vocabulario.json");
    vocabulario = await resVocab.json();

    console.log("✅ Dados carregados com sucesso!");
    mostrarFraseAleatoria("facil"); // inicia com fácil
    mostrarVocabulario("animais");  // inicia com um tópico
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

// 🔹 Escolher frase por nível
function mostrarFraseAleatoria(nivel) {
  const frasesNivel = frases.filter(f => f.nivel === nivel);
  if (frasesNivel.length === 0) return;

  const frase = frasesNivel[Math.floor(Math.random() * frasesNivel.length)];

  document.getElementById("pergunta").innerText = frase.pergunta;
  document.getElementById("resposta").innerText = frase.resposta;

  falar(frase.pergunta);
}

// 🔹 Mostrar vocabulário por tópico
function mostrarVocabulario(topico) {
  const palavras = vocabulario[topico];
  if (!palavras || palavras.length === 0) return;

  const item = palavras[Math.floor(Math.random() * palavras.length)];

  document.getElementById("palavra").innerText = item.palavra;
  document.getElementById("traducao").innerText = item.traducao;

  falar(item.palavra);
}

// 🔹 Fala em inglês
function falar(texto) {
  const msg = new SpeechSynthesisUtterance(texto);
  msg.lang = "en-US";
  speechSynthesis.speak(msg);
}

// 🔹 Verificar resposta
function verificarResposta() {
  const respostaUsuario = document.getElementById("entradaResposta").value.trim().toLowerCase();
  const respostaCorreta = document.getElementById("resposta").innerText.trim().toLowerCase();

  let resultado = "";
  if (respostaUsuario === respostaCorreta) {
    resultado = "✅ Correto!";
    streak++;
  } else {
    resultado = `❌ Errado! Resposta: ${respostaCorreta}`;
    palavrasDificeis.push(respostaCorreta);
    streak = 0;
  }

  historico.push({ pergunta: document.getElementById("pergunta").innerText, respostaUsuario, resultado });
  salvarProgresso();

  document.getElementById("feedback").innerText = resultado;
}

// 🔹 Salvar progresso no navegador
function salvarProgresso() {
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("palavrasDificeis", JSON.stringify(palavrasDificeis));
  localStorage.setItem("streak", streak);
}

// 🔹 Inicializar app
window.onload = carregarDados;
