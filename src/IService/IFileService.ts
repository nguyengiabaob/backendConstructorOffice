export interface CreateFileData {
  projectId?: number | null;
  taskId?: number | null;
  folderId?: number | null;
  folder?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  description?: string;
}

// Binary upload from FileInterceptor (memory storage): stdlib-only shape,
// no @types/multer needed.
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type UpdateFileData = Partial<Omit<CreateFileData, "projectId">>;

export interface FileData {
  id: number;
  key: string;
  projectId: number | null;
  taskId: number | null;
  folderId: number | null;
  fileName: string;
  originalName: string | null;
  mimeType: string | null;
  size: number;
  url: string | null;
  description: string | null;
  uploadedBy: number;
  // ISO 8601 timestamps.
  createdAt: string;
  updatedAt: string;
}

export interface FileListQuery {
  projectId?: number;
  taskId?: number;
  folderId?: number;
  search?: string;
  mimeType?: string;
  uploadedBy?: number;
  page?: number;
  pageSize?: number;
}

export interface FileListData {
  data: FileData[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateFolderData {
  name: string;
  parentId?: number | null;
  projectId?: number | null;
  taskId?: number | null;
}

export interface FolderData {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  projectId: number | null;
  taskId: number | null;
  isDeleted: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderListQuery {
  projectId?: number;
  taskId?: number;
  parentId?: number | null;
}

export interface IFileService {
  getFiles(query?: FileListQuery): Promise<FileListData>;
  getFile(id: number): Promise<FileData>;
  createFile(data: CreateFileData, accessToken?: string, file?: UploadedFileData): Promise<FileData>;
  updateFile(id: number, data: UpdateFileData): Promise<FileData>;
  deleteFile(id: number): Promise<void>;
  createFolder(data: CreateFolderData, accessToken?: string): Promise<FolderData>;
  getFolders(query?: FolderListQuery): Promise<FolderData[]>;
  updateFolder(id: number, newName: string): Promise<FolderData>;
  deleteFolder(id: number): Promise<void>;
}
