export const DEFAULT_PRESET_AMOUNTS_CENTS = [2500, 5000, 10000, 25000];

// Categories with a typically higher cost-per-gift (shelter, building materials, disaster
// logistics) default to a higher set of suggested amounts than smaller, per-meal/per-item causes.
const CATEGORY_PRESET_AMOUNTS_CENTS: Record<string, number[]> = {
  "Disaster Relief": [5000, 10000, 25000, 50000],
  Housing: [5000, 10000, 25000, 50000],
  Environment: [2500, 5000, 10000, 25000],
  "Hunger Relief": [2500, 5000, 10000, 25000],
  Education: [2500, 5000, 10000, 25000],
  "Mental Health": [2500, 5000, 10000, 25000],
  "Youth Development": [2500, 5000, 10000, 25000],
  "Youth Mentorship": [2500, 5000, 10000, 25000],
  "Animal Welfare": [2500, 5000, 10000, 25000],
  Healthcare: [5000, 10000, 25000, 50000],
  "Human Rights": [2500, 5000, 10000, 25000],
  "Arts & Culture": [2500, 5000, 10000, 25000],
};

export function getPresetAmountsCents(category?: string | null): number[] {
  if (category && category in CATEGORY_PRESET_AMOUNTS_CENTS) return CATEGORY_PRESET_AMOUNTS_CENTS[category];
  return DEFAULT_PRESET_AMOUNTS_CENTS;
}
