const fs = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "..", "backend", ".env");
const examplePath = path.join(__dirname, "..", "backend", ".env.example");

if (fs.existsSync(envPath)) {
  console.log("backend/.env already exists, leaving it as-is");
} else {
  fs.copyFileSync(examplePath, envPath);
  console.log("Created backend/.env from backend/.env.example");
}
