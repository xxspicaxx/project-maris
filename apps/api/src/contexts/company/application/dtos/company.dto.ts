import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CompanyType } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCompanyDto {
  @ApiProperty({ description: "Kode perusahaan", example: "PT-NJ" })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: "Nama perusahaan", example: "PT Nusantara Jaya" })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: CompanyType, description: "Tipe perusahaan" })
  @IsEnum(CompanyType)
  type: CompanyType;

  @ApiProperty({ description: "Kode negara (ISO 3166-1 alpha-2)", example: "ID" })
  @IsString()
  @MaxLength(2)
  country: string;

  @ApiPropertyOptional({ description: "Alamat perusahaan" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Email perusahaan" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Nomor telepon" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "NPWP / Tax ID" })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: "Nama perusahaan" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: "Alamat perusahaan" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Email perusahaan" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Nomor telepon" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "NPWP / Tax ID" })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ description: "Timezone", example: "Asia/Jakarta" })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: "Currency", example: "IDR" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: "Language", example: "id" })
  @IsOptional()
  @IsString()
  language?: string;
}
