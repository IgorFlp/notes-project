import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Task } from "../domain/task.js";
import { JsonTaskStore } from "./json-task-store.js";

function createTemporaryDirectory(t: test.TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), "json-task-store-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test("JSON task store starts empty and restores saved tasks in a new instance", (t) => {
  const directory = createTemporaryDirectory(t);
  const filePath = join(directory, ".tasks.json");
  const task: Task = { id: "task-1", title: "Buy milk", status: "open" };
  const store = new JsonTaskStore(filePath);

  assert.deepEqual(store.findAll(), []);
  store.save(task);

  const restored = new JsonTaskStore(filePath);
  assert.deepEqual(restored.findById(task.id), task);
  assert.deepEqual(JSON.parse(readFileSync(filePath, "utf8")), [task]);
  assert.deepEqual(readdirSync(directory), [".tasks.json"]);
});

test("JSON task store persists completion and deletion", (t) => {
  const directory = createTemporaryDirectory(t);
  const filePath = join(directory, ".tasks.json");
  const store = new JsonTaskStore(filePath);
  const openTask: Task = { id: "task-1", title: "Open", status: "open" };
  const doneTask: Task = { id: "task-2", title: "Done", status: "done" };

  store.save(openTask);
  store.save(doneTask);
  store.save({ ...openTask, status: "done" });

  assert.deepEqual(new JsonTaskStore(filePath).findAll(), [
    { ...openTask, status: "done" },
    doneTask,
  ]);
  assert.equal(store.delete(openTask.id), true);
  assert.equal(store.delete(openTask.id), false);
  assert.deepEqual(new JsonTaskStore(filePath).findAll(), [doneTask]);
});

test("JSON task store warns and starts empty for invalid or unreadable files", (t) => {
  const directory = createTemporaryDirectory(t);
  const invalidJsonPath = join(directory, "invalid-json.json");
  const invalidStructurePath = join(directory, "invalid-structure.json");
  const unreadablePath = join(directory, "directory.json");
  const warnings: string[] = [];

  writeFileSync(invalidJsonPath, "{not-json", "utf8");
  writeFileSync(invalidStructurePath, JSON.stringify([{ id: "task-1", title: "", status: "open" }]));
  mkdirSync(unreadablePath);

  for (const filePath of [invalidJsonPath, invalidStructurePath, unreadablePath]) {
    const store = new JsonTaskStore(filePath, (warning) => warnings.push(warning));
    assert.deepEqual(store.findAll(), []);
  }

  assert.equal(warnings.length, 3);
  assert.ok(warnings.some((warning) => warning.includes("invalid JSON")));
  assert.ok(warnings.some((warning) => warning.includes("invalid structure")));
  assert.ok(warnings.some((warning) => warning.includes("unable to read")));
});

test("JSON task store replaces an invalid file on its next mutation", (t) => {
  const directory = createTemporaryDirectory(t);
  const filePath = join(directory, ".tasks.json");
  const task: Task = { id: "task-1", title: "Recovered", status: "open" };
  writeFileSync(filePath, "corrupt", "utf8");

  const store = new JsonTaskStore(filePath, () => {});
  store.save(task);

  assert.deepEqual(new JsonTaskStore(filePath).findAll(), [task]);
});

test("JSON task store preserves in-memory state and cleans up temporary files after write failure", (t) => {
  const directory = createTemporaryDirectory(t);
  const filePath = join(directory, ".tasks.json");
  const existingTask: Task = { id: "task-1", title: "Existing", status: "open" };
  const store = new JsonTaskStore(filePath);
  store.save(existingTask);

  unlinkSync(filePath);
  mkdirSync(filePath);

  assert.throws(() => store.save({ id: "task-2", title: "New", status: "open" }));
  assert.deepEqual(store.findAll(), [existingTask]);
  assert.deepEqual(readdirSync(directory), [".tasks.json"]);
});
