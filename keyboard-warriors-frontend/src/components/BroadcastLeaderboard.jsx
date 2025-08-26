// Path: frontend/src/components/BroadcastLeaderboard.jsx

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";

export default function BroadcastLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);

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

      // 2. Set up the real-time listener
      const channel = supabase
        .channel("public:submissions-broadcast")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "submissions" },
          (payload) => {
            console.log("New submission received on broadcast!", payload);
            setSubmissions((currentSubmissions) => [
              ...currentSubmissions,
              payload.new,
            ]);
          }
        )
        .subscribe();

      // 3. Clean up the listener
      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchAndSubscribe();
  }, []);

  useEffect(() => {
    // This effect recalculates the leaderboard whenever submissions or participants change
    if (participants.length === 0) return;

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

    const sortedLeaderboard = Object.values(scores)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.lastSubmission - b.lastSubmission;
      })
      .slice(0, 15); // Show top 15 for a cleaner big-screen view

    setLeaderboard(sortedLeaderboard);
  }, [submissions, participants]);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono">
      {/* Left Half: Leaderboard */}
      <div className="w-1/2 p-8 flex flex-col">
        <h1 className="text-6xl font-bold tracking-widest text-primary animate-pulse mb-8">
          KEYBOARD WARRIORS
        </h1>
        <div className="flex-grow">
          <ul className="space-y-4">
            {leaderboard.map((p, index) => (
              <motion.li
                key={p.email}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border"
              >
                <span className="flex items-center text-3xl">
                  <span className="font-bold w-12 mr-4 text-primary">
                    {index + 1}.
                  </span>
                  <span className="truncate">{p.email}</span>
                </span>
                <span className="font-bold text-primary bg-primary/10 px-4 py-2 text-2xl rounded-md">
                  {p.score}
                </span>
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
