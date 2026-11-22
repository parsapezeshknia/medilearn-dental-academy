document.addEventListener("DOMContentLoaded", () => {
  const completed = new Set(
    JSON.parse(localStorage.getItem("medilearnCompleted") || "[]")
  );

  let activeLesson = null;
  let quizQuestions = [];
  let quizAnswers = [];
  let quizIndex = 0;
  let quizLocked = false;

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function updateProgress() {
    const total = document.querySelectorAll("[data-lesson]").length;
    const count = completed.size;
    const percent = total ? Math.round(count / total * 100) : 0;

    if ($("progressText"))
      $("progressText").textContent = `${count} of ${total} completed`;

    if ($("progressBar"))
      $("progressBar").style.width = `${percent}%`;

    if ($("panelProgress"))
      $("panelProgress").textContent = `${percent}%`;

    if ($("panelBar"))
      $("panelBar").style.width = `${percent}%`;

    document.querySelectorAll("[data-status]").forEach(item => {
      item.textContent = completed.has(item.dataset.status)
        ? "Completed ✓"
        : "Not started";
    });
  }

  updateProgress();

  // LESSONS
  document.querySelectorAll("[data-lesson]").forEach(button => {
    button.addEventListener("click", () => {
      openLesson(button.dataset.lesson);
    });
  });

  async function openLesson(id) {
    try {
      const response = await fetch(`/api/lesson/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Lesson unavailable");

      const lesson = await response.json();
      activeLesson = id;

      $("modalCategory").textContent =
        lesson.category || lesson.level || "DENTAL LEARNING";

      $("modalTitle").textContent = lesson.title || "Lesson";

      const objectives = lesson.objectives || [];
      $("modalObjectives").innerHTML = objectives.length
        ? "<strong>Learning objectives</strong><ul>" +
          objectives.map(item => `<li>${escapeHTML(item)}</li>`).join("") +
          "</ul>"
        : "";

      const content = lesson.content || [];

      $("modalContent").innerHTML = content.map(item => {
        if (Array.isArray(item)) {
          return `<h3>${escapeHTML(item[0])}</h3>
                  <p>${escapeHTML(item[1])}</p>`;
        }

        return `<h3>${escapeHTML(item.title || item.heading || "")}</h3>
                <p>${escapeHTML(item.text || item.description || item.content || "")}</p>`;
      }).join("");

      $("completeLesson").textContent = completed.has(id)
        ? "Completed ✓"
        : "Mark lesson as complete ✓";

      $("lessonModal").style.display = "flex";
    } catch (error) {
      alert("Could not load this lesson. Please try again.");
    }
  }

  function closeLesson() {
    $("lessonModal").style.display = "none";
  }

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", closeLesson);
  });

  $("completeLesson").addEventListener("click", () => {
    if (!activeLesson) return;

    completed.add(activeLesson);
    localStorage.setItem(
      "medilearnCompleted",
      JSON.stringify([...completed])
    );

    updateProgress();
    $("completeLesson").textContent = "Completed ✓";
  });

  // STUDY ASSISTANT
  function addMessage(message, type) {
    const item = document.createElement("p");
    item.className = type === "user" ? "user" : "bot";
    item.textContent = message;
    $("chatMessages").appendChild(item);
  }

  $("chatForm").addEventListener("submit", async event => {
    event.preventDefault();

    const input = $("chatInput");
    const prompt = input.value.trim();

    if (!prompt) return;

    addMessage(prompt, "user");
    input.value = "";

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Request failed");

      addMessage(data.answer || "No answer was returned.", "bot");
    } catch (error) {
      addMessage("Sorry, the study assistant is unavailable right now.", "bot");
    }
  });

  // QUIZ
  $("startQuiz").addEventListener("click", startQuiz);

  async function startQuiz() {
  try {
    const response = await fetch("/api/quiz");
    if (!response.ok) throw new Error("Quiz unavailable");

    const data = await response.json();

    quizQuestions = (Array.isArray(data) ? data : data.questions || []).map(item => ({
      question: item.q || item.question,
      options: item.options
    }));

    quizAnswers = [];
    quizIndex = 0;
    quizLocked = false;

    if (!quizQuestions.length) throw new Error("No questions found");

    renderQuestion();
  } catch (error) {
    $("quizArea").textContent =
      "The quiz could not be loaded. Please try again.";
  }
function renderQuestion() {
    const question = quizQuestions[quizIndex];

    $("quizArea").innerHTML = `
      <div class="question">
        Question ${quizIndex + 1} of ${quizQuestions.length}
      </div>
      <p class="question">${escapeHTML(question.question)}</p>
      <div class="options">
        ${question.options.map((option, index) => `
          <button class="option" data-option="${index}">
            ${String.fromCharCode(65 + index)}. ${escapeHTML(option)}
          </button>
        `).join("")}
      </div>
      <div id="quizFeedback"></div>
    `;

    $("quizArea").querySelectorAll("[data-option]").forEach(button => {
      button.addEventListener("click", () => {
        selectAnswer(Number(button.dataset.option));
      });
    });

    quizLocked = false;
  }

  function selectAnswer(index) {
    if (quizLocked) return;

    quizLocked = true;
    quizAnswers[quizIndex] = index;

    $("quizArea").querySelectorAll("[data-option]").forEach(button => {
      button.disabled = true;

      if (Number(button.dataset.option) === index) {
        button.classList.add("selected");
      }
    });

    if (quizIndex === quizQuestions.length - 1) {
      showResult();
    } else {
      $("quizFeedback").innerHTML =
        '<button class="btn" id="nextQuestion">Next question →</button>';

      $("nextQuestion").addEventListener("click", () => {
        quizIndex++;
        renderQuestion();
      });
    }
  }

 async function showResult() {
  try {
    const response = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: quizAnswers })
    });

    if (!response.ok) throw new Error("Could not submit answers");

    const result = await response.json();

    const details = (result.details || []).map((item, index) => `
      <p class="quiz-feedback">
        <strong>Question ${index + 1}:</strong>
        ${item.correct ? "Correct ✓" : "Review"}
        - ${escapeHTML(item.explanation || "")}
      </p>
    `).join("");

    const percentage = result.total
      ? Math.round((result.score / result.total) * 100)
      : 0;

    $("quizArea").innerHTML = `
      <h2>${result.score} / ${result.total}</h2>
      <h3>Your score: ${percentage}%</h3>
      <p>Review the explanations to strengthen your knowledge.</p>
      ${details}
      <button class="btn" id="retryQuiz">Try again ↻</button>
    `;

    $("retryQuiz").addEventListener("click", startQuiz);

  } catch (error) {
    $("quizArea").textContent =
      "There was a problem submitting your answers. Please try again.";
  }
  }
});
