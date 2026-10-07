import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../shared/Database/prisma.service";
import {
  CreateProjectData,
  IprojectService,
} from "../IService/IProjectService";

@Injectable()
export class ProjectServices implements IprojectService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  public async getProjects() {
    return [];
  }

  public async getProject() {
    return {};
  }

  public async createProject(data: CreateProjectData, accessToken?: string) {
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
      throw new BadRequestException("Progress must be an integer from 0 to 100");
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
          name,
          projectCode,
          location,
          status,
          progress,
          budget,
          expectedPersonnel,
          imageUrl: data.imageUrl?.trim() || null,
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

  public async updateProject(data: any) {
    return {};
  }

  public async deleteProject(id: string) {}
}
