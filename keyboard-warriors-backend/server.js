// Path: backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const Docker = require("dockerode");
const stream = require("stream");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

// =================================================================================
// INITIALIZATION
// =================================================================================
const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = [
  "http://localhost:5173",
  "https://keyboard-warriors-mwqq1s8oo-agam11s-projects.vercel.app/",
];
// Middleware setup
app.use(cors({ origin: allowedOrigins })); // Allow requests from our frontend
app.use(express.json());

// =================================================================================
// LANGUAGE & TEST CASE CONFIGURATION
// =================================================================================
const languageConfigs = {
  python: {
    image: "python:3.10-slim",
    fileName: "script.py",
    command: (filePath) => ["python", filePath],
  },
  javascript: {
    image: "node:18-slim",
    fileName: "script.js",
    command: (filePath) => ["node", filePath],
  },
  cpp: {
    image: "gcc:latest",
    fileName: "main.cpp",
    command: (filePath) => [
      "bash",
      "-c",
      `g++ ${filePath} -o /app/main && /app/main`,
    ],
  },
};

const testCases = {
  1: {
    stdin: "",
    expectedOutput:
      "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz",
  },
  2: {
    stdin: "A man a plan a canal Panama",
    expectedOutput: "Yes",
  },
  3: {
    stdin: "5",
    expectedOutput: "120",
  },
};

// =================================================================================
// DOCKER EXECUTION LOGIC
// =================================================================================
async function executeCodeInDocker(code, testCase, language) {
  const config = languageConfigs[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const docker = new Docker();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-runner-"));
  const scriptPath = path.join(tempDir, config.fileName);
  await fs.writeFile(scriptPath, code);

  let output = "";
  const outputStream = new stream.Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  let container;
  try {
    await docker.pull(config.image);
    container = await docker.createContainer({
      Image: config.image,
      Cmd: config.command(`/app/${config.fileName}`),
      HostConfig: {
        Binds: [`${tempDir}:/app`],
        CpuShares: 512,
        Memory: 128 * 1024 * 1024,
      },
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: "/app",
    });

    await container.start();
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });
    container.modem.demuxStream(logStream, outputStream, outputStream);
    await container.wait({ timeout: 10000 });
    return output.trim();
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (e) {
        /* Ignore cleanup errors */
      }
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// =================================================================================
// API ENDPOINT
// =================================================================================
app.post("/run-code", async (req, res) => {
  try {
    const { code, question_id, language = "python" } = req.body;
    const testCase = testCases[question_id];

    // --- Authentication Check ---
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ error: "Authorization header missing." });

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

    // --- Input Validation ---
    if (!code || !question_id || !testCase) {
      return res.status(400).json({ error: "Invalid request." });
    }

    // --- Code Execution ---
    const actualOutput = await executeCodeInDocker(code, testCase, language);
    const isCorrect = actualOutput === testCase.expectedOutput.trim();

    // --- Database Update ---
    if (isCorrect) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { error: insertError } = await supabaseAdmin
        .from("submissions")
        .insert({
          participant_id: user.id,
          participant_email: user.email, // <-- THIS IS THE NEW LINE
          question_id: question_id,
          is_correct: true,
        });
      if (insertError) throw insertError;
    }

    res.status(200).json({ is_correct: isCorrect, output: actualOutput });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "An error occurred during code execution." });
  }
});

// =================================================================================
// START SERVER
// =================================================================================
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
