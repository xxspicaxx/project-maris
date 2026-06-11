import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { CurrentUser, RequestUser } from "../../../../shared/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../../shared/guards/jwt-auth.guard";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import {
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RegisterUserDto,
  ResetPasswordDto,
} from "../../application/dtos/auth.dto";
import { AuthService } from "../../application/services/auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Registrasi pengguna baru" })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: "Pengguna berhasil diregistrasi" })
  @ApiResponse({ status: 400, description: "Data tidak valid" })
  @ApiResponse({ status: 409, description: "Email sudah terdaftar" })
  async register(@Body() dto: RegisterUserDto, @Req() request: Request) {
    const user = await this.authService.register(dto);
    return ApiResponseHelper.created(user, "Pengguna berhasil diregistrasi", request);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: "Login pengguna" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: "Login berhasil", type: LoginResponseDto })
  @ApiResponse({ status: 401, description: "Email atau password salah" })
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const result = await this.authService.login(dto.email, dto.password);
    return ApiResponseHelper.success(result, "Login berhasil", request);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: "Token berhasil diperbarui" })
  @ApiResponse({ status: 401, description: "Refresh token tidak valid" })
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    const result = await this.authService.refresh(dto.refreshToken);
    return ApiResponseHelper.success(result, "Token berhasil diperbarui", request);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout pengguna" })
  @ApiResponse({ status: 200, description: "Logout berhasil" })
  async logout(@CurrentUser() user: RequestUser, @Req() request: Request) {
    await this.authService.logout(user.userId);
    return ApiResponseHelper.success(null, "Logout berhasil", request);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Profil pengguna saat ini" })
  @ApiResponse({ status: 200, description: "Data profil pengguna" })
  async getProfile(@CurrentUser() user: RequestUser, @Req() request: Request) {
    const profile = await this.authService.getProfile(user.userId);
    return ApiResponseHelper.success(profile, "Berhasil mengambil profil", request);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Minta link reset password" })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: "Instruksi reset password berhasil diproses" })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    await this.authService.forgotPassword(dto.email);
    return ApiResponseHelper.success(
      null,
      "Jika email terdaftar, instruksi reset password telah dikirim ke log/console",
      request,
    );
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password menggunakan token" })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: "Password berhasil diperbarui" })
  @ApiResponse({ status: 401, description: "Token tidak valid atau kedaluwarsa" })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return ApiResponseHelper.success(null, "Password Anda berhasil diperbarui", request);
  }
}
