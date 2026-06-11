import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Audit } from "../../../../shared/decorators/audit.decorator";
import { Permissions } from "../../../../shared/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../../shared/guards/jwt-auth.guard";
import { RbacGuard } from "../../../../shared/guards/rbac.guard";
import { CompanyIsolationGuard } from "../../../../shared/guards/company-isolation.guard";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanySettingsDto } from "../../application/dtos/company.dto";
import { CompanyService } from "../../application/services/company.service";

@ApiTags("Company Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard, CompanyIsolationGuard)
@Controller("companies")
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Permissions("company:read")
  @ApiOperation({ summary: "Daftar semua perusahaan" })
  async findAll(@Req() request: Request) {
    const companies = await this.companyService.findAll();
    return ApiResponseHelper.success(companies, "Berhasil mengambil data perusahaan", request);
  }

  @Get(":companyId")
  @Permissions("company:read")
  @ApiOperation({ summary: "Detail perusahaan berdasarkan ID" })
  async findOne(@Param("companyId", ParseUUIDPipe) companyId: string, @Req() request: Request) {
    const company = await this.companyService.findById(companyId);
    return ApiResponseHelper.success(company, "Berhasil mengambil detail perusahaan", request);
  }

  @Post()
  @Permissions("company:manage")
  @Audit({ resource: "company" })
  @ApiOperation({ summary: "Buat perusahaan baru" })
  async create(@Body() dto: CreateCompanyDto, @Req() request: Request) {
    const company = await this.companyService.create(dto);
    return ApiResponseHelper.created(company, "Perusahaan berhasil dibuat", request);
  }

  @Patch(":companyId")
  @Permissions("company:manage")
  @Audit({ resource: "company", captureOld: true })
  @ApiOperation({ summary: "Update data perusahaan" })
  async update(
    @Param("companyId", ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateCompanyDto,
    @Req() request: Request,
  ) {
    const company = await this.companyService.update(companyId, dto);
    return ApiResponseHelper.success(company, "Data perusahaan berhasil diperbarui", request);
  }

  @Post(":companyId/deactivate")
  @Permissions("company:manage")
  @Audit({ resource: "company" })
  @ApiOperation({ summary: "Nonaktifkan perusahaan" })
  async deactivate(@Param("companyId", ParseUUIDPipe) companyId: string, @Req() request: Request) {
    const company = await this.companyService.deactivate(companyId);
    return ApiResponseHelper.success(company, "Perusahaan berhasil dinonaktifkan", request);
  }

  @Post(":companyId/activate")
  @Permissions("company:manage")
  @Audit({ resource: "company" })
  @ApiOperation({ summary: "Aktifkan perusahaan" })
  async activate(@Param("companyId", ParseUUIDPipe) companyId: string, @Req() request: Request) {
    const company = await this.companyService.activate(companyId);
    return ApiResponseHelper.success(company, "Perusahaan berhasil diaktifkan", request);
  }

  @Get(":companyId/settings")
  @Permissions("company:read")
  @ApiOperation({ summary: "Ambil pengaturan perusahaan" })
  async getSettings(@Param("companyId", ParseUUIDPipe) companyId: string, @Req() request: Request) {
    const settings = await this.companyService.getSettings(companyId);
    return ApiResponseHelper.success(settings, "Berhasil mengambil pengaturan perusahaan", request);
  }

  @Patch(":companyId/settings")
  @Permissions("company:manage")
  @Audit({ resource: "company", captureOld: true })
  @ApiOperation({ summary: "Update pengaturan perusahaan" })
  async updateSettings(
    @Param("companyId", ParseUUIDPipe) companyId: string,
    @Body() dto: UpdateCompanySettingsDto,
    @Req() request: Request,
  ) {
    const company = await this.companyService.updateSettings(companyId, dto);
    return ApiResponseHelper.success(company, "Pengaturan perusahaan berhasil diperbarui", request);
  }
}
