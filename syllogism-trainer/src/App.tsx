import React, { useState, useRef } from "react";
import "./App.css";
import { getRandomQuiz } from "./quizUtils";

function App() {
  const [started, setStarted] = useState(false);
  const [points, setPoints] = useState(0);
  const [quiz, setQuiz] = useState(getRandomQuiz());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Timer and analytics state
  const [timer, setTimer] = useState(0);
  const [timings, setTimings] = useState<number[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const timerRef = useRef<number | null>(null); // Use number for browser setInterval
  const startTimeRef = useRef<number | null>(null);

  // Helper to extract premise type (e.g., All, No, Some, Either/Or)
  function getPremiseType(premise: string) {
    if (/^All /i.test(premise)) return "All";
    if (/^No /i.test(premise)) return "No";
    if (/^Some /i.test(premise)) return "Some";
    if (/either.*or/i.test(premise)) return "Either/Or";
    return "Other";
  }

  // Start timer when new question appears
  const startTimer = () => {
    setTimer(0);
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimer(Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000));
    }, 200);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (startTimeRef.current !== null) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTimings((prev) => [...prev, elapsed]);
    }
    startTimeRef.current = null;
  };

  // On mount and on new question
  React.useEffect(() => {
    if (sessionActive && started) startTimer();
    // eslint-disable-next-line
  }, [quiz, sessionActive, started]);

  const handleAnswer = (answer: boolean) => {
    setAnswered(true);
    stopTimer();
    if (answer === quiz.correct) {
      setPoints((p) => p + 1);
      setFeedback("Correct!");
    } else {
      setFeedback("Incorrect.");
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    setQuiz(getRandomQuiz());
    setFeedback(null);
    setShowExplanation(false);
    setAnswered(false);
    // Timer will restart via useEffect
  };

  // End session handler
  const handleEndSession = () => {
    setSessionActive(false);
    stopTimer();
    setShowAnalytics(true);
  };

  // Analytics calculations
  const totalTime = timings.reduce((a, b) => a + b, 0);
  const avgTime = timings.length ? totalTime / timings.length : 0;

  // Weakest premise type calculation
  const premiseTypesRef = useRef<string[]>([]);
  React.useEffect(() => {
    if (
      sessionActive &&
      started &&
      premiseTypesRef.current.length < timings.length + 1
    ) {
      premiseTypesRef.current.push(getPremiseType(quiz.premise));
    }
    // eslint-disable-next-line
  }, [quiz, started]);

  const premiseTypeStats = premiseTypesRef.current.reduce(
    (acc, type, idx) => {
      if (!acc[type]) acc[type] = [];
      if (timings[idx] !== undefined) acc[type].push(timings[idx]);
      return acc;
    },
    {} as Record<string, number[]>,
  );
  let weakestType: string | null = null;
  let maxAvg = 0;
  Object.entries(premiseTypeStats).forEach(([type, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (arr.length > 0 && avg > maxAvg) {
      maxAvg = avg;
      weakestType = type;
    }
  });

  // Start page
  if (!started) {
    return (
      <div className="quiz-outer-center">
        <div
          className="quiz-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 340,
          }}
        >
          <h1 style={{ color: "#ffd54f", marginBottom: 32 }}>
            Syllogism Trainer
          </h1>
          <button
            className="next-btn"
            style={{ fontSize: 22, padding: "0.8em 2em" }}
            onClick={() => setStarted(true)}
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-outer-center">
      <div
        className="quiz-container"
        style={{ position: "relative", minWidth: 340 }}
      >
        <h2>Points: {points}</h2>
        <div className="premise">{quiz.premise}</div>
        <div className="question">{quiz.question}</div>
        <div style={{ margin: "0.5em 0" }}>
          <strong>Time:</strong> {timer.toFixed(1)}s
        </div>
        <div className="buttons">
          <button onClick={() => handleAnswer(true)} disabled={answered}>
            Yes
          </button>
          <button onClick={() => handleAnswer(false)} disabled={answered}>
            No
          </button>
        </div>
        {feedback && <div className="feedback">{feedback}</div>}
        {showExplanation && quiz.explanation && (
          <div className="explanation">
            <div>
              <strong>Explanation:</strong> {quiz.explanation}
            </div>
            <div className="key-takeaway">
              <strong>Key takeaway:</strong> {quiz.keyTakeaway}
            </div>
          </div>
        )}
        {answered && (
          <div style={{ display: "flex", gap: "1em", marginTop: "1em" }}>
            <button className="next-btn" onClick={handleNext}>
              Next Question
            </button>
            <button
              className="next-btn end-session-btn"
              onClick={handleEndSession}
              style={{ background: "#e74c3c", color: "white" }}
            >
              End Session
            </button>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className="analytics-modal-overlay">
            <div className="analytics-modal-content">
              <h2 style={{ color: "#e74c3c" }}>Session Analytics</h2>
              <div>
                <strong>Total time:</strong> {totalTime.toFixed(1)}s
              </div>
              <div>
                <strong>Average time per question:</strong> {avgTime.toFixed(1)}
                s
              </div>
              <div style={{ margin: "1em 0" }}>
                <strong>Time per question:</strong>
                <ol>
                  {timings.map((t, i) => (
                    <li key={i}>
                      {t.toFixed(1)}s ({premiseTypesRef.current[i] || "?"})
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <strong>Weakest premise type:</strong>{" "}
                {weakestType
                  ? `${weakestType} (${maxAvg.toFixed(1)}s avg)`
                  : "-"}
              </div>
              <button
                className="next-btn"
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 16,
                  background: "#ffd54f",
                  color: "#23262f",
                }}
              >
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
