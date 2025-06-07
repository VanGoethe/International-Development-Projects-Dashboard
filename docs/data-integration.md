# Data Integration Guide 📊

This guide explains how to integrate real-world data sources with the International Development Projects Dashboard.

## Data Structure Overview

### Project Data Format (GeoJSON)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Country": "Afghanistan",
        "Region": "Kabul",
        "Project Name": "Emergency Response Program",
        "Sector": "Health & Medical Services",
        "Budget": 5000000,
        "Implementing Partner": "World Health Organization",
        "Beneficiaries": 50000,
        "Status": "Active",
        "Start Date": "2023-01-15",
        "End Date": "2025-12-31",
        "Description": "Emergency health services..."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [69.2075, 34.5553]
      }
    }
  ]
}
```

## Real Data Source Integration

### 1. IATI Datastore API

**Base URL**: `https://api.iatistandard.org/datastore/`

#### Example Query

```javascript
// Fetch projects for specific country
const fetchIATIData = async (countryCode) => {
  const response = await fetch(
    `https://api.iatistandard.org/datastore/activity/select?q=recipient_country_code:${countryCode}&fl=iati_identifier,title_narrative,participating_org_narrative,budget_value,recipient_country_narrative`
  );
  return response.json();
};
```

#### Data Transformation

```javascript
const transformIATIData = (iatiData) => {
  return {
    type: "FeatureCollection",
    features: iatiData.response.docs.map((activity) => ({
      type: "Feature",
      properties: {
        Country: activity.recipient_country_narrative?.[0] || "Unknown",
        Region: "National", // IATI doesn't always have sub-national data
        "Project Name": activity.title_narrative?.[0] || "Untitled Project",
        Sector: activity.sector_category_name?.[0] || "Other",
        Budget: activity.budget_value?.[0] || 0,
        "Implementing Partner":
          activity.participating_org_narrative?.[0] || "Unknown",
        Beneficiaries: 0, // Estimate based on budget or sector
        Status: activity.activity_status_name || "Unknown",
      },
      geometry: {
        type: "Point",
        coordinates: getCountryCoordinates(activity.recipient_country_code),
      },
    })),
  };
};
```

### 2. USAID Development Data Library

**Base URL**: `https://data.usaid.gov/`

#### Implementation Example

```javascript
const fetchUSAIDData = async () => {
  const response = await fetch(
    "https://data.usaid.gov/api/views/vm6y-fcqn/rows.json?accessType=DOWNLOAD"
  );
  const data = await response.json();

  return transformUSAIDData(data);
};

const transformUSAIDData = (rawData) => {
  const [headers, ...rows] = rawData.data;

  return {
    type: "FeatureCollection",
    features: rows.map((row) => {
      const project = Object.fromEntries(
        headers.map((header, index) => [header, row[index]])
      );

      return {
        type: "Feature",
        properties: {
          Country: project["Operating Unit"],
          Region: project["Implementing Mechanism Name"],
          "Project Name": project["Activity Name"],
          Sector: project["Program Area"],
          Budget: parseFloat(project["Current Amount"]) || 0,
          "Implementing Partner": project["Prime Partner Name"],
          Beneficiaries: 0, // Calculate based on sector and budget
          Status: "Active",
        },
        geometry: {
          type: "Point",
          coordinates: getCountryCoordinates(project["Operating Unit"]),
        },
      };
    }),
  };
};
```

### 3. World Bank Open Data

**Base URL**: `https://api.worldbank.org/v2/`

#### Example Integration

```javascript
const fetchWorldBankProjects = async (countryCode) => {
  const response = await fetch(
    `https://api.worldbank.org/v2/projects?format=json&countrycode=${countryCode}&rows=1000`
  );
  const [metadata, projects] = await response.json();

  return transformWorldBankData(projects);
};

const transformWorldBankData = (projects) => {
  return {
    type: "FeatureCollection",
    features: projects.map((project) => ({
      type: "Feature",
      properties: {
        Country: project.countryname,
        Region: project.regionname,
        "Project Name": project.project_name,
        Sector: project.sector1?.Name || "Multi-Sector",
        Budget: project.totalcommamt || 0,
        "Implementing Partner": "World Bank",
        Beneficiaries: 0,
        Status: project.status,
        "Start Date": project.boardapprovaldate,
        "End Date": project.closingdate,
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(project.longitude) || 0,
          parseFloat(project.latitude) || 0,
        ],
      },
    })),
  };
};
```

## Data Processing Pipeline

### 1. Create Data Fetcher Service

```typescript
// src/services/dataFetcher.ts
export class DataFetcher {
  private static instance: DataFetcher;

  static getInstance(): DataFetcher {
    if (!DataFetcher.instance) {
      DataFetcher.instance = new DataFetcher();
    }
    return DataFetcher.instance;
  }

  async fetchAllData(): Promise<ProjectData> {
    const [iatiData, usaidData, worldBankData] = await Promise.all([
      this.fetchIATIData(),
      this.fetchUSAIDData(),
      this.fetchWorldBankData(),
    ]);

    return this.mergeDataSources([iatiData, usaidData, worldBankData]);
  }

  private mergeDataSources(dataSources: ProjectData[]): ProjectData {
    const allFeatures = dataSources.flatMap((source) => source.features);

    return {
      type: "FeatureCollection",
      features: this.deduplicateProjects(allFeatures),
    };
  }

