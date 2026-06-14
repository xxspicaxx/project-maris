import { Email } from "../value-objects/email.vo";

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public email: Email,
    public firstName: string,
    public lastName: string,
    public isActive: boolean,
    public lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public disable(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  public enable(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }
}
