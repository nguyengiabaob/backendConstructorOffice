import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import {
  CreateProjectData,
  IprojectService,
} from "../IService/IProjectService";
import { PROJECT_SERVICE } from "../TokenServices/Project.Token";

@Controller("project")
@Injectable()
export class ProjectController {
  constructor(
    @Inject(PROJECT_SERVICE)
    private projectService: IprojectService,
  ) {}
  @Get("getProjects")
  async getProjects() {
    return this.projectService.getProjects();
  }

  @Get("getProject/:id")
  async getProject(@Param("id", ParseIntPipe) id: string) {
    return this.projectService.getProject(id);
  }

  @Post("createProject")
  async createProject(
    @Body() data: CreateProjectData,
    @Headers("authorization") authorization?: string,
  ) {
    return this.projectService.createProject(
      data,
      authorization?.replace(/^Bearer\s+/i, ""),
    );
  }
  @Post("updateProject")
  async updateProject(data: any) {
    return this.projectService.updateProject(data);
  }
  @Post("deleteProject")
  async deleteProject(id: string) {
    return this.projectService.deleteProject(id);
  }
}
