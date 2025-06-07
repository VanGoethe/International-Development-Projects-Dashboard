#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Country configurations with real coordinates
const COUNTRIES = {
  AFG: {
    name: "Afghanistan",
    center: [69.2075, 34.5553],
    regions: [
      "Kabul",
      "Balkh",
      "Kandahar",
      "Nangarhar",
      "Herat",
      "Kunduz",
      "Laghman",
    ],
  },
  IRQ: {
    name: "Iraq",
    center: [44.0, 33.0],
    regions: ["Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Anbar"],
  },
  SYR: {
    name: "Syria",
    center: [38.0, 35.0],
    regions: [
      "Damascus",
      "Aleppo",
      "Homs",
      "Latakia",
      "Daraa",
      "Deir ez-Zor",
      "Idlib",
    ],
  },
  YEM: {
    name: "Yemen",
    center: [47.0, 15.5],
    regions: ["Sana'a", "Aden", "Taiz", "Hodeidah", "Ibb", "Dhamar", "Hajjah"],
  },
  UKR: {
    name: "Ukraine",
    center: [31.0, 49.0],
    regions: [
      "Kyiv",
      "Kharkiv",
      "Odesa",
      "Dnipro",
      "Donetsk",
      "Zaporizhzhia",
      "Lviv",
    ],
  },
  SOM: {
    name: "Somalia",
    center: [46.0, 5.0],
    regions: [
      "Mogadishu",
      "Hargeisa",
      "Bosaso",
      "Kismayo",
      "Galkayo",
      "Berbera",
      "Garowe",
    ],
  },
  ETH: {
    name: "Ethiopia",
    center: [40.0, 9.0],
    regions: [
      "Addis Ababa",
      "Dire Dawa",
      "Mekelle",
      "Gondar",
      "Awasa",
      "Bahir Dar",
      "Jimma",
    ],
  },
  KEN: {
    name: "Kenya",
    center: [37.9, -0.03],
    regions: [
      "Nairobi",
      "Mombasa",
      "Kisumu",
      "Nakuru",
      "Eldoret",
      "Machakos",
      "Thika",
    ],
  },
};

// Development sectors based on OECD DAC codes
const SECTORS = [
  "Education & Training",
  "Health & Medical Services",
  "Agriculture & Food Security",
  "Water & Sanitation",
  "Emergency Response & Humanitarian Aid",
  "Governance & Civil Society",
  "Economic Growth & Private Sector",
  "Infrastructure & Transportation",
  "Environment & Climate Change",
  "Peace & Security",
  "Women's Empowerment & Gender",
  "Child Protection & Youth",
];

// Real implementing organizations
const IMPLEMENTING_PARTNERS = [
  "USAID",
  "World Food Programme",
  "UNICEF",
  "UNHCR",
  "World Health Organization",
  "International Rescue Committee",
  "Mercy Corps",
  "Save the Children",
  "Oxfam International",
  "Médecins Sans Frontières",
  "CARE International",
  "Catholic Relief Services",
  "World Vision International",
  "Danish Refugee Council",
  "Norwegian Refugee Council",
  "Action Against Hunger",
  "International Committee of the Red Cross",
  "Doctors Without Borders",
  "Plan International",
  "Islamic Relief Worldwide",
];

const PROJECT_STATUSES = ["Active", "Paused", "Cancelled", "Completed"];

// Generate realistic project names
const PROJECT_PREFIXES = [
  "Emergency Response",
  "Humanitarian Assistance",
  "Development Support",
  "Capacity Building",
  "Infrastructure Development",
  "Health System Strengthening",
  "Education Access",
  "Water Security",
  "Food Security",
  "Economic Empowerment",
  "Peace Building",
  "Resilience Building",
];

