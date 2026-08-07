// Seeds real, verifiable nonprofits (name, EIN, city/state pulled from the IRS registry via
// ProPublica's Nonprofit Explorer API: https://projects.propublica.org/nonprofits/api) so the
// browse page has real organizations instead of placeholder test data. Fund goals and expense
// line items are illustrative. These orgs never signed up, hence organization.verified rather
// than a real admin account. Deliberately does NOT create any donations: nobody has actually
// donated to these funds through Candor, so raised starts honest at $0. Run
// `npm run simulate:donations` separately if you want fake donation activity for a demo.
import { prisma } from "../src/lib/prisma.js";
import { createLogger } from "../src/lib/logger.js";
import { ensureSystemUser } from "./demoData.js";

const log = createLogger("seed-nonprofits");

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
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Secretary_Perdue_and_Senator_Cornyn_at_Houston_Food_Bank_(20200716-OSEC-LSC-0439).jpg?width=1280",
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
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/US_Navy_070210-N-6081J-282_Senior_Chief_Gas_Turbine_System_Technician_Mike_Wroten,_assigned_to_guided_missile_destroyer_USS_Bainbridge_(DDG_96),_helps_his_son_bowl_at_the_Big_Brothers_Big_Sisters_of_South_Hampton_Roads.jpg?width=1280",
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
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/DSC_0127_The_Trevor_Project_dot_Org_(5826677026).jpg?width=1280",
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
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Alameda_Food_Bank_Thanksgiving_volunteers_111119-G-FY356-019.jpg?width=1280",
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
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Out_of_the_Darkness_Walk_(9939783424).jpg?width=1280",
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
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Ortley_Beach,_N.J.,_Nov._28,_2012_--_Sharon_Meyers,_a_Red_Cross_volunteer,_offers_a_hot_meal_to_a_resident_in_Ortley_Beach,_NJ._The_Red_Cross_is_providing_disaster_relief,_from_hot_-_DPLA_-_25584b763cd0998c4b0794d601608ef9.jpg?width=1280",
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
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Habitat_For_Humanity_Build_2011_037.jpg?width=1280",
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
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/2010_May_-_The_Nature_Conservancy's_Megan_Gibney_and_Service_botanist_Carolyn_Wells_looking_for_rare_plants_(4679838292).jpg?width=1280",
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
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Local_Youth_Wins_National_Recognition_in_Boys_%26_Girls_Clubs_Art_Contest_(9784569).jpg?width=1280",
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
  {
    ein: "131788491",
    name: "American Cancer Society",
    city: "Atlanta",
    state: "GA",
    description: "A nationwide voluntary health organization funding cancer research, patient support programs, and prevention education.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/ACS-logo.svg/250px-ACS-logo.svg.png",
    websiteUrl: "https://www.cancer.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/American_Cancer_Society_Relay_For_Life-_USAG_Bavaria_2024_(8598027).jpg?width=1280",
    fund: {
      name: "Cancer Research Grants",
      description: "Funds peer-reviewed research grants investigating new cancer treatments and prevention strategies.",
      category: "Healthcare",
      goalCents: 70_000_00,
    },
    expenses: [
      { category: "Research", description: "Grant support for an early-career researcher", amountCents: 95_00 },
      { category: "Patient Programs", description: "Rides to treatment for patients without transportation", amountCents: 40_00 },
      { category: "Education", description: "Cancer prevention materials for community clinics", amountCents: 30_00 },
    ],
  },
  {
    ein: "620646012",
    name: "St. Jude Children's Research Hospital",
    city: "Memphis",
    state: "TN",
    description: "Treats and researches childhood cancer and other life-threatening diseases, and never sends a family a bill for treatment, travel, housing, or food.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/St._Jude_Children%27s_Research_Hospital_logo.svg/250px-St._Jude_Children%27s_Research_Hospital_logo.svg.png",
    websiteUrl: "https://www.stjude.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Tyana-maldonado-miss-teen-world-2020-st-jude-walk-run-02.jpg?width=1280",
    fund: {
      name: "Never a Bill Fund",
      description: "Covers treatment, travel, housing, and food for patient families so no one ever receives a bill from St. Jude.",
      category: "Healthcare",
      goalCents: 80_000_00,
    },
    expenses: [
      { category: "Patient Care", description: "Chemotherapy treatment support for a patient", amountCents: 120_00 },
      { category: "Family Housing", description: "A family's stay at Target House during treatment", amountCents: 55_00 },
      { category: "Travel", description: "Flight for an out-of-state family", amountCents: 35_00 },
    ],
  },
  {
    ein: "133433452",
    name: "Doctors Without Borders USA",
    city: "New York",
    state: "NY",
    description: "Sends doctors, nurses, and medical staff to deliver emergency care in conflict zones, epidemics, and natural disasters worldwide.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/M%C3%A9decins_Sans_Fronti%C3%A8res_%28logo%29.svg/250px-M%C3%A9decins_Sans_Fronti%C3%A8res_%28logo%29.svg.png",
    websiteUrl: "https://www.doctorswithoutborders.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Campaña_de_Medicos_Sin_Fronteras_(MSF)_en_San_Juan_de_Lurigancho.jpg?width=1280",
    fund: {
      name: "Emergency Medical Response",
      description: "Funds doctors, nurses, and medical supplies deployed to conflict zones and disease outbreaks.",
      category: "Disaster Relief",
      goalCents: 65_000_00,
    },
    expenses: [
      { category: "Medical Supplies", description: "Trauma care kits for a field hospital", amountCents: 100_00 },
      { category: "Staffing", description: "Field nurse deployment for an active crisis", amountCents: 70_00 },
      { category: "Logistics", description: "Transport of medical cargo into a conflict zone", amountCents: 40_00 },
    ],
  },
  {
    ein: "131623829",
    name: "ASPCA",
    city: "New York",
    state: "NY",
    description: "Works to prevent animal cruelty across the United States through rescue, adoption, and animal welfare advocacy.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/ASPCA_logo_2025.svg/250px-ASPCA_logo_2025.svg.png",
    websiteUrl: "https://www.aspca.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Salud_Carbajal_attends_ASPCA_Paws_for_Love_-_2020-02-18.jpg?width=1280",
    fund: {
      name: "Animal Rescue & Recovery",
      description: "Funds emergency rescue, veterinary treatment, and rehabilitation for animals removed from cruelty situations.",
      category: "Animal Welfare",
      goalCents: 35_000_00,
    },
    expenses: [
      { category: "Veterinary Care", description: "Emergency surgery for a rescued dog", amountCents: 65_00 },
      { category: "Rescue Operations", description: "Transport for a multi-animal cruelty scene rescue", amountCents: 45_00 },
      { category: "Sheltering", description: "Temporary shelter and food for rescued animals", amountCents: 20_00 },
    ],
  },
  {
    ein: "202370934",
    name: "Wounded Warrior Project",
    city: "Jacksonville",
    state: "FL",
    description: "Provides free mental health care, career counseling, and long-term rehabilitative support for veterans injured after September 11, 2001.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Wounded_Warrior_Project_logo.svg/250px-Wounded_Warrior_Project_logo.svg.png",
    websiteUrl: "https://www.woundedwarriorproject.org",
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Wolf_Creek_NFH_2022_Wounded_Warrior_Fishing_Derby_participants_7_September_2022.png?width=1280",
    fund: {
      name: "Warrior Mental Health Program",
      description: "Funds free mental health counseling and PTSD treatment programs for injured veterans.",
      category: "Mental Health",
      goalCents: 45_000_00,
    },
    expenses: [
      { category: "Counseling", description: "Individual PTSD therapy session for a veteran", amountCents: 80_00 },
      { category: "Programs", description: "Veteran peer support retreat", amountCents: 35_00 },
      { category: "Career Support", description: "Career counseling workshop materials", amountCents: 25_00 },
    ],
  },
  {
    ein: "223936753",
    name: "charity: water",
    city: "Franklin",
    state: "TN",
    description: "Funds wells and water systems that bring clean drinking water to rural communities in developing countries.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/Charity_water_logo.jpg/250px-Charity_water_logo.jpg",
    websiteUrl: "https://www.charitywater.org",
    fund: {
      name: "Clean Water Wells",
      description: "Funds well drilling and water systems bringing clean drinking water to rural communities.",
      category: "Environment",
      goalCents: 50_000_00,
    },
    expenses: [
      { category: "Well Drilling", description: "Borehole drilling equipment for a village well", amountCents: 105_00 },
      { category: "Community Training", description: "Water committee training for well upkeep", amountCents: 30_00 },
      { category: "Monitoring", description: "Remote sensor for well water quality", amountCents: 25_00 },
    ],
  },
  {
    ein: "136213516",
    name: "ACLU Foundation",
    city: "New York",
    state: "NY",
    description: "Litigates and educates the public on civil liberties issues including free speech, voting rights, and equal protection.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/New_ACLU_Logo_2017.svg/250px-New_ACLU_Logo_2017.svg.png",
    websiteUrl: "https://www.aclu.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/ACLU_at_the_Twin_Cities_Pride_Parade_2011_(5873836717).jpg?width=1280",
    fund: {
      name: "Civil Liberties Defense Fund",
      description: "Funds litigation and legal defense for free speech, voting rights, and equal protection cases.",
      category: "Human Rights",
      goalCents: 55_000_00,
    },
    expenses: [
      { category: "Litigation", description: "Court filing and legal research for an active case", amountCents: 90_00 },
      { category: "Advocacy", description: "Voter rights education materials", amountCents: 30_00 },
      { category: "Community Outreach", description: "Know-your-rights training session", amountCents: 25_00 },
    ],
  },
  {
    ein: "132875808",
    name: "Human Rights Watch",
    city: "New York",
    state: "NY",
    description: "Investigates and reports on human rights abuses in more than 100 countries to hold perpetrators accountable.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Hrw_logo.svg/250px-Hrw_logo.svg.png",
    websiteUrl: "https://www.hrw.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Msc_2008-Saturday,_14.00_-_16.00_Uhr-Moerk026_Roth.jpg?width=1280",
    fund: {
      name: "Global Investigations Fund",
      description: "Funds field investigations and reporting on human rights abuses worldwide.",
      category: "Human Rights",
      goalCents: 45_000_00,
    },
    expenses: [
      { category: "Field Research", description: "Investigator travel and witness interviews", amountCents: 75_00 },
      { category: "Reporting", description: "Publication of an investigative findings report", amountCents: 30_00 },
      { category: "Advocacy", description: "Briefing materials prepared for policymakers", amountCents: 25_00 },
    ],
  },
  {
    ein: "431201653",
    name: "NAMI",
    city: "Arlington",
    state: "VA",
    description: "The largest grassroots mental health organization in the US, providing advocacy, education, support groups, and public awareness for people affected by mental illness.",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/NAMI_logo.gif/250px-NAMI_logo.gif",
    websiteUrl: "https://www.nami.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/NAMIOnCampusTabeling.jpg?width=1280",
    fund: {
      name: "Mental Health Support Network",
      description: "Funds free support groups, helpline operations, and mental health education programs nationwide.",
      category: "Mental Health",
      goalCents: 30_000_00,
    },
    expenses: [
      { category: "Helpline", description: "NAMI HelpLine staffing for a shift", amountCents: 50_00 },
      { category: "Support Groups", description: "Peer support group materials for a local chapter", amountCents: 25_00 },
      { category: "Education", description: "Mental health awareness training session", amountCents: 20_00 },
    ],
  },
  {
    ein: "941153307",
    name: "Sierra Club",
    city: "Oakland",
    state: "CA",
    description:
      "One of the oldest and largest grassroots environmental organizations in the U.S., advocating for public lands protection, clean energy, and climate policy through litigation, lobbying, and local chapters nationwide.",
    logoUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Sierra_Club_logo.png?width=250",
    websiteUrl: "https://www.sierraclub.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/People's_Climate_March_2017_in_Washington_DC_71.jpg?width=1280",
    fund: {
      name: "Public Lands Protection Fund",
      description: "Funds legal advocacy and campaigns to protect national parks, forests, and wilderness areas from development and extraction.",
      category: "Environment",
      goalCents: 40_000_00,
    },
    expenses: [
      { category: "Advocacy", description: "Legal filing fees for a public lands lawsuit", amountCents: 85_00 },
      { category: "Field Organizing", description: "Printed materials for a local chapter cleanup event", amountCents: 30_00 },
      { category: "Education", description: "Climate policy briefing prepared for lawmakers", amountCents: 45_00 },
    ],
  },
  {
    ein: "362934689",
    name: "Ronald McDonald House Charities",
    city: "Chicago",
    state: "IL",
    description:
      "Provides free or low-cost lodging near hospitals so families can stay close to children receiving medical treatment, through a global network of local Ronald McDonald House chapters.",
    logoUrl: "https://en.wikipedia.org/wiki/Special:FilePath/Ronald_McDonald_House_Logo.svg?width=250",
    websiteUrl: "https://rmhc.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Sailors_volunteer_at_Ronald_McDonald_House._(8530717815).jpg?width=1280",
    fund: {
      name: "Family Housing Support",
      description: "Covers lodging, meals, and transportation so families can stay together near the hospital during a child's treatment.",
      category: "Housing",
      goalCents: 30_000_00,
    },
    expenses: [
      { category: "Lodging", description: "A family's week-long stay at a local Ronald McDonald House", amountCents: 65_00 },
      { category: "Meals", description: "Groceries stocked for family kitchens at a House", amountCents: 35_00 },
      { category: "Transportation", description: "Gas card for a family commuting to the hospital", amountCents: 25_00 },
    ],
  },
  {
    ein: "135613797",
    name: "American Heart Association",
    city: "Dallas",
    state: "TX",
    description:
      "Funds cardiovascular and stroke research and teaches CPR and healthy-living education to reduce heart disease, the leading cause of death in the U.S.",
    logoUrl: "https://en.wikipedia.org/wiki/Special:FilePath/American_Heart_Association_Logo.svg?width=250",
    websiteUrl: "https://www.heart.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/SRNS_Heart_Walk_2018_(44752311512).jpg?width=1280",
    fund: {
      name: "Cardiovascular Research Fund",
      description: "Funds peer-reviewed research grants investigating heart disease and stroke prevention and treatment.",
      category: "Healthcare",
      goalCents: 60_000_00,
    },
    expenses: [
      { category: "Research", description: "Grant support for a cardiovascular research fellow", amountCents: 90_00 },
      { category: "Education", description: "CPR training kits for a community class", amountCents: 40_00 },
      { category: "Community Outreach", description: "Blood pressure screening event supplies", amountCents: 25_00 },
    ],
  },
  {
    ein: "133541913",
    name: "Teach For America",
    city: "New York",
    state: "NY",
    description: "Recruits and trains college graduates and professionals to teach for two years in under-resourced public schools across the country.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Teach_For_America_logo.svg?width=250",
    websiteUrl: "https://www.teachforamerica.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Teach_for_America_Social_-_Capitol_Grocery,_Baton_Rouge_2008.jpg?width=1280",
    fund: {
      name: "Corps Member Classroom Fund",
      description: "Funds training, coaching, and classroom start-up costs for new corps members placed in high-need schools.",
      category: "Education",
      goalCents: 35_000_00,
    },
    expenses: [
      { category: "Training", description: "Summer training institute materials for incoming corps members", amountCents: 55_00 },
      { category: "Classroom Support", description: "Starter classroom supplies for a first-year teacher", amountCents: 40_00 },
      { category: "Coaching", description: "Instructional coaching session for a corps member", amountCents: 30_00 },
    ],
  },
  {
    ein: "680051386",
    name: "Convoy of Hope",
    city: "Springfield",
    state: "MO",
    description:
      "Mobilizes volunteers and supplies to respond to natural disasters and chronic hunger, delivering food, water, and emergency supplies in the U.S. and internationally.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Convoy-of-Hope-Logo-2023.jpg?width=250",
    websiteUrl: "https://convoyofhope.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/FMSC_Distribution_Partner_-_Convoy_of_Hope_(8090723203).jpg?width=1280",
    fund: {
      name: "Disaster Response Fund",
      description: "Funds emergency food, water, and supply distribution in the immediate aftermath of a disaster.",
      category: "Disaster Relief",
      goalCents: 45_000_00,
    },
    expenses: [
      { category: "Relief Supplies", description: "Emergency water and hygiene kits for displaced families", amountCents: 50_00 },
      { category: "Logistics", description: "Truck fuel for a disaster response distribution route", amountCents: 45_00 },
      { category: "Volunteer Support", description: "Meals and gear for deployed volunteer teams", amountCents: 30_00 },
    ],
  },
  {
    ein: "320077563",
    name: "Innocence Project",
    city: "New York",
    state: "NY",
    description:
      "Uses DNA evidence and legal advocacy to exonerate wrongly convicted people and works to reform the criminal justice system to prevent future wrongful convictions.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Innocence_Project_logo.svg?width=250",
    websiteUrl: "https://innocenceproject.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Actual_innocence_book_from_...innocence_project_(48591893406).jpg?width=1280",
    fund: {
      name: "Wrongful Conviction Defense Fund",
      description: "Funds DNA testing, legal investigation, and litigation costs for wrongful conviction cases.",
      category: "Human Rights",
      goalCents: 50_000_00,
    },
    expenses: [
      { category: "Legal Investigation", description: "DNA testing for an active exoneration case", amountCents: 95_00 },
      { category: "Litigation", description: "Court filing and expert witness fees", amountCents: 60_00 },
      { category: "Policy Reform", description: "Research supporting a state wrongful-conviction reform bill", amountCents: 35_00 },
    ],
  },
  {
    ein: "237447812",
    name: "Meals on Wheels America",
    city: "Arlington",
    state: "VA",
    description:
      "The national network supporting local Meals on Wheels programs that deliver meals and safety check-ins to homebound seniors across nearly every U.S. community.",
    logoUrl: "https://www.mealsonwheelsamerica.org/wp-content/uploads/2026/04/Layer_1.webp",
    websiteUrl: "https://www.mealsonwheelsamerica.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Sailor_delivers_Meals-on-Wheels_to_elderly_and_homebound_residents._(35855356622).jpg?width=1280",
    fund: {
      name: "Senior Meal Delivery Fund",
      description: "Funds meal preparation and delivery routes bringing food and safety check-ins to homebound seniors.",
      category: "Hunger Relief",
      goalCents: 25_000_00,
    },
    expenses: [
      { category: "Meal Preparation", description: "Ingredients for a week of delivered senior meals", amountCents: 60_00 },
      { category: "Delivery", description: "Volunteer driver mileage reimbursement for a delivery route", amountCents: 25_00 },
      { category: "Program Support", description: "Wellness check-in training for delivery volunteers", amountCents: 20_00 },
    ],
  },
  {
    ein: "300728021",
    name: "Girls Who Code",
    city: "New York",
    state: "NY",
    description:
      "Runs free coding clubs and summer immersion programs to close the gender gap in technology by teaching computer science skills to girls and young women.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Girls_Who_Code_Logo.svg?width=250",
    websiteUrl: "https://www.girlswhocode.com",
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Girls_Who_Code_group_photo_with_members_of_Congress,_July_10,_2019_at_the_Library_of_Congress.jpg?width=1280",
    fund: {
      name: "Coding Club Program Fund",
      description: "Funds laptops, curriculum, and instructor stipends for free after-school coding clubs.",
      category: "Youth Development",
      goalCents: 30_000_00,
    },
    expenses: [
      { category: "Program Supplies", description: "Loaner laptops for a coding club cohort", amountCents: 90_00 },
      { category: "Instruction", description: "Instructor stipend for a semester of after-school sessions", amountCents: 50_00 },
      { category: "Curriculum", description: "Coding curriculum licensing for a new club chapter", amountCents: 25_00 },
    ],
  },
  {
    ein: "751835298",
    name: "Susan G. Komen",
    city: "Dallas",
    state: "TX",
    description: "Funds breast cancer research, patient navigation, and screening access programs, and advocates for policies that improve breast cancer outcomes.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Susan_G_Komen_Logo.svg?width=250",
    websiteUrl: "https://www.komen.org",
    bannerUrl:
      "https://commons.wikimedia.org/wiki/Special:FilePath/HHS_Secretary_and_other_HHS_Staffers_at_the_runner's_start_of_the_Susan_B._Komen_Race_for_the_Cure_in_June_2010.jpg?width=1280",
    fund: {
      name: "Breast Cancer Screening Access",
      description: "Funds free mammograms and patient navigation services for people who can't otherwise afford screening.",
      category: "Healthcare",
      goalCents: 40_000_00,
    },
    expenses: [
      { category: "Screening", description: "Mammogram voucher for an uninsured patient", amountCents: 75_00 },
      { category: "Patient Navigation", description: "Navigator support session for a newly diagnosed patient", amountCents: 45_00 },
      { category: "Education", description: "Breast health awareness materials for a community clinic", amountCents: 20_00 },
    ],
  },
  {
    ein: "951831116",
    name: "Direct Relief",
    city: "Santa Barbara",
    state: "CA",
    description:
      "Distributes free medicine and medical supplies to health workers responding to disasters and poverty in the U.S. and worldwide, without regard to politics or religion.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Direct-Relief-Square.png?width=250",
    websiteUrl: "https://www.directrelief.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Nepal_Earthquake_Emergency_Medical_Pack_Delivery.jpg?width=1280",
    fund: {
      name: "Emergency Medical Aid Fund",
      description: "Funds medicine and medical supply shipments to clinics and health workers responding to disasters.",
      category: "Disaster Relief",
      goalCents: 55_000_00,
    },
    expenses: [
      { category: "Medical Supplies", description: "Trauma packs shipped to a disaster-affected clinic", amountCents: 100_00 },
      { category: "Logistics", description: "Air cargo costs for an emergency medical shipment", amountCents: 65_00 },
      { category: "Warehouse Operations", description: "Cold-chain storage for temperature-sensitive medicine", amountCents: 35_00 },
    ],
  },
  {
    ein: "222406433",
    name: "Salvation Army National Corp",
    city: "Alexandria",
    state: "VA",
    description:
      "Provides emergency shelter, rehabilitation programs, and disaster relief services nationwide, funded in part by its well-known red kettle donation drives.",
    logoUrl: "https://en.wikipedia.org/wiki/Special:FilePath/The_Salvation_Army.svg?width=250",
    websiteUrl: "https://www.salvationarmyusa.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/FEMA_-_37417_-_Salvation_Army_volunteer_cooking_in_Texas.jpg?width=1280",
    fund: {
      name: "Emergency Shelter Fund",
      description: "Funds emergency shelter beds, meals, and case management for people experiencing homelessness.",
      category: "Housing",
      goalCents: 35_000_00,
    },
    expenses: [
      { category: "Shelter Operations", description: "A week of shelter beds and linens for guests", amountCents: 55_00 },
      { category: "Meals", description: "Hot meal service for shelter residents", amountCents: 30_00 },
      { category: "Case Management", description: "Intake and case management session for a new shelter guest", amountCents: 25_00 },
    ],
  },
  {
    ein: "520889518",
    name: "Special Olympics",
    city: "Washington",
    state: "DC",
    description: "Provides year-round sports training and competition for children and adults with intellectual disabilities across nearly every country in the world.",
    logoUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_Special_Olympics.svg?width=250",
    websiteUrl: "https://www.specialolympics.org",
    bannerUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Four_by_100_Special_Olympics.jpg?width=1280",
    fund: {
      name: "Athlete Program Fund",
      description: "Funds uniforms, coaching, and travel so athletes with intellectual disabilities can train and compete.",
      category: "Youth Development",
      goalCents: 25_000_00,
    },
    expenses: [
      { category: "Athlete Support", description: "Uniforms and equipment for a local team", amountCents: 45_00 },
      { category: "Coaching", description: "Certified coach training for a new sports program", amountCents: 35_00 },
      { category: "Travel", description: "Bus transportation to a regional competition", amountCents: 30_00 },
    ],
  },
];

async function main() {
  const systemUser = await ensureSystemUser();

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
