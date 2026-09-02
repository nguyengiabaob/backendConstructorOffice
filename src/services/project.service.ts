import { Injectable } from "@nestjs/common";
import { IprojectService } from "../IService/IProjectService";
@Injectable()
export class ProjectServices implements IprojectService {
  constructor() {}

  public async getProjects() {
    return [];
  }

  public async getProject() {
    return {};
  }
  public async createProject(data: any) {
    return {};
  }

  public async updateProject(data: any) {
    return {};
  }
  public async deleteProject(id: string) {}
}
