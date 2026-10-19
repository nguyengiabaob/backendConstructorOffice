import assert from "node:assert/strict";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { JwtService } from "@nestjs/jwt";
import type { PrismaService } from "../../shared/Database/prisma.service";
import { ProjectServices } from "./project.service";

async function checkCreateProject() {
  let saved: Record<string, unknown> | undefined;
  const prisma = {
    project: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        saved = data;
        return { id: 1, ...data };
      },
    },
  } as unknown as PrismaService;
  const jwt = { verify: () => ({ sub: 7 }) } as unknown as JwtService;
  const service = new ProjectServices(prisma, jwt);

  await service.createProject(
    {
      name: " Central Park Residence ",
      projectCode: " BF-2026-001 ",
      location: "District 1, Ho Chi Minh City",
      progress: 10,
      budget: 2_500_000,
      expectedPersonnel: 25,
      imageUrl: "https://example.com/project.jpg",
    },
    "access-token",
  );

  assert.equal(saved?.name, "Central Park Residence");
  assert.equal(saved?.projectCode, "BF-2026-001");
  assert.equal(saved?.status, "PLANNING");
  assert.equal(saved?.createdBy, 7);
  await assert.rejects(
    service.createProject(
      {
        name: "Invalid project",
        projectCode: "INVALID",
        location: "Bangkok",
        progress: 101,
      },
      "access-token",
    ),
    BadRequestException,
  );
}

async function checkGetProjects() {
  const project = {
    name: "Central Park Residence",
    projectCode: "BF-2026-001",
    location: "Bangkok",
    status: "PLANNING",
    progress: 0,
    budget: new Prisma.Decimal("2500.50"),
    expectedPersonnel: 25,
    imageUrl: null,
  };
  let rows = [project];
  let expectedWhere: Prisma.ProjectWhereInput = { isDelete: false };
  let expectedSkip = 0;
  let expectedTake = 10;
  const prisma = {
    project: {
      findMany: async (args: Prisma.ProjectFindManyArgs) => {
        assert.deepEqual(args.where, expectedWhere);
        assert.equal(args.skip, expectedSkip);
        assert.equal(args.take, expectedTake);
        assert.deepEqual(args.orderBy, { id: "desc" });
        assert.deepEqual(Object.keys(args.select ?? {}).sort(), Object.keys(project).sort());
        return rows;
      },
      count: async (args: Prisma.ProjectCountArgs) => {
        assert.deepEqual(args.where, expectedWhere);
        return rows.length;
      },
    },
  } as unknown as PrismaService;
  const service = new ProjectServices(prisma, {} as JwtService);

  assert.deepEqual(await service.getProjects(), {
    data: [{ ...project, budget: 2500.5, imageUrl: undefined }],
    page: 1, pageSize: 10, total: 1, totalPages: 1,
  });
  expectedWhere = {
    isDelete: false,
    OR: [
      { name: { contains: "Park" } },
      { projectCode: { contains: "Park" } },
      { location: { contains: "Park" } },
    ],
  };
  expectedSkip = 2;
  expectedTake = 2;
  const result = await service.getProjects(" Park ", 2, 2);
  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 2);
  assert.equal(result.total, 1);
  assert.equal(result.totalPages, 1);
  rows = [];
  expectedWhere = { isDelete: false };
  expectedSkip = 0;
  expectedTake = 10;
  assert.deepEqual(await service.getProjects("   "), {
    data: [], page: 1, pageSize: 10, total: 0, totalPages: 0,
  });
  for (const [page, pageSize] of [[0, 10], [1.5, 10], [1, 0], [1, 101], [NaN, 10]]) {
    await assert.rejects(service.getProjects("", page, pageSize), BadRequestException);
  }
  await assert.rejects(service.getProjects([] as unknown as string), BadRequestException);
}

