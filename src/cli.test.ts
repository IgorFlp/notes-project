import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import { runCli } from "./cli.js";

test("CLI keeps task state across commands in the same session", async () => {
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
  const execution = runCli(input, output, errorOutput);

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

test("CLI reports command errors and continues until EOF", async () => {
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
  const execution = runCli(input, output, errorOutput);

  input.end('create "   "\ncomplete missing-id\nremove missing-id\ncreate "A valid task"\nlist\n');

  assert.equal(await execution, 1);
  assert.match(capturedOutput, /A valid task \[open\]/);
  assert.match(capturedErrors, /Invalid command input/);
  assert.equal((capturedErrors.match(/was not found/g) ?? []).length, 2);
});

test("CLI exits successfully on the exit command", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  const execution = runCli(input, output, errorOutput);

  input.end("exit\n");

  assert.equal(await execution, 0);
});
