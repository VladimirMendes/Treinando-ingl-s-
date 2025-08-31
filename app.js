let frases = [];
let vocabulario = {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let palavrasDificeis = JSON.parse(localStorage.getItem("palavrasDificeis")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;

/* =========================================================
   Velocidade global do áudio
   ========================================================= */
let globalAudioRate = 1; // valor inicial = 1x

const globalSpeed = document.getElementById('globalSpeed');
const globalSpeedValue = document.getElementById('globalSpeedValue');

// Atualiza ao mover o controle
globalSpeed.addEventListener('input', () => {
  globalAudioRate = parseFloat(globalSpeed.value);
  globalSpeedValue.textContent = globalAudioRate.toFixed(1) + "x";
});

/* =========================================================
   TTS – Web Speech API (texto → fala)
   ========================================================= */
function speakEn(text){
  if(!('speechSynthesis' in window)) {
    alert('TTS não suportado neste navegador.');
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = globalAudioRate;  // ✅ usa a velocidade global
  u.pitch = 1;

  const vs = speechSynthesis.getVoices();
  const pref = vs.find(v=>/en(-|_)?(US|GB|AU|CA|IN)?/i.test(v.lang)) || vs[0];
  if(pref) u.voice = pref;

  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
// 🔹 Botão para repetir a pergunta em inglês
document.getElementById("btnPlayQ").addEventListener("click", () => {
  const text = document.getElementById("questionEn").innerText;
  speakTextEn(text);
});

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

  speakTextEn(frase.pergunta); // ✅ já respeita velocidade global
}

// 🔹 Mostrar vocabulário por tópico
function mostrarVocabulario(topico) {
  const palavras = vocabulario[topico];
  if (!palavras || palavras.length === 0) return;

  const item = palavras[Math.floor(Math.random() * palavras.length)];

  document.getElementById("palavra").innerText = item.palavra;
  document.getElementById("traducao").innerText = item.traducao;

  speakTextEn(item.palavra); // ✅ idem aqui
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
