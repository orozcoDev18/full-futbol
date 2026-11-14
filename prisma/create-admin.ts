import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

/**
 * Crea (o actualiza) un usuario del panel.
 * Uso: npm run create-admin -- <usuario> <contraseña> [SUPER_ADMIN|ADMIN]
 */
async function main() {
  const [username, password, role = "SUPER_ADMIN"] = process.argv.slice(2);
  if (!username || !password) {
    throw new Error(
      "Uso: npm run create-admin -- <usuario> <contraseña> [SUPER_ADMIN|ADMIN]",
    );
  }
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new Error("El rol debe ser SUPER_ADMIN o ADMIN");
  }

  const org = await prisma.organization.upsert({
    where: { slug: process.env.ORG_SLUG ?? "demo" },
    update: {},
    create: {
      slug: process.env.ORG_SLUG ?? "demo",
      name: process.env.ORG_NAME ?? "Mi organización",
    },
  });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { username: username.toLowerCase() },
    update: { passwordHash, role },
    create: {
      organizationId: org.id,
      username: username.toLowerCase(),
      name: username,
      passwordHash,
      role,
    },
  });

  console.log(`Usuario listo: ${user.username} (${user.role}) en "${org.name}"`);
}

main()
  .catch((error) => {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
