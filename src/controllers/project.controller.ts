import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import {
  CreateProjectInput,
  DeleteProjectInput,
  ProjectServices,
  UpdateProjectInput,
} from "../services/project.service";

@Controller("project")
@Injectable()
export class ProjectController {
  constructor(private readonly projectService: ProjectServices) {}

  @Get("getProjects")
  async getProjects() {
    return this.projectService.getProjects();
  }

  @Get("getProject/:id")
  async getProject(@Param("id", ParseIntPipe) id: number) {
    return this.projectService.getProject(id);
  }

  @Post("createProject")
  async createProject(@Body() body: CreateProjectInput) {
    return this.projectService.createProject(body);
  }

  @Post("updateProject/:id")
  async updateProject(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProjectInput,
  ) {
    return this.projectService.updateProject(id, body);
  }

  @Post("deleteProject/:id")
  async deleteProject(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: DeleteProjectInput,
  ) {
    return this.projectService.deleteProject(id, body);
  }
}
