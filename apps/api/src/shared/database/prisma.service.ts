import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
        { emit: "stdout", level: "error" },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Database connected successfully");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }

  /**
   * Soft delete helper — sets deletedAt field instead of actual delete
   */
  async softDelete<T extends { deletedAt: Date | null }>(
    model: {
      update: (args: { where: unknown; data: unknown }) => Promise<T>;
    },
    id: string,
  ): Promise<T> {
    return model.update({
      where: { id } as any,
      data: { deletedAt: new Date() } as any,
    }) as Promise<T>;
  }

  /**
   * Check if a record is soft-deleted
   */
  isDeleted(record: { deletedAt: Date | null } | null): boolean {
    return record?.deletedAt !== null && record?.deletedAt !== undefined;
  }
}
