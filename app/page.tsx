"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import quizData from "./data/questions.json";

/* ============ TYPES ============ */
interface Question {
  id: number;
  category: string;
  difficulty: string;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface HistoryEntry {
  id: string;
  date: string;
  category: string;
  categoryName: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  timeSpent: number;
}

type Screen = "home" | "quiz" | "results" | "history";
type Difficulty = "all" | "easy" | "medium" | "hard";

/* ============ HELPERS ============ */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return "var(--accent-green)";
  if (pct >= 60) return "var(--accent-blue)";
  if (pct >= 40) return "var(--accent-orange)";
  return "var(--accent-red)";
}

function getScoreBadge(pct: number): { label: string; className: string } {
  if (pct >= 90) return { label: "Excelent! 🌟", className: "excellent" };
  if (pct >= 70) return { label: "Foarte bine! 👏", className: "good" };
  if (pct >= 50) return { label: "Bine 👍", className: "average" };
  return { label: "Mai exersează 📚", className: "poor" };
}

function getTrophy(pct: number): string {
  if (pct >= 90) return "🏆";
  if (pct >= 70) return "🥈";
  if (pct >= 50) return "🥉";
  return "📖";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ============ LOCAL STORAGE ============ */
function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("dental-quiz-history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem("dental-quiz-history", JSON.stringify(entries));
}

function getBestScore(category: string, difficulty: string): number {
  const history = getHistory();
  const matching = history.filter(
    (h) => h.category === category && h.difficulty === difficulty
  );
  if (matching.length === 0) return 0;
  return Math.max(...matching.map((h) => h.percentage));
}

function getTotalGames(): number {
  return getHistory().length;
}

function getOverallBest(): number {
  const history = getHistory();
  if (history.length === 0) return 0;
  return Math.max(...history.map((h) => h.percentage));
}

/* ============ MAIN COMPONENT ============ */
export default function DentalQuiz() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<"play" | "history">("play");

  const categories: Category[] = quizData.categories as Category[];
  const allQuestions: Question[] = quizData.questions as Question[];

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Timer
  useEffect(() => {
    if (screen === "quiz" && !showExplanation) {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, showExplanation, currentIndex]);

  const getFilteredQuestions = useCallback((): Question[] => {
    let filtered = [...allQuestions];
    if (selectedCategory !== "all") {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === selectedDifficulty);
    }
    return shuffleArray(filtered);
  }, [selectedCategory, selectedDifficulty, allQuestions]);

  const getCategoryQuestionCount = (catId: string): number => {
    if (catId === "all") return allQuestions.length;
    return allQuestions.filter((q) => q.category === catId).length;
  };

  const startQuiz = () => {
    const filtered = getFilteredQuestions();
    if (filtered.length === 0) return;
    setQuestions(filtered);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setIsSubmitted(false);
    setShowExplanation(false);
    setScore(0);
    setWrongCount(0);
    setTimer(0);
    setScreen("quiz");
  };

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;

    const isMultiple = Array.isArray(questions[currentIndex].correctAnswer);

    if (isMultiple) {
      if (selectedOptions.includes(index)) {
        setSelectedOptions(selectedOptions.filter(i => i !== index));
      } else {
        setSelectedOptions([...selectedOptions, index]);
      }
    } else {
      setSelectedOptions([index]);
      setIsSubmitted(true);
      setShowExplanation(true);
      if (timerRef.current) clearInterval(timerRef.current);

      if (index === questions[currentIndex].correctAnswer) {
        setScore((s) => s + 1);
      } else {
        setWrongCount((w) => w + 1);
      }
    }
  };

  const handleVerifyMultiple = () => {
    if (isSubmitted || selectedOptions.length === 0) return;

    setIsSubmitted(true);
    setShowExplanation(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const correctAnswers = questions[currentIndex].correctAnswer as number[];
    const isCorrect = correctAnswers.length === selectedOptions.length && correctAnswers.every(val => selectedOptions.includes(val));

    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setWrongCount((w) => w + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOptions([]);
      setIsSubmitted(false);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const pct = Math.round((score / questions.length) * 100);
    const catName =
      selectedCategory === "all"
        ? "Toate categoriile"
        : categories.find((c) => c.id === selectedCategory)?.name || selectedCategory;

    const prevBest = getBestScore(selectedCategory, selectedDifficulty);
    setIsNewBest(pct > prevBest && prevBest > 0);

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: selectedCategory,
      categoryName: catName,
      difficulty: selectedDifficulty,
      score,
      total: questions.length,
      percentage: pct,
      timeSpent: timer,
    };

    const newHistory = [entry, ...getHistory()].slice(0, 50);
    saveHistory(newHistory);
    setHistory(newHistory);
    setScreen("results");
  };

  const goHome = () => {
    setScreen("home");
    setActiveTab("play");
  };

  const currentQuestion = questions[currentIndex];
  const progressPct =
    questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const finalPct =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  /* ============ RENDER ============ */
  return (
    <div className="app-container">
      {/* ---- HEADER ---- */}
      <header className="app-header">
        <div className="app-logo">🦷</div>
        <h1 className="app-title">DentalQuiz</h1>
        <p className="app-subtitle">Odontoterapie — Capitol 1</p>
      </header>

      {/* ============ HOME ============ */}
      {screen === "home" && (
        <div className="home-screen">
          {/* Nav Tabs */}
          <div className="nav-bar">
            <button
              className={`nav-btn ${activeTab === "play" ? "active" : ""}`}
              onClick={() => setActiveTab("play")}
            >
              🎮 Quiz
            </button>
            <button
              className={`nav-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              📊 Istoric
            </button>
          </div>

          {activeTab === "play" && (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-value">{getOverallBest()}%</div>
                  <div className="stat-label">Cel mai bun</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-value">{getTotalGames()}</div>
                  <div className="stat-label">Jocuri</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-value">{allQuestions.length}</div>
                  <div className="stat-label">Întrebări</div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="section-title">Categorie</div>
                <div className="category-grid">
                  <div
                    className={`category-card ${selectedCategory === "all" ? "selected" : ""}`}
                    onClick={() => setSelectedCategory("all")}
                    style={{ "--cat-color": "var(--accent-blue)" } as React.CSSProperties}
                  >
                    <div className="category-icon">📋</div>
                    <div className="category-name">Toate</div>
                    <div className="category-count">
                      {allQuestions.length} întrebări
                    </div>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`category-card ${selectedCategory === cat.id ? "selected" : ""}`}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{ "--cat-color": cat.color } as React.CSSProperties}
                    >
                      <div className="category-icon">{cat.icon}</div>
                      <div className="category-name">{cat.name}</div>
                      <div className="category-count">
                        {getCategoryQuestionCount(cat.id)} întrebări
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="difficulty-section">
                <div className="section-title">Dificultate</div>
                <div className="difficulty-options">
                  {(
                    [
                      { key: "all", label: "Toate" },
                      { key: "easy", label: "Ușor" },
                      { key: "medium", label: "Mediu" },
                      { key: "hard", label: "Greu" },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.key}
                      className={`difficulty-btn ${d.key} ${selectedDifficulty === d.key ? "selected" : ""}`}
                      onClick={() => setSelectedDifficulty(d.key)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start */}
              <button
                className="start-btn"
                onClick={startQuiz}
                disabled={getFilteredQuestions().length === 0}
              >
                Începe Quiz-ul 🚀
              </button>
            </>
          )}

          {activeTab === "history" && (
            <HistoryScreen history={history} />
          )}
        </div>
      )}

      {/* ============ QUIZ ============ */}
      {screen === "quiz" && currentQuestion && (
        <div className="quiz-screen">
          {/* Quiz Header */}
          <div className="quiz-header">
            <div className="quiz-progress-info">
              <span className="quiz-question-counter">
                {currentIndex + 1} / {questions.length}
              </span>
              <span className="quiz-category-badge">
                {categories.find((c) => c.id === currentQuestion.category)?.icon}{" "}
                {categories.find((c) => c.id === currentQuestion.category)?.name}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div className="timer-display">
                ⏱ {formatTime(timer)}
              </div>
              <div className="quiz-score-display">
                <span className="score-icon">⭐</span> {score}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Question */}
          <div className="glass-card question-card" key={currentQuestion.id}>
            <div className={`question-difficulty ${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty === "easy" && "🟢 Ușor"}
              {currentQuestion.difficulty === "medium" && "🟡 Mediu"}
              {currentQuestion.difficulty === "hard" && "🔴 Greu"}
            </div>
            {Array.isArray(currentQuestion.correctAnswer) && (
              <div className="question-difficulty" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
                ☑️ Mai multe răspunsuri corecte
              </div>
            )}
            <p className="question-text">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="options-container" key={`opts-${currentQuestion.id}`}>
            {currentQuestion.options.map((opt, idx) => {
              let className = "option-btn";
              const isMultiple = Array.isArray(currentQuestion.correctAnswer);
              const isSelected = selectedOptions.includes(idx);

              if (isSubmitted) {
                className += " disabled";
                const isCorrectAns = isMultiple 
                  ? (currentQuestion.correctAnswer as number[]).includes(idx)
                  : currentQuestion.correctAnswer === idx;
                
                if (isCorrectAns) {
                  className += " correct";
                } else if (isSelected) {
                  className += " wrong";
                }
              } else if (isSelected) {
                className += " selected";
              }

              return (
                <button
                  key={idx}
                  className={className}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isSubmitted}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {Array.isArray(currentQuestion.correctAnswer) && !isSubmitted && (
            <button 
              className="next-btn" 
              onClick={handleVerifyMultiple}
              disabled={selectedOptions.length === 0}
              style={{ marginTop: '10px', background: 'var(--accent-purple)' }}
            >
              Verifică Răspunsul ✅
            </button>
          )}

          {/* Explanation */}
          {showExplanation && (
            <div className="explanation-box">
              <div className="explanation-title">
                💡 Explicație
              </div>
              <p className="explanation-text">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Next */}
          {showExplanation && (
            <button className="next-btn" onClick={handleNext}>
              {currentIndex < questions.length - 1
                ? "Următoarea întrebare →"
                : "Vezi rezultatele 🏆"}
            </button>
          )}
        </div>
      )}

      {/* ============ RESULTS ============ */}
      {screen === "results" && (
        <div className="results-screen animate-fadeIn">
          <div className="results-trophy">{getTrophy(finalPct)}</div>
          <h2 className="results-title">Quiz Finalizat!</h2>
          <p className="results-subtitle">
            {getScoreBadge(finalPct).label}
          </p>

          <div className="glass-card results-score-card">
            <div className="results-score-big">{finalPct}%</div>
            <div className="results-score-label">
              {score} din {questions.length} răspunsuri corecte
            </div>
          </div>

          <div className="results-stats">
            <div className="result-stat">
              <div className="result-stat-value correct-color">{score}</div>
              <div className="result-stat-label">Corecte</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-value wrong-color">{wrongCount}</div>
              <div className="result-stat-label">Greșite</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-value time-color">
                {formatTime(timer)}
              </div>
              <div className="result-stat-label">Timp</div>
            </div>
          </div>

          {isNewBest && (
            <div className="results-badge new-best">
              🏅 Nou record personal!
            </div>
          )}

          <div className="results-actions">
            <button className="btn-secondary" onClick={goHome}>
              🏠 Acasă
            </button>
            <button className="btn-primary" onClick={startQuiz}>
              🔄 Joacă din nou
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ HISTORY SUBCOMPONENT ============ */
function HistoryScreen({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="history-empty-icon">📭</div>
        <div className="history-empty-text">
          Nu ai jucat încă niciun quiz.
          <br />
          Începe primul tău quiz acum!
        </div>
      </div>
    );
  }

  return (
    <div className="history-list">
      {history.map((entry, idx) => {
        const badge = getScoreBadge(entry.percentage);
        const dateStr = new Date(entry.date).toLocaleDateString("ro-RO", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const diffLabel =
          entry.difficulty === "all"
            ? "Toate"
            : entry.difficulty === "easy"
              ? "Ușor"
              : entry.difficulty === "medium"
                ? "Mediu"
                : "Greu";

        return (
          <div
            className="history-item"
            key={entry.id}
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            <div className="history-item-left">
              <div className="history-item-category">{entry.categoryName}</div>
              <div className="history-item-date">{dateStr}</div>
              <div className="history-item-details">
                {diffLabel} • {entry.score}/{entry.total} • {formatTime(entry.timeSpent)}
              </div>
            </div>
            <div className="history-item-right">
              <div
                className="history-item-score"
                style={{ color: getScoreColor(entry.percentage) }}
              >
                {entry.percentage}%
              </div>
              <span className={`history-item-badge ${badge.className}`}>
                {badge.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
