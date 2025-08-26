// Path: frontend/src/App.jsx

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import EventPage from "./components/EventPage";
import BroadcastLeaderboard from "./components/BroadcastLeaderboard";

// This component will protect the EventPage route
const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-4xl text-primary animate-pulse">
          // INITIALIZING...
        </h1>
      </div>
    );
  }

  // If there is a session, render the children (EventPage) and pass the session as a prop
  // Otherwise, render the LoginPage
  return session ? React.cloneElement(children, { session }) : <LoginPage />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <EventPage />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<BroadcastLeaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
