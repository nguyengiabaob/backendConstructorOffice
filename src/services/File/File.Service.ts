import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { File, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, normalize as normalizePath, relative, sep } from "node:path";
import { PrismaService } from "../../../shared/Database/prisma.service";
import {
  CreateFileData,
  FileData,
  FileListData,
  FileListQuery,
  FolderData,
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

  private toData(file: File): FileData {
    return {
      ...file,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }

  private normalize(data: UpdateFileData) {
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new BadRequestException("File data is required");
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
    if (
      data.originalName !== undefined &&
      data.originalName !== null &&
      typeof data.originalName !== "string"
    )
      throw new BadRequestException("Original name must be a string");
    if (
      data.mimeType !== undefined &&
      data.mimeType !== null &&
      typeof data.mimeType !== "string"
    )
      throw new BadRequestException("Mime type must be a string");
    if (
      data.size !== undefined &&
      (typeof data.size !== "number" ||
        !Number.isFinite(data.size) ||
        data.size < 0)
    )
      throw new BadRequestException("Size must be a non-negative number");
    if (data.url !== undefined && data.url !== null && !data.url.startsWith("/uploads/")) {
      try {
        const protocol = new URL(data.url).protocol;
        if (protocol !== "http:" && protocol !== "https:") throw new Error();
      } catch {
        throw new BadRequestException("URL must be a valid http(s) URL or an /uploads/ path");
      }
    }
    if (
      data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string"
    )
      throw new BadRequestException("Description must be a string");
    if (data.taskId != null) this.id(data.taskId);
    return {
      fileName: data.fileName?.trim(),
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      description: data.description,
      taskId: data.taskId,
    };
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
    )
      throw new BadRequestException("Invalid pagination");
    if (query.projectId != null) this.id(query.projectId);
    if (query.taskId != null) this.id(query.taskId);
    if (query.uploadedBy != null) this.id(query.uploadedBy);
    if (query.search !== undefined && typeof query.search !== "string")
      throw new BadRequestException("Search must be a string");
    const search = query.search?.trim() ?? "";
    const where: Prisma.FileWhereInput = {
      ...(query.projectId != null ? { projectId: query.projectId } : {}),
      ...(query.taskId != null ? { taskId: query.taskId } : {}),
      ...(query.uploadedBy != null ? { uploadedBy: query.uploadedBy } : {}),
      ...(query.mimeType ? { mimeType: query.mimeType } : {}),
      project: { isDelete: false },
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
      where: { id: this.id(id), project: { isDelete: false } },
    });
    if (!file) throw new NotFoundException("File not found");
    return this.toData(file);
  }

  // Resolves a user-supplied folder to a directory inside uploads/.
  private folderDir(folder?: string, required = false): string {
    if (folder !== undefined && folder !== null && typeof folder !== "string")
      throw new BadRequestException("Folder must be a string");
    const name = folder?.trim() ?? "";
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
      normalized.split("/").some((segment) => !segment || segment === "." || segment === ".." || /[<>:"|?*\0]/.test(segment))
    )
      throw new BadRequestException("Invalid folder path");
    const dir = join(UPLOAD_DIR, normalized);
    if (dir !== UPLOAD_DIR && !dir.startsWith(UPLOAD_DIR + sep))
      throw new BadRequestException("Invalid folder path");
    return dir;
  }

  private folderPublicPath(dir: string): string {
    const rel = relative(UPLOAD_DIR, dir).split(sep).filter(Boolean).join("/");
    return rel ? `/uploads/${rel}` : "/uploads";
  }

  async createFolder(name: string): Promise<FolderData> {
    const dir = this.folderDir(name, true);
    await mkdir(dir, { recursive: true });
    return { path: this.folderPublicPath(dir) };
  }

  async updateFolder(oldName: string, newName: string): Promise<FolderData> {
    const from = this.folderDir(oldName, true);
    const to = this.folderDir(newName, true);
    if (to === from || to.startsWith(from + sep))
      throw new BadRequestException("Target folder must not be the source folder or inside it");
    try {
      await stat(from);
    } catch {
      throw new NotFoundException("Folder not found");
    }
    try {
      await stat(to);
      throw new BadRequestException("Target folder already exists");
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
    }
    await rename(from, to);
    return { path: this.folderPublicPath(to) };
  }

  async deleteFolder(name: string): Promise<void> {
    const dir = this.folderDir(name, true);
    try {
      await stat(dir);
    } catch {
      throw new NotFoundException("Folder not found");
    }
    await rm(dir, { recursive: true, force: true });
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
    const projectId = this.id(data.projectId);
    let uploadedBy: number;
    try {
      if (!accessToken) throw new Error();
      uploadedBy = this.id(
        Number(this.jwt.verify<{ sub: number }>(accessToken).sub),
      );
    } catch {
      throw new UnauthorizedException("Invalid or missing access token");
    }
    // Save the bytes first so the stored url always points at a real file.
    const dir = this.folderDir(data.folder);
    const storedName = file
      ? `${randomUUID()}-${basename(file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file"}`
      : undefined;
    if (file && storedName) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, storedName), file.buffer);
    }
    try {
      return await this.prisma.$transaction(async (db) => {
        const project = await db.project.findUnique({
          where: { id: projectId, isDelete: false },
        });
        if (!project) throw new NotFoundException("Project not found");
        if (!(await db.user.findUnique({ where: { id: uploadedBy } })))
          throw new UnauthorizedException("Uploader not found");
        if (values.taskId != null) {
          const task = await db.task.findUnique({
            where: { id: values.taskId },
          });
          if (!task || task.projectId !== projectId)
            throw new BadRequestException("Task must belong to same project");
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
              url: storedName ? `${this.folderPublicPath(dir)}/${storedName}` : values.url,
              key: randomUUID(),
              projectId,
              uploadedBy,
            },
          }),
        );
      });
    } catch (error) {
      if (storedName)
        await unlink(join(dir, storedName)).catch(() => {});
      throw error;
    }
  }

  async updateFile(id: number, data: UpdateFileData): Promise<FileData> {
    this.id(id);
    const values = this.normalize(data);
    return this.prisma.$transaction(async (db) => {
      const file = await db.file.findFirst({
        where: { id, project: { isDelete: false } },
      });
      if (!file) throw new NotFoundException("File not found");
      if (values.taskId != null) {
        const task = await db.task.findUnique({ where: { id: values.taskId } });
        if (!task || task.projectId !== file.projectId)
          throw new BadRequestException("Task must belong to same project");
      }
      return this.toData(await db.file.update({ where: { id }, data: values }));
    });
  }

  async deleteFile(id: number): Promise<void> {
    await this.getFile(id);
    try {
      await this.prisma.file.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      )
        throw new NotFoundException("File not found");
      throw error;
    }
  }
}
