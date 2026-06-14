import { PrismaClient, Permission, PermissionScope } from "@prisma/client";

const RESOURCES = [
  "vessel",
  "crew",
  "voyage",
  "document",
  "technical",
  "hsseq",
  "financial",
  "user",
  "company",
  "system",
];

const ACTIONS = ["create", "read", "update", "delete"];
const SCOPES: PermissionScope[] = ["OWN", "COMPANY", "ALL"];

export async function seedPermissions(prisma: PrismaClient): Promise<Permission[]> {
  console.log("Seeding permissions..."); // eslint-disable-line no-console
  const permissions: Permission[] = [];

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      for (const scope of SCOPES) {
        const description = `Can ${action} ${resource} data with ${scope} scope`;

        const permission = await prisma.permission.upsert({
          where: {
            resource_action_scope: {
              resource,
              action,
              scope,
            },
          },
          update: {
            description,
            updatedBy: "SEED",
          },
          create: {
            resource,
            action,
            scope,
            description,
            createdBy: "SEED",
            updatedBy: "SEED",
          },
        });
        permissions.push(permission);
      }
    }
  }

  console.log(`  ✅ Seeded ${permissions.length} permissions.`); // eslint-disable-line no-console
  return permissions;
}
