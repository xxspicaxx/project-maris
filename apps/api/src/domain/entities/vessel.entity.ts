import { VesselStatus } from "../value-objects/vessel-status.vo";

export class VesselEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public imoNumber: string,
    public name: string,
    public flagState: string,
    public vesselType: string,
    public status: VesselStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public changeStatus(newStatus: string): void {
    this.status = new VesselStatus(newStatus);
    this.updatedAt = new Date();
  }
}
