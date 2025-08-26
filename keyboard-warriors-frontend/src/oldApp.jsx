// Path: src/App.jsx

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import EventPage from "./components/EventPage"; // Import the real EventPage

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // Stop loading once we have auth state
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show a loading indicator while checking for session
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <h1 className="text-4xl text-primary animate-pulse">
          // INITIALIZING...
        </h1>
      </div>
    );
  }

  return (
    <div>{!session ? <LoginPage /> : <EventPage session={session} />}</div>
  );
}
