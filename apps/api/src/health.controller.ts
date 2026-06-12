import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API health status" })
  check() {
    return {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
