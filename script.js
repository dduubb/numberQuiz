class QuizGame {
  constructor(config) {
    this.alphabet = config.alphabet.split("");
    this.positiveMessages = config.positiveMessages;
    this.errorStyle = config.errorStyle;
    this.successStyle = config.successStyle;
    this.timerDuration = config.timerDuration;

    this.quizQuestions = [];
    this.currentQuestionIndex = 0;
    this.startTime = null;
    this.questionTimeout = null;
    this.timerInterval = null;
    this.hasAnswered = false;
    this.selectedQuestionCount = 0; // Ensure this is initialized

    console.log("Initializing QuizGame..."); // Debugging log
    this.initDOMElements();
    this.bindEventListeners();
    console.log("QuizGame initialized."); // Debugging log
  }

  initDOMElements() {
    this.startScreen = document.getElementById("start-screen");
    this.quizContainer = document.getElementById("quiz-container");
    this.questionArea = document.getElementById("question-area");
    this.feedbackDiv = document.getElementById("feedback");
    this.resultDiv = document.getElementById("result");
    this.timeTakenP = document.getElementById("time-taken");
    this.timerBar = document.getElementById("timer-bar");
  }

  bindEventListeners() {
    document.querySelectorAll(".question-btn").forEach(button => {
      button.addEventListener("click", () => {
        const count = parseInt(button.getAttribute("data-count"), 10);
        this.startQuiz(count);
        this.selectedQuestionCount = count; // Store the selected question count
      });
    });

    document.getElementById("restart-btn").addEventListener("click", () => {
      this.startQuiz(this.selectedQuestionCount || 10); // Use the stored count or default to 10
    });
  }

  generateQuestions() {
    const allQuestions = [];
    for (let i = 0; i < this.alphabet.length; i++) {
      const letter = this.alphabet[i];
      const number = (i + 1).toString();
      allQuestions.push({ prompt: letter, expected: number, mode: "number" });
      allQuestions.push({ prompt: number, expected: letter, mode: "text" });
    }
    return allQuestions;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  startQuiz(count) {
    console.log("Starting quiz with", count, "questions."); // Debugging log

    // Reset all game state variables
    this.quizQuestions = this.generateQuestions();
    this.shuffle(this.quizQuestions);
    this.quizQuestions = this.quizQuestions.slice(0, count);
    this.currentQuestionIndex = 0;
    this.feedbackDiv.textContent = "";
    this.startTime = new Date();
    this.hasAnswered = false; // Ensure the answered flag is reset

    // Clear any lingering timers from a previous game
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Remove any existing event listeners to prevent duplicates
    const optionButtons = this.questionArea.querySelectorAll(".option-btn");
    optionButtons.forEach(button => {
      button.replaceWith(button.cloneNode(true));
    });

    // Update UI for a new game
    this.startScreen.classList.add("hidden");
    this.resultDiv.classList.add("hidden");
    this.quizContainer.classList.remove("hidden");

    console.log("Game state reset. Starting first question."); // Debugging log
    this.showQuestion();
  }

  showQuestion() {
    this.hasAnswered = false; // Reset flag for the new question

    if (this.currentQuestionIndex >= this.quizQuestions.length) {
      this.endQuiz();
      return;
    }

    const q = this.quizQuestions[this.currentQuestionIndex];
    console.log("Displaying question index:", this.currentQuestionIndex); // Debugging log

    this.questionArea.innerHTML = 
      `<h2>Question ${this.currentQuestionIndex + 1} of ${this.quizQuestions.length}</h2>
       <p>${q.prompt}</p>`;

    const options = this.generateOptions(q.expected, q.mode);
    const optionsHtml = options.map(option => 
      `<button class="option-btn" data-value="${option}">${option}</button>`
    ).join(" ");

    this.questionArea.innerHTML += `<div class="options-container">${optionsHtml}</div>`;

    // Remove any existing event listeners to prevent duplicates
    const optionButtons = this.questionArea.querySelectorAll(".option-btn");
    optionButtons.forEach(button => {
      button.replaceWith(button.cloneNode(true)); // Replace button to clear existing listeners
    });

    // Attach new event listeners
    this.questionArea.querySelectorAll(".option-btn").forEach(button => {
      button.addEventListener("click", (event) => {
        const selectedValue = event.target.getAttribute("data-value");
        console.log("Option selected:", selectedValue); // Debugging log
        this.submitAnswer(selectedValue);
      });
    });

    this.startTimer();
  }

  generateOptions(correctAnswer, mode) {
    const options = new Set([correctAnswer]);
    while (options.size < 6) {
      if (mode === "number") {
        const randomNum = Math.floor(Math.random() * 26) + 1;
        options.add(randomNum.toString());
      } else {
        const randomLetter = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
        options.add(randomLetter);
      }
    }
    return Array.from(options).sort(() => Math.random() - 0.5);
  }

  submitAnswer(userAnswer) {
    if (this.hasAnswered) {
      console.warn("submitAnswer called multiple times for the same question.");
      return; // Prevent multiple submissions
    }
    this.hasAnswered = true;

    clearTimeout(this.questionTimeout);
    clearInterval(this.timerInterval);
    this.timerBar.style.width = "0%";

    const q = this.quizQuestions[this.currentQuestionIndex];
    if (!q) {
      console.error("Question is undefined. Current index:", this.currentQuestionIndex);
      return;
    }

    console.log("Processing answer for question index:", this.currentQuestionIndex);
    if (userAnswer === q.expected) {
      console.log("Answer is correct. Waiting to advance...");
      this.feedbackDiv.textContent = this.positiveMessages[Math.floor(Math.random() * this.positiveMessages.length)];
      this.feedbackDiv.style = this.successStyle;
      setTimeout(() => {
        this.feedbackDiv.textContent = "";
        this.currentQuestionIndex++;
        console.log("Advancing to question index:", this.currentQuestionIndex);
        this.showQuestion();
      }, 300);
    } else {
      console.log("Answer is incorrect. Waiting to advance...");
      this.feedbackDiv.textContent = `Wrong! The correct answer was: ${q.expected}`;
      this.feedbackDiv.style = this.errorStyle;
      setTimeout(() => {
        this.feedbackDiv.textContent = "";
        this.currentQuestionIndex++;
        console.log("Advancing to question index:", this.currentQuestionIndex);
        this.showQuestion();
      }, 800);
    }
  }

  startTimer() {
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const timerStart = Date.now();
    const timerEnd = timerStart + this.timerDuration;

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, timerEnd - now);
      this.timerBar.style.width = (remaining / this.timerDuration) * 100 + "%";

      if (remaining === 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        if (!this.hasAnswered) {
          this.submitAnswer(null); // Auto-submit when time runs out
        }
      }
    }, 50);

    this.questionTimeout = setTimeout(() => {
      if (!this.hasAnswered) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.submitAnswer(null);
      }
    }, this.timerDuration);
  }

  endQuiz() {
    console.log("End of quiz reached. Total questions:", this.quizQuestions.length);
    console.log("Final question index:", this.currentQuestionIndex);

    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.quizContainer.classList.add("hidden");
    this.resultDiv.classList.remove("hidden");
    const endTime = new Date();
    const timeDiff = (endTime - this.startTime) / 1000;
    const avgTime = timeDiff / this.quizQuestions.length;
    this.timeTakenP.innerHTML = `Completed in ${timeDiff.toFixed(2)} seconds<br>Average per question: ${avgTime.toFixed(2)} seconds.`;
  }
}

fetch("config.json")
  .then(response => response.json())
  .then(config => {
    new QuizGame(config);
  });