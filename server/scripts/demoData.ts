import { prisma } from "../src/lib/prisma.js";

const SYSTEM_USER_EMAIL = "system@candor.app";

const DEMO_DONOR_NAMES = [
  "Alex M.",
  "Jordan K.",
  "Sam R.",
  "Taylor B.",
  "Casey W.",
  "Morgan P.",
  "Riley S.",
  "Jamie L.",
];

// Logs expenses against seeded funds; never authenticates, exists only as a foreign key target.
export async function ensureSystemUser() {
  return prisma.user.upsert({
    where: { email: SYSTEM_USER_EMAIL },
    update: {},
    create: { email: SYSTEM_USER_EMAIL, name: "Candor System", role: "ADMIN" },
  });
}

// A fixed pool of fake donors that simulated donations attribute to, so demo activity
// exercises the real donorUserId foreign key instead of pointing at a single placeholder.
export async function ensureDemoDonors() {
  const donors = await Promise.all(
    DEMO_DONOR_NAMES.map((name, i) =>
      prisma.user.upsert({
        where: { email: `demo-donor-${i + 1}@candor.app` },
        update: { isDemoDonor: true },
        create: { email: `demo-donor-${i + 1}@candor.app`, name, role: "DONOR", isDemoDonor: true },
      }),
    ),
  );
  return donors;
}
