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

export interface ProjectListData {
  data: CreateProjectData[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IprojectService {
  getProjects(search?: string, page?: number, pageSize?: number): Promise<ProjectListData>;
  getProject(id: number): Promise<CreateProjectData>;
  createProject(data: CreateProjectData, accessToken?: string): Promise<any>;
  updateProject(id: number, data: CreateProjectData): Promise<any>;
  deleteProject(id: string): Promise<void>;
}
