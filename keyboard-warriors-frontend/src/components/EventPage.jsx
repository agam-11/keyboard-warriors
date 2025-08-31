// Path: frontend/src/components/EventPage.jsx

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import VaultModal from "./VaultModal";
import WinnerScreen from "./WinnerScreen";
import Timer from "./Timer"; // <-- IMPORT TIMER
import { motion, AnimatePresence } from "framer-motion";
import { useSounds } from "../hooks/useSounds";
import InfoModal from "./InfoModal"; // <-- IMPORT THE NEW MODAL

// const API_URL = "https://keyboard-warriors-production.up.railway.app/run-code";
// const API_URL = "http://localhost:3001/run-code";
// const API_URL = "http://40.81.241.235/run-code";
// const API_URL = "http://20.40.57.155/run-code";
const API_URL = "http://4.240.91.240/run-code";

const FINAL_PHRASE = "LIVE LIFE LOVE LAUGH";
const PATTERN_TEXT = `1 2 3 4 5
1 2 3 4
1 2 3
1 2
1
1 2
1 2 3
1 2 3 4
1 2 3 4 5`;

// ... (Keep the SVG Icons)
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-3 inline-block text-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-3 inline-block text-primary"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export default function EventPage({ session }) {
  const { playSuccess, playError, playWinner, playClick } = useSounds();

  // ... (Keep all existing state)
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [solvedQuestionIds, setSolvedQuestionIds] = useState(new Set());
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedWord, setRevealedWord] = useState("");
  const [finalAttempt, setFinalAttempt] = useState("");
  const [gameWon, setGameWon] = useState(false);
  const [collectedWords, setCollectedWords] = useState([]);

  // NEW STATE FOR THE INFO MODAL
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // NEW STATE FOR TIMER
  const [startTime, setStartTime] = useState(null);
  const [finishTime, setFinishTime] = useState(null);

  const languageExtensions = {
    python: [python()],
    javascript: [javascript({ jsx: true })],
    cpp: [cpp()],
  };

  // ... (Keep the leaderboard useEffect)
  useEffect(() => {
    if (questions.length === 0 && participants.length === 0) return;
    const userSubmissions = submissions.filter(
      (s) => s.participant_id === session.user.id && s.is_correct
    );
    const solvedIds = new Set(userSubmissions.map((s) => s.question_id));
    setSolvedQuestionIds(solvedIds);
    const words = questions
      .filter((q) => solvedIds.has(q.id))
      .map((q) => q.secret_word);
    setCollectedWords(words);
    const firstUnsolved = questions.find((q) => !solvedIds.has(q.id));
    setActiveQuestion(firstUnsolved || null);
    setCode("");
    setMessage("");
    const scores = participants.reduce((acc, p) => {
      const participantSubmissions = submissions.filter(
        (s) => s.participant_id === p.id && s.is_correct
      );
      const uniqueSolved = new Set(
        participantSubmissions.map((s) => s.question_id)
      );
      const lastSubmissionTime = Math.max(
        0,
        ...participantSubmissions.map((s) => new Date(s.submitted_at).getTime())
      );
      acc[p.id] = {
        email: p.email,
        score: uniqueSolved.size,
        lastSubmission: lastSubmissionTime,
      };
      return acc;
    }, {});
    const sortedLeaderboard = Object.values(scores).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.lastSubmission - b.lastSubmission;
    });
    setLeaderboard(sortedLeaderboard);
  }, [submissions, questions, participants, session.user.id]);

  // UPDATED data fetching and real-time hook
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch event start time
      const { data: configData } = await supabase
        .from("event_config")
        .select("start_time")
        .limit(1)
        .single();
      if (configData) setStartTime(configData.start_time);

      // Check if user has already won
      const { data: winnerData } = await supabase
        .from("winners")
        .select("won_at")
        .eq("participant_id", session.user.id)
        .single();
      if (winnerData) {
        setGameWon(true);
        setFinishTime(winnerData.won_at);
        return;
      }

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .order("order", { ascending: true });
      setQuestions(questionsData || []);

      const { data: participantsData } = await supabase
        .from("participants")
        .select("id, email");
      setParticipants(participantsData || []);

      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("*");
      setSubmissions(submissionsData || []);
    };

    fetchInitialData();

    const channel = supabase
      .channel("public:submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          setSubmissions((currentSubmissions) => {
            if (currentSubmissions.some((s) => s.id === payload.new.id))
              return currentSubmissions;
            return [...currentSubmissions, payload.new];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session.user.id]);

  // ... (Keep handleSubmitCode)
  const handleSubmitCode = async () => {
    playClick();
    if (!code || !activeQuestion) return;
    setIsLoading(true);
    setMessage("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          code,
          language,
          question_id: activeQuestion.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Server returned an error: ${response.statusText}`
        );
      }
      const result = await response.json();
      if (result.is_correct) {
        playSuccess();
        const solvedQuestion = questions.find(
          (q) => q.id === activeQuestion.id
        );
        if (solvedQuestion) {
          setRevealedWord(solvedQuestion.secret_word);
          setIsModalOpen(true);
          const newSubmission = {
            id: Math.random(),
            participant_id: session.user.id,
            participant_email: session.user.email,
            question_id: activeQuestion.id,
            is_correct: true,
            submitted_at: new Date().toISOString(),
          };
          setSubmissions((currentSubmissions) => [
            ...currentSubmissions,
            newSubmission,
          ]);
        }
      } else {
        playError();
        setMessage(`Incorrect. Output:\n${result.output}`);
      }
    } catch (error) {
      playError();
      console.error("Submission Error:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    playClick();
    await supabase.auth.signOut();
  };

  // UPDATED final submit handler
  const handleFinalSubmit = async () => {
    playClick();
    if (finalAttempt.trim().toUpperCase() === FINAL_PHRASE) {
      playWinner();
      const { data, error } = await supabase
        .from("winners")
        .insert({ participant_id: session.user.id })
        .select()
        .single();
      if (data) {
        setFinishTime(data.won_at);
      }
      setGameWon(true);
    } else {
      playError();
      setMessage("INCORRECT PHRASE. ACCESS DENIED.");
    }
  };

  // NEW HANDLERS FOR INFO MODAL
  const showPattern = () => {
    playClick();
    setModalContent({ type: "text", content: PATTERN_TEXT });
    setInfoModalOpen(true);
  };

  const showImage = (url) => {
    playClick();
    setModalContent({ type: "image", content: url });
    setInfoModalOpen(true);
  };

  if (gameWon) {
    return <WinnerScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 flex flex-col">
      <VaultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        secretWord={revealedWord}
      />

      {/* RENDER THE NEW INFO MODAL */}
      <InfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        content={modalContent}
      />

      <header className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-primary animate-pulse">
            KEYBOARD WARRIORS
          </h1>
          <p className="text-sm text-muted">
            Participant: {session.user.email}
          </p>
        </div>
        {/* ADD TIMER TO HEADER */}
        <Timer startTime={startTime} finishTime={finishTime} />
        <button
          onClick={handleLogout}
          className="border border-destructive text-destructive px-4 py-2 rounded hover:bg-destructive hover:text-background transition-colors duration-300"
        >
          Logout
        </button>
      </header>

      {/* ... (Rest of the JSX is the same) */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-background/50 border border-border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 border-b border-border pb-2 text-primary">
            VAULT STATUS
          </h2>
          <ul className="space-y-3">
            {questions.map((q, index) => {
              const isSolved = solvedQuestionIds.has(q.id);
              const isLocked =
                !isSolved && activeQuestion && q.order > activeQuestion.order;
              const isActive = activeQuestion && q.id === activeQuestion.id;

              return (
                <li
                  key={q.id}
                  className={`p-3 rounded border transition-all duration-300 ${
                    isActive ? "bg-primary/10 border-primary" : "border-muted"
                  } ${
                    isLocked
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-default"
                  }`}
                >
                  {isSolved ? <CheckCircleIcon /> : <LockIcon />}
                  <span
                    className={
                      isSolved
                        ? "text-primary"
                        : isLocked
                        ? "text-muted"
                        : "text-foreground"
                    }
                  >
                    Vault #{index + 1}: {q.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-6 bg-background/50 border border-border rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4 border-b border-border pb-2 text-primary">
            {activeQuestion
              ? `CHALLENGE: ${activeQuestion.title}`
              : "FINAL CHALLENGE"}
          </h2>
          {activeQuestion ? (
            <>
              <div className="flex-grow text-foreground mb-4 whitespace-pre-wrap p-2 bg-black/20 rounded">
                <p>{activeQuestion.prompt}</p>
                {/* NEW BUTTONS FOR PATTERN AND IMAGE */}
                {activeQuestion.id === 1 && (
                  <button
                    onClick={showPattern}
                    className="mt-4 text-sm flex items-center justify-center w-full border border-accent text-accent px-3 py-2 rounded hover:bg-accent hover:text-background transition-colors duration-300"
                  >
                    <EyeIcon /> Show Required Pattern
                  </button>
                )}
                {activeQuestion.id === 4 && activeQuestion.attachment_url && (
                  <button
                    onClick={() => showImage(activeQuestion.attachment_url)}
                    className="mt-4 text-sm flex items-center justify-center w-full border border-accent text-accent px-3 py-2 rounded hover:bg-accent hover:text-background transition-colors duration-300"
                  >
                    <EyeIcon /> Show Reference Image
                  </button>
                )}
              </div>

              <div className="flex items-center mb-2">
                <label className="text-sm mr-2">Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-muted text-foreground rounded px-2 py-1"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="h-64 bg-black border border-muted rounded font-mono text-sm overflow-hidden">
                <CodeMirror
                  value={code}
                  height="256px"
                  theme={okaidia}
                  extensions={languageExtensions[language]}
                  onChange={(value) => setCode(value)}
                />
              </div>
              {message && (
                <div
                  className={`mt-4 p-2 rounded text-xs whitespace-pre-wrap ${
                    message.startsWith("Correct")
                      ? "bg-accent/20 text-accent"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {message}
                </div>
              )}
              <button
                onClick={handleSubmitCode}
                disabled={isLoading}
                className="mt-4 w-full bg-primary text-background font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors duration-300 disabled:opacity-50 disabled:animate-pulse"
              >
                {isLoading ? "EXECUTING..." : "SUBMIT & RUN"}
              </button>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <p className="text-lg text-foreground mb-4">
                  You have collected all the secret words. Unscramble them to
                  form the final phrase and unlock the mainframe.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {collectedWords.map((word) => (
                    <div
                      key={word}
                      className="bg-muted/50 border border-border px-4 py-2 rounded text-2xl font-bold text-primary animate-pulse"
                    >
                      {word}
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={finalAttempt}
                  onChange={(e) => setFinalAttempt(e.target.value)}
                  placeholder="Enter the final phrase..."
                  className="w-full max-w-lg bg-background border border-muted rounded px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-300"
                />
                {message && (
                  <div
                    className={`mt-4 p-2 rounded text-xs whitespace-pre-wrap ${
                      message.startsWith("SYSTEM")
                        ? "bg-accent/20 text-accent"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {message}
                  </div>
                )}
                <button
                  onClick={handleFinalSubmit}
                  className="mt-4 w-full max-w-lg bg-accent text-background font-bold py-2 px-4 rounded hover:bg-opacity-90 transition-colors duration-300"
                >
                  UNLOCK MAINFRAME
                </button>
              </motion.div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-background/50 border border-border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 border-b border-border pb-2 text-primary">
            LEADERBOARD
          </h2>
          <ul className="space-y-2">
            {leaderboard.map((p, index) => (
              <motion.li
                key={p.email}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="flex justify-between items-center bg-muted/20 p-2 rounded"
              >
                <span className="flex items-center">
                  <span className="font-bold text-sm w-6 mr-2 text-primary">
                    {index + 1}.
                  </span>
                  <span className="text-sm truncate">{p.email}</span>
                </span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-1 text-xs rounded">
                  {p.score} Solved
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
