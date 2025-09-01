let frases = [];
let vocabulario = {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let palavrasDificeis = JSON.parse(localStorage.getItem("palavrasDificeis")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;

/* ======== Controle de velocidade global ======== */
let speechRate = 1;
const rateInput  = document.getElementById('globalSpeed');
const rateLabel  = document.getElementById('globalSpeedValue');

function updateRate(){
  speechRate = parseFloat(rateInput?.value || 1);
  if (rateLabel) rateLabel.textContent = speechRate.toFixed(1) + 'x';
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

if (rateInput) {
  rateInput.addEventListener('input', updateRate);
  updateRate();
}

/* ======== TTS com voz e velocidade (robusto) ======== */
function speakEn(text){
  if (!text) return;
  if (!('speechSynthesis' in window)){
    alert('Síntese de voz não suportada neste navegador.');
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang  = 'en-US';
  u.rate  = speechRate;
  u.pitch = 1;

  const speakNow = () => {
    const voices = speechSynthesis.getVoices();
    const voice  = voices.find(v => /^en(-|_)/i.test(v.lang)) || voices[0];
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = speakNow;
    setTimeout(speakNow, 100);
  } else {
    speakNow();
  }
}

/* ======== Botão para repetir a pergunta em inglês ======== */
document.getElementById("btnPlayQ").addEventListener("click", () => {
  const text = document.getElementById("questionEn").innerText;
  speakEn(text);
});

/* ======== Carregar arquivos JSON externos ======== */
async function carregarDados() {
  try {
    const resFrases = await fetch("data/frases.json");
    frases = await resFrases.json();

    const resVocab = await fetch("data/vocabulario.json");
    vocabulario = await resVocab.json();

    console.log("✅ Dados carregados com sucesso!");
    mostrarFraseAleatoria("facil");
    mostrarVocabulario("animais");
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

/* ======== Escolher frase por nível ======== */
function mostrarFraseAleatoria(nivel) {
  const frasesNivel = frases.filter(f => f.nivel === nivel);
  if (frasesNivel.length === 0) return;

  const frase = frasesNivel[Math.floor(Math.random() * frasesNivel.length)];

  document.getElementById("pergunta").innerText = frase.pergunta;
  document.getElementById("resposta").innerText = frase.resposta;

  speakEn(frase.pergunta);
}

/* ======== Mostrar vocabulário por tópico ======== */
function mostrarVocabulario(topico) {
  const palavras = vocabulario[topico];
  if (!palavras || palavras.length === 0) return;

  const item = palavras[Math.floor(Math.random() * palavras.length)];

  document.getElementById("palavra").innerText = item.palavra;
  document.getElementById("traducao").innerText = item.traducao;

  speakEn(item.palavra);
}

/* ======== Verificar resposta ======== */
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

/* ======== Salvar progresso no navegador ======== */
function salvarProgresso() {
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("palavrasDificeis", JSON.stringify(palavrasDificeis));
  localStorage.setItem("streak", streak);
}

/* ======== Limpar histórico e palavras difíceis ======== */
function limparProgresso() {
  if (!confirm("Tem certeza que deseja limpar o histórico e as palavras de reforço?")) return;

  historico = [];
  palavrasDificeis = [];
  streak = 0;

  salvarProgresso();

  // Atualizar interface
  document.getElementById("feedback").innerText = "";
  document.getElementById("pergunta").innerText = "";
  document.getElementById("resposta").innerText = "";
  document.getElementById("palavra").innerText = "";
  document.getElementById("traducao").innerText = "";

  alert("✅ Histórico e palavras de reforço limpos!");
}

/* ======== Inicializar app ======== */
window.onload = () => {
  carregarDados();

  // ativar botão de limpar histórico, se existir
  const btnClear = document.getElementById("btnClearHistory");
  if (btnClear) {
    btnClear.addEventListener("click", limparProgresso);
  }
};
