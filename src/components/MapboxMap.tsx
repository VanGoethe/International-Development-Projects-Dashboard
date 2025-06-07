"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Types
interface ProjectProperties {
  "Project Name": string;
  Country: string;
  Region: string;
  Budget: number;
  Beneficiaries: number;
  Sector: string;
  "Implementing Partner": string;
  Status?: string;
  "Start Date"?: string;
  "End Date"?: string;
  Description?: string;
}

interface ProjectFeature {
  type: "Feature";
  properties: ProjectProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface ProjectData {
  type: "FeatureCollection";
  features: ProjectFeature[];
}

interface CountryBoundaryProperties {
  NAME?: string;
  NAME_EN?: string;
  ADMIN?: string;
  ISO_A3?: string;
  ADM0_A3?: string;
  feature_id: number;
  [key: string]: any; // Allow additional properties
}

interface CountryBoundaryFeature {
  type: "Feature";
  id: number;
  properties: CountryBoundaryProperties;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

interface CountryBoundaryData {
  type: "FeatureCollection";
  features: CountryBoundaryFeature[];
}

interface ProjectLocationProperties {
  country: string;
  region: string;
  projects: ProjectProperties[];
  totalBudget: number;
  totalBeneficiaries: number;
  sectors: string[];
  partners: string[];
}

interface ProjectLocationFeature {
  type: "Feature";
  properties: ProjectLocationProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface ProjectLocationsData {
  type: "FeatureCollection";
  features: ProjectLocationFeature[];
}

// Constants
const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";
const WORLD_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const WORLD_BOUNDARIES_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// Set Mapbox access token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const MapboxMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [hoveredStateId, setHoveredStateId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    // Check if Mapbox token is available
    if (!mapboxgl.accessToken) {
      setError(
        "Mapbox access token is required. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file."
      );
      setIsLoading(false);
      return;
    }

