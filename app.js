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
  // cancela fala atual para a nova velocidade valer no próximo play
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

if (rateInput) {
  rateInput.addEventListener('input', updateRate);
  updateRate(); // inicializa label e variável
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
  u.rate  = speechRate;  // << aplica a velocidade escolhida
  u.pitch = 1;

  const speakNow = () => {
    const voices = speechSynthesis.getVoices();
    const voice  = voices.find(v => /^en(-|_)/i.test(v.lang)) || voices[0];
    if (voice) u.voice = voice;
    speechSynthesis.cancel(); // evita sobreposição
    speechSynthesis.speak(u);
  };

  // Em alguns navegadores as vozes carregam depois
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = speakNow;
    // fallback para garantir a execução
    setTimeout(speakNow, 100);
  } else {
    speakNow();
  }
}

/* ======== Botão para repetir a pergunta em inglês ======== */
document.getElementById("btnPlayQ").addEventListener("click", () => {
  const text = document.getElementById("questionEn").innerText;
  speakEn(text); // corrigido para usar speakEn
});

/* ======== Carregar arquivos JSON externos ======== */
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

/* ======== Escolher frase por nível ======== */
function mostrarFraseAleatoria(nivel) {
  const frasesNivel = frases.filter(f => f.nivel === nivel);
  if (frasesNivel.length === 0) return;

  const frase = frasesNivel[Math.floor(Math.random() * frasesNivel.length)];

  document.getElementById("pergunta").innerText = frase.pergunta;
  document.getElementById("resposta").innerText = frase.resposta;

  speakEn(frase.pergunta); // ✅ já respeita velocidade global
}

/* ======== Mostrar vocabulário por tópico ======== */
function mostrarVocabulario(topico) {
  const palavras = vocabulario[topico];
  if (!palavras || palavras.length === 0) return;

  const item = palavras[Math.floor(Math.random() * palavras.length)];

  document.getElementById("palavra").innerText = item.palavra;
  document.getElementById("traducao").innerText = item.traducao;

  speakEn(item.palavra); // ✅ idem aqui
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

/* ======== Inicializar app ======== */
window.onload = carregarDados;
