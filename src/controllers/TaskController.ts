import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Inject,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  CreateTaskData,
  ITaskService,
  TaskPriority,
  TaskStatus,
  TaskType,
  UpdateTaskData,
} from "../IService/ITaskService";
import { TASK_SERVICE } from "../TokenServices/Project.Token";

@Controller("task")
@Injectable()
export class TaskController {
  constructor(@Inject(TASK_SERVICE) private taskService: ITaskService) {}

  @Get("getTasks")
  async getTasks(
    @Query("projectId", new ParseIntPipe({ optional: true }))
    projectId?: number,
    @Query("search") search?: string,
    @Query("status") status?: TaskStatus,
    @Query("type") type?: TaskType,
    @Query("priority") priority?: TaskPriority,
    @Query("assigneeId", new ParseIntPipe({ optional: true }))
    assigneeId?: number,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number = 10,
  ) {
    return this.taskService.getTasks({
      projectId,
      search,
      status,
      type,
      priority,
      assigneeId,
      page,
      pageSize,
    });
  }

  @Get("getTask/:id")
  async getTask(@Param("id", ParseIntPipe) id: number) {
    return this.taskService.getTask(id);
  }

  @Post("createTask")
  async createTask(
    @Body() data: CreateTaskData,
    @Headers("authorization") authorization?: string,
  ) {
    return this.taskService.createTask(
      data,
      authorization?.replace(/^Bearer\s+/i, ""),
    );
  }

  @Post("updateTask/:id")
  async updateTask(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: UpdateTaskData,
  ) {
    return this.taskService.updateTask(id, data);
  }

  @Post("deleteTask/:id")
  async deleteTask(@Param("id", ParseIntPipe) id: number) {
    return this.taskService.deleteTask(id);
  }
}
