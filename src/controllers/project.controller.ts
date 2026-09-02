import { Controller, Get, Inject, Injectable, Post } from "@nestjs/common";

import { IprojectService } from "../IService/IProjectService";
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
  @Post("createProject")
  async createProject(data: any) {
    return this.projectService.createProject(data);
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
