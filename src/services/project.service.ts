import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../shared/Database/prisma.service";
import {
  CreateProjectData,
  IprojectService,
  ProjectListData,
} from "../IService/IProjectService";

@Injectable()
export class ProjectServices implements IprojectService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  public async getProjects(
    search = "",
    page = 1,
    pageSize = 10,
  ): Promise<ProjectListData> {
    if (typeof search !== "string") {
      throw new BadRequestException("Search must be a string");
    }
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)
    ) {
      throw new BadRequestException(
        "Page must be a positive integer and pageSize must be from 1 to 100",
      );
    }

    const term = search.trim();
    const where: Prisma.ProjectWhereInput = {
      isDelete: false,
      ...(term
        ? {
            OR: [
              { name: { contains: term } },
              { projectCode: { contains: term } },
              { location: { contains: term } },
            ],
          }
        : {}),
    };
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "desc" },
        select: {
          name: true,
          projectCode: true,
          location: true,
          status: true,
          progress: true,
          budget: true,
          expectedPersonnel: true,
          imageUrl: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((project) => ({
        ...project,
        budget: project.budget.toNumber(),
        imageUrl: project.imageUrl ?? undefined,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  public async getProject(id: number): Promise<CreateProjectData> {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException("Project ID must be a positive integer");
    }

    const project = await this.prisma.project.findUnique({
      where: { id, isDelete: false },
      select: {
        name: true,
        projectCode: true,
        location: true,
        status: true,
        progress: true,
        budget: true,
        expectedPersonnel: true,
        imageUrl: true,
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return {
      ...project,
      budget: project.budget.toNumber(),
      imageUrl: project.imageUrl ?? undefined,
    };
  }

  private normalizeProjectData(data: CreateProjectData) {
    if (
      !data ||
      typeof data.name !== "string" ||
      typeof data.projectCode !== "string" ||
      typeof data.location !== "string" ||
      (data.status !== undefined && typeof data.status !== "string") ||
      (data.imageUrl !== undefined && typeof data.imageUrl !== "string")
    ) {
      throw new BadRequestException(
        "Project name, code and location are required",
      );
    }

    const name = data.name.trim();
    const projectCode = data.projectCode.trim();
    const location = data.location.trim();
    const status = data.status?.trim() || "PLANNING";
    const progress = Number(data.progress ?? 0);
    const budget = Number(data.budget ?? 0);
    const expectedPersonnel = Number(data.expectedPersonnel ?? 1);

    if (!name || !projectCode || !location) {
      throw new BadRequestException(
        "Project name, code and location are required",
      );
    }
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw new BadRequestException(
        "Progress must be an integer from 0 to 100",
      );
    }
    if (!Number.isFinite(budget) || budget < 0) {
      throw new BadRequestException("Budget must be a non-negative number");
    }
    if (!Number.isInteger(expectedPersonnel) || expectedPersonnel < 1) {
      throw new BadRequestException(
        "Expected personnel must be a positive integer",
      );
    }
    if (data.imageUrl) {
      try {
        const protocol = new URL(data.imageUrl).protocol;
        if (protocol !== "http:" && protocol !== "https:") throw new Error();
      } catch {
        throw new BadRequestException("Image URL must be a valid http(s) URL");
      }
    }
    return {
      name,
      projectCode,
      location,
      status,
      progress,
      budget,
      expectedPersonnel,
      imageUrl: data.imageUrl?.trim() || null,
    };
  }

  public async createProject(data: CreateProjectData, accessToken?: string) {
    const projectData = this.normalizeProjectData(data);
    if (!accessToken) {
      throw new UnauthorizedException("Access token is required");
    }

    let createdBy: number;
    try {
      createdBy = Number(this.jwt.verify<{ sub: number }>(accessToken).sub);
      if (!Number.isInteger(createdBy) || createdBy < 1) throw new Error();
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    try {
      return await this.prisma.project.create({
        data: {
          ...projectData,
          createdBy,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Project code already exists");
      }
      throw error;
    }
  }

  public async updateProject(id: number, data: CreateProjectData) {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException("Project ID must be a positive integer");
    }
    const projectData = this.normalizeProjectData(data);

    try {
      return await this.prisma.project.update({
        where: { id, isDelete: false },
        data: {
          ...projectData,
          status: data.status === undefined ? undefined : projectData.status,
          progress: data.progress === undefined ? undefined : projectData.progress,
          budget: data.budget === undefined ? undefined : projectData.budget,
          expectedPersonnel: data.expectedPersonnel === undefined ? undefined : projectData.expectedPersonnel,
          imageUrl: data.imageUrl === undefined ? undefined : projectData.imageUrl,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Project not found");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Project code already exists");
        }
      }
      throw error;
    }
  }

  public async deleteProject(id: string): Promise<void> {
    const projectId = Number(id);
    if (typeof id !== "string" || !/^\d+$/.test(id) ||
        !Number.isSafeInteger(projectId) || projectId < 1) {
      throw new BadRequestException("Project ID must be a positive integer");
    }

    try {
      await this.prisma.project.update({
        where: { id: projectId, isDelete: false },
        data: { isDelete: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException("Project not found");
      }
      throw error;
    }
  }
}
