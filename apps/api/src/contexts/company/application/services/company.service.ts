import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../../shared/database/prisma.service";
import {
  CompanyCodeExistsException,
  CompanyNotFoundException,
} from "../../domain/exceptions/company.exception";

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        country: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        country: true,
        address: true,
        email: true,
        phone: true,
        taxId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    return company;
  }

  async create(data: {
    code: string;
    name: string;
    type: "SHIP_OWNER" | "SHIP_MANAGER" | "CHARTERER" | "HOLDING";
    country: string;
    address?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  }) {
    // Check if code already exists
    const existing = await this.prisma.company.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new CompanyCodeExistsException(data.code);
    }

    return this.prisma.company.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        country: data.country,
        address: data.address,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId,
        // Audit fields — SYSTEM as actor since this is an admin operation
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      },
    });
  }

  async update(
    companyId: string,
    data: {
      name?: string;
      address?: string;
      email?: string;
      phone?: string;
      taxId?: string;
    },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data,
    });
  }

  async deactivate(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: false },
    });
  }

  async activate(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: { isActive: true },
    });
  }

  /**
   * Returns company settings.
   *
   * NOTE: The Company schema currently does not have a `settings` Json column.
   * This method returns hardcoded defaults until the column is added via a
   * schema migration and `createdBy`/`updatedBy` are sourced from the JWT.
   */
  async getSettings(companyId: string): Promise<Record<string, unknown>> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    return {
      timezone: "Asia/Jakarta",
      currency: "IDR",
      language: "id",
    };
  }

  /**
   * Updates company settings.
   *
   * NOTE: The Company schema currently does not have a `settings` Json column.
   * This is a no-op stub that returns the default settings until the column
   * is added via a schema migration.
   */
  async updateSettings(
    companyId: string,
    settingsData: { timezone?: string; currency?: string; language?: string },
  ): Promise<Record<string, unknown>> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    // TODO: persist settings once a `settings Json?` column is added to the
    // Company model and a migration is applied.
    const defaultSettings: Record<string, unknown> = {
      timezone: "Asia/Jakarta",
      currency: "IDR",
      language: "id",
    };

    return { ...defaultSettings, ...settingsData };
  }
}
