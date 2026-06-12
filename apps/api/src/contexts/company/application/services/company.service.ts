import { Injectable } from "@nestjs/common";
import { type PrismaService } from "../../../../shared/database/prisma.service";
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

  async getSettings(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    const defaultSettings = {
      timezone: "Asia/Jakarta",
      currency: "IDR",
      language: "id",
    };

    return {
      ...defaultSettings,
      ...((company.settings as Record<string, unknown>) || {}),
    };
  }

  async updateSettings(
    companyId: string,
    settingsData: { timezone?: string; currency?: string; language?: string },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    const currentSettings = (company.settings as Record<string, unknown>) || {};
    const updatedSettings = {
      ...currentSettings,
      ...settingsData,
    };

    return this.prisma.company.update({
      where: { id: companyId },
      data: {
        settings: updatedSettings,
      },
      select: {
        id: true,
        name: true,
        settings: true,
      },
    });
  }
}
