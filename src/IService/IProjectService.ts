export interface CreateProjectData {
  name: string;
  projectCode: string;
  location: string;
  status?: string;
  progress?: number;
  budget?: number;
  expectedPersonnel?: number;
  imageUrl?: string;
}

export interface IprojectService {
  getProjects(): Promise<any[]>;
  getProject(id: string): Promise<any>;
  createProject(data: CreateProjectData, accessToken?: string): Promise<any>;
  updateProject(data: any): Promise<any>;
  deleteProject(id: string): Promise<void>;
}
