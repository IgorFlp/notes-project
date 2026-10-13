import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import {
  createTaskInputSchema,
  taskIdSchema,
  taskStatusFilterSchema,
} from "../domain/task.js";
import { TaskNotFoundError, TaskService } from "../service/task-service.js";
import { InMemoryTaskStore } from "../store/in-memory-task-store.js";

class HttpProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function sendError(
  response: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(response, status, { error: { code, message } });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers["content-type"];
  if (!contentType || !/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new HttpProblem(400, "VALIDATION_ERROR", "A JSON request body is required.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpProblem(400, "VALIDATION_ERROR", "The request body must contain valid JSON.");
  }
}

function decodeTaskId(value: string): string {
  let id: string;
  try {
    id = decodeURIComponent(value);
  } catch {
    throw new HttpProblem(400, "VALIDATION_ERROR", "The task ID is invalid.");
  }

  return taskIdSchema.parse(id);
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  service: TaskService,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");
  const { method } = request;

  if (method === "POST" && url.pathname === "/tasks") {
    const input = createTaskInputSchema.parse(await readJsonBody(request));
    sendJson(response, 201, service.create(input.title));
    return;
  }

  if (method === "GET" && url.pathname === "/tasks") {
    const statusValues = url.searchParams.getAll("status");
    if (statusValues.length > 1) {
      throw new HttpProblem(400, "INVALID_STATUS_FILTER", "The status filter is invalid.");
    }

    const statusResult = taskStatusFilterSchema.safeParse(statusValues[0] ?? "all");
    if (!statusResult.success) {
      throw new HttpProblem(400, "INVALID_STATUS_FILTER", "The status filter is invalid.");
    }

    sendJson(response, 200, service.list(statusResult.data));
    return;
  }

  const completeMatch = url.pathname.match(/^\/tasks\/([^/]+)\/complete$/);
  if (method === "PATCH" && completeMatch) {
    const task = service.complete(decodeTaskId(completeMatch[1]!));
    sendJson(response, 200, task);
    return;
  }

  const removeMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);
  if (method === "DELETE" && removeMatch) {
    service.remove(decodeTaskId(removeMatch[1]!));
    response.writeHead(204);
    response.end();
    return;
  }

  sendError(response, 404, "NOT_FOUND", "Route not found.");
}

function handleError(response: ServerResponse, error: unknown): void {
  if (error instanceof HttpProblem) {
    sendError(response, error.status, error.code, error.message);
    return;
  }
  if (error instanceof ZodError) {
    sendError(response, 400, "VALIDATION_ERROR", "The request input is invalid.");
    return;
  }
  if (error instanceof TaskNotFoundError) {
    sendError(response, 404, "TASK_NOT_FOUND", "Task not found.");
    return;
  }

  console.error("Unhandled HTTP request error:", error);
  sendError(response, 500, "INTERNAL_ERROR", "An internal error occurred.");
}

export function createTaskServer(service: TaskService): Server {
  return createServer((request, response) => {
    void routeRequest(request, response, service).catch((error: unknown) => {
      handleError(response, error);
    });
  });
}

export function startTaskServer(port = 3000, host = "127.0.0.1"): Server {
  const service = new TaskService(new InMemoryTaskStore());
  return createTaskServer(service).listen(port, host);
}
