// Configuration constants for the Afghanistan Development Projects Dashboard

export const MAP_CONFIG = {
  // Mapbox configuration
  STYLE: "mapbox://styles/mapbox/light-v11",
  CENTER: [69.2075, 34.5553] as [number, number], // Afghanistan center
  DEFAULT_ZOOM: 5,
  PROJECTION: "mercator" as const,

  // Data sources
  GEOBOUNDARIES_URL:
    "https://www.geoboundaries.org/data/geoBoundaries-3_0_0/AFG/ADM1/geoBoundaries-3_0_0-AFG-ADM1.geojson",
  PROJECT_DATA_URL: "/data.geojson",

  // Layer styling
  COLORS: {
    PROVINCE_FILL: "#f8d5cc",
    PROVINCE_OUTLINE: "#d3a79d",
    PROVINCE_BORDER: "#8c6b63",
    HOVER_FILL: "#e63946",
    PROJECT_POINT: "#e63946",
    BUDGET: "#4caf50",
    BENEFICIARIES: "#2196f3",
  },

  // Layer opacity
  OPACITY: {
    PROVINCE_FILL: 0.4,
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
  TITLE: "Afghanistan Development Projects Dashboard",
  DESCRIPTION:
    "Interactive map visualization showing development projects and their impact across Afghanistan's provinces",
} as const;

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
