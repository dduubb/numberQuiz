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
    console.log("Starting quiz with", count === -1 ? "Tournament Mode" : count + " questions."); // Debugging log

    // Reset all game state variables
    this.quizQuestions = this.generateQuestions();
    this.shuffle(this.quizQuestions);
    this.quizQuestions = count === -1 ? this.quizQuestions : this.quizQuestions.slice(0, count); // Limit questions for normal modes
    this.currentQuestionIndex = 0;
    this.feedbackDiv.textContent = "";
    this.startTime = new Date();
    this.hasAnswered = false; // Ensure the answered flag is reset
    this.isTournamentMode = count === -1; // Track if Tournament Mode is active
    this.currentTimerDuration = this.timerDuration; // Initialize the timer duration

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
    this.startScreen.classList.add("hidden"); // Ensure the start screen is hidden during gameplay
    this.resultDiv.classList.add("hidden");
    this.quizContainer.classList.remove("hidden");

    console.log("Game state reset. Starting first question."); // Debugging log
    this.showQuestion();
  }

  generateNextQuestion() {
    const letterIndex = Math.floor(Math.random() * this.alphabet.length);
    const letter = this.alphabet[letterIndex];
    const number = (letterIndex + 1).toString();

    // Alternate between letter-to-number and number-to-letter questions
    if (Math.random() > 0.5) {
      return { prompt: letter, expected: number, mode: "number" };
    } else {
      return { prompt: number, expected: letter, mode: "text" };
    }
  }

  showQuestion() {
    this.hasAnswered = false; // Reset flag for the new question

    if (!this.isTournamentMode && this.currentQuestionIndex >= this.quizQuestions.length) {
      this.endQuiz(); // End the game if the question limit is reached in normal modes
      return;
    }

    if (this.isTournamentMode && this.currentQuestionIndex >= this.quizQuestions.length) {
      // Dynamically generate a new question in Tournament Mode
      this.quizQuestions.push(this.generateNextQuestion());
    }

    const q = this.quizQuestions[this.currentQuestionIndex];
    console.log("Displaying question index:", this.currentQuestionIndex); // Debugging log

    this.questionArea.innerHTML = 
      `<h2>Question ${this.currentQuestionIndex + 1}</h2>
       <p id="question-char">${q.prompt}</p>`;

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
      this.feedbackDiv.classList.add("show");
      setTimeout(() => {
        this.feedbackDiv.classList.remove("show");
        this.feedbackDiv.textContent = "";
        this.currentQuestionIndex++;
        this.currentTimerDuration = Math.max(1000, this.currentTimerDuration - 100); // Decrease timer duration with a minimum of 1 second
        console.log("Advancing to question index:", this.currentQuestionIndex);
        this.showQuestion();
      }, 300);
    } else {
      console.log("Answer is incorrect. Ending game in Tournament Mode...");
      this.feedbackDiv.textContent = `Wrong! The correct answer was: ${q.expected}`;
      this.feedbackDiv.style = this.errorStyle;
      this.feedbackDiv.classList.add("show");
      setTimeout(() => {
        this.feedbackDiv.classList.remove("show");
        this.feedbackDiv.textContent = "";
        if (this.isTournamentMode) {
          this.endQuiz(); // End the game immediately in Tournament Mode
        } else {
          this.currentQuestionIndex++;
          console.log("Advancing to question index:", this.currentQuestionIndex);
          this.showQuestion();
        }
      }, 800);
    }

    // Adjust total time for incorrect answers by adding a penalty
    if (userAnswer !== q.expected) {
      const penaltyTime = this.currentTimerDuration * 2 / 1000; // Convert milliseconds to seconds
      this.startTime = new Date(this.startTime.getTime() - penaltyTime * 1000); // Adjust start time to reflect penalty
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
    const timerEnd = timerStart + this.currentTimerDuration;

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, timerEnd - now);
      this.timerBar.style.width = (remaining / this.currentTimerDuration) * 100 + "%";

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
    }, this.currentTimerDuration);
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
    const avgTime = timeDiff / this.currentQuestionIndex; // Average time based on correct answers

    // Calculate correct answers
    const correctAnswers = this.currentQuestionIndex;

    // Retrieve high scores and names from cookies
    const highScore = parseInt(document.cookie.replace(/(?:(?:^|.*;\s*)highScore\s*\=\s*([^;]*).*$)|^.*$/, "$1")) || 0;
    let highScoreName = document.cookie.replace(/(?:(?:^|.*;\s*)highScoreName\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "Anonymous";
    let fastestAvgTimeName = document.cookie.replace(/(?:(?:^|.*;\s*)fastestAvgTime\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "Anonymous";
    const fastestAvgTime = parseFloat(document.cookie.replace(/(?:(?:^|.*;\s*)fastestAvgTime\s*\=\s*([^;]*).*$)|^.*$/, "$1")) || Infinity;

    let newHighScore = false;
    let newFastestTime = false;

    // Update high scores and names if necessary
    if (correctAnswers > highScore) {
      newHighScore = true;
      const name = prompt("New Iron Man high score! Enter your name:", "Anonymous");
      document.cookie = `highScore=${correctAnswers}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
      document.cookie = `highScoreName=${name}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
      highScoreName = name; // Update the displayed high score name
    }
    if (avgTime < fastestAvgTime) {
      newFastestTime = true;
      const name = prompt("New Speed Demon record! Enter your name:", "Anonymous");
      document.cookie = `fastestAvgTime=${avgTime}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
      document.cookie = `fastestAvgTimeName=${name}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
      fastestAvgTimeName = name; // Update the displayed fastest average time name
    }

    // Highlight the high score if the current score is a new high score
    const isNewHighScore = correctAnswers > highScore;
    const isNewFastestTime = avgTime < fastestAvgTime;

    // Update the results grid with the latest high scores
    this.resultDiv.innerHTML = `
      <h2>Results</h2>
      <div class="results-grid">
        <div class="results-section">
          <h3>Latest Game</h3>
          <p>Completed in: ${timeDiff.toFixed(2)} seconds</p>
          <p>Average per question: ${avgTime.toFixed(2)} seconds</p>
          <p>Correct answers: ${correctAnswers}</p>
        </div>
        <div class="results-section">
          <h3>High Scores</h3>
          <p><strong>Speed Demon:</strong> ${newFastestTime ? avgTime.toFixed(2) : fastestAvgTime.toFixed(2)} seconds by ${newFastestTime ? fastestAvgTimeName : document.cookie.replace(/(?:(?:^|.*;\s*)fastestAvgTimeName\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "Anonymous"} ${newFastestTime ? '<span class="highlight">(New!)</span>' : ''}</p>
          <p><strong>Iron Man:</strong> ${newHighScore ? correctAnswers : highScore} correct answers by ${newHighScore ? highScoreName : document.cookie.replace(/(?:(?:^|.*;\s*)highScoreName\s*\=\s*([^;]*).*$)|^.*$/, "$1") || "Anonymous"} ${newHighScore ? '<span class="highlight">(New!)</span>' : ''}</p>
        </div>
      </div>
      <button id="restart-btn">Play Again</button>
    `;

    // Ensure the reset button is added to the DOM and visible
    const resetButton = document.createElement("button");
    resetButton.id = "reset-btn";
    resetButton.textContent = "Reset High Scores";
    resetButton.style.display = "block"; // Ensure it is displayed
    this.resultDiv.appendChild(resetButton);

    // Bind the reset button to clear cookies
    resetButton.addEventListener("click", () => {
      document.cookie = "highScore=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      document.cookie = "highScoreName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      document.cookie = "fastestAvgTime=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      document.cookie = "fastestAvgTimeName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      alert("High scores have been reset!");
      location.reload(); // Reload the page to reflect the reset
    });

    // Rebind the restart button
    document.getElementById("restart-btn").addEventListener("click", () => {
      this.startQuiz(this.selectedQuestionCount || 10);
    });
  }
}

fetch("config.json")
  .then(response => response.json())
  .then(config => {
    new QuizGame(config);
  });