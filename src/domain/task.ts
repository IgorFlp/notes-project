import { z } from "zod";

export const taskStatusSchema = z.enum(["open", "done"]);
export const taskStatusFilterSchema = z.enum(["all", "open", "done"]);

export const createTaskInputSchema = z
  .object({
    title: z.string().trim().min(1),
  })
  .strict();

export const taskIdSchema = z.string().min(1);

export const taskSchema = z
  .object({
    id: taskIdSchema,
    title: z.string().min(1),
    status: taskStatusSchema,
  })
  .strict();

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskStatusFilter = z.infer<typeof taskStatusFilterSchema>;
