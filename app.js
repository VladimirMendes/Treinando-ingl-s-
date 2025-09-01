// ============================
// Script atualizado — START
// ============================

let frases = [];
let vocabulario = {};
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let palavrasDificeis = JSON.parse(localStorage.getItem("palavrasDificeis")) || [];
let streak = parseInt(localStorage.getItem("streak")) || 0;

// chave moderna do app (se existir)
const LS_KEY = 'trainer_progress_v2';

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
const btnPlayQ = document.getElementById("btnPlayQ");
if (btnPlayQ) btnPlayQ.addEventListener("click", () => {
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
    // Se existirem funções mais completas no app, mantenha-as. Aqui chamamos as versões simples.
    if (typeof pickNext === 'function') {
      pickNext();
    } else {
      mostrarFraseAleatoria("facil");
    }
    if (typeof initVocab === 'function') {
      initVocab();
    } else {
      mostrarVocabulario(Object.keys(vocabulario)[0] || "animais");
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

/* ======== Escolher frase por nível ======== */
function mostrarFraseAleatoria(nivel) {
  const frasesNivel = frases.filter(f => f.nivel === nivel);
  if (frasesNivel.length === 0) return;

  const frase = frasesNivel[Math.floor(Math.random() * frasesNivel.length)];

  // mantém compatibilidade com outras versões do app: ids may differ
  const elPerg = document.getElementById("pergunta") || document.getElementById("questionEn");
  const elResp = document.getElementById("resposta") || document.getElementById("answerEn");
  if (elPerg) elPerg.innerText = frase.pergunta || frase.en_q || '';
  if (elResp) elResp.innerText = frase.resposta || frase.en_a || '';

  speakEn(frase.pergunta || frase.en_q);
}

/* ======== Mostrar vocabulário por tópico ======== */
function mostrarVocabulario(topico) {
  const palavras = vocabulario[topico];
  if (!palavras || palavras.length === 0) return;

  const item = palavras[Math.floor(Math.random() * palavras.length)];

  const elPal = document.getElementById("palavra") || document.getElementById("vEn");
  const elTrad = document.getElementById("traducao") || document.getElementById("vPt");
  if (elPal) elPal.innerText = item.palavra || item.en || '';
  if (elTrad) elTrad.innerText = item.traducao || item.pt || '';

  speakEn(item.palavra || item.en);
}

/* ======== Verificar resposta ======== */
function verificarResposta() {
  const inputEl = document.getElementById("entradaResposta") || document.getElementById("txtAnswer");
  if (!inputEl) return;
  const respostaUsuario = inputEl.value.trim().toLowerCase();
  const respostaEl = document.getElementById("resposta") || document.getElementById("answerEn");
  const respostaCorreta = (respostaEl ? respostaEl.innerText : '').trim().toLowerCase();

  let resultado = "";
  if (respostaUsuario === respostaCorreta && respostaCorreta !== '') {
    resultado = "✅ Correto!";
    streak++;
  } else {
    resultado = `❌ Errado! Resposta: ${respostaCorreta || '(sem gabarito)'}`;
    palavrasDificeis.push(respostaCorreta || '(sem gabarito)');
    streak = 0;
  }

  historico.push({ pergunta: document.getElementById("pergunta")?.innerText || document.getElementById("questionEn")?.innerText || '', respostaUsuario, resultado });
  salvarProgresso();

  const fb = document.getElementById("feedback") || document.getElementById("feedbackMsg");
  if (fb) fb.innerText = resultado;
}

/* ======== Salvar progresso no navegador (compatível) ======== */
function salvarProgresso() {
  // salva versões legadas
  localStorage.setItem("historico", JSON.stringify(historico));
  localStorage.setItem("palavrasDificeis", JSON.stringify(palavrasDificeis));
  localStorage.setItem("streak", streak);

  // salva estrutura moderna (state.progress) se existir
  if (window.state && state.progress) {
    // atualiza campos legados também no state.progress (para consistência)
    state.progress.score = state.progress.score ?? 0;
    state.progress.streak = state.progress.streak ?? 0;
    // sincronizar histórico e difficult se quiser (opcional)
    if (!Array.isArray(state.progress.history)) state.progress.history = [];
    // não sobrescrevemos state.progress.history aqui para evitar duplicação, mas você pode ajustar conforme necessário
    if (typeof saveProgress === 'function') {
      try { saveProgress(); return; } catch(e){ /* fallback */ }
    }
    localStorage.setItem(LS_KEY, JSON.stringify(state.progress));
  }
}

/* ======== Limpar histórico e palavras difíceis (compatível com state.progress) ======== */
function clearAllProgress(confirmPrompt = true) {
  if (confirmPrompt && !confirm("Tem certeza? Isso apagará histórico, reforço e resetará pontuação.")) return;

  // 1) Se o app usa state.progress (ideia moderna), resetar isso
  if (window.state && state.progress) {
    state.progress.history = [];
    state.progress.difficult = {};
    state.progress.score = 0;
    state.progress.streak = 0;
    state.progress.lastLevel = 'Fácil';
    state.progress.vocabIndexByTopic = {};
    if (typeof saveProgress === 'function') {
      try { saveProgress(); } catch (e) { localStorage.setItem(LS_KEY, JSON.stringify(state.progress)); }
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(state.progress));
    }

    // Atualiza UI se as funções existirem
    if (typeof renderKPIs === 'function') renderKPIs();
    if (typeof renderDifficult === 'function') renderDifficult();

    // limpa tabela de histórico (se existir)
    const tbody = document.querySelector('#histTable tbody');
    if (tbody) tbody.innerHTML = '';
    const histEmpty = document.getElementById('histEmpty');
    const histWrap = document.getElementById('histTableWrap');
    if (histEmpty) histEmpty.style.display = 'block';
    if (histWrap) histWrap.style.display = 'none';

  } else {
    // 2) fallback: limpar chaves legadas
    historico = [];
    palavrasDificeis = [];
    streak = 0;
    localStorage.removeItem('historico');
    localStorage.removeItem('palavrasDificeis');
    localStorage.removeItem('streak');

    // atualizar UI básica
    const fb = document.getElementById("feedback") || document.getElementById("feedbackMsg");
    if (fb) fb.innerText = '';
    ['pergunta','resposta','palavra','traducao','questionEn','answerEn','vEn','vPt'].forEach(id=>{
      const el = document.getElementById(id);
      if (el) el.innerText = '';
    });

    // limpar tabela legacy se existir
    const tbody = document.querySelector('#histTable tbody');
    if (tbody) tbody.innerHTML = '';
    const histEmpty = document.getElementById('histEmpty');
    const histWrap = document.getElementById('histTableWrap');
    if (histEmpty) histEmpty.style.display = 'block';
    if (histWrap) histWrap.style.display = 'none';
  }

  // garantir que o app mostre uma nova frase se existir função
  if (typeof pickNext === 'function') pickNext();
  else mostrarFraseAleatoria('facil');

  if (typeof renderDifficult === 'function') renderDifficult();
  else {
    const hardDiv = document.getElementById('hardList');
    if (hardDiv) hardDiv.textContent = 'Nenhuma por enquanto 🚀';
  }

  if (typeof renderKPIs === 'function') renderKPIs();
  else {
    const sEl = document.getElementById('kpiScore'); if (sEl) sEl.textContent = '0';
    const stEl = document.getElementById('kpiStreak'); if (stEl) stEl.textContent = '0';
  }

  alert('✅ Histórico e palavras de reforço limpos!');
}

/* ======== Limpar apenas reforço/difficult ======== */
function clearDifficult(confirmPrompt = true) {
  if (confirmPrompt && !confirm("Limpar apenas a lista de palavras/frases de reforço?")) return;

  if (window.state && state.progress) {
    state.progress.difficult = {};
    if (typeof saveProgress === 'function') { try { saveProgress(); } catch(e){ localStorage.setItem(LS_KEY, JSON.stringify(state.progress)); } }
    else localStorage.setItem(LS_KEY, JSON.stringify(state.progress));
    if (typeof renderDifficult === 'function') renderDifficult();
  } else {
    palavrasDificeis = [];
    localStorage.setItem('palavrasDificeis', JSON.stringify([]));
    const hardDiv = document.getElementById('hardList');
    if (hardDiv) hardDiv.textContent = 'Nenhuma por enquanto 🚀';
  }
  alert('✅ Lista de reforço limpa!');
}

/* ======== Conectar botões de limpeza (multi-id compatível) ======== */
function attachClearButtons() {
  const allClearIds = ['btnClearHistory','btnClearProgress','btnClearAll','btnClear'];
  allClearIds.forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => clearAllProgress(true));
  });

  const diffIds = ['btnClearDifficult','btnClearReforco','btnClearDiff'];
  diffIds.forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => clearDifficult(true));
  });

  // Para compatibilidade com seu código anterior (se ainda usa limparProgresso)
  const legacyBtn = document.getElementById('btnClearHistory');
  if (legacyBtn) legacyBtn.addEventListener('click', () => clearAllProgress(true));
}