  private deduplicateProjects(features: ProjectFeature[]): ProjectFeature[] {
    const seen = new Set();
    return features.filter((feature) => {
      const key = `${feature.properties.Country}-${feature.properties["Project Name"]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
```

### 2. Update Map Component

```typescript
// In MapboxMap.tsx
useEffect(() => {
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Use real data in production, generated data in development
      const projectData =
        process.env.NODE_ENV === "production"
          ? await DataFetcher.getInstance().fetchAllData()
          : await fetch("/data.geojson").then((res) => res.json());

      // Process and display data...
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load project data");
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, []);
```

## Data Quality & Validation

### 1. Schema Validation

```typescript
import Joi from "joi";

const projectSchema = Joi.object({
  Country: Joi.string().required(),
  Region: Joi.string().required(),
  "Project Name": Joi.string().required(),
  Sector: Joi.string().required(),
  Budget: Joi.number().min(0).required(),
  "Implementing Partner": Joi.string().required(),
  Beneficiaries: Joi.number().min(0).required(),
  Status: Joi.string().valid("Active", "Paused", "Cancelled", "Completed"),
  "Start Date": Joi.date().iso().optional(),
  "End Date": Joi.date().iso().min(Joi.ref("Start Date")).optional(),
  Description: Joi.string().optional(),
});

export const validateProject = (project: any): boolean => {
  const { error } = projectSchema.validate(project);
  if (error) {
    console.warn("Invalid project data:", error.message);
    return false;
  }
  return true;
};
```

### 2. Data Cleaning

```typescript
export const cleanProjectData = (rawData: any[]): ProjectFeature[] => {
  return rawData.filter(validateProject).map((project) => ({
    type: "Feature" as const,
    properties: {
      ...project,
      Budget: Math.round(project.Budget || 0),
      Beneficiaries: Math.round(project.Beneficiaries || 0),
      Country: project.Country?.trim(),
      Region: project.Region?.trim() || "National",
    },
    geometry: {
      type: "Point" as const,
      coordinates: validateCoordinates(project.coordinates)
        ? project.coordinates
        : getDefaultCountryCoordinates(project.Country),
    },
  }));
};
```

## Caching & Performance

### 1. Data Caching Strategy

```typescript
// src/utils/cache.ts
export class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 1000 * 60 * 60; // 1 hour

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }
}
```

### 2. Incremental Updates

```typescript
export const fetchIncrementalUpdates = async (
  lastUpdate: Date
): Promise<ProjectData> => {
  const params = new URLSearchParams({
    modified_since: lastUpdate.toISOString(),
    format: "json",
  });

  const response = await fetch(`${API_BASE_URL}/projects/updates?${params}`);
  return response.json();
};
```

## Environment Configuration

### Development Environment

```env
# .env.local
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_development_token
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### Production Environment

```env
# .env.production
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_production_token
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
NEXT_PUBLIC_USE_MOCK_DATA=false
IATI_API_KEY=your_iati_api_key
USAID_API_KEY=your_usaid_api_key
```

## Rate Limiting & Error Handling

### 1. API Rate Limiting

```typescript
export class RateLimitedFetcher {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly delay = 1000; // 1 second between requests

  async fetch(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          resolve(await response.json());
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      await request();
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }

    this.isProcessing = false;
  }
}
```

### 2. Fallback Strategies

```typescript
export const fetchWithFallback = async (
  primaryUrl: string,
  fallbackUrl: string
): Promise<any> => {
  try {
    return await fetch(primaryUrl).then((res) => res.json());
  } catch (primaryError) {
    console.warn("Primary data source failed, using fallback:", primaryError);

    try {
      return await fetch(fallbackUrl).then((res) => res.json());
    } catch (fallbackError) {
      console.error("All data sources failed:", fallbackError);

      // Return cached data or empty dataset
      return (
        DataCache.getInstance().get("lastKnownGoodData") || {
          type: "FeatureCollection",
          features: [],
        }
      );
    }
  }
};
```

## Monitoring & Analytics

### 1. Data Quality Monitoring

```typescript
export const monitorDataQuality = (data: ProjectData): DataQualityReport => {
  const report = {
    totalProjects: data.features.length,
    missingFields: 0,
    invalidCoordinates: 0,
    duplicates: 0,
    countryCoverage: new Set<string>(),
  };

  data.features.forEach((feature) => {
    // Check for missing required fields
    const required = ["Country", "Project Name", "Budget"];
    required.forEach((field) => {
      if (!feature.properties[field]) report.missingFields++;
    });

    // Validate coordinates
    const [lng, lat] = feature.geometry.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      report.invalidCoordinates++;
    }

    report.countryCoverage.add(feature.properties.Country);
  });

  return report;
};
```

## Next Steps

1. **API Key Management**: Set up secure API key rotation
2. **Real-time Updates**: Implement WebSocket connections for live data
3. **Data Validation**: Add comprehensive schema validation
4. **Performance Optimization**: Implement data pagination and lazy loading
5. **Error Recovery**: Add retry logic and circuit breakers
6. **Analytics**: Track data usage and performance metrics

For questions or additional integration needs, please refer to the main README or create an issue in the repository.
