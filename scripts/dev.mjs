import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
// Forward Vite flags while keeping the API and UI in a single command.
const api = spawn(
  process.execPath,
  ["--import", "tsx", "--watch", "server/index.ts"],
  { stdio: "inherit" },
);
const vite = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  vite.kill();
  process.exitCode = code;
}
api.on("exit", (code) => stop(code ?? 0));
vite.on("exit", (code) => stop(code ?? 0));
for (const child of [api, vite])
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
