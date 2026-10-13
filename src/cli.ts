import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import type { Readable, Writable } from "node:stream";
import { ZodError } from "zod";
import {
  createTaskInputSchema,
  taskIdSchema,
  taskStatusFilterSchema,
  type TaskStatusFilter,
} from "./domain/task.js";
import { InMemoryTaskStore } from "./store/in-memory-task-store.js";
import { TaskNotFoundError, TaskService } from "./service/task-service.js";

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let token = "";
  let tokenStarted = false;
  let inQuotes = false;
  let escaping = false;

  for (const character of line) {
    if (escaping) {
      token += character;
      escaping = false;
      continue;
    }
    if (inQuotes && character === "\\") {
      escaping = true;
      continue;
    }
    if (character === '"') {
      inQuotes = !inQuotes;
      tokenStarted = true;
      continue;
    }
    if (/\s/.test(character) && !inQuotes) {
      if (tokenStarted) {
        tokens.push(token);
        token = "";
        tokenStarted = false;
      }
      continue;
    }
    token += character;
    tokenStarted = true;
  }

  if (escaping) token += "\\";
  if (inQuotes) throw new Error("Unterminated quoted argument.");
  if (tokenStarted) tokens.push(token);
  return tokens;
}

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return "Invalid command input.";
  if (error instanceof TaskNotFoundError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

function executeCommand(tokens: string[], service: TaskService, output: Writable): boolean {
  const [command, ...args] = tokens;

  if (command === "create") {
    const input = createTaskInputSchema.parse({
      title: args.length > 0 ? args.join(" ") : undefined,
    });
    const task = service.create(input.title);
    output.write(`Task ${task.id} created: ${task.title} [${task.status}]\n`);
    return false;
  }

  if (command === "list") {
    let status: TaskStatusFilter = "all";
    if (args.length > 0) {
      if (args.length !== 2 || args[0] !== "--status") {
        throw new Error("Usage: list [--status all|open|done]");
      }
      status = taskStatusFilterSchema.parse(args[1]);
    }

    const tasks = service.list(status);
    if (tasks.length === 0) {
      output.write("No tasks found.\n");
    } else {
      for (const task of tasks) {
        output.write(`${task.id}\t${task.status}\t${task.title}\n`);
      }
    }
    return false;
  }

  if (command === "complete") {
    if (args.length !== 1) throw new Error("Usage: complete <id>");
    const id = taskIdSchema.parse(args[0]);
    const task = service.complete(id);
    output.write(`Task ${task.id} completed: ${task.title} [${task.status}]\n`);
    return false;
  }

  if (command === "remove") {
    if (args.length !== 1) throw new Error("Usage: remove <id>");
    const id = taskIdSchema.parse(args[0]);
    service.remove(id);
    output.write(`Task ${id} removed.\n`);
    return false;
  }

  if (command === "exit" && args.length === 0) return true;
  if (command === undefined) return false;
  throw new Error(`Unknown command: ${command}`);
}

export function runCli(
  input: Readable = process.stdin,
  output: Writable = process.stdout,
  errorOutput: Writable = process.stderr,
): Promise<number> {
  const service = new TaskService(new InMemoryTaskStore());
  const terminal = input === process.stdin && process.stdin.isTTY === true;
  const readline = createInterface({
    input,
    output,
    terminal,
    crlfDelay: Infinity,
  });
  if (terminal) {
    readline.setPrompt("tasks> ");
    readline.prompt();
  }

  return new Promise((resolveExitCode) => {
    let failed = false;
    let closing = false;

    readline.on("line", (line) => {
      if (closing) return;
      try {
        if (executeCommand(tokenize(line), service, output)) {
          closing = true;
          readline.close();
          return;
        }
      } catch (error) {
        failed = true;
        errorOutput.write(`Error: ${errorMessage(error)}\n`);
      }

      if (terminal) readline.prompt();
    });

    readline.on("SIGINT", () => {
      failed = true;
      errorOutput.write("Error: CLI session interrupted.\n");
      closing = true;
      readline.close();
    });

    input.on("error", (error: Error) => {
      failed = true;
      errorOutput.write(`Error: unable to read CLI input: ${error.message}\n`);
      closing = true;
      readline.close();
    });

    readline.on("close", () => resolveExitCode(failed ? 1 : 0));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
