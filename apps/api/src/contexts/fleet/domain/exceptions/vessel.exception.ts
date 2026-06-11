import { DomainException } from "../../../../shared/exceptions/base.exception";

export class VesselNotFoundException extends DomainException {
  readonly code = "FLEET_VESSEL_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(vesselId: string) {
    super(`Kapal dengan ID ${vesselId} tidak ditemukan`, { vesselId });
  }
}

export class DuplicateImoNumberException extends DomainException {
  readonly code = "FLEET_VESSEL_DUPLICATE_IMO";
  readonly httpStatus = 409;

  constructor(imoNumber: string) {
    super(`Nomor IMO ${imoNumber} sudah terdaftar di sistem`, { imoNumber });
  }
}

export class VesselAlreadyActiveException extends DomainException {
  readonly code = "FLEET_VESSEL_ALREADY_ACTIVE";
  readonly httpStatus = 409;

  constructor(vesselId: string) {
    super(`Kapal sudah dalam status aktif`, { vesselId });
  }
}

export class CertificateNotFoundException extends DomainException {
  readonly code = "FLEET_CERT_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(certificateId: string) {
    super(`Sertifikat kapal dengan ID ${certificateId} tidak ditemukan`, { certificateId });
  }
}

export class CertificateAlreadyValidException extends DomainException {
  readonly code = "FLEET_CERT_ALREADY_VALID";
  readonly httpStatus = 409;

  constructor(vesselId: string, certificateType: string) {
    super(`Sertifikat dengan tipe ${certificateType} sudah ada dan masih valid`, {
      vesselId,
      certificateType,
    });
  }
}
