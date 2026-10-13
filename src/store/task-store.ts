import type { Task } from "../domain/task.js";

export interface TaskStore {
  save(task: Task): void;
  findById(id: string): Task | undefined;
  findAll(): Task[];
  delete(id: string): boolean;
}
