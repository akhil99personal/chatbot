// Milestono AI chat API — hits the main server at /api/ai/*
// In CRA, the proxy is set in package.json or via REACT_APP_BASE_URL.

const BASE = process.env.REACT_APP_BASE_URL || "";

let lastSearchProperties = [];

export function setLastSearchProperties(properties) {
  lastSearchProperties = Array.isArray(properties) ? properties : [];
}

export function getLastSearchProperties() {
  return lastSearchProperties;
}

/** Turn API / network errors into user-friendly chat messages */
export function formatChatError(err) {
  let msg = "";
  if (err && typeof err === "object") {
    msg = err.message || err.error || "";
    if (err.description) msg += " - " + err.description;
  } else {
    msg = String(err || "");
  }

  // Safe JSON extraction: if the message itself is a JSON string
  const trimmed = msg.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      msg = parsed.message || parsed.error || parsed.msg || msg;
    } catch (e) {
      // Keep as is
    }
  }

  if (!msg) {
    msg = "Something went wrong. Please try again.";
  }

  const lowerMsg = msg.toLowerCase();

  // 1. Location / Geolocation Errors
  if (
    lowerMsg.includes("latitude") ||
    lowerMsg.includes("longitude") ||
    lowerMsg.includes("radius") ||
    lowerMsg.includes("geolocation") ||
    lowerMsg.includes("user denied") ||
    lowerMsg.includes("permission denied") ||
    lowerMsg.includes("position unavailable")
  ) {
    return "For your request, I wanted location coordinates, or you can simply type a city or area name and I can give you the best results based on it.";
  }

  // 2. Network / Offline Errors
  if (
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("networkerror") ||
    lowerMsg.includes("network error") ||
    lowerMsg.includes("econnrefused") ||
    lowerMsg.includes("dns")
  ) {
    return "I couldn't reach the server. Please check your internet connection and verify that the backend is running.";
  }

  // 3. AI Service / Gemini / API Key Errors
  if (
    lowerMsg.includes("gemini") ||
    lowerMsg.includes("api key") ||
    lowerMsg.includes("model unavailable") ||
    lowerMsg.includes("vertex")
  ) {
    return "The AI service is temporarily unavailable. Property searches, filters, and maps are still fully active — please try asking for properties by city or landmark.";
  }

  // 4. Session / Auth Errors
  if (
    lowerMsg.includes("401") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("token expired") ||
    lowerMsg.includes("invalid token")
  ) {
    return "Your session has expired. Please log in again to access saved properties, dashboards, and profile features.";
  }

  // 5. Rate limit / Quota Errors
  if (
    lowerMsg.includes("429") ||
    lowerMsg.includes("quota") ||
    lowerMsg.includes("too many requests") ||
    lowerMsg.includes("rate limit")
  ) {
    return "I'm receiving too many queries right now. Please wait a brief moment and try again.";
  }

  // 6. Endpoint / Router Errors
  if (
    lowerMsg.includes("<!doctype") ||
    lowerMsg.includes("not found") ||
    lowerMsg.includes("404") ||
    lowerMsg.includes("500") ||
    lowerMsg.includes("internal server error")
  ) {
    return "The backend service encountered an issue. Please try again in a few seconds.";
  }

  // 7. Clean up other backend messages (e.g. Mongoose validation errors)
  if (msg.includes("validation failed") || msg.includes("Validator failed")) {
    const cleanMsg = msg.split(":").pop().trim();
    if (cleanMsg) return cleanMsg;
  }

  return msg.length > 200 ? `${msg.slice(0, 197)}...` : msg;
}

/** Get auth token from localStorage */
export function getAuthToken() {
  try {
    return localStorage.getItem("auth") || null;
  } catch {
    return null;
  }
}

/** Check if user is logged in */
export function isLoggedIn() {
  return !!getAuthToken();
}

