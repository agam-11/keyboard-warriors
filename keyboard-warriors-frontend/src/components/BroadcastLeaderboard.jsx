// Path: frontend/src/components/BroadcastLeaderboard.jsx

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

// Helper to get styling for Top 3 winners
const getRankStyling = (index) => {
  switch (index) {
    case 0:
      return "border-yellow-400 text-yellow-400 shadow-lg shadow-yellow-400/20"; // Gold
    case 1:
      return "border-slate-400 text-slate-400 shadow-lg shadow-slate-400/20"; // Silver
    case 2:
      return "border-amber-700 text-amber-700 shadow-lg shadow-amber-700/20"; // Bronze
    default:
      return "border-border text-foreground"; // Default for others
  }
};

export default function BroadcastLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    // This combined hook fetches initial data and sets up the real-time listener
    const fetchAndSubscribe = async () => {
      // 1. Fetch initial data
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

      // 2. Set up real-time listeners for both submissions and winners
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

      // 3. Clean up the listeners
      return () => {
        supabase.removeChannel(submissionsChannel);
        supabase.removeChannel(winnersChannel);
      };
    };

    fetchAndSubscribe();
  }, []);

  useEffect(() => {
    // This effect recalculates the leaderboard whenever submissions or participants change
    if (participants.length === 0) return;

    const winnerIds = new Set(winners.map((w) => w.participant_id));

    // Separate participants who are still playing
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
      return {
        email: participant?.email || "Unknown",
        won_at: w.won_at,
        isWinner: true,
      };
    });

    const combinedLeaderboard = [...winnerScores, ...playingScores].slice(
      0,
      15
    );
    setLeaderboard(combinedLeaderboard);
  }, [submissions, participants, winners]);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono">
      {/* Left Half: Leaderboard */}
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
                    Finished: {new Date(p.won_at).toLocaleTimeString()}
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

      {/* Right Half: Placeholder for Sponsor Videos */}
      <div className="w-1/2 bg-black flex items-center justify-center border-l-4 border-primary">
        <div className="text-center text-muted">
          <h2 className="text-4xl font-bold">SPONSOR VIDEO</h2>
          <p className="mt-2">This area is reserved for video playback.</p>
        </div>
      </div>
    </div>
  );
}
