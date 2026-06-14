import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const SOFT_DELETE_MODELS = [
  "Company",
  "User",
  "Role",
  "Permission",
  "Vessel",
  "VesselCertificate",
  "Seafarer",
  "SeafarerCertificate",
  "CrewAssignment",
  "Voyage",
  "PortCall",
  "Document",
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    super({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });
  }

  /**
   * Creates an extended client with automatic soft-delete filtering.
   * Use this when you want findFirst/findMany/findUnique to automatically
   * exclude soft-deleted records (where deletedAt IS NOT NULL).
   */
  withSoftDelete(): ReturnType<typeof this.$extends> {
    const addSoftDeleteFilter = ({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => Promise<unknown>;
    }): Promise<unknown> => {
      args.where = args.where || {};
      if (args.where.deletedAt === undefined) {
        args.where.deletedAt = null;
      }
      return query(args);
    };

    const queryOverrides = Object.fromEntries(
      SOFT_DELETE_MODELS.map((model) => {
        const key = model.charAt(0).toLowerCase() + model.slice(1);
        return [
          key,
          {
            findFirst: addSoftDeleteFilter,
            findMany: addSoftDeleteFilter,
            findUnique: addSoftDeleteFilter,
          },
        ];
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.$extends({ query: queryOverrides as any });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma connected successfully");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Prisma disconnected");
  }
}
