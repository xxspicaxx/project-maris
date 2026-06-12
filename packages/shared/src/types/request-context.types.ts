export interface RequestUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  vesselIds?: string[];
  isSuperAdmin: boolean;
}
