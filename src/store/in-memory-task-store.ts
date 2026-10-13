import type { Task } from "../domain/task.js";
import type { TaskStore } from "./task-store.js";

export class InMemoryTaskStore implements TaskStore {
  private readonly tasks = new Map<string, Task>();

  save(task: Task): void {
    this.tasks.set(task.id, { ...task });
  }

  findById(id: string): Task | undefined {
    const task = this.tasks.get(id);
    return task ? { ...task } : undefined;
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values(), (task) => ({ ...task }));
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}
