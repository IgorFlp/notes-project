import { startTaskServer } from "./http/task-server.js";

const server = startTaskServer();

server.on("error", (error: Error) => {
  console.error("Unable to start HTTP server:", error);
  process.exitCode = 1;
});

server.on("listening", () => {
  console.log("Task API listening on http://127.0.0.1:3000");
});