async function checkGetProject() {
  const project = {
    name: "Central Park Residence",
    projectCode: "BF-2026-001",
    location: "Bangkok",
    status: "PLANNING",
    progress: 0,
    budget: new Prisma.Decimal("2500.50"),
    expectedPersonnel: 25,
    imageUrl: null,
  };
  let found: typeof project | null = project;
  let queries = 0;
  const prisma = {
    project: {
      findUnique: async (args: Prisma.ProjectFindUniqueArgs) => {
        queries++;
        assert.deepEqual(args.where, { id: 7, isDelete: false });
        assert.deepEqual(Object.keys(args.select ?? {}).sort(), Object.keys(project).sort());
        return found;
      },
    },
  } as unknown as PrismaService;
  const service = new ProjectServices(prisma, {} as JwtService);

  assert.deepEqual(await service.getProject(7), {
    ...project, budget: 2500.5, imageUrl: undefined,
  });
  found = null;
  await assert.rejects(service.getProject(7), NotFoundException);
  for (const id of [0, -1, 1.5, NaN, Infinity]) {
    await assert.rejects(service.getProject(id), BadRequestException);
  }
  assert.equal(queries, 2);
}

async function checkUpdateProject() {
  let saved: Prisma.ProjectUpdateArgs | undefined;
  let failure: Error | undefined;
  const prisma = {
    project: {
      update: async (args: Prisma.ProjectUpdateArgs) => {
        saved = args;
        if (failure) throw failure;
        return { id: 7, ...args.data };
      },
    },
  } as unknown as PrismaService;
  const service = new ProjectServices(prisma, {} as JwtService);
  const data = { name: " Updated ", projectCode: " CODE ", location: " Bangkok " };
  const result = await service.updateProject(7, data);
  assert.equal(result.id, 7);
  assert.deepEqual(saved?.where, { id: 7, isDelete: false });
  assert.equal(saved?.data.name, "Updated");
  assert.equal(saved?.data.projectCode, "CODE");
  assert.equal(saved?.data.location, "Bangkok");
  for (const key of ["status", "progress", "budget", "expectedPersonnel", "imageUrl"] as const) {
    assert.equal(saved?.data[key], undefined);
  }
  await service.updateProject(7, {
    ...data, status: "ACTIVE", progress: 0, budget: 0, expectedPersonnel: 1, imageUrl: "",
  });
  assert.equal(saved?.data.progress, 0);
  assert.equal(saved?.data.budget, 0);
  assert.equal(saved?.data.imageUrl, null);
  await assert.rejects(service.updateProject(0, data), BadRequestException);
  await assert.rejects(service.updateProject(7, { ...data, name: " " }), BadRequestException);
  await assert.rejects(service.updateProject(7, { ...data, progress: 101 }), BadRequestException);
  await assert.rejects(service.updateProject(7, { ...data, imageUrl: "invalid" }), BadRequestException);
  for (const [code, exception] of [["P2025", NotFoundException], ["P2002", ConflictException]] as const) {
    failure = new Prisma.PrismaClientKnownRequestError("Update failed", { code, clientVersion: "5.22.0" });
    await assert.rejects(service.updateProject(7, data), exception);
  }
  failure = new Error("Database unavailable");
  await assert.rejects(service.updateProject(7, data), failure);
}

async function checkDeleteProject() {
  let deleted = false;
  let queries = 0;
  let failure: Error | undefined;
  const prisma = {
    project: {
      update: async (args: Prisma.ProjectUpdateArgs) => {
        queries++;
        assert.deepEqual(args.where, { id: 7, isDelete: false });
        assert.deepEqual(args.data, { isDelete: true });
        if (failure) throw failure;
        if (deleted) {
          throw new Prisma.PrismaClientKnownRequestError("Not found", {
            code: "P2025", clientVersion: "5.22.0",
          });
        }
        deleted = true;
        return { id: 7, isDelete: true };
      },
    },
  } as unknown as PrismaService;
  const service = new ProjectServices(prisma, {} as JwtService);
  assert.equal(await service.deleteProject("7"), undefined);
  assert.equal(deleted, true);
  await assert.rejects(service.deleteProject("7"), NotFoundException);
  for (const id of ["", " ", "0", "-1", "1.5", "abc", "1e2", "9007199254740992"]) {
    await assert.rejects(service.deleteProject(id), BadRequestException);
  }
  assert.equal(queries, 2);
  failure = new Error("Database unavailable");
  await assert.rejects(service.deleteProject("7"), failure);
}

void Promise.all([checkCreateProject(), checkGetProjects(), checkGetProject(), checkUpdateProject(), checkDeleteProject()]);
