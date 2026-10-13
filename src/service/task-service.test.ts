import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTaskStore } from "../store/in-memory-task-store.js";
import { TaskNotFoundError, TaskService } from "./task-service.js";

test("creates tasks with normalized titles and open status", () => {
  const service = new TaskService(new InMemoryTaskStore());
  const task = service.create("  Buy milk  ");

  assert.equal(task.title, "Buy milk");
  assert.equal(task.status, "open");
  assert.ok(task.id.length > 0);
});

test("rejects empty task titles", () => {
  const service = new TaskService(new InMemoryTaskStore());

  assert.throws(() => service.create("   "));
});

test("lists all tasks and filters by status", () => {
  const service = new TaskService(new InMemoryTaskStore());
  const openTask = service.create("Open");
  const doneTask = service.create("Done");
  service.complete(doneTask.id);

  assert.deepEqual(service.list("all").map(({ id }) => id), [openTask.id, doneTask.id]);
  assert.deepEqual(service.list("open").map(({ id }) => id), [openTask.id]);
  assert.deepEqual(service.list("done").map(({ id }) => id), [doneTask.id]);
});

test("completes a task idempotently", () => {
  const service = new TaskService(new InMemoryTaskStore());
  const task = service.create("Finish");

  assert.equal(service.complete(task.id).status, "done");
  assert.deepEqual(service.complete(task.id), service.complete(task.id));
});

test("removes open and completed tasks and rejects unknown IDs", () => {
  const service = new TaskService(new InMemoryTaskStore());
  const openTask = service.create("Open");
  const doneTask = service.create("Done");
  service.complete(doneTask.id);

  service.remove(openTask.id);
  service.remove(doneTask.id);

  assert.deepEqual(service.list(), []);
  assert.throws(() => service.complete("missing"), TaskNotFoundError);
  assert.throws(() => service.remove("missing"), TaskNotFoundError);
});
