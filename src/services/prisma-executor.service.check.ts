import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import type { PrismaService } from "../../shared/Database/prisma.service";
import { PrismaExecutorService } from "./prisma-executor.service";

async function checkPrismaExecutor() {
  let received: unknown[] = [];
  const prisma = {
    $queryRawUnsafe: async (...args: unknown[]) => {
      received = args;
      return [];
    },
    $executeRawUnsafe: async (...args: unknown[]) => {
      received = args;
      return 1;
    },
  } as unknown as PrismaService;
  const service = new PrismaExecutorService(prisma);

  await service.executeStoredProcedure("reports.create_project", [7, "BF-001"]);
  assert.deepEqual(received, ["CALL reports.create_project(?, ?)", 7, "BF-001"]);

  await service.executeQuery("SELECT * FROM Project WHERE id = ?", [7]);
  assert.deepEqual(received, ["SELECT * FROM Project WHERE id = ?", 7]);

  await service.executeStatement("DELETE FROM Project WHERE id = ?", [7]);
  assert.deepEqual(received, ["DELETE FROM Project WHERE id = ?", 7]);

  assert.throws(
    () => service.executeStoredProcedure("project; DROP TABLE User"),
    BadRequestException,
  );
}

void checkPrismaExecutor();
