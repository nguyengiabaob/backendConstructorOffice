import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
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

void checkCreateProject();
