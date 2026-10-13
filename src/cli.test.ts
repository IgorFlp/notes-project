import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import test from "node:test";
import { runCli } from "./cli.js";

function createTaskFilePath(t: test.TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), "task-cli-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, ".tasks.json");
}

test("CLI keeps task state across commands in the same session", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  let capturedOutput = "";
  let capturedErrors = "";
  let resolveCreated!: (value: string) => void;
  const createdOutput = new Promise<string>((resolve) => {
    resolveCreated = resolve;
  });
  output.on("data", (chunk: Buffer | string) => {
    capturedOutput += chunk.toString();
    if (capturedOutput.includes(" created: ")) resolveCreated(capturedOutput);
  });
  errorOutput.on("data", (chunk: Buffer | string) => {
    capturedErrors += chunk.toString();
  });
  const execution = runCli(input, output, errorOutput, taskFilePath);

  input.write('create "Buy milk"\n');
  const firstOutput = await createdOutput;
  assert.match(firstOutput, /Task [\w-]+ created: Buy milk \[open\]/);
  const idMatch = firstOutput.match(/Task ([\w-]+) created:/);
  assert.ok(idMatch);

  input.end(`list --status open\nlist\nlist --status all\ncomplete ${idMatch[1]}\nlist --status done\nremove ${idMatch[1]}\nlist\nexit\n`);

  assert.equal(await execution, 0);
  assert.match(capturedOutput, /Buy milk \[open\]/);
  assert.match(capturedOutput, /completed: Buy milk \[done\]/);
  assert.match(capturedOutput, /Task .* removed\./);
  assert.match(capturedOutput, /No tasks found\./);
  assert.equal(capturedErrors, "");
});

test("CLI reports command errors and continues until EOF", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  let capturedOutput = "";
  let capturedErrors = "";
  output.on("data", (chunk: Buffer | string) => {
    capturedOutput += chunk.toString();
  });
  errorOutput.on("data", (chunk: Buffer | string) => {
    capturedErrors += chunk.toString();
  });
  const execution = runCli(input, output, errorOutput, taskFilePath);

  input.end('create "   "\ncomplete missing-id\nremove missing-id\ncreate "A valid task"\nlist\n');

  assert.equal(await execution, 1);
  assert.match(capturedOutput, /A valid task \[open\]/);
  assert.match(capturedErrors, /Invalid command input/);
  assert.equal((capturedErrors.match(/was not found/g) ?? []).length, 2);
});

test("CLI exits successfully on the exit command", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  const execution = runCli(input, output, errorOutput, taskFilePath);

  input.end("exit\n");

  assert.equal(await execution, 0);
});

test("CLI restores task state across sessions", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  const firstInput = new PassThrough();
  const firstOutput = new PassThrough();
  const firstErrors = new PassThrough();
  let createdOutput = "";
  firstOutput.on("data", (chunk: Buffer | string) => {
    createdOutput += chunk.toString();
  });
  const firstExecution = runCli(firstInput, firstOutput, firstErrors, taskFilePath);

  firstInput.end('create "Persisted task"\n');
  assert.equal(await firstExecution, 0);
  const idMatch = createdOutput.match(/Task ([\w-]+) created:/);
  assert.ok(idMatch);
  assert.deepEqual(JSON.parse(readFileSync(taskFilePath, "utf8")), [
    { id: idMatch[1], title: "Persisted task", status: "open" },
  ]);

  const secondInput = new PassThrough();
  const secondOutput = new PassThrough();
  const secondErrors = new PassThrough();
  let listedOutput = "";
  let capturedErrors = "";
  secondOutput.on("data", (chunk: Buffer | string) => {
    listedOutput += chunk.toString();
  });
  secondErrors.on("data", (chunk: Buffer | string) => {
    capturedErrors += chunk.toString();
  });
  const secondExecution = runCli(secondInput, secondOutput, secondErrors, taskFilePath);

  secondInput.end("list\nexit\n");

  assert.equal(await secondExecution, 0);
  assert.match(listedOutput, new RegExp(`${idMatch[1]}\\topen\\tPersisted task`));
  assert.equal(capturedErrors, "");
});

test("CLI warns for invalid task data and replaces it on the next mutation", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  writeFileSync(taskFilePath, "{invalid json", "utf8");
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  let capturedOutput = "";
  let capturedErrors = "";
  output.on("data", (chunk: Buffer | string) => {
    capturedOutput += chunk.toString();
  });
  errorOutput.on("data", (chunk: Buffer | string) => {
    capturedErrors += chunk.toString();
  });
  const execution = runCli(input, output, errorOutput, taskFilePath);

  input.end('list\ncreate "Replaced task"\n');

  assert.equal(await execution, 0);
  assert.match(capturedErrors, /contains invalid JSON/);
  assert.match(capturedOutput, /No tasks found\./);
  assert.match(capturedOutput, /created: Replaced task \[open\]/);
  assert.deepEqual(JSON.parse(readFileSync(taskFilePath, "utf8")).map(
    ({ title }: { title: string }) => title,
  ), ["Replaced task"]);
});

test("CLI reports task-file write errors without confirming mutations and continues", async (t) => {
  const taskFilePath = createTaskFilePath(t);
  mkdirSync(taskFilePath);
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  let capturedOutput = "";
  let capturedErrors = "";
  output.on("data", (chunk: Buffer | string) => {
    capturedOutput += chunk.toString();
  });
  errorOutput.on("data", (chunk: Buffer | string) => {
    capturedErrors += chunk.toString();
  });
  const execution = runCli(input, output, errorOutput, taskFilePath);

  input.end('create "Must not be saved"\nlist\n');

  assert.equal(await execution, 1);
  assert.doesNotMatch(capturedOutput, /created: Must not be saved/);
  assert.match(capturedOutput, /No tasks found\./);
  assert.match(capturedErrors, /Warning: unable to read task file/);
  assert.match(capturedErrors, /Error:/);
});
