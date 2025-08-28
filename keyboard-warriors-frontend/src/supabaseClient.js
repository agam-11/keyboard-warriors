// Path: src/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

// Read the variables from the environment.
// Vite uses `import.meta.env` to access them.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
