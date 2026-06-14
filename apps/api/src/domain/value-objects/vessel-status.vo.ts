export enum VesselStatusEnum {
  ACTIVE = "ACTIVE",
  DRYDOCK = "DRYDOCK",
  LAID_UP = "LAID_UP",
  SCRAPPED = "SCRAPPED",
  SOLD = "SOLD",
}

export class VesselStatus {
  private readonly value: VesselStatusEnum;

  constructor(value: string) {
    if (!Object.values(VesselStatusEnum).includes(value as VesselStatusEnum)) {
      throw new Error(`Invalid vessel status: ${value}`);
    }
    this.value = value as VesselStatusEnum;
  }

  getValue(): VesselStatusEnum {
    return this.value;
  }

  equals(other: VesselStatus): boolean {
    return this.value === other.getValue();
  }
}
