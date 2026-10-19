import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Task, TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../../shared/Database/prisma.service";
import { CreateTaskData, ITaskService, TaskData, TaskListData, TaskListQuery, UpdateTaskData } from "../../IService/ITaskService";

@Injectable()
export class TaskService implements ITaskService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private id(value: number): number {
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
      throw new BadRequestException("IDs must be positive integers");
    }
    return value;
  }

  private toData(task: Task): TaskData {
    return {
      ...task,
      labels: task.labels as string[],
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private normalize(data: UpdateTaskData) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new BadRequestException("Task data is required");
    if (data.summary !== undefined && (typeof data.summary !== "string" || !data.summary.trim() || data.summary.trim().length > 191)) {
      throw new BadRequestException("Summary must contain 1 to 191 characters");
    }
    if (data.description !== undefined && typeof data.description !== "string") throw new BadRequestException("Description must be a string");
    for (const [value, values] of [[data.type, TaskType], [data.status, TaskStatus], [data.priority, TaskPriority]] as const) {
      if (value !== undefined && !Object.values(values).includes(value as never)) throw new BadRequestException("Invalid task type, status or priority");
    }
    for (const value of [data.assigneeId, data.parentTaskId]) if (value != null) this.id(value);
    if (data.labels !== undefined && (!Array.isArray(data.labels) || data.labels.some(label => typeof label !== "string"))) throw new BadRequestException("Labels must be strings");
    if (data.storyPoints != null && (typeof data.storyPoints !== "number" || !Number.isFinite(data.storyPoints) || data.storyPoints < 0)) throw new BadRequestException("Story points must be a non-negative number");
    if (data.dueDate != null && (typeof data.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(data.dueDate) || !Number.isFinite(Date.parse(data.dueDate)))) throw new BadRequestException("Due date must be an ISO 8601 timestamp");
    return {
      summary: data.summary?.trim(), description: data.description,
      type: data.type, status: data.status, priority: data.priority,
      assigneeId: data.assigneeId, parentTaskId: data.parentTaskId,
      labels: data.labels, storyPoints: data.storyPoints,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate === null ? null : new Date(data.dueDate),
    };
  }

  async getTasks(query: TaskListQuery = {}): Promise<TaskListData> {
    const { page = 1, pageSize = 10 } = query;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || !Number.isSafeInteger((page - 1) * pageSize)) throw new BadRequestException("Invalid pagination");
    this.normalize({ type: query.type, status: query.status, priority: query.priority, assigneeId: query.assigneeId });
    if (query.search !== undefined && typeof query.search !== "string") throw new BadRequestException("Search must be a string");
    const search = query.search?.trim();
    const where: Prisma.TaskWhereInput = {
      project: { isDelete: false },
      projectId: query.projectId === undefined ? undefined : this.id(query.projectId),
      status: query.status, type: query.type, priority: query.priority, assigneeId: query.assigneeId,
      ...(search ? { OR: [{ key: { contains: search } }, { summary: { contains: search } }, { description: { contains: search } }] } : {}),
    };
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { id: "desc" } }),
      this.prisma.task.count({ where }),
    ]);
    return { data: tasks.map(task => this.toData(task)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async getTask(id: number): Promise<TaskData> {
    const task = await this.prisma.task.findFirst({ where: { id: this.id(id), project: { isDelete: false } } });
    if (!task) throw new NotFoundException("Task not found");
    return this.toData(task);
  }

  private async checkRelations(db: Prisma.TransactionClient, data: UpdateTaskData, projectId: number, taskId?: number) {
    if (data.assigneeId != null && !await db.user.findUnique({ where: { id: data.assigneeId } })) throw new NotFoundException("Assignee not found");
    let parentId = data.parentTaskId;
    const visited = new Set<number>();
    while (parentId != null) {
      if (parentId === taskId || visited.has(parentId)) throw new BadRequestException("Parent task would create a cycle");
      visited.add(parentId);
      const parent = await db.task.findUnique({ where: { id: parentId } });
      if (!parent || parent.projectId !== projectId) throw new BadRequestException("Parent task must belong to the same project");
      parentId = parent.parentTaskId;
    }
  }

  async createTask(data: CreateTaskData, accessToken?: string): Promise<TaskData> {
    const values = this.normalize(data);
    if (!values.summary) throw new BadRequestException("Summary is required");
    const projectId = this.id(data.projectId);
    let reporterId: number;
    try {
      if (!accessToken) throw new Error();
      reporterId = this.id(Number(this.jwt.verify<{ sub: number }>(accessToken).sub));
    } catch { throw new UnauthorizedException("Invalid or missing access token"); }
    return this.prisma.$transaction(async db => {
      const project = await db.project.findUnique({ where: { id: projectId, isDelete: false } });
      if (!project) throw new NotFoundException("Project not found");
      if (!await db.user.findUnique({ where: { id: reporterId } })) throw new UnauthorizedException("Reporter not found");
      await this.checkRelations(db, data, projectId);
      const task = await db.task.create({ data: { ...values, summary: values.summary!, description: values.description ?? "", key: randomUUID(), projectId, reporterId } });
      return this.toData(await db.task.update({ where: { id: task.id }, data: { key: `${project.projectCode}-${task.id}` } }));
    });
  }

  async updateTask(id: number, data: UpdateTaskData): Promise<TaskData> {
    this.id(id);
    const values = this.normalize(data);
    return this.prisma.$transaction(async db => {
      const task = await db.task.findFirst({ where: { id, project: { isDelete: false } } });
      if (!task) throw new NotFoundException("Task not found");
      await this.checkRelations(db, data, task.projectId, id);
      return this.toData(await db.task.update({ where: { id }, data: values }));
    });
  }

  async deleteTask(id: number): Promise<void> {
    await this.getTask(id);
    try { await this.prisma.task.delete({ where: { id } }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new NotFoundException("Task not found");
      throw error;
    }
  }
}
