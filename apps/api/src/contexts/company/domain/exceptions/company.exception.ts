import { DomainException } from "../../../../shared/exceptions/base.exception";

export class CompanyNotFoundException extends DomainException {
  readonly code = "IAM_COMPANY_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(companyId: string) {
    super(`Perusahaan dengan ID ${companyId} tidak ditemukan`, { companyId });
  }
}

export class CompanyCodeExistsException extends DomainException {
  readonly code = "COMPANY_CODE_EXISTS";
  readonly httpStatus = 409;

  constructor(code: string) {
    super(`Kode perusahaan ${code} sudah terdaftar`, { code });
  }
}
