import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../shared/Database/prisma.service";

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  participantIds?: number[];
  managerIds?: number[];
  createdBy: number;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  participantIds?: number[];
  managerIds?: number[];
  modifiedBy: number;
}

export interface DeleteProjectInput {
  modifiedBy: number;
}

const projectInclude = {
  creator: {
    select: { id: true, name: true, email: true },
  },
  modifier: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectServices {
  constructor(private readonly prisma: PrismaService) {}

  public async getProjects() {
    return this.prisma.project.findMany({
      where: { isDelete: false },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  public async getProject(id: number) {
    const project = await this.prisma.project.findFirst({
      where: { id, isDelete: false },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} was not found`);
    }

    return project;
  }

  public async createProject(input: CreateProjectInput) {
    const name = this.validateName(input.name);
    const createdBy = this.validateUserId(input.createdBy, "createdBy");
    const participantIds = this.validateUserIds(
      input.participantIds ?? [],
      "participantIds",
    );
    const managerIds = this.validateUserIds(
      input.managerIds ?? [],
      "managerIds",
    );

    await this.assertUsersExist([createdBy, ...participantIds, ...managerIds]);

    return this.prisma.project.create({
      data: {
        name,
        description: input.description ?? null,
        participantIds,
        managerIds,
        createdBy,
        isDelete: false,
      },
      include: projectInclude,
    });
  }

  public async updateProject(id: number, input: UpdateProjectInput) {
    await this.getProject(id);

    const modifiedBy = this.validateUserId(input.modifiedBy, "modifiedBy");
    const data: Prisma.ProjectUncheckedUpdateInput = { modifiedBy };
    const userIdsToValidate = [modifiedBy];

    if (input.name !== undefined) {
      data.name = this.validateName(input.name);
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.participantIds !== undefined) {
      const participantIds = this.validateUserIds(
        input.participantIds,
        "participantIds",
      );
      data.participantIds = participantIds;
      userIdsToValidate.push(...participantIds);
    }

    if (input.managerIds !== undefined) {
      const managerIds = this.validateUserIds(input.managerIds, "managerIds");
      data.managerIds = managerIds;
      userIdsToValidate.push(...managerIds);
    }

    await this.assertUsersExist(userIdsToValidate);

    return this.prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    });
  }

  public async deleteProject(id: number, input: DeleteProjectInput) {
    await this.getProject(id);

    const modifiedBy = this.validateUserId(input.modifiedBy, "modifiedBy");
    await this.assertUsersExist([modifiedBy]);

    return this.prisma.project.update({
      where: { id },
      data: {
        isDelete: true,
        modifiedBy,
      },
      include: projectInclude,
    });
  }

  private validateName(name: unknown): string {
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new BadRequestException("name is required");
    }

    return name.trim();
  }

  private validateUserId(value: unknown, fieldName: string): number {
    if (!Number.isInteger(value) || Number(value) <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive user ID`);
    }

    return Number(value);
  }

  private validateUserIds(value: unknown, fieldName: string): number[] {
    if (!Array.isArray(value)) {
      throw new BadRequestException(
        `${fieldName} must be an array of user IDs`,
      );
    }

    const ids = value.map((id) => this.validateUserId(id, fieldName));
    return [...new Set(ids)];
  }

  private async assertUsersExist(ids: number[]): Promise<void> {
    const uniqueIds = [...new Set(ids)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingIds = new Set(users.map((user) => user.id));
    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `User IDs not found: ${missingIds.join(", ")}`,
      );
    }
  }
}
