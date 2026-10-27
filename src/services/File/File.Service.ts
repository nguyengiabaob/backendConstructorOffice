import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { File, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize as normalizePath,
  relative,
  sep,
} from "node:path";
import { PrismaService } from "../../../shared/Database/prisma.service";
import {
  CreateFileData,
  CreateFolderData,
  FileData,
  FileListData,
  FileListQuery,
  FolderData,
  FolderListQuery,
  IFileService,
  UpdateFileData,
  UploadedFileData,
} from "../../IService/IFileService";

const UPLOAD_DIR = join(process.cwd(), "uploads");

@Injectable()
export class FileService implements IFileService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private id(value: number): number {
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
      throw new BadRequestException("IDs must be positive integers");
    }
    return value;
  }

  private authUserId(accessToken?: string): number {
    if (!accessToken)
      throw new UnauthorizedException("Invalid or missing access token");
    try {
      return this.id(Number(this.jwt.verify<{ sub: number }>(accessToken).sub));
    } catch {
      throw new UnauthorizedException("Invalid or missing access token");
    }
  }

  private toData(file: File & { folderId?: number | null }): FileData {
    return {
      ...file,
      folderId: file.folderId ?? null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }

  private toFolderData(folder: any): FolderData {
    return {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parentId: folder.parentId ?? null,
      projectId: folder.projectId ?? null,
      taskId: folder.taskId ?? null,
      isDeleted: Boolean(folder.isDeleted),
      createdBy: folder.createdBy,
      createdAt:
        folder.createdAt instanceof Date
          ? folder.createdAt.toISOString()
          : String(folder.createdAt),
      updatedAt:
        folder.updatedAt instanceof Date
          ? folder.updatedAt.toISOString()
          : String(folder.updatedAt),
    };
  }

  private normalize(data: UpdateFileData & { folderId?: number | null }) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new BadRequestException("File data is required");
    }
    if (
      data.fileName !== undefined &&
      (typeof data.fileName !== "string" ||
        !data.fileName.trim() ||
        data.fileName.trim().length > 191)
    ) {
      throw new BadRequestException(
        "File name must contain 1 to 191 characters",
      );
    }
    if (data.originalName != null && typeof data.originalName !== "string") {
      throw new BadRequestException("Original name must be a string");
    }
    if (data.mimeType != null && typeof data.mimeType !== "string") {
      throw new BadRequestException("Mime type must be a string");
    }
    if (
      data.size != null &&
      (typeof data.size !== "number" ||
        !Number.isFinite(data.size) ||
        data.size < 0)
    ) {
      throw new BadRequestException("Size must be a non-negative number");
    }
    if (
      data.url != null &&
      !data.url.startsWith("/uploads/") &&
      !/^https?:\/\//i.test(data.url)
    ) {
      throw new BadRequestException(
        "URL must be a valid http(s) URL or an /uploads/ path",
      );
    }
    if (data.description != null && typeof data.description !== "string") {
      throw new BadRequestException("Description must be a string");
    }
    if (data.taskId != null) this.id(data.taskId);
    if (data.folderId != null) this.id(data.folderId);
    return {
      fileName: data.fileName?.trim(),
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      description: data.description,
      taskId: data.taskId,
      folderId: data.folderId,
    };
  }

  private folderDir(folder?: string, required = false): string {
    const name = folder?.trim();
    if (!name) {
      if (required) throw new BadRequestException("Folder name is required");
      return UPLOAD_DIR;
    }
    const normalized = normalizePath(name).replace(/\\/g, "/");
    if (
      normalized === "." ||
      normalized === ".." ||
      normalized.startsWith("../") ||
      isAbsolute(normalized) ||
      normalized
        .split("/")
        .some((s) => !s || s === "." || s === ".." || /[<>:"|?*\0]/.test(s))
    ) {
      throw new BadRequestException("Invalid folder path");
    }
    const dir = join(UPLOAD_DIR, normalized);
    if (!dir.startsWith(UPLOAD_DIR + sep))
      throw new BadRequestException("Invalid folder path");
    return dir;
  }

  private folderPublicPath(dir: string): string {
    const rel = relative(UPLOAD_DIR, dir).split(sep).filter(Boolean).join("/");
    return rel ? `/uploads/${rel}` : "/uploads";
  }

  private async findFolder(idOrName: number | string, db: any = this.prisma) {
    const isNum =
      typeof idOrName === "number" ||
      (typeof idOrName === "string" && /^\d+$/.test(idOrName));
    const folder = await db.folder.findFirst({
      where: isNum
        ? { id: Number(idOrName), isDeleted: false }
        : { name: String(idOrName), isDeleted: false },
    });
    if (!folder) throw new NotFoundException("Folder not found");
    return folder;
  }

  async getFiles(query: FileListQuery = {}): Promise<FileListData> {
    const { page = 1, pageSize = 10 } = query;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)
    ) {
      throw new BadRequestException("Invalid pagination");
    }
    if (query.projectId != null) this.id(query.projectId);
    if (query.taskId != null) this.id(query.taskId);
    if (query.folderId != null) this.id(query.folderId);
    if (query.uploadedBy != null) this.id(query.uploadedBy);
    if (query.search !== undefined && typeof query.search !== "string") {
      throw new BadRequestException("Search must be a string");
    }
    const search = query.search?.trim() ?? "";
    const where: Prisma.FileWhereInput = {
      ...(query.projectId != null
        ? { projectId: query.projectId, project: { isDelete: false } }
        : {}),
      ...(query.taskId != null ? { taskId: query.taskId } : {}),
      ...(query.folderId != null ? { folderId: query.folderId } : {}),
      ...(query.uploadedBy != null ? { uploadedBy: query.uploadedBy } : {}),
      ...(query.mimeType ? { mimeType: query.mimeType } : {}),
      ...(search
        ? {
            OR: [
              { fileName: { contains: search } },
              { originalName: { contains: search } },
            ],
          }
        : {}),
    };
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "desc" },
      }),
      this.prisma.file.count({ where }),
    ]);
    return {
      data: files.map((file) => this.toData(file)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getFile(id: number): Promise<FileData> {
    const file = await this.prisma.file.findFirst({
      where: { id: this.id(id) },
    });
    if (!file) throw new NotFoundException("File not found");
    return this.toData(file);
  }

  async createFolder(
    input: string | CreateFolderData,
    accessToken?: string,
  ): Promise<FolderData> {
    const data: CreateFolderData =
      typeof input === "string" ? { name: input } : input;
    if (!data?.name?.trim() || data.name.trim().length > 191) {
      throw new BadRequestException(
        "Folder name must contain 1 to 191 characters",
      );
    }
    const folderName = data.name.trim().replace(/[<>:"|?*\0/\\]/g, "_");
    const createdBy = accessToken ? this.authUserId(accessToken) : 1;

    return (this.prisma as any).$transaction(async (db: any) => {
      const parent =
        data.parentId != null
          ? await db.folder.findFirst({
              where: { id: this.id(data.parentId), isDeleted: false },
            })
          : null;
      if (data.parentId != null && !parent)
        throw new NotFoundException("Parent folder not found");

      let projectId =
        data.projectId != null
          ? this.id(data.projectId)
          : (parent?.projectId ?? null);
      let taskId =
        data.taskId != null ? this.id(data.taskId) : (parent?.taskId ?? null);

      if (projectId != null) {
        projectId =
          (
            await db.project.findUnique({
              where: { id: projectId, isDelete: false },
              select: { id: true },
            })
          )?.id ?? null;
      }
      if (taskId != null) {
        taskId =
          (
            await db.task.findUnique({
              where: { id: taskId },
              select: { id: true },
            })
          )?.id ?? null;
      }

      const relPath = parent
        ? join(parent.path.replace(/^\/uploads\/?/, ""), folderName).replace(
            /\\/g,
            "/",
          )
        : taskId != null
          ? join("tasks", String(taskId), folderName).replace(/\\/g, "/")
          : projectId != null
            ? join("projects", String(projectId), folderName).replace(
                /\\/g,
                "/",
              )
            : folderName;

      const fullDir = join(UPLOAD_DIR, relPath);
      await mkdir(fullDir, { recursive: true });

      const created = await db.folder.create({
        data: {
          name: folderName,
          path: `/uploads/${relPath}`,
          parentId: parent?.id ?? null,
          projectId,
          taskId,
          createdBy,
        },
      });
      return this.toFolderData(created);
    });
  }

  async getFolders(query: FolderListQuery = {}): Promise<FolderData[]> {
    const where: any = {
      isDeleted: false,
      ...(query.projectId != null ? { projectId: query.projectId } : {}),
      ...(query.taskId != null ? { taskId: query.taskId } : {}),
      ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
    };
    const folders = await (this.prisma as any).folder.findMany({
      where,
      orderBy: { id: "desc" },
    });
    return folders.map((f: any) => this.toFolderData(f));
  }

  async updateFolder(
    idOrOldName: number | string,
    newName: string,
  ): Promise<FolderData> {
    const name = newName?.trim();
    if (!name || name.length > 191)
      throw new BadRequestException(
        "Folder name must contain 1 to 191 characters",
      );
    const sanitized = name.replace(/[<>:"|?*\0/\\]/g, "_");

    const folder = await this.findFolder(idOrOldName);
    const oldRel = folder.path.replace(/^\/uploads\/?/, "");
    const parentRel = dirname(oldRel);
    const newRel =
      parentRel && parentRel !== "."
        ? join(parentRel, sanitized).replace(/\\/g, "/")
        : sanitized;

    const oldDir = join(UPLOAD_DIR, oldRel);
    const newDir = join(UPLOAD_DIR, newRel);
    if (oldDir !== newDir) await rename(oldDir, newDir).catch(() => {});

    const updated = await (this.prisma as any).folder.update({
      where: { id: folder.id },
      data: { name: sanitized, path: `/uploads/${newRel}` },
    });
    return this.toFolderData(updated);
  }

  async deleteFolder(input: number | string): Promise<void> {
    const folder = await this.findFolder(input);
    await (this.prisma as any).folder.update({
      where: { id: folder.id },
      data: { isDeleted: true },
    });
  }

  async createFile(
    data: CreateFileData,
    accessToken?: string,
    file?: UploadedFileData,
  ): Promise<FileData> {
    const values = this.normalize(data);
    if (file && !file.buffer?.length)
      throw new BadRequestException("Uploaded file is empty");
    const fileName =
      values.fileName ?? file?.originalname?.trim().slice(0, 191);
    if (!fileName) throw new BadRequestException("File name is required");
    const uploadedBy = this.authUserId(accessToken);
    const projectId = data.projectId != null ? this.id(data.projectId) : null;
    const baseDir = this.folderDir(data.folder);
    const storedName = file
      ? `${randomUUID()}-${
          basename(file.originalname || "file")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(0, 100) || "file"
        }`
      : undefined;

    let targetDir = baseDir;

    try {
      return await (this.prisma as any).$transaction(async (db: any) => {
        if (!(await db.user.findUnique({ where: { id: uploadedBy } }))) {
          throw new UnauthorizedException("Uploader not found");
        }

        let savedProjectId =
          projectId != null
            ? ((
                await db.project.findUnique({
                  where: { id: projectId, isDelete: false },
                  select: { id: true },
                })
              )?.id ?? null)
            : null;
        let savedTaskId =
          values.taskId != null
            ? ((
                await db.task.findUnique({
                  where: { id: values.taskId },
                  select: { id: true },
                })
              )?.id ?? null)
            : null;
        let savedFolderId: number | null = null;

        if (values.folderId != null) {
          const folder = await db.folder.findFirst({
            where: { id: values.folderId, isDeleted: false },
          });
          if (folder) {
            savedFolderId = folder.id;
            if (!data.folder)
              targetDir = join(
                UPLOAD_DIR,
                folder.path.replace(/^\/uploads\/?/, ""),
              );
            savedProjectId ??= folder.projectId;
            savedTaskId ??= folder.taskId;
          }
        }

        if (file && storedName) {
          await mkdir(targetDir, { recursive: true });
          await writeFile(join(targetDir, storedName), file.buffer);
        }

        return this.toData(
          await db.file.create({
            data: {
              ...values,
              fileName,
              originalName:
                values.originalName ?? file?.originalname?.slice(0, 191),
              mimeType: values.mimeType ?? file?.mimetype,
              size: values.size ?? file?.size,
              url: storedName
                ? `${this.folderPublicPath(targetDir)}/${storedName}`
                : values.url,
              key: randomUUID(),
              projectId: savedProjectId,
              taskId: savedTaskId,
              folderId: savedFolderId,
              uploadedBy,
            },
          }),
        );
      });
    } catch (error) {
      if (storedName) await unlink(join(targetDir, storedName)).catch(() => {});
      throw error;
    }
  }

  async updateFile(id: number, data: UpdateFileData): Promise<FileData> {
    this.id(id);
    const values = this.normalize(data);
    return this.prisma.$transaction(async (db) => {
      const file = await db.file.findFirst({ where: { id } });
      if (!file) throw new NotFoundException("File not found");
      if (values.taskId != null && file.projectId != null) {
        const task = await db.task.findUnique({ where: { id: values.taskId } });
        if (!task || task.projectId !== file.projectId) {
          throw new BadRequestException("Task must belong to same project");
        }
      }
      return this.toData(await db.file.update({ where: { id }, data: values }));
    });
  }

  async deleteFile(id: number): Promise<void> {
    await this.getFile(id);
    await this.prisma.file.delete({ where: { id } }).catch((error) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("File not found");
      }
      throw error;
    });
  }
}
