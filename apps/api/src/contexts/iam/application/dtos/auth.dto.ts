import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({ description: "Email pengguna", example: "captain@shipping.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Password", example: "SecurePass123!" })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/, {
    message:
      "Password minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial",
  })
  password: string;

  @ApiProperty({ description: "Nama depan", example: "John" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: "Nama belakang", example: "Doe" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: "Nomor telepon", example: "+6281234567890" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: "Perusahaan ID", example: "uuid-company" })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ description: "Role ID yang akan diberikan" })
  @IsOptional()
  @IsString()
  roleId?: string;
}

export class LoginDto {
  @ApiProperty({ description: "Email pengguna", example: "captain@shipping.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Password", example: "SecurePass123!" })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token" })
  @IsString()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: "Access token (15 menit)" })
  accessToken: string;

  @ApiProperty({ description: "Refresh token (7 hari)" })
  refreshToken: string;

  @ApiProperty({ description: "Tipe token", example: "Bearer" })
  tokenType: string;

  @ApiProperty({ description: "User info" })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[];
    permissions: string[];
  };
}

export class ForgotPasswordDto {
  @ApiProperty({ description: "Email pengguna", example: "captain@shipping.com" })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "Token reset password" })
  @IsString()
  token: string;

  @ApiProperty({ description: "Password baru", example: "SecurePassNew123!" })
  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/, {
    message:
      "Password minimal 12 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter spesial",
  })
  newPassword: string;
}
