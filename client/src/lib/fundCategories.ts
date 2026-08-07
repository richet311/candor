// The canonical set of fund categories. Keeping this as a fixed list (rather than free text)
// means the cause filters on the funds/organizations directories actually group things
// meaningfully instead of splintering into near-duplicate strings ("Hunger Relief" vs
// "Hunger" vs "Food Security"). "Other" exists as an escape hatch for a fund that genuinely
// doesn't fit, not as a way around picking a real category.
export const FUND_CATEGORIES = [
  "Hunger Relief",
  "Housing",
  "Disaster Relief",
  "Education",
  "Environment",
  "Animal Welfare",
  "Mental Health",
  "Youth Development",
  "Youth Mentorship",
  "Healthcare",
  "Human Rights",
  "Arts & Culture",
] as const;

export const OTHER_CATEGORY = "Other";