/** Get user profile from the server */
export async function getUserProfile() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}/api/user-data`, {
      headers: { Authorization: token },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Normalize the shape for our components
    return {
      fullName: data.userFullName || data.fullName || null,
      name: data.userFullName || data.name || null,
      email: data.email || null,
      premiumPlan: data.premiumAccountName || null,
      premiumEndDate: data.premiumEndDate || null,
      stats: {
        countOfPostedProperty: data.countOfPostedProperty || 0,
        countOfSavedProperty: data.countOfSavedProperty || 0,
        countOfContactedProperty: data.countOfContactedProperty || 0,
        countOfRequestedService: data.countOfRequestedService || 0,
      },
    };
  } catch {
    return null;
  }
}

export async function streamChat({ messages, signal, onChunk }) {
  const headers = { "Content-Type": "application/json" };

  // Send auth token if user is logged in
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = token;
  }

  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    let err = await res.text().catch(() => "");
    if (err.includes("<!DOCTYPE html>") || err.includes("<html")) {
      throw new Error("The AI service is currently unavailable or the endpoint could not be found. Please check your server connection.");
    }
    try {
      const parsed = JSON.parse(err);
      throw new Error(parsed.error || parsed.message || `Chat failed (${res.status})`);
    } catch {
      throw new Error(err || `Chat failed (${res.status})`);
    }
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onChunk?.(full);
    }
  }
  return full;
}

export async function health() {
  const r = await fetch(`${BASE}/api/ai/health`);
  return r.json();
}

/** Get browser geolocation as { latitude, longitude } */
export function getCurrentPosition(options = {}) {
  const { timeout = 10000, enableHighAccuracy = true } = options;
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout, enableHighAccuracy });
  });
}

/** Search properties near coordinates via the main property API */
export async function searchNearbyProperties({ latitude, longitude, radiusKm = 5 }) {
  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = token;

  const res = await fetch(`${BASE}/api/search_properties`, {
    method: "POST",
    headers,
    body: JSON.stringify({ latitude, longitude, radius: radiusKm }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `Property search failed (${res.status})`);
  }
  return res.json();
}

/** Search all properties in a city by name */
export async function searchPropertiesByCity(city, filters = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = token;

  const res = await fetch(`${BASE}/api/search_properties`, {
    method: "POST",
    headers,
    body: JSON.stringify({ city: city.trim(), ...filters }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `City search failed (${res.status})`);
  }
  return res.json();
}

/** Fetch multiple properties by MongoDB ids */
export async function fetchPropertiesByIds(ids) {
  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = token;

  const res = await fetch(`${BASE}/api/properties_by_ids`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `Failed to load properties (${res.status})`);
  }
  return res.json();
}

/** Extract city name from natural-language property search queries */
export function extractCityFromQuery(text) {
  if (!text) return null;
  const patterns = [
    /(?:give\s+me|show\s+me|find|search|list|get)\s+(?:all\s+)?(?:the\s+)?(?:properties|property|flat|flats|house|houses|homes|apartment|apartments|villa|villas|plot|plots|bhk)[^\w]*(?:in|at|near|around|from)\s+([a-zA-Z][a-zA-Z\s.-]{1,40})/i,
    /(?:properties|property|flat|flats|house|houses|homes|apartment|apartments|villa|villas|plot|plots|bhk)\s+(?:in|at|near|around|from)\s+([a-zA-Z][a-zA-Z\s.-]{1,40})/i,
    /(?:in|at)\s+([a-zA-Z][a-zA-Z\s.-]{1,40})\s+(?:properties|property|flat|flats|house|houses|homes|apartment|apartments|villa|villas|plot|plots|bhk)/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match?.[1]) {
      const city = match[1]
        .trim()
        .replace(/\s+(please|under|below|for|with|and|or|near|around).*$/i, "")
        .replace(/[?.!,]+$/, "")
        .trim();
      if (city.length >= 2 && city.length <= 40) return city;
    }
  }
  return null;
}

export function isCityPropertyQuery(text) {
  if (isNearbyPropertyQuery(text)) return false;
  return !!extractCityFromQuery(text);
}

/** Contextual loading message while the assistant searches */
export function getChatSearchStatusMessage(text) {
  if (isNearbyPropertyQuery(text)) return "Finding properties near you…";
  const city = extractCityFromQuery(text);
  if (city) return `Searching all properties in ${city}…`;
  if (/compare/i.test(text)) return "Comparing properties for you…";
  if (/(direction|route|navigate)/i.test(text)) return "Calculating route to property…";
  if (/(map|map view)/i.test(text)) return "Loading property map…";
  if (/detail|info|about/i.test(text)) return "Fetching property details…";
  if (/saved|contacted/i.test(text)) return "Loading your properties…";
  if (/emi|calculator|stamp|tds|afford/i.test(text)) return "Calculating for you…";
  return "Finding the best results for you…";
}

export function formatCityPropertyResponse({ city, properties }) {
  setLastSearchProperties(properties);
  const count = properties.length;
  const intro = count
    ? `Here are **${count}** ${count === 1 ? "property" : "properties"} in **${city}**:`
    : `I couldn't find any properties in **${city}**. Try another city or broaden your search.`;

  if (count === 0) return intro;

  const propsCard = {
    card: "properties",
    intro: `Properties in ${city}:`,
    items: properties,
    totalCount: count,
    hasMore: false,
  };

  const withCoords = properties.filter((p) => p.latitude && p.longitude);
  const parts = [intro, `\n\`\`\`json\n${JSON.stringify(propsCard)}\n\`\`\``];

  if (withCoords.length > 0) {
    const avgLat = withCoords.reduce((s, p) => s + Number(p.latitude), 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, p) => s + Number(p.longitude), 0) / withCoords.length;
    const mapCard = {
      card: "nearby_map",
      title: `Properties in ${city}`,
      latitude: avgLat,
      longitude: avgLng,
      radiusKm: 15,
      properties: withCoords.map((p) => ({
        id: p._id,
        _id: p._id,
        heading: p.heading,
        expectedPrice: p.expectedPrice,
        pricePerMonth: p.pricePerMonth,
        sellType: p.sellType,
        bedrooms: p.bedrooms,
        latitude: p.latitude,
        longitude: p.longitude,
        uploadedPhotos: p.uploadedPhotos,
        city: p.city,
        landmark: p.landmark,
      })),
    };
    parts.push(`\n\`\`\`json\n${JSON.stringify(mapCard)}\n\`\`\``);
  }

  parts.push("\nEach property has a **#code** on its card. Ask `details <code>` or `compare <code1> and <code2>`.");
  return parts.join("");
}

