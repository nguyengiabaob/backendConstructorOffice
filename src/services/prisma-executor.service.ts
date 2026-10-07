import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/Database/prisma.service";

@Injectable()
export class PrismaExecutorService {
  constructor(private readonly prisma: PrismaService) {}

  /** The SQL string must be trusted. Pass all user values through parameters. */
  executeQuery<T = unknown[]>(
    queryString: string,
    parameters: unknown[] = [],
  ): Promise<T> {
    this.requireQuery(queryString);
    return this.prisma.$queryRawUnsafe<T>(queryString, ...parameters);
  }

  /** Use for INSERT, UPDATE, DELETE, or DDL statements. */
  executeStatement(
    queryString: string,
    parameters: unknown[] = [],
  ): Promise<number> {
    this.requireQuery(queryString);
    return this.prisma.$executeRawUnsafe(queryString, ...parameters);
  }

  executeStoredProcedure<T = unknown>(
    procedureName: string,
    parameters: unknown[] = [],
  ): Promise<T> {
    if (
      !/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(
        procedureName,
      )
    ) {
      throw new BadRequestException("Invalid stored procedure name");
    }

    const placeholders = parameters.map(() => "?").join(", ");
    return this.prisma.$queryRawUnsafe<T>(
      `CALL ${procedureName}(${placeholders})`,
      ...parameters,
    );
  }

  private requireQuery(queryString: string) {
    if (typeof queryString !== "string" || !queryString.trim()) {
      throw new BadRequestException("Query string is required");
    }
  }
}
