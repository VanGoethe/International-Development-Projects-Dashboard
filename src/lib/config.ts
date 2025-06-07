// Configuration constants for the International Development Projects Dashboard

export const MAP_CONFIG = {
  // Mapbox configuration
  STYLE: "mapbox://styles/mapbox/light-v11",
  DEFAULT_CENTER: [20, 0] as [number, number], // World center
  DEFAULT_ZOOM: 2,
  PROJECTION: "mercator" as const,

  // Country-specific configurations
  COUNTRIES: {
    AFG: {
      NAME: "Afghanistan",
      CENTER: [69.2075, 34.5553] as [number, number],
      ZOOM: 5,
      GEOBOUNDARIES_URL:
        "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/AFG/ADM1/geoBoundaries-3_0_0-AFG-ADM1.geojson",
    },
    IRQ: {
      NAME: "Iraq",
      CENTER: [44.0, 33.0] as [number, number],
      ZOOM: 5,
      GEOBOUNDARIES_URL:
        "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/IRQ/ADM1/geoBoundaries-3_0_0-IRQ-ADM1.geojson",
    },
    SYR: {
      NAME: "Syria",
      CENTER: [38.0, 35.0] as [number, number],
      ZOOM: 6,
      GEOBOUNDARIES_URL:
        "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/SYR/ADM1/geoBoundaries-3_0_0-SYR-ADM1.geojson",
    },
    YEM: {
      NAME: "Yemen",
      CENTER: [47.0, 15.5] as [number, number],
      ZOOM: 6,
      GEOBOUNDARIES_URL:
        "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/YEM/ADM1/geoBoundaries-3_0_0-YEM-ADM1.geojson",
    },
    UKR: {
      NAME: "Ukraine",
      CENTER: [31.0, 49.0] as [number, number],
      ZOOM: 5,
      GEOBOUNDARIES_URL:
        "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/UKR/ADM1/geoBoundaries-3_0_0-UKR-ADM1.geojson",
    },
  },

  // Data sources
  PROJECT_DATA_URL: "/data.geojson",
  WORLD_BOUNDARIES_URL:
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson",

  // External APIs for future integration
  APIS: {
    IATI_DATASTORE: "https://api.iatistandard.org/datastore/",
    USAID_DDL: "https://data.usaid.gov/",
    FOREIGN_ASSISTANCE: "https://foreignassistance.gov/api/",
  },

  // Layer styling
  COLORS: {
    COUNTRY_FILL: "#f8f9fa",
    COUNTRY_OUTLINE: "#dee2e6",
    COUNTRY_BORDER: "#6c757d",
    HOVER_FILL: "#e63946",
    PROJECT_POINT: "#e63946",
    BUDGET: "#4caf50",
    BENEFICIARIES: "#2196f3",
    // Status colors
    ACTIVE: "#28a745",
    PAUSED: "#ffc107",
    CANCELLED: "#dc3545",
    COMPLETED: "#6c757d",
  },

  // Layer opacity
  OPACITY: {
    COUNTRY_FILL: 0.2,
    HOVER_FILL: 0.7,
    BORDER: 0.8,
    PROJECT_POINT: 0.8,
  },

  // UI Configuration
  POPUP_OFFSET: 0.5,
  ANIMATION_DURATION: 1000,
  POPUP_MAX_WIDTH: "320px",
} as const;

export const APP_METADATA = {
  TITLE: "International Development Projects Dashboard",
  DESCRIPTION:
    "Interactive map visualization showing development projects and their impact across multiple countries",
} as const;

// Utility functions
export const getCountryConfig = (iso3Code: string) => {
  return MAP_CONFIG.COUNTRIES[iso3Code as keyof typeof MAP_CONFIG.COUNTRIES];
};

export const getAllCountryCodes = () => {
  return Object.keys(MAP_CONFIG.COUNTRIES);
};

// Environment variables with fallbacks
export const ENV = {
  MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
  NODE_ENV: process.env.NODE_ENV || "development",
} as const;

// Validation
export const validateEnvironment = () => {
  const errors: string[] = [];

  if (!ENV.MAPBOX_ACCESS_TOKEN) {
    errors.push("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required");
  } else if (!ENV.MAPBOX_ACCESS_TOKEN.startsWith("pk.")) {
    errors.push(
      "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN must be a valid Mapbox public token (starts with 'pk.')"
    );
  }

  if (errors.length > 0 && ENV.NODE_ENV === "production") {
    console.error("Environment validation errors:", errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Run validation
const validation = validateEnvironment();
if (!validation.isValid && ENV.NODE_ENV === "development") {
  console.warn("⚠️ Environment Setup Required:", validation.errors);
}