    if (!mapContainer.current || map.current) return;

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: WORLD_CENTER,
      zoom: DEFAULT_ZOOM,
      projection: "mercator",
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.current.on("load", async () => {
      if (!map.current) return;

      try {
        setIsLoading(true);

        // Fetch data
        const [projectResponse, boundariesResponse] = await Promise.all([
          fetch("/data.geojson"),
          fetch(WORLD_BOUNDARIES_URL),
        ]);

        if (!projectResponse.ok) {
          throw new Error(
            `Failed to fetch project data: ${projectResponse.status}`
          );
        }
        if (!boundariesResponse.ok) {
          throw new Error(
            `Failed to fetch boundaries: ${boundariesResponse.status}`
          );
        }

        const [projectData, boundariesData]: [
          ProjectData,
          CountryBoundaryData
        ] = await Promise.all([
          projectResponse.json(),
          boundariesResponse.json(),
        ]);

        console.log("Data loaded successfully");

        // Extract unique countries from project data
        const uniqueCountries = [
          ...new Set(projectData.features.map((f) => f.properties.Country)),
        ];
        setCountries(uniqueCountries);

        // Process boundaries data
        const processedBoundaries: CountryBoundaryData = {
          ...boundariesData,
          features: boundariesData.features.map(
            (feature, index): CountryBoundaryFeature => ({
              ...feature,
              id: index,
              properties: {
                ...feature.properties,
                feature_id: index,
                NAME:
                  feature.properties.NAME_EN ||
                  feature.properties.NAME ||
                  feature.properties.ADMIN,
                ISO_A3: feature.properties.ISO_A3 || feature.properties.ADM0_A3,
              },
            })
          ),
        };

        // Add sources
        map.current!.addSource("world-boundaries", {
          type: "geojson",
          data: processedBoundaries,
          generateId: false,
        });

        // Add layers
        addMapLayers();

        // Process and add project data
        const projectsByCountryRegion = processProjectData(projectData);
        addProjectLayers(projectsByCountryRegion);

        // Add event listeners
        addMapEventListeners(projectData);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(
          "Failed to load map data. Please check your internet connection and try again."
        );
        setIsLoading(false);
      }
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMapLayers = () => {
    if (!map.current) return;

    // Country fill layer
    map.current.addLayer({
      id: "world-fills",
      type: "fill",
      source: "world-boundaries",
      layout: {},
      paint: {
        "fill-color": "#f8f9fa",
        "fill-opacity": 0.2,
        "fill-outline-color": "#dee2e6",
      },
    });

    // Hover layer
    map.current.addLayer({
      id: "world-hover",
      type: "fill",
      source: "world-boundaries",
      layout: {},
      filter: ["==", ["get", "feature_id"], -1],
      paint: {
        "fill-color": "#e63946",
        "fill-opacity": 0.7,
        "fill-outline-color": "#dee2e6",
      },
    });

    // Border layer
    map.current.addLayer({
      id: "world-borders",
      type: "line",
      source: "world-boundaries",
      layout: {},
      paint: {
        "line-color": "#6c757d",
        "line-width": 1,
        "line-opacity": 0.8,
      },
    });

    // Labels layer
    map.current.addLayer({
      id: "country-labels",
      type: "symbol",
      source: "world-boundaries",
      layout: {
        "text-field": ["get", "NAME"],
        "text-font": ["Open Sans Bold"],
        "text-size": 12,
        "text-allow-overlap": false,
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#333",
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
    });
  };

  const processProjectData = (projectData: ProjectData) => {
    const projectsByCountryRegion: Record<
      string,
      {
        projects: ProjectProperties[];
        totalBudget: number;
        totalBeneficiaries: number;
        sectors: string[];
        partners: string[];
        coordinates: [number, number];
      }
    > = {};

    projectData.features.forEach((feature) => {
      const country = feature.properties.Country;
      if (!projectsByCountryRegion[country]) {
        projectsByCountryRegion[country] = {
          projects: [feature.properties],
          totalBudget: feature.properties.Budget,
          totalBeneficiaries: feature.properties.Beneficiaries,
          sectors: [feature.properties.Sector],
          partners: [feature.properties["Implementing Partner"]],
          coordinates: feature.geometry.coordinates,
        };
      } else {
        const countryData = projectsByCountryRegion[country];
        countryData.projects.push(feature.properties);
        countryData.totalBudget += feature.properties.Budget;
        countryData.totalBeneficiaries += feature.properties.Beneficiaries;

        if (!countryData.sectors.includes(feature.properties.Sector)) {
          countryData.sectors.push(feature.properties.Sector);
        }

        if (
          !countryData.partners.includes(
            feature.properties["Implementing Partner"]
          )
        ) {
          countryData.partners.push(feature.properties["Implementing Partner"]);
        }
      }
    });

    return projectsByCountryRegion;
  };

  const addProjectLayers = (
    projectsByCountryRegion: ReturnType<typeof processProjectData>
  ) => {
    if (!map.current) return;

    const projectLocations: ProjectLocationsData = {
      type: "FeatureCollection",
      features: Object.entries(projectsByCountryRegion).map(
        ([country, data]): ProjectLocationFeature => ({
          type: "Feature",
          properties: {
            country,
            region: "Global",
            projects: data.projects,
            totalBudget: data.totalBudget,
            totalBeneficiaries: data.totalBeneficiaries,
            sectors: data.sectors,
            partners: data.partners,
          },
          geometry: {
            type: "Point",
            coordinates: data.coordinates,
          },
        })
      ),
    };

    map.current.addSource("project-locations", {
      type: "geojson",
      data: projectLocations,
    });

    map.current.addLayer({
      id: "project-points",
      type: "circle",
      source: "project-locations",
      paint: {
        "circle-radius": 6,
        "circle-color": "#e63946",
        "circle-opacity": 0.8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });
  };

  const addMapEventListeners = (projectData: ProjectData) => {
    if (!map.current) return;

    // Mouse move handler
    map.current.on("mousemove", "world-fills", (e) => {
      if (!map.current || !e.features?.length) return;

      try {
        if (hoveredStateId !== null) {
          map.current.setFilter("world-hover", [
            "==",
            ["get", "feature_id"],
            -1,
          ]);
        }

        const id = e.features[0].id || 0;
        map.current.setFilter("world-hover", ["==", ["get", "feature_id"], id]);
        setHoveredStateId(id as number);
        map.current.getCanvas().style.cursor = "pointer";
      } catch (error) {
        console.warn("Error in mousemove event:", error);
      }
    });

    // Mouse leave handler
    map.current.on("mouseleave", "world-fills", () => {
      if (!map.current) return;

      try {
        if (hoveredStateId !== null) {
          map.current.setFilter("world-hover", [
            "==",
            ["get", "feature_id"],
            -1,
          ]);
        }
        setHoveredStateId(null);
        map.current.getCanvas().style.cursor = "";
      } catch (error) {
        console.warn("Error in mouseleave event:", error);
      }
    });

    // Country click handler
    map.current.on("click", "world-fills", (e) => {
      if (!map.current || !e.features?.length) return;

      try {
        handleCountryClick(e, projectData);
      } catch (error) {
        console.error("Error in country click handler:", error);
      }
    });

    // Project point click handler
    map.current.on("click", "project-points", (e) => {
      if (!map.current || !e.features?.length) return;
      handleProjectClick(e);
    });
  };

  const handleCountryClick = (
    e: mapboxgl.MapMouseEvent,
    projectData: ProjectData
  ) => {
    if (!map.current || !e.features?.length) return;

    // Remove existing popups
    const existingPopups = document.getElementsByClassName("mapboxgl-popup");
    Array.from(existingPopups).forEach((popup) => popup.remove());

    const feature = e.features[0] as mapboxgl.MapboxGeoJSONFeature;
    const countryName = feature.properties?.NAME || "Unknown Country";
    const featureId = feature.id || feature.properties?.feature_id;

    // Find matching projects
    const matchingProjects = projectData.features.filter((project) =>
      project.properties.Country.toLowerCase().includes(
        countryName.toLowerCase()
      )
    );

    if (matchingProjects.length === 0) {
      console.log(`No projects found in ${countryName}`);
      return;
    }

    // Calculate statistics
    const stats = calculateProjectStats(matchingProjects);

    // Create popup content
    const html = createPopupHTML(countryName, matchingProjects, stats);

    // Position and show popup
    showPopup(feature, html, featureId);
  };

  const handleProjectClick = (e: mapboxgl.MapMouseEvent) => {
    if (!e.features?.length) return;

    // Remove existing popups
    const existingPopups = document.getElementsByClassName("mapboxgl-popup");
    Array.from(existingPopups).forEach((popup) => popup.remove());

    const feature = e.features[0] as mapboxgl.MapboxGeoJSONFeature;
    const properties = feature.properties!;
    const coordinates = (
      feature.geometry as GeoJSON.Point
    ).coordinates.slice() as [number, number];

    // Parse properties
    const projects =
      typeof properties.projects === "string"
        ? JSON.parse(properties.projects)
        : properties.projects;

    const sectors =
      typeof properties.sectors === "string"
        ? JSON.parse(properties.sectors)
        : properties.sectors;

    const partners =
      typeof properties.partners === "string"
        ? JSON.parse(properties.partners)
        : properties.partners;

    const html = createProjectPopupHTML(
      properties,
      projects,
      sectors,
      partners
    );

    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      className: "custom-popup",
      maxWidth: "320px",
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map.current!);
  };

  const calculateProjectStats = (projects: ProjectFeature[]) => {
    const totalBudget = projects.reduce(
      (sum, project) => sum + project.properties.Budget,
      0
    );
    const totalBeneficiaries = projects.reduce(
      (sum, project) => sum + project.properties.Beneficiaries,
      0
    );

    const sectors = [
      ...new Set(projects.map((project) => project.properties.Sector)),
    ];
    const partners = [
      ...new Set(
        projects.map((project) => project.properties["Implementing Partner"])
      ),
    ];

    return { totalBudget, totalBeneficiaries, sectors, partners };
  };

  const createPopupHTML = (
    countryName: string,
    projects: ProjectFeature[],
    stats: ReturnType<typeof calculateProjectStats>
  ): string => {
    const projectsList = projects
      .map((project) => `<li>${project.properties["Project Name"]}</li>`)
      .join("");

    const sectorsList = stats.sectors
      .map((sector) => `<li>${sector}</li>`)
      .join("");

    const partnersList = stats.partners
      .map((partner) => `<li>${partner}</li>`)
      .join("");

    return `
      <div class="popup-content">
        <h3 class="popup-title">${countryName}</h3>
        <div class="popup-body">
          <div class="popup-stats">
            <div class="stat-item">
              <span class="stat-label">Total Budget</span>
              <span class="stat-value budget">$${stats.totalBudget.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Beneficiaries</span>
              <span class="stat-value beneficiaries">${stats.totalBeneficiaries.toLocaleString()}</span>
            </div>
          </div>
          <div class="popup-details">
            <div class="section">
              <h4>Projects (${projects.length})</h4>
              <ul class="project-list">${projectsList}</ul>
            </div>
            <div class="section">
              <h4>Sectors</h4>
              <ul class="sector-list">${sectorsList}</ul>
            </div>
            <div class="section">
              <h4>Implementing Partners</h4>
              <ul class="partner-list">${partnersList}</ul>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const createProjectPopupHTML = (
    properties: Record<string, unknown>,
    projects: ProjectProperties[],
    sectors: string[],
    partners: string[]
  ): string => {
    const budget = parseInt(String(properties.totalBudget)).toLocaleString();
    const beneficiaries = parseInt(
      String(properties.totalBeneficiaries)
    ).toLocaleString();

    const projectsList = Array.isArray(projects)
      ? projects
          .map((project) => `<li>${project["Project Name"]}</li>`)
          .join("")
      : "";

    const sectorsList = Array.isArray(sectors)
      ? sectors.map((sector) => `<li>${sector}</li>`).join("")
      : "";

    const partnersList = Array.isArray(partners)
      ? partners.map((partner) => `<li>${partner}</li>`).join("")
      : "";

    return `
      <div class="popup-content">
        <h3 class="popup-title">${properties.country}</h3>
        <div class="popup-body">
          <div class="popup-stats">
            <div class="stat-item">
              <span class="stat-label">Total Budget</span>
              <span class="stat-value budget">$${budget}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Beneficiaries</span>
              <span class="stat-value beneficiaries">${beneficiaries}</span>
            </div>
          </div>
          <div class="popup-details">
            <div class="section">
              <h4>Projects (${
                Array.isArray(projects) ? projects.length : 0
              })</h4>
              <ul class="project-list">${projectsList}</ul>
            </div>
            <div class="section">
              <h4>Sectors</h4>
              <ul class="sector-list">${sectorsList}</ul>
            </div>
            <div class="section">
              <h4>Implementing Partners</h4>
              <ul class="partner-list">${partnersList}</ul>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const showPopup = (
    feature: mapboxgl.MapboxGeoJSONFeature,
    html: string,
    featureId: string | number
  ) => {
    if (!map.current) return;

    // Calculate bounds and position
    const bounds = new mapboxgl.LngLatBounds();
    const coordinates = (feature.geometry as GeoJSON.Polygon).coordinates[0];
    coordinates.forEach((coord) => {
      bounds.extend([coord[0], coord[1]]);
    });

    const center = bounds.getCenter();
    const east = bounds.getEast();
    const popupLngLat = new mapboxgl.LngLat(east + 0.5, center.lat);

    // Create and show popup
    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      className: "custom-popup",
      maxWidth: "320px",
    })
      .setLngLat(popupLngLat)
      .setHTML(html)
      .addTo(map.current);

    // Adjust map view
    map.current.easeTo({
      center: [center.lng + 1, center.lat],
      padding: { left: 50, right: 350 },
      duration: 1000,
    });

    // Highlight country
    map.current.setFilter("world-hover", [
      "==",
      ["get", "feature_id"],
      featureId,
    ]);
    setHoveredStateId(featureId as number);
  };

  const focusOnCountry = (countryName: string) => {
    if (!map.current) return;

    setSelectedCountry(countryName);

    // Find country bounds and center map
    // For now, we'll use a simple approach - in production, you'd want to calculate actual bounds
    const countryCoordinates: Record<
      string,
      { center: [number, number]; zoom: number }
    > = {
      Afghanistan: { center: [69.2075, 34.5553], zoom: 5 },
      Iraq: { center: [44.0, 33.0], zoom: 5 },
      Syria: { center: [38.0, 35.0], zoom: 6 },
      Yemen: { center: [47.0, 15.5], zoom: 6 },
      Ukraine: { center: [31.0, 49.0], zoom: 5 },
      Somalia: { center: [46.0, 5.0], zoom: 5 },
      Ethiopia: { center: [40.0, 9.0], zoom: 5 },
      Kenya: { center: [37.9, -0.03], zoom: 5 },
    };

    const countryData = countryCoordinates[countryName];
    if (countryData) {
      map.current.easeTo({
        center: countryData.center,
        zoom: countryData.zoom,
        duration: 1500,
      });
    }
  };

  const resetView = () => {
    if (!map.current) return;

    setSelectedCountry(null);
    map.current.easeTo({
      center: WORLD_CENTER,
      zoom: DEFAULT_ZOOM,
      duration: 1500,
    });
  };

  return (
    <div className="map-container">
      {/* Country Filter Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-2">Filter by Country</h3>
        <div className="space-y-2">
          <button
            onClick={resetView}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCountry === null
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            🌍 All Countries
          </button>
          {countries.map((country) => (
            <button
              key={country}
              onClick={() => focusOnCountry(country)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedCountry === country
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              📍 {country}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="map-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Map Configuration Error</h3>
            <p>{error}</p>
            {error.includes("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN") && (
              <div className="error-instructions">
                <h4>How to fix this:</h4>
                <ol>
                  <li>
                    Get a Mapbox access token from{" "}
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Mapbox Account
                    </a>
                  </li>
                  <li>
                    Create a <code>.env.local</code> file in your project root
                  </li>
                  <li>
                    Add:{" "}
                    <code>
                      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
                    </code>
                  </li>
                  <li>Restart your development server</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      ) : isLoading ? (
        <div className="map-loader">
          <div className="loader-content">
            <div className="spinner"></div>
            <p>Loading map data...</p>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .map-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 0, 0, 0.2);
          z-index: 1000;
          text-align: center;
          min-width: 400px;
          max-width: 600px;
        }

        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .error-icon {
          font-size: 48px;
        }

        .map-error h3 {
          margin: 0;
          color: #dc2626;
          font-size: 24px;
          font-weight: 600;
        }

        .map-error p {
          margin: 0;
          color: #374151;
          font-size: 16px;
          line-height: 1.5;
        }

        .error-instructions {
          text-align: left;
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
        }

        .error-instructions h4 {
          margin: 0 0 15px 0;
          color: #dc2626;
          font-size: 16px;
        }

        .error-instructions ol {
          margin: 0;
          padding-left: 20px;
        }

        .error-instructions li {
          margin: 8px 0;
          color: #374151;
          line-height: 1.5;
        }

        .error-instructions code {
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: "Monaco", "Consolas", monospace;
          font-size: 14px;
        }

        .error-instructions a {
          color: #2563eb;
          text-decoration: underline;
        }

        .map-loader {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 1000;
          text-align: center;
          min-width: 200px;
        }

        .loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top: 3px solid #e63946;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .map-loader p {
          margin: 0;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div ref={mapContainer} className="w-full h-screen relative" />
    </div>
  );
};

export default MapboxMap;
