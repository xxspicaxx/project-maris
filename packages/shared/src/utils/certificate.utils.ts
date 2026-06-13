import { calculateDaysUntilDate } from "./date.utils";
import { EXPIRY_CRITICAL_DAYS, EXPIRY_WARNING_DAYS } from "../constants/certificate-thresholds";
import { CertificateStatus } from "../enums/certificate-status.enum";

export function calculateCertificateExpiryStatus(expiryDate: Date | string): CertificateStatus {
  const daysUntil = calculateDaysUntilDate(expiryDate);

  if (daysUntil < 0) {
    return CertificateStatus.EXPIRED;
  }
  if (daysUntil <= EXPIRY_CRITICAL_DAYS) {
    return CertificateStatus.CRITICAL;
  }
  if (daysUntil <= EXPIRY_WARNING_DAYS) {
    return CertificateStatus.EXPIRING_SOON;
  }
  return CertificateStatus.VALID;
}
