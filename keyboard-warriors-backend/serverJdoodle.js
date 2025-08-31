require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// =================================================================================
// INITIALIZATION
// =================================================================================
const app = express();
const port = process.env.PORT || 8080; // Render uses PORT env var
const allowedOrigins = [
  "http://localhost:5173",
  "https://keyboard-warriors-mwqq1s8oo-agam11s-projects.vercel.app",
  "https://keyboard-warriors-ebon.vercel.app",
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// =================================================================================
// LANGUAGE & TEST CASE CONFIGURATION
// =================================================================================
const languageMap = {
  python: { lang: "python3", versionIndex: "4" },
  javascript: { lang: "nodejs", versionIndex: "4" },
  cpp: { lang: "cpp17", versionIndex: "1" },
};

const testCases = {
  1: {
    stdin: "",
    expectedOutput:
      "1 2 3 4 5\n1 2 3 4\n1 2 3\n1 2\n1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5",
  },
  2: {
    stdin: "Khoor, Zruog!\n3",
    expectedOutput: "Hello, World!",
  },
  3: {
    stdin: "listen\nsilent",
    expectedOutput: "The words are anagrams!",
  },
  4: {
    stdin: "01001000 01000101 01001100 01001100 01001111",
    expectedOutput: "HELLO",
  },
};

// =================================================================================
// JDOODLE EXECUTION LOGIC
// =================================================================================
async function executeCodeWithJDoodle(code, testCase, language) {
  const langConfig = languageMap[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await axios({
    method: "post",
    url: "https://api.jdoodle.com/v1/execute",
    data: {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      stdin: testCase.stdin,
      language: langConfig.lang,
      versionIndex: langConfig.versionIndex,
    },
    headers: { "Content-Type": "application/json" },
  });

  if (response.data.error || response.data.statusCode !== 200) {
    throw new Error(
      response.data.error || `JDoodle API Error: ${response.data.statusCode}`
    );
  }

  return response.data.output.trim();
}

// =================================================================================
// API ENDPOINT
// =================================================================================
app.post("/run-code", async (req, res) => {
  try {
    const { code, question_id, language } = req.body;
    const testCase = testCases[question_id];

    // Auth Check
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ error: "Auth header missing." });
    const token = authHeader.split(" ")[1];
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user)
      return res.status(401).json({ error: "Invalid token." });

    // Input Validation
    if (!code || !question_id || !testCase || !language) {
      return res.status(400).json({ error: "Invalid request payload." });
    }

    // Code Execution
    const actualOutput = await executeCodeWithJDoodle(code, testCase, language);
    const isCorrect = actualOutput === testCase.expectedOutput.trim();

    // Database Update
    if (isCorrect) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error: insertError } = await supabaseAdmin
        .from("submissions")
        .insert({
          participant_id: user.id,
          participant_email: user.email,
          question_id: question_id,
          is_correct: true,
        });
      if (insertError) throw insertError;
    }

    res.status(200).json({ is_correct: isCorrect, output: actualOutput });
  } catch (error) {
    console.error(
      "An error occurred:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "An error occurred during code execution." });
  }
});

// =================================================================================
// START SERVER
// =================================================================================
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
