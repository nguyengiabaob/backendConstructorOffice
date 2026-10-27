import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Inject,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  IFileService,
  UpdateFileData,
  UploadedFileData,
} from "../IService/IFileService";
import { FILE_SERVICE } from "../TokenServices/Project.Token";
import { GuardMiddleware } from "../middlewares/guard.middleware";

@Controller("file")
@UseGuards(GuardMiddleware)
@Injectable()
export class FileController {
  constructor(@Inject(FILE_SERVICE) private fileService: IFileService) {}

  @Get("getFiles")
  async getFiles(
    @Query("projectId", new ParseIntPipe({ optional: true }))
    projectId?: number,
    @Query("taskId", new ParseIntPipe({ optional: true }))
    taskId?: number,
    @Query("folderId", new ParseIntPipe({ optional: true }))
    folderId?: number,
    @Query("search") search?: string,
    @Query("mimeType") mimeType?: string,
    @Query("uploadedBy", new ParseIntPipe({ optional: true }))
    uploadedBy?: number,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe)
    pageSize: number = 10,
  ) {
    return this.fileService.getFiles({
      projectId,
      taskId,
      folderId,
      search,
      mimeType,
      uploadedBy,
      page,
      pageSize,
    });
  }

  @Get("getFile/:id")
  async getFile(@Param("id", ParseIntPipe) id: number) {
    return this.fileService.getFile(id);
  }

  @Post("createFile")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async createFile(
    @UploadedFile() file: UploadedFileData | undefined,
    @Body() body: Record<string, any>,
    @Headers("authorization") authorization?: string,
  ) {
    // Multipart fields arrive as strings; Number(NaN) fails id() validation below.
    const num = (value: unknown) =>
      value === undefined || value === null || value === ""
        ? undefined
        : Number(value);
    return this.fileService.createFile(
      {
        projectId: num(body.projectId),
        taskId: num(body.taskId),
        folderId: num(body.folderId),
        folder: body.folder,
        fileName: body.fileName,
        originalName: body.originalName,
        mimeType: body.mimeType,
        size: num(body.size),
        url: body.url,
        description: body.description,
      },
      authorization?.replace(/^Bearer\s+/i, ""),
      file,
    );
  }

  @Post("updateFile/:id")
  async updateFile(
    @Param("id", ParseIntPipe) id: number,
    @Body() data: UpdateFileData,
  ) {
    return this.fileService.updateFile(id, data);
  }

  @Get("getFolders")
  async getFolders(
    @Query("projectId", new ParseIntPipe({ optional: true }))
    projectId?: number,
    @Query("taskId", new ParseIntPipe({ optional: true }))
    taskId?: number,
    @Query("parentId", new ParseIntPipe({ optional: true }))
    parentId?: number,
  ) {
    return this.fileService.getFolders({ projectId, taskId, parentId });
  }

  @Post("createFolder")
  async createFolder(
    @Body()
    body: {
      name: string;
      parentId?: number;
      projectId?: number;
      taskId?: number;
    },
    @Headers("authorization") authorization?: string,
  ) {
    const num = (v: unknown) =>
      v === undefined || v === null || v === "" ? undefined : Number(v);
    return this.fileService.createFolder(
      {
        name: body.name,
        parentId: num(body.parentId),
        projectId: num(body.projectId),
        taskId: num(body.taskId),
      },
      authorization?.replace(/^Bearer\s+/i, ""),
    );
  }

  @Post("updateFolder")
  async updateFolder(
    @Body() body: { id?: number; oldName?: string; newName: string },
  ) {
    const target = body.id ?? body.oldName;
    return this.fileService.updateFolder(target as any, body.newName);
  }

  @Post("deleteFolder")
  async deleteFolder(@Body() body: { id?: number; name?: string }) {
    const target = body.id ?? body.name;
    return this.fileService.deleteFolder(target as any);
  }

  @Post("deleteFolder/:id")
  async deleteFolderById(@Param("id", ParseIntPipe) id: number) {
    return this.fileService.deleteFolder(id);
  }

  @Post("deleteFile/:id")
  async deleteFile(@Param("id", ParseIntPipe) id: number) {
    return this.fileService.deleteFile(id);
  }
}