export function isNearbyPropertyQuery(text) {
  const t = text.toLowerCase();
  const hasLocationIntent = /near\s*me|nearby|near\s*by|around\s*me|close\s*to\s*me|aas\s*pass|mere\s*paas|javal\s*pas/i.test(t);
  const hasPropertyIntent = /propert|flat|apartment|house|home|villa|plot|bhk|rent|buy/i.test(t);
  const isGenericNearbySearch = /give\s+me|show\s+me|find|search|list|get/i.test(t);
  return hasLocationIntent && (hasPropertyIntent || isGenericNearbySearch);
}

export function formatNearbyPropertyResponse({ latitude, longitude, properties, radiusKm = 5 }) {
  setLastSearchProperties(properties);
  const count = properties.length;
  const intro = count
    ? `Here are **${count}** ${count === 1 ? "property" : "properties"} within **${radiusKm} km** of your current location:`
    : `I couldn't find any properties within **${radiusKm} km** of your location. Try searching by city or area instead (e.g. "3 BHK flats in Pune").`;

  if (count === 0) return intro;

  const propsCard = {
    card: "properties",
    intro: "Properties near you:",
    items: properties,
    totalCount: count,
    hasMore: count > 12,
  };

  const mapCard = {
    card: "nearby_map",
    title: "Properties Near You",
    latitude,
    longitude,
    radiusKm,
    properties: properties.map((p) => ({
      id: p._id,
      _id: p._id,
      heading: p.heading,
      expectedPrice: p.expectedPrice,
      pricePerMonth: p.pricePerMonth,
      sellType: p.sellType,
      bedrooms: p.bedrooms,
      latitude: p.latitude,
      longitude: p.longitude,
      uploadedPhotos: p.uploadedPhotos,
      city: p.city,
      landmark: p.landmark,
    })),
  };

  return [
    intro,
    `\n\`\`\`json\n${JSON.stringify(propsCard)}\n\`\`\``,
    `\n\`\`\`json\n${JSON.stringify(mapCard)}\n\`\`\``,
    "\nEach property has a **#code** on its card (e.g. `#saj2e3`). Ask `details saj2e3` for full info, or `compare saj2e3 and jkj2jn` to compare two properties.",
  ].join("");
}

/**
 * Normalizes and resolves image paths returned by the database.
 * Converts local development hosts to the configured client API base,
 * leaves complete external URLs or base64 data URIs intact,
 * and prefixes relative paths (uploads/...) with process.env.REACT_APP_BASE_URL.
 */
export function resolveImageUrl(path) {
  if (!path) return null;
  const baseUrl = process.env.REACT_APP_BASE_URL || "https://api.milestono.com:6005";
  
  // Convert any string representing a local development host to the client's configured base URL
  if (path.startsWith("http://localhost:") || path.startsWith("https://localhost:")) {
    return path.replace(/^https?:\/\/localhost:\d+/, baseUrl);
  }
  
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}