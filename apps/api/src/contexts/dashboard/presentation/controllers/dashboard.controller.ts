import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { type Request } from "express";
import {
  CurrentUser,
  type RequestUser,
} from "../../../../shared/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../../shared/guards/jwt-auth.guard";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import { type DashboardService } from "../../application/services/dashboard.service";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("fleet-overview")
  @ApiOperation({ summary: "Ringkasan armada (total, aktif, drydock, laid-up)" })
  async getFleetOverview(@CurrentUser() user: RequestUser, @Req() request: Request) {
    const data = await this.dashboardService.getFleetOverview(user.companyId);
    return ApiResponseHelper.success(data, "Berhasil mengambil data overview armada", request);
  }

  @Get("certificate-summary")
  @ApiOperation({ summary: "Ringkasan sertifikat (valid, expiring, critical, expired)" })
  async getCertificateSummary(@CurrentUser() user: RequestUser, @Req() request: Request) {
    const data = await this.dashboardService.getCertificateSummary(user.companyId);
    return ApiResponseHelper.success(data, "Berhasil mengambil ringkasan sertifikat", request);
  }

  @Get("alert-panel")
  @ApiOperation({ summary: "Panel alert (sertifikat kritis, segera expired, kapal drydock)" })
  async getAlertPanel(@CurrentUser() user: RequestUser, @Req() request: Request) {
    const data = await this.dashboardService.getAlertPanel(user.companyId);
    return ApiResponseHelper.success(data, "Berhasil mengambil data alert", request);
  }
}
