import { Controller, Get, Injectable, Post } from "@nestjs/common";
import { ProjectServices } from "../services/project.service";

@Controller("project")
@Injectable()
export class ProjectController {
  constructor(private projectService: ProjectServices) {}

  @Get("getProjects")
  async getProjects() {
    return this.projectService.getProjects();
  }
  @Post("createProject")
  async createProject() {
    return this.projectService.createProject();
  }
  @Post("updateProject")
  async updateProject() {
    return this.projectService.updateProject();
  }
  @Post("deleteProject")
  async deleteProject() {
    return this.projectService.deleteProject();
  }
}
