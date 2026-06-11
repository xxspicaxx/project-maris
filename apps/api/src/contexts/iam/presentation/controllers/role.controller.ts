import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import { RoleService } from "../../application/services/role.service";

@ApiTags("System Admin — Roles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("roles")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions("role:read")
  @ApiOperation({ summary: "Daftar semua role" })
  async findAll(@Req() request: Request) {
    const roles = await this.roleService.findAll();
    return ApiResponseHelper.success(roles, "Berhasil mengambil data role", request);
  }

  @Get(":roleId")
  @Permissions("role:read")
  @ApiOperation({ summary: "Detail role berdasarkan ID" })
  async findOne(@Param("roleId", ParseUUIDPipe) roleId: string, @Req() request: Request) {
    const role = await this.roleService.findById(roleId);
    return ApiResponseHelper.success(role, "Berhasil mengambil detail role", request);
  }

  @Post()
  @Permissions("role:manage")
  @Audit({ resource: "role" })
  @ApiOperation({ summary: "Buat role baru" })
  async create(
    @Body()
    data: { name: string; displayName: string; description?: string; permissionIds?: string[] },
    @Req() request: Request,
  ) {
    const role = await this.roleService.create(data);
    return ApiResponseHelper.created(role, "Role berhasil dibuat", request);
  }

  @Patch(":roleId")
  @Permissions("role:manage")
  @Audit({ resource: "role", captureOld: true })
  @ApiOperation({ summary: "Update role" })
  async update(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Body() data: { displayName?: string; description?: string; permissionIds?: string[] },
    @Req() request: Request,
  ) {
    const role = await this.roleService.update(roleId, data);
    return ApiResponseHelper.success(role, "Role berhasil diperbarui", request);
  }

  @Delete(":roleId")
  @HttpCode(HttpStatus.OK)
  @Permissions("role:manage")
  @Audit({ resource: "role" })
  @ApiOperation({ summary: "Hapus role" })
  async delete(@Param("roleId", ParseUUIDPipe) roleId: string, @Req() request: Request) {
    await this.roleService.delete(roleId);
    return ApiResponseHelper.success(null, "Role berhasil dihapus", request);
  }

  @Get("permissions/all")
  @Permissions("role:read")
  @ApiOperation({ summary: "Daftar semua permission" })
  async findAllPermissions(@Req() request: Request) {
    const permissions = await this.roleService.findAllPermissions();
    return ApiResponseHelper.success(permissions, "Berhasil mengambil data permission", request);
  }

  @Post("permissions")
  @Permissions("role:manage")
  @ApiOperation({ summary: "Buat permission baru" })
  async createPermission(
    @Body()
    data: {
      resource: string;
      action: string;
      scope: "OWN" | "COMPANY" | "ALL";
      description?: string;
    },
    @Req() request: Request,
  ) {
    const permission = await this.roleService.createPermission(data);
    return ApiResponseHelper.created(permission, "Permission berhasil dibuat", request);
  }
}
