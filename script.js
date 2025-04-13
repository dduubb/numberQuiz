document.addEventListener("DOMContentLoaded", function () {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const allQuestions = [];
  for (let i = 0; i < alphabet.length; i++) {
    const letter = alphabet[i];
    const number = (i + 1).toString();
    allQuestions.push({
      prompt: letter,
      expected: number,
      mode: "number"
    });
    allQuestions.push({
      prompt: number,
      expected: letter,
      mode: "text"
    });
  }

  const positiveMessages = ["Great!", "Awesome!", "You got it!", "Nice job!", "Correct!"];
  const errorStyle = "color: red;";
  const successStyle = "color: green;";

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  const startScreen = document.getElementById("start-screen");
  const startBtn = document.getElementById("start-btn");
  const questionCountInput = document.getElementById("question-count");
  const quizContainer = document.getElementById("quiz-container");
  const questionArea = document.getElementById("question-area");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const feedbackDiv = document.getElementById("feedback");
  const resultDiv = document.getElementById("result");
  const timeTakenP = document.getElementById("time-taken");
  const restartBtn = document.getElementById("restart-btn");
  const timerBar = document.getElementById("timer-bar");

  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let startTime;
  let questionTimeout;
  let timerInterval;
  const timerDuration = 3000;

  function submitAnswer(autoSubmitted) {
    const q = quizQuestions[currentQuestionIndex];
    const userAnswer = answerInput.value.trim();
    clearTimeout(questionTimeout);
    clearInterval(timerInterval);

    if (autoSubmitted) {
      answerInput.disabled = true;
      if ((q.mode === "text" && userAnswer.toUpperCase() === q.expected.toUpperCase()) ||
          (q.mode === "number" && userAnswer === q.expected)) {
        feedbackDiv.textContent = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
        feedbackDiv.style = successStyle;
        setTimeout(() => {
          feedbackDiv.textContent = "";
          currentQuestionIndex++;
          showQuestion();
        }, 300);
      } else {
        feedbackDiv.textContent = "Time's up! The correct answer was: " + q.expected;
        feedbackDiv.style = errorStyle;
        setTimeout(() => {
          feedbackDiv.textContent = "";
          currentQuestionIndex++;
          showQuestion();
        }, 800);
      }
    } else {
      if ((q.mode === "text" && userAnswer.toUpperCase() === q.expected.toUpperCase()) ||
          (q.mode === "number" && userAnswer === q.expected)) {
        feedbackDiv.textContent = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
        feedbackDiv.style = successStyle;
        setTimeout(() => {
          feedbackDiv.textContent = "";
          currentQuestionIndex++;
          showQuestion();
        }, 300);
      } else {
        feedbackDiv.textContent = "Oops, try again!";
        feedbackDiv.style = errorStyle;
      }
    }
  }

  function startTimer() {
    timerBar.style.width = "100%";
    const timerStart = Date.now();
    clearTimeout(questionTimeout);
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      let elapsed = Date.now() - timerStart;
      let remaining = timerDuration - elapsed;
      if (remaining < 0) remaining = 0;
      timerBar.style.width = (remaining / timerDuration * 100) + "%";
    }, 50);

    questionTimeout = setTimeout(() => {
      submitAnswer(true);
    }, timerDuration);
  }

  function showQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
      endQuiz();
      return;
    }

    const q = quizQuestions[currentQuestionIndex];
    questionArea.innerHTML = 
      "<h2>Question " + (currentQuestionIndex + 1) + " of " + quizQuestions.length + "</h2>" +
      "<p>" + q.prompt + "</p>";

    answerInput.value = "";
    answerInput.disabled = false;
    answerInput.setAttribute("type", q.mode === "number" ? "number" : "text");
    answerInput.setAttribute("inputmode", q.mode === "number" ? "numeric" : "text");
    answerInput.focus();
    startTimer();
  }

  answerForm.addEventListener("submit", function(e) {
    e.preventDefault();
    submitAnswer(false);
  });

  function endQuiz() {
    quizContainer.classList.add("hidden");
    resultDiv.classList.remove("hidden");
    const endTime = new Date();
    const timeDiff = (endTime - startTime) / 1000;
    const avgTime = timeDiff / quizQuestions.length;
    timeTakenP.innerHTML = "Completed in " + timeDiff.toFixed(2) + " seconds" +
                             "<br>Average per question: " + avgTime.toFixed(2) + " seconds.";
  }

  function startQuiz() {
    let count = parseInt(questionCountInput.value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > allQuestions.length) count = allQuestions.length;
    shuffle(allQuestions);
    quizQuestions = allQuestions.slice(0, count);
    currentQuestionIndex = 0;
    feedbackDiv.textContent = "";
    startTime = new Date();
    startScreen.classList.add("hidden");
    resultDiv.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    showQuestion();
  }

  startBtn.addEventListener("click", startQuiz);
  restartBtn.addEventListener("click", startQuiz);
});