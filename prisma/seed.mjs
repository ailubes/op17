import { PrismaClient, RoleName } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

const SCRYPT_KEYLEN = 64;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

const hashPassword = async (password) => {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString("hex");
  const derived = await scryptAsync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
};

const ensureRoles = async () => {
  const roles = [RoleName.ADMIN, RoleName.MANAGER, RoleName.FULFILLMENT, RoleName.SUPPORT];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
};

const ensureAdminUser = async () => {
  const emailRaw = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";
  const name = process.env.ADMIN_NAME || "Admin";
  const email = emailRaw.trim().toLowerCase();

  if (!email || !password) {
    return null;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, name },
    create: { email, passwordHash, name, isActive: true },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (!adminRole) {
    throw new Error("Admin role missing");
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  return user;
};

const main = async () => {
  await ensureRoles();
  const admin = await ensureAdminUser();

  if (!admin) {
    console.log("Seeded roles. ADMIN_EMAIL/ADMIN_PASSWORD not set, admin user skipped.");
  } else {
    console.log(`Seeded roles and admin user: ${admin.email}`);
  }
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

