import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Audit } from "../../../../shared/decorators/audit.decorator";
import { CurrentUser, RequestUser } from "../../../../shared/decorators/current-user.decorator";
import { Permissions } from "../../../../shared/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../../shared/guards/jwt-auth.guard";
import { RbacGuard } from "../../../../shared/guards/rbac.guard";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import { StorageService } from "../../../../shared/storage/storage.service";
import {
  CreateCertificateDto,
  CreateVesselDto,
  ListVesselsQueryDto,
  UpdateVesselDto,
} from "../../application/dtos/vessel.dto";
import { CertificateService } from "../../application/services/certificate.service";
import { VesselService } from "../../application/services/vessel.service";

@ApiTags("Fleet — Vessels")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("vessels")
export class VesselController {
  constructor(
    private readonly vesselService: VesselService,
    private readonly certificateService: CertificateService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Permissions("vessel:create")
  @Audit({ resource: "vessel" })
  @ApiOperation({ summary: "Registrasi kapal baru" })
  @ApiResponse({ status: 201, description: "Kapal berhasil diregistrasi" })
  @ApiResponse({ status: 400, description: "Data tidak valid" })
  @ApiResponse({ status: 409, description: "IMO Number sudah terdaftar" })
  async create(
    @Body() dto: CreateVesselDto,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const vessel = await this.vesselService.create(dto as any, user.companyId, user.userId);
    return ApiResponseHelper.created(vessel, "Kapal berhasil diregistrasi", request);
  }

  @Get()
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Daftar semua kapal dalam perusahaan" })
  async findAll(
    @Query() query: ListVesselsQueryDto,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const result = await this.vesselService.findAll(user.companyId, query);
    return ApiResponseHelper.paginated(
      result.data,
      result.meta,
      "Berhasil mengambil data armada",
      request,
    );
  }

  @Get(":vesselId")
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Detail kapal berdasarkan ID" })
  async findOne(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const vessel = await this.vesselService.findById(vesselId, user.companyId);
    return ApiResponseHelper.success(vessel, "Berhasil mengambil detail kapal", request);
  }

  @Patch(":vesselId")
  @Permissions("vessel:update")
  @Audit({ resource: "vessel", captureOld: true })
  @ApiOperation({ summary: "Update data kapal" })
  async update(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @Body() dto: UpdateVesselDto,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const vessel = await this.vesselService.update(vesselId, user.companyId, user.userId, dto);
    return ApiResponseHelper.success(vessel, "Data kapal berhasil diperbarui", request);
  }

  @Delete(":vesselId")
  @Permissions("vessel:delete")
  @Audit({ resource: "vessel" })
  @ApiOperation({ summary: "Nonaktifkan kapal (soft delete)" })
  async delete(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    await this.vesselService.softDelete(vesselId, user.companyId, user.userId);
    return ApiResponseHelper.success(null, "Kapal berhasil dinonaktifkan", request);
  }

  @Post(":vesselId/status")
  @Permissions("vessel:update")
  @Audit({ resource: "vessel", captureOld: true })
  @ApiOperation({ summary: "Update status kapal (ACTIVE, DRYDOCK, LAID_UP, SCRAPPED, SOLD)" })
  async updateStatus(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @Body() body: { status: string },
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const vessel = await this.vesselService.updateStatus(
      vesselId,
      user.companyId,
      user.userId,
      body.status,
    );
    return ApiResponseHelper.success(vessel, "Status kapal berhasil diperbarui", request);
  }

  // ─── Certificates ───────────────────────────────────────

  @Get(":vesselId/certificates")
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Daftar sertifikat kapal" })
  async findCertificates(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const certificates = await this.certificateService.findAllByVessel(vesselId, user.companyId);
    return ApiResponseHelper.success(certificates, "Berhasil mengambil data sertifikat", request);
  }

  @Post(":vesselId/certificates")
  @Permissions("vessel:certificate:manage")
  @Audit({ resource: "vessel_certificate" })
  @ApiOperation({ summary: "Tambah sertifikat kapal baru" })
  async createCertificate(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @Body() dto: CreateCertificateDto,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const certificate = await this.certificateService.create(
      { ...dto, vesselId },
      user.companyId,
      user.userId,
    );
    return ApiResponseHelper.created(certificate, "Sertifikat berhasil ditambahkan", request);
  }

  @Get("certificates/:certificateId")
  @Permissions("vessel:read")
  @ApiOperation({ summary: "Detail sertifikat berdasarkan ID" })
  async findCertificate(
    @Param("certificateId", ParseUUIDPipe) certificateId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const certificate = await this.certificateService.findById(certificateId, user.companyId);
    return ApiResponseHelper.success(certificate, "Berhasil mengambil detail sertifikat", request);
  }

  @Patch("certificates/:certificateId")
  @Permissions("vessel:certificate:manage")
  @Audit({ resource: "vessel_certificate", captureOld: true })
  @ApiOperation({ summary: "Update sertifikat kapal" })
  async updateCertificate(
    @Param("certificateId", ParseUUIDPipe) certificateId: string,
    @Body() dto: any,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const certificate = await this.certificateService.update(
      certificateId,
      user.companyId,
      user.userId,
      dto,
    );
    return ApiResponseHelper.success(certificate, "Sertifikat berhasil diperbarui", request);
  }

  @Delete("certificates/:certificateId")
  @Permissions("vessel:certificate:manage")
  @Audit({ resource: "vessel_certificate" })
  @ApiOperation({ summary: "Hapus sertifikat kapal" })
  async deleteCertificate(
    @Param("certificateId", ParseUUIDPipe) certificateId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    await this.certificateService.delete(certificateId, user.companyId);
    return ApiResponseHelper.success(null, "Sertifikat berhasil dihapus", request);
  }

  @Post(":vesselId/documents/upload")
  @Permissions("document:upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload dokumen/sertifikat kapal ke MinIO" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        title: { type: "string" },
        description: { type: "string" },
        documentType: { type: "string" },
      },
    },
  })
  async uploadDocument(
    @Param("vesselId", ParseUUIDPipe) vesselId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; description?: string; documentType?: string },
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException("File wajib diunggah");
    }

    // 1. File size validation (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException("Ukuran file maksimal 10MB");
    }

    // 2. File format validation (pdf, jpg, jpeg, doc, docx, xls, xlsx)
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Format file tidak didukung. Gunakan PDF, JPG, JPEG, PNG, Word, atau Excel",
      );
    }

    // 3. Upload to MinIO
    const key = `companies/${user.companyId}/vessels/${vesselId}/${Date.now()}-${file.originalname}`;
    const fileUrl = await this.storageService.uploadFile(key, file.buffer, file.mimetype);

    // 4. Save to Database via VesselService
    const document = await this.vesselService.addDocument(vesselId, user.companyId, user.userId, {
      title: body.title || file.originalname,
      description: body.description,
      documentType: body.documentType || "manual",
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return ApiResponseHelper.created(document, "Dokumen berhasil diunggah", request);
  }
}
