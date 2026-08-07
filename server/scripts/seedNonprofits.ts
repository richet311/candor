// Seeds real, verifiable nonprofits (name, EIN, city/state pulled from the IRS registry via
// ProPublica's Nonprofit Explorer API: https://projects.propublica.org/nonprofits/api) so the
// browse page has real organizations instead of placeholder test data. Fund goals, expense line
// items, and donation activity remain illustrative, this script does not move real money and
// these orgs never signed up, hence organization.verified rather than a real admin account.
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma.js";
import { env } from "../src/config/env.js";
import { createLogger } from "../src/lib/logger.js";
import { stripe } from "../src/services/stripeService.js";
import { ensureSystemUser, ensureDemoDonors } from "./demoData.js";

const log = createLogger("seed-nonprofits");

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Expenses are seeded immediately, but "raised" only comes from real or simulated donations,
// which trickle in slowly. Without this, a freshly seeded fund shows spent > raised, an
// impossible state for an app whose whole pitch is an honest, accurate ledger. Tops a fund's
// raised total up to comfortably clear its seeded expenses using the same real webhook path
// scripts/simulateDonations.ts uses, attributed to the same clearly-marked demo donor pool.
async function ensureFundClearsExpenses(fund: { id: string; name: string }, minimumCents: number, donorIds: string[]) {
  const { _sum } = await prisma.donation.aggregate({
    where: { fundId: fund.id, status: "SUCCEEDED" },
    _sum: { amountCents: true },
  });
  let shortfallCents = minimumCents - (_sum.amountCents ?? 0);
  if (shortfallCents <= 0) return;

  while (shortfallCents > 0) {
    const amountCents = Math.min(shortfallCents, 100_00);
    const donorId = pickRandom(donorIds);
    const sessionId = `cs_seed_${randomUUID()}`;

    await prisma.donation.create({
      data: { fundId: fund.id, donorUserId: donorId, amountCents, status: "PENDING", stripeCheckoutSessionId: sessionId },
    });

    const payload = JSON.stringify({
      id: `evt_seed_${randomUUID()}`,
      type: "checkout.session.completed",
      data: { object: { id: sessionId, payment_intent: `pi_seed_${randomUUID()}` } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });

    const res = await fetch(`${env.API_ORIGIN}/api/webhooks/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "stripe-signature": signature },
      body: payload,
    });

    if (!res.ok) {
      log.warn({ status: res.status, fund: fund.name }, "seed top-up donation webhook was rejected, is the API server running?");
      return;
    }

    shortfallCents -= amountCents;
  }

  log.info({ fund: fund.name, minimumCents }, "topped up seed donations so raised clears spent");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SeedExpense {
  category: string;
  description: string;
  amountCents: number;
}

interface SeedOrg {
  ein: string;
  name: string;
  city: string;
  state: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  bannerUrl?: string;
  fund: { name: string; description: string; category: string; goalCents: number };
  expenses: SeedExpense[];
}

// EINs verified against projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json
const NONPROFITS: SeedOrg[] = [
  {
    ein: "742181456",
    name: "Houston Food Bank",
    city: "Houston",
    state: "TX",
    description:
      "One of the largest food banks in the country, distributing donated and purchased food to hundreds of partner pantries across 18 Southeast Texas counties.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Houston_Food_Bank_%28logo%29.jpg/250px-Houston_Food_Bank_%28logo%29.jpg",
    websiteUrl: "https://www.houstonfoodbank.org",
    fund: {
      name: "Emergency Food Distribution",
      description: "Covers sourcing, cold storage, and transport of shelf-stable and fresh food to partner pantries.",
      category: "Hunger Relief",
      goalCents: 50_000_00,
    },
    expenses: [
      { category: "Food Sourcing", description: "Bulk produce purchase for partner pantries", amountCents: 85_00 },
      { category: "Logistics", description: "Refrigerated truck rental for weekly routes", amountCents: 45_00 },
      { category: "Warehouse", description: "Cold storage facility maintenance", amountCents: 25_00 },
    ],
  },
  {
    ein: "237147797",
    name: "Best Friends Animal Society",
    city: "Kanab",
    state: "UT",
    description:
      "Runs the country's largest no-kill animal sanctuary and works with shelters nationwide toward ending the killing of dogs and cats in America's shelters.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Bfas-logo.png/250px-Bfas-logo.png",
    websiteUrl: "https://bestfriends.org",
    fund: {
      name: "Shelter Support Fund",
      description: "Funds veterinary care, food, and transport for animals moving through the shelter and adoption network.",
      category: "Animal Welfare",
      goalCents: 30_000_00,
    },
    expenses: [
      { category: "Veterinary Care", description: "Spay/neuter clinic supplies", amountCents: 60_00 },
      { category: "Transport", description: "Interstate transport van fuel and maintenance", amountCents: 25_00 },
      { category: "Shelter Operations", description: "Bedding and enrichment supplies for the sanctuary", amountCents: 30_00 },
    ],
  },
  {
    ein: "134129457",
    name: "DonorsChoose.org",
    city: "New York",
    state: "NY",
    description: "Lets public school teachers request classroom supplies and materials directly, funded by individual donors.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/DonorsChoose-Logo.png/250px-DonorsChoose-Logo.png",
    websiteUrl: "https://www.donorschoose.org",
    fund: {
      name: "Classroom Supplies Fund",
      description: "Funds teacher-requested classroom materials, books, and supplies for under-resourced public schools.",
      category: "Education",
      goalCents: 20_000_00,
    },
    expenses: [
      { category: "Supplies", description: "Classroom materials for 40 funded teacher requests", amountCents: 70_00 },
      { category: "Books", description: "Classroom library books, grades 3-5", amountCents: 35_00 },
      { category: "Technology", description: "Tablets for a reading intervention project", amountCents: 45_00 },
    ],
  },
  {
    ein: "231365190",
    name: "Big Brothers Big Sisters of America",
    city: "Tampa",
    state: "FL",
    description: "The nation's largest youth mentoring network, pairing kids with adult mentors through one-to-one relationships.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Big_Brothers_Big_Sisters_of_America_logo.png/250px-Big_Brothers_Big_Sisters_of_America_logo.png",
    websiteUrl: "https://www.bbbs.org",
    fund: {
      name: "Mentor Match Program",
      description: "Covers background checks, mentor training, and program staff that make new youth-mentor matches possible.",
      category: "Youth Mentorship",
      goalCents: 25_000_00,
    },
    expenses: [
      { category: "Screening", description: "Background check processing for new mentors", amountCents: 40_00 },
      { category: "Training", description: "Mentor orientation and training materials", amountCents: 30_00 },
      { category: "Program Events", description: "Quarterly mentor-mentee group outing", amountCents: 25_00 },
    ],
  },
  {
    ein: "954681287",
    name: "The Trevor Project",
    city: "West Hollywood",
    state: "CA",
    description: "Operates 24/7 crisis intervention and suicide prevention services for LGBTQ young people.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/The_Trevor_Project_logo.svg/250px-The_Trevor_Project_logo.svg.png",
    websiteUrl: "https://www.thetrevorproject.org",
    fund: {
      name: "Crisis Line Operations",
      description: "Keeps the 24/7 phone, text, and chat crisis lines staffed with trained crisis counselors.",
      category: "Mental Health",
      goalCents: 40_000_00,
    },
    expenses: [
      { category: "Staffing", description: "Overnight crisis counselor shift coverage", amountCents: 90_00 },
      { category: "Training", description: "Crisis counselor certification program", amountCents: 45_00 },
      { category: "Technology", description: "Crisis chat platform infrastructure", amountCents: 35_00 },
    ],
  },
  {
    ein: "273521132",
    name: "World Central Kitchen",
    city: "Washington",
    state: "DC",
    description: "Deploys chefs and volunteers to provide fresh meals in the wake of natural disasters and humanitarian crises.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/8/86/World_Central_Kitchen_logo.svg/250px-World_Central_Kitchen_logo.svg.png",
    websiteUrl: "https://wck.org",
    bannerUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/World_Central_Kitchen_after_Hurricane_Ian_01.jpg/1280px-World_Central_Kitchen_after_Hurricane_Ian_01.jpg",
    fund: {
      name: "Disaster Response Kitchen",
      description: "Funds ingredients, kitchen equipment, and logistics to serve fresh meals in active disaster zones.",
      category: "Disaster Relief",
      goalCents: 60_000_00,
    },
    expenses: [
      { category: "Ingredients", description: "Bulk meal ingredients for field kitchen", amountCents: 110_00 },
      { category: "Equipment", description: "Portable cooking equipment repair", amountCents: 40_00 },
      { category: "Logistics", description: "Transport of supplies into a disaster zone", amountCents: 50_00 },
    ],
  },
  {
    ein: "363673599",
    name: "Feeding America",
    city: "Chicago",
    state: "IL",
    description: "A nationwide network of food banks that sources and distributes food to local hunger-relief agencies.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/a/aa/Feeding_America_logo.svg/250px-Feeding_America_logo.svg.png",
    websiteUrl: "https://www.feedingamerica.org",
    fund: {
      name: "Nationwide Food Rescue",
      description: "Funds food rescue logistics that move surplus food from suppliers to local food banks before it goes to waste.",
      category: "Hunger Relief",
      goalCents: 75_000_00,
    },
    expenses: [
      { category: "Logistics", description: "Regional food rescue trucking network", amountCents: 95_00 },
      { category: "Technology", description: "Food inventory matching platform hosting", amountCents: 35_00 },
      { category: "Food Sourcing", description: "Surplus produce pickup from regional suppliers", amountCents: 55_00 },
    ],
  },
  {
    ein: "133393329",
    name: "American Foundation for Suicide Prevention",
    city: "New York",
    state: "NY",
    description: "Funds suicide prevention research and supports survivors of suicide loss through education and advocacy programs.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/American_Foundation_for_Suicide_Prevention_logo.svg/250px-American_Foundation_for_Suicide_Prevention_logo.svg.png",
    websiteUrl: "https://afsp.org",
    fund: {
      name: "Prevention Research Fund",
      description: "Funds peer-reviewed research into suicide risk factors and prevention strategies.",
      category: "Mental Health",
      goalCents: 35_000_00,
    },
    expenses: [
      { category: "Research", description: "Research grant, adolescent risk factors study", amountCents: 80_00 },
      { category: "Education", description: "Community gatekeeper training program", amountCents: 30_00 },
      { category: "Support Programs", description: "Survivor-of-loss support group facilitation", amountCents: 25_00 },
    ],
  },
  {
    ein: "530196605",
    name: "American Red Cross",
    city: "Washington",
    state: "DC",
    description: "Provides emergency assistance, disaster relief, and disaster preparedness education across the country.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/American_Red_Cross_logo.svg/250px-American_Red_Cross_logo.svg.png",
    websiteUrl: "https://www.redcross.org",
    fund: {
      name: "Disaster Relief Response",
      description: "Funds emergency shelter, food, and relief supplies for families displaced by disasters.",
      category: "Disaster Relief",
      goalCents: 65_000_00,
    },
    expenses: [
      { category: "Emergency Shelter", description: "Temporary shelter setup for displaced families", amountCents: 100_00 },
      { category: "Relief Supplies", description: "Emergency kits with food, water, and first aid", amountCents: 55_00 },
      { category: "Volunteer Training", description: "Disaster response certification course", amountCents: 30_00 },
    ],
  },
  {
    ein: "911914868",
    name: "Habitat for Humanity International",
    city: "Americus",
    state: "GA",
    description: "Builds and repairs affordable homes in partnership with families in need across the country and around the world.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Logo_Habitat_for_Humanity.svg/250px-Logo_Habitat_for_Humanity.svg.png",
    websiteUrl: "https://www.habitat.org",
    fund: {
      name: "Home Building Fund",
      description: "Funds construction materials and skilled labor coordination for new affordable homes.",
      category: "Housing",
      goalCents: 45_000_00,
    },
    expenses: [
      { category: "Materials", description: "Framing lumber and roofing for a build site", amountCents: 90_00 },
      { category: "Volunteer Coordination", description: "Build-day tools and site supervision", amountCents: 35_00 },
      { category: "Site Preparation", description: "Grading and permitting for a new build lot", amountCents: 40_00 },
    ],
  },
  {
    ein: "530242652",
    name: "The Nature Conservancy",
    city: "Arlington",
    state: "VA",
    description: "Works to protect land and water around the world through conservation science, land acquisition, and habitat restoration.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Nature_Conservancy.svg/250px-Nature_Conservancy.svg.png",
    websiteUrl: "https://www.nature.org",
    fund: {
      name: "Land & Water Conservation",
      description: "Funds land acquisition and habitat restoration in threatened watersheds and forests.",
      category: "Environment",
      goalCents: 55_000_00,
    },
    expenses: [
      { category: "Habitat Restoration", description: "Native plant restoration for a river watershed", amountCents: 75_00 },
      { category: "Conservation Science", description: "Field survey equipment for a protected tract", amountCents: 40_00 },
      { category: "Land Acquisition", description: "Legal and survey costs for a new preserve parcel", amountCents: 60_00 },
    ],
  },
  {
    ein: "135562976",
    name: "Boys & Girls Clubs of America",
    city: "Atlanta",
    state: "GA",
    description: "Runs after-school and summer clubs that give young people a safe place to learn, play, and build skills.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/9/93/Boys_%26_Girls_Clubs_of_America_Logo.svg/250px-Boys_%26_Girls_Clubs_of_America_Logo.svg.png",
    websiteUrl: "https://www.bgca.org",
    fund: {
      name: "After-School Programs Fund",
      description: "Funds staffing, activity supplies, and snacks for after-school club programming.",
      category: "Youth Development",
      goalCents: 30_000_00,
    },
    expenses: [
      { category: "Program Staffing", description: "After-school program leader hours", amountCents: 65_00 },
      { category: "Activity Supplies", description: "STEM and arts program materials", amountCents: 25_00 },
      { category: "Transportation", description: "Bus route bringing kids to the club after school", amountCents: 30_00 },
    ],
  },
];

async function main() {
  const systemUser = await ensureSystemUser();
  const donors = await ensureDemoDonors();
  const donorIds = donors.map((d) => d.id);

  for (const org of NONPROFITS) {
    const orgSlug = slugify(org.name);
    const organization = await prisma.organization.upsert({
      where: { ein: org.ein },
      update: {
        name: org.name,
        description: org.description,
        sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
        websiteUrl: org.websiteUrl,
        logoUrl: org.logoUrl,
        bannerUrl: org.bannerUrl,
        verified: true,
      },
      create: {
        name: org.name,
        slug: orgSlug,
        description: org.description,
        ein: org.ein,
        sourceUrl: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
        websiteUrl: org.websiteUrl,
        logoUrl: org.logoUrl,
        bannerUrl: org.bannerUrl,
        verified: true,
      },
    });

    const fundSlug = slugify(`${org.name}-${org.fund.name}`);
    const fund = await prisma.fund.upsert({
      where: { slug: fundSlug },
      update: { description: org.fund.description, category: org.fund.category, goalCents: org.fund.goalCents },
      create: {
        organizationId: organization.id,
        name: org.fund.name,
        slug: fundSlug,
        description: org.fund.description,
        category: org.fund.category,
        goalCents: org.fund.goalCents,
      },
    });

    const existingExpenses = await prisma.expense.count({ where: { fundId: fund.id } });
    if (existingExpenses === 0) {
      await prisma.expense.createMany({
        data: org.expenses.map((e) => ({ ...e, fundId: fund.id, createdByUserId: systemUser.id })),
      });
    }

    const totalExpenseCents = org.expenses.reduce((sum, e) => sum + e.amountCents, 0);
    await ensureFundClearsExpenses(fund, totalExpenseCents + 50_00, donorIds);

    log.info({ org: org.name, city: org.city, state: org.state, ein: org.ein }, "seeded verified nonprofit");
  }

  log.info({ count: NONPROFITS.length }, "nonprofit seed complete");
}

main()
  .catch((err) => {
    log.error({ err }, "nonprofit seed failed");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
