// One-off CLI: npx tsx scripts/promoteToOwner.ts you@example.com
// Deliberately not exposed anywhere in the app - the OWNER role has no self-registration
// path, it's granted by running this against an account that already exists.
import { prisma } from "../src/lib/prisma.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/promoteToOwner.ts <email>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No account found for ${email}. Register normally first, then run this.`);
  process.exit(1);
}

if (user.role === "OWNER") {
  console.log(`${email} is already an owner.`);
  process.exit(0);
}

const updated = await prisma.user.update({ where: { id: user.id }, data: { role: "OWNER" } });
console.log(`${updated.email} is now an owner.`);
