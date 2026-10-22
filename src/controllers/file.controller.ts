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
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  IFileService,
  UpdateFileData,
  UploadedFileData,
} from "../IService/IFileService";
import { FILE_SERVICE } from "../TokenServices/Project.Token";

@Controller("file")
@Injectable()
export class FileController {
  constructor(@Inject(FILE_SERVICE) private fileService: IFileService) {}

  @Get("getFiles")
  async getFiles(
    @Query("projectId", new ParseIntPipe({ optional: true }))
    projectId?: number,
    @Query("taskId", new ParseIntPipe({ optional: true }))
    taskId?: number,
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

  @Post("createFolder")
  async createFolder(@Body() body: { name: string }) {
    return this.fileService.createFolder(body.name);
  }

  @Post("updateFolder")
  async updateFolder(@Body() body: { oldName: string; newName: string }) {
    return this.fileService.updateFolder(body.oldName, body.newName);
  }

  @Post("deleteFolder")
  async deleteFolder(@Body() body: { name: string }) {
    return this.fileService.deleteFolder(body.name);
  }

  @Post("deleteFile/:id")
  async deleteFile(@Param("id", ParseIntPipe) id: number) {
    return this.fileService.deleteFile(id);
  }
}