const PROJECT_SUFFIXES = [
  "Program",
  "Initiative",
  "Project",
  "Response",
  "Support",
  "Assistance",
  "Development Program",
  "Emergency Response",
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBudget(country) {
  // Emergency/conflict zones tend to have higher budgets
  const emergencyCountries = ["AFG", "IRQ", "SYR", "YEM", "SOM"];
  const baseMin = emergencyCountries.includes(country) ? 500000 : 100000;
  const baseMax = emergencyCountries.includes(country) ? 50000000 : 20000000;

  return getRandomNumber(baseMin, baseMax);
}

function getRandomBeneficiaries(budget) {
  // Higher budgets generally reach more beneficiaries
  const ratio = Math.random() * 0.1 + 0.02; // 2-12% of budget as beneficiaries
  return Math.floor((budget * ratio) / 100);
}

function generateProjectName() {
  const prefix = getRandomElement(PROJECT_PREFIXES);
  const suffix = getRandomElement(PROJECT_SUFFIXES);
  return `${prefix} ${suffix}`;
}

function getRegionCoordinates(countryCode, regionName) {
  const country = COUNTRIES[countryCode];
  const baseCoord = country.center;

  // Add some random offset to create realistic regional coordinates
  const latOffset = (Math.random() - 0.5) * 4; // +/- 2 degrees
  const lngOffset = (Math.random() - 0.5) * 6; // +/- 3 degrees

  return [baseCoord[0] + lngOffset, baseCoord[1] + latOffset];
}

function generateProjects() {
  const features = [];

  // Generate projects for each country
  Object.keys(COUNTRIES).forEach((countryCode) => {
    const country = COUNTRIES[countryCode];
    const projectCount = getRandomNumber(8, 25); // 8-25 projects per country

    for (let i = 0; i < projectCount; i++) {
      const region = getRandomElement(country.regions);
      const budget = getRandomBudget(countryCode);
      const beneficiaries = getRandomBeneficiaries(budget);
      const coordinates = getRegionCoordinates(countryCode, region);

      const feature = {
        type: "Feature",
        properties: {
          Country: country.name,
          Region: region,
          "Project Name": generateProjectName(),
          Sector: getRandomElement(SECTORS),
          Budget: budget,
          "Implementing Partner": getRandomElement(IMPLEMENTING_PARTNERS),
          Beneficiaries: beneficiaries,
          Status: getRandomElement(PROJECT_STATUSES),
          "Start Date": generateRandomDate(2020, 2024),
          "End Date": generateRandomDate(2024, 2026),
          Description: `Development project focusing on ${getRandomElement(
            SECTORS
          ).toLowerCase()} in ${region}, ${country.name}.`,
        },
        geometry: {
          type: "Point",
          coordinates: coordinates,
        },
      };

      features.push(feature);
    }
  });

  return {
    type: "FeatureCollection",
    features: features,
  };
}

function generateRandomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split("T")[0];
}

function main() {
  console.log("🌍 Generating international development projects data...");

  const projectData = generateProjects();

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write the data file
  const outputPath = path.join(publicDir, "data.geojson");
  fs.writeFileSync(outputPath, JSON.stringify(projectData, null, 2));

  console.log(
    `✅ Generated ${projectData.features.length} projects across ${
      Object.keys(COUNTRIES).length
    } countries`
  );
  console.log(`📁 Data saved to: ${outputPath}`);

  // Log summary statistics
  const stats = {};
  projectData.features.forEach((feature) => {
    const country = feature.properties.Country;
    if (!stats[country]) {
      stats[country] = { count: 0, totalBudget: 0, totalBeneficiaries: 0 };
    }
    stats[country].count++;
    stats[country].totalBudget += feature.properties.Budget;
    stats[country].totalBeneficiaries += feature.properties.Beneficiaries;
  });

  console.log("\n📊 Summary by Country:");
  Object.keys(stats).forEach((country) => {
    const stat = stats[country];
    console.log(
      `${country}: ${stat.count} projects, $${(
        stat.totalBudget / 1000000
      ).toFixed(
        1
      )}M budget, ${stat.totalBeneficiaries.toLocaleString()} beneficiaries`
    );
  });
}

if (require.main === module) {
  main();
}
