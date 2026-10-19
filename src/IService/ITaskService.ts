export type TaskType = "TASK" | "STORY" | "BUG" | "EPIC" | "SUBTASK";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOWEST" | "LOW" | "MEDIUM" | "HIGH" | "HIGHEST";

export interface CreateTaskData {
  projectId: number;
  summary: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number | null;
  parentTaskId?: number | null;
  labels?: string[];
  // ISO 8601 date string.
  dueDate?: string | null;
  storyPoints?: number | null;
}

export type UpdateTaskData = Partial<Omit<CreateTaskData, "projectId">>;

export interface TaskData {
  id: number;
  key: string;
  projectId: number;
  summary: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  reporterId: number;
  parentTaskId: number | null;
  labels: string[];
  dueDate: string | null;
  storyPoints: number | null;
  // ISO 8601 timestamps.
  createdAt: string;
  updatedAt: string;
}

export interface TaskListQuery {
  projectId?: number;
  search?: string;
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  assigneeId?: number;
  page?: number;
  pageSize?: number;
}

export interface TaskListData {
  data: TaskData[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ITaskService {
  getTasks(query?: TaskListQuery): Promise<TaskListData>;
  getTask(id: number): Promise<TaskData>;
  createTask(data: CreateTaskData, accessToken?: string): Promise<TaskData>;
  updateTask(id: number, data: UpdateTaskData): Promise<TaskData>;
  deleteTask(id: number): Promise<void>;
}
