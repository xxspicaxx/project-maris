import { DomainException } from "../../../../shared/exceptions/base.exception";

export class UserNotFoundException extends DomainException {
  readonly code = "IAM_USER_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(userId: string) {
    super(`Pengguna dengan ID ${userId} tidak ditemukan`, { userId });
  }
}

export class UserEmailExistsException extends DomainException {
  readonly code = "IAM_USER_EMAIL_EXISTS";
  readonly httpStatus = 409;

  constructor(email: string) {
    super(`Email ${email} sudah terdaftar`, { email });
  }
}

export class InvalidCredentialsException extends DomainException {
  readonly code = "AUTH_CREDENTIALS_INVALID";
  readonly httpStatus = 401;

  constructor() {
    super("Email atau password salah");
  }
}

export class AccountDisabledException extends DomainException {
  readonly code = "AUTH_ACCOUNT_DISABLED";
  readonly httpStatus = 403;

  constructor() {
    super("Akun Anda telah dinonaktifkan");
  }
}

export class RoleNotFoundException extends DomainException {
  readonly code = "IAM_ROLE_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(roleId: string) {
    super(`Role dengan ID ${roleId} tidak ditemukan`, { roleId });
  }
}

export class CannotDeleteSystemRoleException extends DomainException {
  readonly code = "IAM_CANNOT_DELETE_SYSTEM_ROLE";
  readonly httpStatus = 422;

  constructor() {
    super("Role sistem tidak dapat dihapus");
  }
}

export class CompanyNotFoundException extends DomainException {
  readonly code = "IAM_COMPANY_NOT_FOUND";
  readonly httpStatus = 404;

  constructor(companyId: string) {
    super(`Perusahaan dengan ID ${companyId} tidak ditemukan`, { companyId });
  }
}
