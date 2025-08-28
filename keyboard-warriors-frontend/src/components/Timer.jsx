// Path: frontend/src/components/Timer.jsx

import { useState, useEffect } from "react";

// Helper function to format milliseconds into MM:SS
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export default function Timer({ startTime, finishTime }) {
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    if (!startTime) return;

    // If the user has already finished, calculate and display the final duration and stop.
    if (finishTime) {
      const duration = new Date(finishTime) - new Date(startTime);
      setElapsedTime(formatTime(duration));
      return;
    }

    // Otherwise, start a live timer that ticks every second.
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - new Date(startTime).getTime();
      setElapsedTime(formatTime(elapsed));
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [startTime, finishTime]);

  return (
    <div className="bg-primary/10 border border-primary text-primary font-bold text-2xl px-4 py-2 rounded-md">
      {elapsedTime}
    </div>
  );
}
