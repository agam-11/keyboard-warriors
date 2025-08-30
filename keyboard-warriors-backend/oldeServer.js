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
const port = process.env.PORT || 8080;
const allowedOrigins = [
  "http://localhost:5173",
  "https://keyboard-warriors-mwqq1s8oo-agam11s-projects.vercel.app",
  "https://keyboard-warriors-ebon.vercel.app",
];
// Middleware setup
app.use(
  cors({
    origin: allowedOrigins,
  })
); // Allow requests from our frontend
app.use(express.json());

// =================================================================================
// LANGUAGE & TEST CASE CONFIGURATION
// =================================================================================
// const languageConfigs = {
//   python: {
//     image: "python:3.10-slim",
//     fileName: "script.py",
//     command: (filePath) => ["python", filePath],
//   },
//   javascript: {
//     image: "node:18-slim",
//     fileName: "script.js",
//     command: (filePath) => ["node", filePath],
//   },
//   cpp: {
//     image: "gcc:latest",
//     fileName: "main.cpp",
//     command: (filePath) => [
//       "bash",
//       "-c",
//       `g++ ${filePath} -o /app/main && /app/main`,
//     ],
//   },
// };

const languageConfigs = {
  python: {
    image: "python:3.10-slim",
    fileName: "script.py",
    // UPDATED: Use shell piping for stdin
    command: (filePath, stdin) => [
      "bash",
      "-c",
      `printf "%s" "${stdin}" | python ${filePath}`,
    ],
  },
  javascript: {
    image: "node:18-slim",
    fileName: "script.js",
    // UPDATED: Use shell piping for stdin
    command: (filePath, stdin) => [
      "bash",
      "-c",
      `printf "%s" "${stdin}" | node ${filePath}`,
    ],
  },
  cpp: {
    image: "gcc:latest",
    fileName: "main.cpp",
    // UPDATED: Use shell piping for stdin
    command: (filePath, stdin) => [
      "bash",
      "-c",
      `printf "%s" "${stdin}" | (g++ ${filePath} -o /app/main && /app/main)`,
    ],
  },
};

// const testCases = {
//   // Question 1: Pattern Printing
//   1: {
//     stdin: "",
//     expectedOutput: `
// 1 2 3 4 5
// 1 2 3 4
// 1 2 3
// 1 2
// 1
// 1 2
// 1 2 3
// 1 2 3 4
// 1 2 3 4 5
// `,
//   },
//   // Question 2: Caesar Cipher
//   2: {
//     stdin: "Khoor, Zruog!\n3", // Encrypted Message + Shift Value
//     expectedOutput: "Hello, World!",
//   },
//   // Question 3: Anagram Check
//   3: {
//     stdin: "listen\nsilent", // Two words to check
//     expectedOutput: "The words are anagrams!",
//   },
//   // Question 4: Binary to ASCII
//   4: {
//     stdin: "01001100 01000001 01010101 01000111 01001000", // Binary for "LAUGH"
//     expectedOutput: "LAUGH",
//   },
// };

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
// DOCKER EXECUTION LOGIC
// =================================================================================
// async function executeCodeInDocker(code, testCase, language) {
//   const config = languageConfigs[language];
//   if (!config) throw new Error(`Unsupported language: ${language}`);

//   const docker = new Docker();
//   const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-runner-"));
//   const scriptPath = path.join(tempDir, config.fileName);
//   await fs.writeFile(scriptPath, code);

//   let output = "";
//   const outputStream = new stream.Writable({
//     write(chunk, encoding, callback) {
//       output += chunk.toString();
//       callback();
//     },
//   });

//   let container;
//   try {
//     await docker.pull(config.image);
//     container = await docker.createContainer({
//       Image: config.image,
//       Cmd: config.command(`/app/${config.fileName}`),
//       HostConfig: {
//         Binds: [`${tempDir}:/app`],
//         CpuShares: 512,
//         Memory: 128 * 1024 * 1024,
//       },
//       Tty: false,
//       AttachStdout: true,
//       AttachStderr: true,
//       WorkingDir: "/app",
//     });

//     await container.start();
//     const logStream = await container.logs({
//       follow: true,
//       stdout: true,
//       stderr: true,
//     });
//     container.modem.demuxStream(logStream, outputStream, outputStream);
//     await container.wait({ timeout: 10000 });
//     return output.trim();
//   } finally {
//     if (container) {
//       try {
//         await container.remove({ force: true });
//       } catch (e) {
//         /* Ignore cleanup errors */
//       }
//     }
//     await fs.rm(tempDir, { recursive: true, force: true });
//   }
// }

// DOCKER EXECUTION LOGIC (UPDATED AND MORE ROBUST)
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
    // Sanitize stdin to prevent shell command injection issues
    const sanitizedStdin = (testCase.stdin || "").replace(/"/g, '\\"');

    container = await docker.createContainer({
      Image: config.image,
      // Pass sanitized stdin to the command generator
      Cmd: config.command(`/app/${config.fileName}`, sanitizedStdin),
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

    // Wait for the container to finish execution
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
