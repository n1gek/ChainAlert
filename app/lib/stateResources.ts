export interface StateResource {
  name: string;
  hotline: string;
  orgs: Organization[];
  sanctuaryCities: string[];
  keyLaws: string[];
  notes: string;
  riskLevel: "low" | "medium" | "high";
}

export interface Organization {
  name: string;
  phone: string;
  website: string;
  services: string[];
  languages: string[];
}

const NATIONAL_HOTLINE = "1-888-509-1239";

const NATIONAL_ORGS: Organization[] = [
  {
    name: "Immigration Advocates Network",
    phone: NATIONAL_HOTLINE,
    website: "https://www.immigrationadvocates.org",
    services: [
      "Legal referrals",
      "Know Your Rights information",
      "Detention support",
      "Emergency resources",
    ],
    languages: ["English", "Spanish"],
  },
  {
    name: "ACLU Immigrants’ Rights Project",
    phone: "(212) 549-2500",
    website: "https://www.aclu.org/issues/immigrants-rights",
    services: [
      "Impact litigation",
      "Legal resources",
      "Know Your Rights guides",
    ],
    languages: ["English", "Spanish"],
  },
  {
    name: "United We Dream",
    phone: "(202) 709-0505",
    website: "https://unitedwedream.org",
    services: [
      "Youth advocacy",
      "Legal education",
      "Emergency support",
    ],
    languages: ["English", "Spanish"],
  },
];

function state(
  name: string,
  riskLevel: "low" | "medium" | "high",
  keyLaws: string[] = []
): StateResource {
  return {
    name,
    hotline: NATIONAL_HOTLINE,
    riskLevel,
    sanctuaryCities: [],
    keyLaws,
    orgs: NATIONAL_ORGS,
    notes:
      "State-level immigration enforcement varies by locality. If detained, national legal organizations will route to verified local counsel.",
  };
}

export const stateResources: Record<string, StateResource> = {
  AL: state("Alabama", "high"),
  AK: state("Alaska", "medium"),
  AZ: state("Arizona", "high", ["SB 1070 (partially struck down)"]),
  AR: state("Arkansas", "high"),
  CA: state("California", "low", ["SB 54 – California Values Act"]),
  CO: state("Colorado", "low"),
  CT: state("Connecticut", "low"),
  DE: state("Delaware", "medium"),
  FL: state("Florida", "medium"),
  GA: state("Georgia", "high"),
  HI: state("Hawaii", "low"),
  ID: state("Idaho", "high"),
  IL: state("Illinois", "low"),
  IN: state("Indiana", "medium"),
  IA: state("Iowa", "medium"),
  KS: state("Kansas", "medium"),
  KY: state("Kentucky", "medium"),
  LA: state("Louisiana", "high"),
  ME: state("Maine", "low"),
  MD: state("Maryland", "low"),
  MA: state("Massachusetts", "low"),
  MI: state("Michigan", "medium"),
  MN: state("Minnesota", "low"),
  MS: state("Mississippi", "high"),
  MO: state("Missouri", "medium"),
  MT: state("Montana", "medium"),
  NE: state("Nebraska", "medium"),
  NV: state("Nevada", "medium"),
  NH: state("New Hampshire", "low"),
  NJ: state("New Jersey", "low"),
  NM: state("New Mexico", "medium"),
  NY: state("New York", "low"),
  NC: state("North Carolina", "medium"),
  ND: state("North Dakota", "medium"),
  OH: state("Ohio", "medium"),
  OK: state("Oklahoma", "high"),
  OR: state("Oregon", "low"),
  PA: state("Pennsylvania", "medium"),
  RI: state("Rhode Island", "low"),
  SC: state("South Carolina", "high"),
  SD: state("South Dakota", "medium"),
  TN: state("Tennessee", "high"),
  TX: state("Texas", "high"),
  UT: state("Utah", "medium"),
  VT: state("Vermont", "low"),
  VA: state("Virginia", "medium"),
  WA: state("Washington", "low"),
  WV: state("West Virginia", "medium"),
  WI: state("Wisconsin", "medium"),
  WY: state("Wyoming", "medium"),
  DC: state("Washington, DC", "low"),
};

// Helpers
export function getStateResources(stateCode: string): StateResource {
  return stateResources[stateCode.toUpperCase()] || stateResources["DC"];
}

export const availableStates = Object.entries(stateResources)
  .map(([code, value]) => ({
    code,
    name: value.name,
    riskLevel: value.riskLevel,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