/* ======== Inicializar app (window load) ======== */
window.addEventListener('load', async () => {
  await carregarDados();

  // anexar botões de limpar
  attachClearButtons();

  // se existir kpi/renders no app maior, atualiza
  if (typeof renderKPIs === 'function') renderKPIs();
  if (typeof renderDifficult === 'function') renderDifficult();

  // se existirem históricos salvos no state.progress, mostre-os
  if (window.state && state.progress && Array.isArray(state.progress.history) && state.progress.history.length) {
    // se já existe rotina para preencher tabela, ela será chamada em main; caso contrário, atualiza tabela simples:
    const tbody = document.querySelector('#histTable tbody');
    const histEmpty = document.getElementById('histEmpty');
    const histWrap = document.getElementById('histTableWrap');
    if (tbody && histEmpty && histWrap) {
      tbody.innerHTML = '';
      state.progress.history.slice().reverse().forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${h.level||''}</td><td class="mono">${h.question||''}</td><td class="mono">${h.answerCorrect||''}</td><td class="mono">${h.answerUser||''}</td><td>${h.result||''}</td><td>${h.similarity||''}</td>`;
        tbody.appendChild(tr);
      });
      histEmpty.style.display = 'none';
      histWrap.style.display = 'block';
    }
  } else {
    // fallback: se há histórico legado, popula tabela simples
    const tbody = document.querySelector('#histTable tbody');
    const histEmpty = document.getElementById('histEmpty');
    const histWrap = document.getElementById('histTableWrap');
    if (tbody && (historico?.length)) {
      tbody.innerHTML = '';
      historico.slice().reverse().forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${h.nivel||''}</td><td class="mono">${h.pergunta||''}</td><td class="mono">${h.resposta_correta||''}</td><td class="mono">${h.resposta_usuario||h.respostaUsuario||''}</td><td>${h.resultado||h.result||''}</td><td>${h.similarity||''}</td>`;
        tbody.appendChild(tr);
      });
      if (histEmpty) histEmpty.style.display = 'none';
      if (histWrap) histWrap.style.display = 'block';
    }
  }

});

// ============================
// Script atualizado — END
// ============================
