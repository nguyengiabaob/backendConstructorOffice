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
  async getProjects(
    @Query("search") search?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number = 10,
  ) {
    return this.projectService.getProjects(search, page, pageSize);
  }

  @Get("getProject/:id")
  async getProject(@Param("id", ParseIntPipe) id: number) {
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
  @Post("updateProject/:id")
  async updateProject(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: CreateProjectData,
  ) {
    return this.projectService.updateProject(id, data);
  }
  @Post("deleteProject/:id")
  async deleteProject(@Param("id") id: string) {
    return this.projectService.deleteProject(id);
  }
}
