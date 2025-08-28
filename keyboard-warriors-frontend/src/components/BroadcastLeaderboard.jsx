// Path: frontend/src/components/BroadcastLeaderboard.jsx

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

// Helper to format milliseconds into a duration string (e.g., "12m 34s")
const formatDuration = (ms) => {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

// ... (Keep getRankStyling helper)
const getRankStyling = (index) => {
  switch (index) {
    case 0:
      return "border-yellow-400 text-yellow-400 shadow-lg shadow-yellow-400/20"; // Gold
    case 1:
      return "border-slate-400 text-slate-400 shadow-lg shadow-slate-400/20"; // Silver
    case 2:
      return "border-amber-700 text-amber-700 shadow-lg shadow-amber-700/20"; // Bronze
    default:
      return "border-border text-foreground";
  }
};

export default function BroadcastLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [winners, setWinners] = useState([]);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      // Fetch start time
      const { data: configData } = await supabase
        .from("event_config")
        .select("start_time")
        .limit(1)
        .single();
      if (configData) setStartTime(new Date(configData.start_time));

      // ... (rest of the fetching is the same)
      const { data: participantsData } = await supabase
        .from("participants")
        .select("id, email");
      setParticipants(participantsData || []);
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("*");
      setSubmissions(submissionsData || []);
      const { data: winnersData } = await supabase
        .from("winners")
        .select("*")
        .order("won_at", { ascending: true });
      setWinners(winnersData || []);

      // ... (rest of the subscriptions are the same)
      const submissionsChannel = supabase
        .channel("public:submissions-broadcast")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "submissions" },
          (payload) => setSubmissions((current) => [...current, payload.new])
        )
        .subscribe();
      const winnersChannel = supabase
        .channel("public:winners-broadcast")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "winners" },
          (payload) =>
            setWinners((current) =>
              [...current, payload.new].sort(
                (a, b) => new Date(a.won_at) - new Date(b.won_at)
              )
            )
        )
        .subscribe();

      return () => {
        supabase.removeChannel(submissionsChannel);
        supabase.removeChannel(winnersChannel);
      };
    };
    fetchAndSubscribe();
  }, []);

  useEffect(() => {
    if (participants.length === 0 || !startTime) return;

    const winnerIds = new Set(winners.map((w) => w.participant_id));
    const stillPlaying = participants.filter((p) => !winnerIds.has(p.id));

    const playingScores = stillPlaying
      .map((p) => {
        const participantSubmissions = submissions.filter(
          (s) => s.participant_id === p.id && s.is_correct
        );
        const score = new Set(participantSubmissions.map((s) => s.question_id))
          .size;
        const lastSubmissionTime = Math.max(
          0,
          ...participantSubmissions.map((s) =>
            new Date(s.submitted_at).getTime()
          )
        );
        return {
          email: p.email,
          score,
          lastSubmission: lastSubmissionTime,
          isWinner: false,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.lastSubmission - b.lastSubmission;
      });

    const winnerScores = winners.map((w) => {
      const participant = participants.find((p) => p.id === w.participant_id);
      // Calculate duration
      const duration = new Date(w.won_at) - startTime;
      return {
        email: participant?.email || "Unknown",
        duration,
        isWinner: true,
      };
    });

    const combinedLeaderboard = [...winnerScores, ...playingScores].slice(
      0,
      15
    );
    setLeaderboard(combinedLeaderboard);
  }, [submissions, participants, winners, startTime]);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono">
      <div className="w-1/2 p-8 flex flex-col">
        <h1 className="text-5xl font-bold tracking-widest text-primary animate-pulse mb-6 whitespace-nowrap">
          KEYBOARD WARRIORS
        </h1>
        <div className="flex-grow">
          <ul className="space-y-3">
            {leaderboard.map((p, index) => (
              <motion.li
                key={p.email}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`flex justify-between items-center bg-muted/20 p-3 rounded-lg border-2 ${
                  p.isWinner ? getRankStyling(index) : "border-border"
                }`}
              >
                <span className="flex items-center text-2xl">
                  <span
                    className={`font-bold w-10 mr-4 ${
                      !p.isWinner && "text-primary"
                    }`}
                  >
                    {index + 1}.
                  </span>
                  <span className="truncate">{p.email}</span>
                </span>
                {p.isWinner ? (
                  <span className="font-bold text-xl">
                    {formatDuration(p.duration)}
                  </span>
                ) : (
                  <span className="font-bold bg-primary/10 px-3 py-1 text-xl rounded-md text-primary">
                    {p.score}
                  </span>
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-1/2 bg-black flex items-center justify-center border-l-4 border-primary">
        <div className="text-center text-muted">
          <h2 className="text-4xl font-bold">SPONSOR VIDEO</h2>
          <p className="mt-2">This area is reserved for video playback.</p>
        </div>
      </div>
    </div>
  );
}
