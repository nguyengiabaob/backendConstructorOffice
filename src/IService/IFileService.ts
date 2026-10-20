export interface CreateFileData {
  projectId: number;
  taskId?: number | null;
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
  projectId: number;
  taskId: number | null;
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

export interface FolderData {
  path: string;
}

export interface IFileService {
  getFiles(query?: FileListQuery): Promise<FileListData>;
  getFile(id: number): Promise<FileData>;
  createFile(data: CreateFileData, accessToken?: string, file?: UploadedFileData): Promise<FileData>;
  updateFile(id: number, data: UpdateFileData): Promise<FileData>;
  deleteFile(id: number): Promise<void>;
  createFolder(name: string): Promise<FolderData>;
  updateFolder(oldName: string, newName: string): Promise<FolderData>;
  deleteFolder(name: string): Promise<void>;
}
