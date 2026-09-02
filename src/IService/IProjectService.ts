export interface IprojectService {
  getProjects(): Promise<any[]>;
  getProject(): Promise<any>;
  createProject(data: any): Promise<any>;
  updateProject(data: any): Promise<any>;
  deleteProject(id: string): Promise<void>;
}
