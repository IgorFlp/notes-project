import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createTaskServer } from "./task-server.js";
import { InMemoryTaskStore } from "../store/in-memory-task-store.js";
import { TaskService } from "../service/task-service.js";

test("HTTP API supports task lifecycle and status filters", async (context) => {
  const server = createTaskServer(new TaskService(new InMemoryTaskStore()));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const createdResponse = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "  Buy milk  " }),
  });
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()) as {
    id: string;
    title: string;
    status: string;
  };
  assert.equal(created.title, "Buy milk");
  assert.equal(created.status, "open");

  const listResponse = await fetch(`${baseUrl}/tasks`);
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [created]);

  const openResponse = await fetch(`${baseUrl}/tasks?status=open`);
  assert.equal(openResponse.status, 200);
  assert.deepEqual(await openResponse.json(), [created]);

  const completedResponse = await fetch(`${baseUrl}/tasks/${created.id}/complete`, {
    method: "PATCH",
  });
  assert.equal(completedResponse.status, 200);
  assert.equal((await completedResponse.json()).status, "done");

  const doneResponse = await fetch(`${baseUrl}/tasks?status=done`);
  assert.equal(doneResponse.status, 200);
  assert.equal((await doneResponse.json()).length, 1);

  const repeatedCompletion = await fetch(`${baseUrl}/tasks/${created.id}/complete`, {
    method: "PATCH",
  });
  assert.equal(repeatedCompletion.status, 200);

  const removedResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
    method: "DELETE",
  });
  assert.equal(removedResponse.status, 204);
  assert.equal(await removedResponse.text(), "");

  const removedAgainResponse = await fetch(`${baseUrl}/tasks/${created.id}`, {
    method: "DELETE",
  });
  assert.equal(removedAgainResponse.status, 404);
  assert.equal((await removedAgainResponse.json()).error.code, "TASK_NOT_FOUND");
});

test("HTTP API reports validation and not-found errors", async (context) => {
  const server = createTaskServer(new TaskService(new InMemoryTaskStore()));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const invalidTitle = await fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "  " }),
  });
  assert.equal(invalidTitle.status, 400);
  assert.equal((await invalidTitle.json()).error.code, "VALIDATION_ERROR");

  const invalidFilter = await fetch(`${baseUrl}/tasks?status=closed`);
  assert.equal(invalidFilter.status, 400);
  assert.equal((await invalidFilter.json()).error.code, "INVALID_STATUS_FILTER");

  const missingTask = await fetch(`${baseUrl}/tasks/missing/complete`, { method: "PATCH" });
  assert.equal(missingTask.status, 404);
  assert.equal((await missingTask.json()).error.code, "TASK_NOT_FOUND");

  const missingDeletion = await fetch(`${baseUrl}/tasks/missing`, { method: "DELETE" });
  assert.equal(missingDeletion.status, 404);
  assert.equal((await missingDeletion.json()).error.code, "TASK_NOT_FOUND");

  const missingRoute = await fetch(`${baseUrl}/unknown`);
  assert.equal(missingRoute.status, 404);
  assert.equal((await missingRoute.json()).error.code, "NOT_FOUND");
});
