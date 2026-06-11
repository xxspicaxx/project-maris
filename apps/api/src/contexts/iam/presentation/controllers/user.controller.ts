import {
  Body,
  Controller,
  Delete,
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
import { Audit as AuditLog } from "../../../../shared/decorators/audit.decorator";
import { CurrentUser, RequestUser } from "../../../../shared/decorators/current-user.decorator";
import { Permissions } from "../../../../shared/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../../../shared/guards/jwt-auth.guard";
import { RbacGuard } from "../../../../shared/guards/rbac.guard";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import { UserService } from "../../application/services/user.service";

@ApiTags("System Admin — Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions("user:read")
  @ApiOperation({ summary: "Daftar semua pengguna dalam perusahaan" })
  async findAll(@CurrentUser() user: RequestUser, @Req() request: Request) {
    const users = await this.userService.findAll(user.companyId);
    return ApiResponseHelper.success(users, "Berhasil mengambil data pengguna", request);
  }

  @Get(":userId")
  @Permissions("user:read")
  @ApiOperation({ summary: "Detail pengguna berdasarkan ID" })
  async findOne(
    @Param("userId", ParseUUIDPipe) userId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const userData = await this.userService.findById(userId, user.companyId);
    return ApiResponseHelper.success(userData, "Berhasil mengambil detail pengguna", request);
  }

  @Patch(":userId")
  @Permissions("user:manage")
  @AuditLog({ resource: "user", captureOld: true })
  @ApiOperation({ summary: "Update data pengguna" })
  async update(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body()
    data: { firstName?: string; lastName?: string; phone?: string; isActive?: boolean },
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    const updated = await this.userService.update(userId, user.companyId, data);
    return ApiResponseHelper.success(updated, "Data pengguna berhasil diperbarui", request);
  }

  @Post(":userId/roles/:roleId")
  @Permissions("user:manage")
  @AuditLog({ resource: "user" })
  @ApiOperation({ summary: "Assign role ke pengguna" })
  async assignRole(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    await this.userService.assignRole(userId, roleId, user.userId);
    return ApiResponseHelper.success(null, "Role berhasil diberikan", request);
  }

  @Delete(":userId/roles/:roleId")
  @Permissions("user:manage")
  @AuditLog({ resource: "user" })
  @ApiOperation({ summary: "Hapus role dari pengguna" })
  async removeRole(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Req() request: Request,
  ) {
    await this.userService.removeRole(userId, roleId);
    return ApiResponseHelper.success(null, "Role berhasil dihapus", request);
  }

  @Delete(":userId")
  @Permissions("user:manage")
  @AuditLog({ resource: "user" })
  @ApiOperation({ summary: "Nonaktifkan pengguna (soft delete)" })
  async delete(
    @Param("userId", ParseUUIDPipe) userId: string,
    @CurrentUser() user: RequestUser,
    @Req() request: Request,
  ) {
    await this.userService.softDelete(userId, user.companyId);
    return ApiResponseHelper.success(null, "Pengguna berhasil dinonaktifkan", request);
  }
}
