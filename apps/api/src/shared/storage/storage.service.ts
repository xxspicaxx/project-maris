import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>("MINIO_ENDPOINT", "localhost");
    const port = this.configService.get<string>("MINIO_PORT", "9000");
    const accessKey = this.configService.get<string>("MINIO_ACCESS_KEY", "minioadmin");
    const secretKey = this.configService.get<string>("MINIO_SECRET_KEY", "minioadmin");
    this.bucketName = this.configService.get<string>("MINIO_BUCKET", "maritime-docs");

    const useSSL = this.configService.get<string>("MINIO_USE_SSL", "false") === "true";
    const protocol = useSSL ? "https" : "http";

    this.s3Client = new S3Client({
      endpoint: `${protocol}://${endpoint}:${port}`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      region: "us-east-1",
      forcePathStyle: true, // Required for MinIO
    });

    this.logger.log(
      `StorageService initialized with MinIO endpoint: ${protocol}://${endpoint}:${port}, bucket: ${this.bucketName}`,
    );
  }

  /**
   * Upload file to MinIO bucket
   * @returns public file URL
   */
  async uploadFile(key: string, file: Buffer, mimeType: string): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimeType,
        }),
      );

      const endpoint = this.configService.get<string>("MINIO_ENDPOINT", "localhost");
      const port = this.configService.get<string>("MINIO_PORT", "9000");
      const useSSL = this.configService.get<string>("MINIO_USE_SSL", "false") === "true";
      const protocol = useSSL ? "https" : "http";

      return `${protocol}://${endpoint}:${port}/${this.bucketName}/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete file from MinIO bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      throw error;
    }
  }
}
