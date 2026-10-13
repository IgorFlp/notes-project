import assert from "node:assert/strict";
import test from "node:test";
import type { Task } from "../domain/task.js";
import { InMemoryTaskStore } from "./in-memory-task-store.js";

test("in-memory task store saves and returns defensive task copies", () => {
  const store = new InMemoryTaskStore();
  const task: Task = { id: "task-1", title: "Buy milk", status: "open" };

  store.save(task);
  const returned = store.findById(task.id);
  assert.deepEqual(returned, task);
  assert.notEqual(returned, task);

  if (returned) returned.title = "Changed";
  assert.equal(store.findById(task.id)?.title, "Buy milk");
});

test("in-memory task store lists and removes tasks", () => {
  const store = new InMemoryTaskStore();
  store.save({ id: "task-1", title: "Open", status: "open" });
  store.save({ id: "task-2", title: "Done", status: "done" });

  assert.deepEqual(store.findAll().map(({ id }) => id), ["task-1", "task-2"]);
  assert.equal(store.delete("task-1"), true);
  assert.equal(store.delete("task-1"), false);
  assert.deepEqual(store.findAll().map(({ id }) => id), ["task-2"]);
});
