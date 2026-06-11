import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FuelType, VesselStatus, VesselType } from "@prisma/client";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateVesselDto {
  @ApiProperty({ description: "Nomor IMO kapal (7 digit)", example: "9123456" })
  @IsString()
  @Matches(/^[0-9]{7}$/, { message: "Nomor IMO harus terdiri dari 7 digit angka" })
  imoNumber: string;

  @ApiPropertyOptional({ description: "Nomor MMSI (9 digit)" })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{9}$/, { message: "Nomor MMSI harus terdiri dari 9 digit angka" })
  mmsiNumber?: string;

  @ApiProperty({ description: "Nama kapal", example: "MV Nusantara Jaya" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Nama-nama sebelumnya" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formerNames?: string[];

  @ApiPropertyOptional({ description: "Call sign", example: "YHAA" })
  @IsOptional()
  @IsString()
  callSign?: string;

  @ApiProperty({ description: "Kode flag state (ISO 3166-1 alpha-2)", example: "ID" })
  @IsString()
  flagState: string;

  @ApiPropertyOptional({ description: "Port of registry", example: "Jakarta" })
  @IsOptional()
  @IsString()
  portOfRegistry?: string;

  @ApiProperty({ enum: VesselType })
  @IsEnum(VesselType)
  vesselType: VesselType;

  @ApiPropertyOptional({ enum: VesselStatus })
  @IsOptional()
  @IsEnum(VesselStatus)
  status?: VesselStatus;

  @ApiProperty({ description: "Gross Tonnage (GT)", example: 12500.5 })
  @IsNumber()
  @Min(0)
  grossTonnage: number;

  @ApiPropertyOptional({ description: "Net Tonnage (NT)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  netTonnage?: number;

  @ApiPropertyOptional({ description: "Deadweight Tonnage (DWT)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deadweightTonnage?: number;

  @ApiPropertyOptional({ description: "Length Overall (LOA) dalam meter" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthOverall?: number;

  @ApiPropertyOptional({ description: "Breadth dalam meter" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breadth?: number;

  @ApiPropertyOptional({ description: "Depth dalam meter" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ description: "Tahun pembangunan", example: 2015 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  yearBuilt?: number;

  @ApiPropertyOptional({ description: "Nama shipyard" })
  @IsOptional()
  @IsString()
  shipyard?: string;

  @ApiPropertyOptional({ description: "Negara shipyard" })
  @IsOptional()
  @IsString()
  shipyardCountry?: string;

  @ApiPropertyOptional({ description: "Nomor lambung / class number" })
  @IsOptional()
  @IsString()
  classNumber?: string;

  @ApiPropertyOptional({ description: "Class society", example: "BKI" })
  @IsOptional()
  @IsString()
  classSociety?: string;

  @ApiPropertyOptional({ description: "Tipe mesin utama" })
  @IsOptional()
  @IsString()
  mainEngineType?: string;

  @ApiPropertyOptional({ description: "Daya mesin utama (kW)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mainEnginePower?: number;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;
}

export class UpdateVesselDto {
  @ApiPropertyOptional({ description: "Nama kapal" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Call sign" })
  @IsOptional()
  @IsString()
  callSign?: string;

  @ApiPropertyOptional({ description: "Flag state" })
  @IsOptional()
  @IsString()
  flagState?: string;

  @ApiPropertyOptional({ description: "Port of registry" })
  @IsOptional()
  @IsString()
  portOfRegistry?: string;

  @ApiPropertyOptional({ enum: VesselStatus })
  @IsOptional()
  @IsEnum(VesselStatus)
  status?: VesselStatus;

  @ApiPropertyOptional({ description: "Class society" })
  @IsOptional()
  @IsString()
  classSociety?: string;
}

export class ListVesselsQueryDto {
  @ApiPropertyOptional({ description: "Halaman", default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Jumlah per halaman", default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: VesselStatus })
  @IsOptional()
  @IsEnum(VesselStatus)
  status?: VesselStatus;

  @ApiPropertyOptional({ description: "Flag state filter" })
  @IsOptional()
  @IsString()
  flagState?: string;

  @ApiPropertyOptional({ description: "Pencarian (IMO, nama, call sign)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Sort by field", default: "createdAt" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: "Sort order", default: "desc" })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}

export class CreateCertificateDto {
  @ApiProperty({
    enum: [
      "SMC",
      "DOC",
      "ISSC",
      "LOAD_LINE",
      "IOPP",
      "ITC",
      "CSR",
      "MARPOL_ANNEX_VI",
      "CLASS_CERTIFICATE",
      "RADIO_LICENSE",
      "MINIMUM_SAFE_MANNING",
    ],
  })
  @IsString()
  certificateType: string;

  @ApiPropertyOptional({ description: "Nomor sertifikat" })
  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @ApiProperty({ description: "Penerbit sertifikat", example: "BKI" })
  @IsString()
  issuingAuthority: string;

  @ApiProperty({ description: "Tanggal terbit", example: "2024-01-01T00:00:00Z" })
  @IsString()
  issueDate: string;

  @ApiProperty({ description: "Tanggal kadaluarsa", example: "2025-01-01T00:00:00Z" })
  @IsString()
  expiryDate: string;

  @ApiPropertyOptional({ description: "URL dokumen sertifikat" })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: "Catatan" })
  @IsOptional()
  @IsString()
  notes?: string;
}
