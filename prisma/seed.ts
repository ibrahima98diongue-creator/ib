// Seed minimal : crée uniquement l'entreprise et le compte administrateur
// nécessaires pour se connecter. Aucune donnée métier fictive (pas de
// client, site, installation ou équipement inventé).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const companyName = process.env.SEED_COMPANY_NAME ?? "Mon entreprise";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`L'utilisateur ${email} existe déjà, rien à faire.`);
    return;
  }

  const company = await prisma.company.create({ data: { name: companyName } });
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Administrateur",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Compte administrateur créé :");
  console.log(`  Email       : ${email}`);
  console.log(`  Mot de passe: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
