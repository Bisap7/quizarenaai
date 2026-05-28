import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

const API = "https://quizarenaai-2.onrender.com";

export default function App() {
  const [userId, setUserId] = useState("");
  const [started, setStarted] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [result, setResult] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [showBoard, setShowBoard] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // START QUIZ
  const startQuiz = async () => {
    if (!userId) return alert("Enter your name");

    await fetch(`${API}/start-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    const res = await fetch(`${API}/questions`);
    const data = await res.json();

    setQuestions(data);
    setStarted(true);
    setIndex(0);
    setScore(0);
  };

  // ANSWER QUESTION
  const answer = async (option) => {
    const q = questions[index];

    const res = await fetch(`${API}/check-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        question_id: q.id,
        answer: option,
      }),
    });

    const data = await res.json();

    if (data.current_score !== undefined) {
      setScore(data.current_score);
    }

    // show animation feedback
    if (data.is_correct) {
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    // wait before next question
    setTimeout(async () => {
      setFeedback(null);

      if (index + 1 < questions.length) {
        setIndex((prev) => prev + 1);
      } else {
        const resultRes = await fetch(`${API}/result/${userId}`);
        const resultData = await resultRes.json();
        setResult(resultData);
      }
    }, 1200);
  };

  // LOAD LEADERBOARD
  const loadLeaderboard = async () => {
    const res = await fetch(`${API}/leaderboard`);
    const data = await res.json();
    setLeaderboard(data);
    setShowBoard(true);
  };

  // RESET
  const reset = () => {
    setUserId("");
    setStarted(false);
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setResult(null);
    setShowBoard(false);
  };

  // LEADERBOARD SCREEN
  if (showBoard) {
    return (
      <motion.div
        className="container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1>🏆 Leaderboard</h1>

        {leaderboard.length === 0 ? (
          <p>No scores yet</p>
        ) : (
          leaderboard.map((user, i) => (
            <motion.div
              key={i}
              className="card"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3>
                #{i + 1} {user.user}
              </h3>
              <p
                style={{
                  fontWeight: "bold",
                  color: "#38bdf8",
                  fontSize: "18px",
                }}
              >
                🏅 Score: {user.score} / {user.total}
              </p>
            </motion.div>
          ))
        )}

        <button onClick={() => setShowBoard(false)}>Back</button>
      </motion.div>
    );
  }

  // START SCREEN
  if (!started) {
    return (
      <motion.div
        className="container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h1>🎮 QuizArena AI</h1>

        <input
          placeholder="Enter your name"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <button onClick={startQuiz}>Start Quiz</button>
        <button onClick={loadLeaderboard}>View Leaderboard 🏆</button>
      </motion.div>
    );
  }

  // RESULT SCREEN
  if (result) {
    return (
      <motion.div
        className="container"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5 }}
        >
          🏁 Quiz Completed
        </motion.h1>

        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Final Score: {result.final_score}
        </motion.h2>

        <h3>Total Questions: {result.total_questions}</h3>

        <button onClick={reset}>Play Again</button>
      </motion.div>
    );
  }

  const q = questions[index];

  // QUIZ SCREEN
  return (
    <motion.div
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3>Player: {userId}</h3>
      <h3>Score: {score}</h3>

      <p>
        Question {index + 1} / {questions.length}
      </p>

      {/* progress bar */}
      <div
        style={{
          width: "400px",
          margin: "0 auto",
          background: "#334155",
          borderRadius: "10px",
        }}
      >
        <motion.div
          style={{
            height: "10px",
            background: "#38bdf8",
            borderRadius: "10px",
          }}
          animate={{
            width: `${((index + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="card"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
        >
          <h2>{q.question}</h2>

          <div className="options">
            {q.options.map((opt, i) => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                key={i}
                onClick={() => answer(opt)}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* feedback animation */}
      {feedback === "correct" && (
        <motion.div
          className="feedback correct"
          initial={{ scale: 0 }}
          animate={{ scale: 1.2 }}
          exit={{ scale: 0 }}
        >
          ✅ Correct!
        </motion.div>
      )}

      {feedback === "wrong" && (
        <motion.div
          className="feedback wrong"
          initial={{ scale: 0 }}
          animate={{ scale: 1.2 }}
          exit={{ scale: 0 }}
        >
          ❌ Wrong!
        </motion.div>
      )}
    </motion.div>
  );
}
