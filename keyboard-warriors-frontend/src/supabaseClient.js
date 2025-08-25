// Path: src/supabaseClient.js
// This file initializes the Supabase client.

import { createClient } from "@supabase/supabase-js";

// IMPORTANT: Replace these with your actual Supabase Project URL and Anon Key
const supabaseUrl = "https://neihadbjdhblhrpmwarc.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWhhZGJqZGhibGhycG13YXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTgxODgsImV4cCI6MjA3MTY5NDE4OH0.0EtMUOnVTcCuMMwaKuXLYOUmwbm_n6Z1-1CwB7bq0tw";

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
