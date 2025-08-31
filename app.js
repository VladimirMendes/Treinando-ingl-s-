const questions = [
  { q: "How are you?", a: ["i am fine", "i'm fine", "good", "great"] },
  { q: "What is your name?", a: ["my name is", "i am"] },
  { q: "Where are you from?", a: ["i am from", "i'm from"] },
  { q: "Do you like English?", a: ["yes", "of course", "i like", "sure"] }
];

let currentQuestion = -1;

function nextQuestion() {
  currentQuestion = (currentQuestion + 1) % questions.length;
  document.getElementById("question").innerText = questions[currentQuestion].q;
  document.getElementById("answer").value = "";
  document.getElementById("feedback").innerText = "";
}

function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.toLowerCase();
  const correctAnswers = questions[currentQuestion].a;

  let isCorrect = correctAnswers.some(ans => userAnswer.includes(ans));
  
  if (isCorrect) {
    document.getElementById("feedback").innerText = "✅ Boa! Resposta correta.";
    document.getElementById("feedback").style.color = "green";
  } else {
    document.getElementById("feedback").innerText = "❌ Tente novamente.";
    document.getElementById("feedback").style.color = "red";
  }
  }
