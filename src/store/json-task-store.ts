import { randomUUID } from "node:crypto";
import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { z } from "zod";
import { taskSchema, type Task } from "../domain/task.js";
import type { TaskStore } from "./task-store.js";

const persistedTasksSchema = z.array(taskSchema);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class JsonTaskStore implements TaskStore {
  private tasks: Map<string, Task>;

  constructor(
    private readonly filePath: string,
    private readonly warn: (message: string) => void = (message) => console.error(message),
  ) {
    this.tasks = this.loadTasks();
  }

  save(task: Task): void {
    const nextTasks = new Map(this.tasks);
    nextTasks.set(task.id, { ...task });
    this.persist(nextTasks);
    this.tasks = nextTasks;
  }

  findById(id: string): Task | undefined {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values(), (task) => ({ ...task }));
  }

  delete(id: string): boolean {
    if (!this.tasks.has(id)) return false;

    const nextTasks = new Map(this.tasks);
    nextTasks.delete(id);
    this.persist(nextTasks);
    this.tasks = nextTasks;
    return true;
  }

  private loadTasks(): Map<string, Task> {
    let contents: string;
    try {
      contents = readFileSync(this.filePath, "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return new Map();
      }
      this.warn(`Warning: unable to read task file "${this.filePath}": ${errorMessage(error)}`);
      return new Map();
    }

    let value: unknown;
    try {
      value = JSON.parse(contents);
    } catch (error) {
      this.warn(`Warning: task file "${this.filePath}" contains invalid JSON: ${errorMessage(error)}`);
      return new Map();
    }

    const parsed = persistedTasksSchema.safeParse(value);
    if (!parsed.success) {
      this.warn(`Warning: task file "${this.filePath}" has an invalid structure.`);
      return new Map();
    }

    const tasks = new Map<string, Task>();
    for (const task of parsed.data) {
      if (tasks.has(task.id)) {
        this.warn(`Warning: task file "${this.filePath}" contains duplicate task IDs.`);
        return new Map();
      }
      tasks.set(task.id, task);
    }
    return tasks;
  }

  private persist(tasks: Map<string, Task>): void {
    const temporaryPath = join(
      dirname(this.filePath),
      `.${basename(this.filePath)}.${randomUUID()}.tmp`,
    );
    const contents = `${JSON.stringify(Array.from(tasks.values()), null, 2)}\n`;

    try {
      writeFileSync(temporaryPath, contents, { encoding: "utf8", flag: "wx" });
      renameSync(temporaryPath, this.filePath);
    } catch (error) {
      if (existsSync(temporaryPath)) {
        try {
          unlinkSync(temporaryPath);
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            `Unable to persist task file "${this.filePath}" or clean up its temporary file.`,
          );
        }
      }
      throw error;
    }
  }
}
