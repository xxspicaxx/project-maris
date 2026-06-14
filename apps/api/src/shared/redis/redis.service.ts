import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("redis.host");
    const port = this.configService.get<number>("redis.port");
    const password = this.configService.get<string>("redis.password");

    this.redis = new Redis({
      host,
      port,
      password,
    });

    this.redis.on("connect", () => {
      this.logger.log("Connected to Redis successfully");
    });

    this.redis.on("error", (err: Error) => {
      this.logger.error("Redis connection error", err);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, "EX", ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
