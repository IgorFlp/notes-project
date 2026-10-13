import { randomUUID } from "node:crypto";
import {
  createTaskInputSchema,
  type Task,
  type TaskStatusFilter,
} from "../domain/task.js";
import type { TaskStore } from "../store/task-store.js";

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task "${id}" was not found.`);
    this.name = "TaskNotFoundError";
  }
}

export class TaskService {
  constructor(private readonly store: TaskStore) {}

  create(title: string): Task {
    const input = createTaskInputSchema.parse({ title });
    let id = randomUUID();
    while (this.store.findById(id)) id = randomUUID();

    const task: Task = {
      id,
      title: input.title,
      status: "open",
    };

    this.store.save(task);
    return task;
  }

  list(status: TaskStatusFilter = "all"): Task[] {
    const tasks = this.store.findAll();
    return status === "all"
      ? tasks
      : tasks.filter((task) => task.status === status);
  }

  complete(id: string): Task {
    const task = this.findOrThrow(id);
    if (task.status === "open") {
      const completedTask: Task = { ...task, status: "done" };
      this.store.save(completedTask);
      return completedTask;
    }

    return task;
  }

  remove(id: string): void {
    this.findOrThrow(id);
    this.store.delete(id);
  }

  private findOrThrow(id: string): Task {
    const task = this.store.findById(id);
    if (!task) throw new TaskNotFoundError(id);
    return task;
  }
}
