import {
  fetchPropertiesByIds,
  getLastSearchProperties,
} from "./api.js";
import {
  extractCodesFromMessage,
  lookupPropertyCode,
  getOrCreatePropertyCode,
  resolveComparisonCodes,
  resolvePropertyCodeFromContext,
} from "./propertyCodes.js";
import { buildCompareCardData } from "./propertyCompare.js";

export function isCompareQuery(text) {
  return /compare|comparison|versus|vs\b|difference between/i.test(text);
}

export function isDirectionsQuery(text) {
  return /(direction|directions|route|navigate|how\s+to\s+get|way\s+to|drive\s+to|reach|take\s+me\s+to)/i.test(text);
}

export function isPropertiesMapQuery(text) {
  return /(show\s+(?:me\s+)?(?:a\s+)?map|map\s+of|map\s+view|plot\s+on\s+map|these\s+properties|property\s+locations|where\s+are\s+(?:these|the)\s+propert)/i.test(text);
}

export function extractSingleCode(text) {
  return resolvePropertyCodeFromContext(text);
}

function wrapCard(cardData, intro = "") {
  const parts = intro ? [intro] : [];
  parts.push(`\n\`\`\`json\n${JSON.stringify(cardData)}\n\`\`\``);
  return parts.join("");
}

function wrapCards(cards, intro = "") {
  const parts = intro ? [intro] : [];
  for (const card of cards) {
    parts.push(`\n\`\`\`json\n${JSON.stringify(card)}\n\`\`\``);
  }
  return parts.join("");
}

export async function handleCompareByCodes(text) {
  const codes = resolveComparisonCodes(text);
  if (codes.length < 2) {
    return "Please search for properties first, or specify at least **two property codes** to compare (e.g. `compare abc123 and def456`).";
  }
  if (codes.length > 3) {
    return "You can compare up to **3 properties** at a time. Please use fewer codes.";
  }

  const ids = codes.map((c) => lookupPropertyCode(c)?.propertyId).filter(Boolean);
  if (ids.length < codes.length) {
    return "One or more property codes were not found in this session. Search for properties first, then use the **#codes** shown on each card.";
  }

  const properties = await fetchPropertiesByIds(ids);
  if (properties.length < 2) {
    return "Could not load enough properties to compare. The listings may have been removed.";
  }

  const ordered = ids.map((id) => properties.find((p) => String(p._id) === String(id))).filter(Boolean);
  const card = buildCompareCardData(ordered, codes);
  return wrapCard(card, `Here is a side-by-side comparison of **${codes.join("** vs **")}**:`);
}

export async function handleDirections(text, getPosition) {
  const code = extractSingleCode(text);
  if (!code) {
    return "Please mention a property **#code** for directions (e.g. `directions to abc123`).";
  }

  const entry = lookupPropertyCode(code);
  if (!entry) {
    return `Property code **${code}** was not found in this session. Search properties first to get codes.`;
  }

  let userLat;
  let userLng;
  try {
    const pos = await getPosition({ timeout: 10000, enableHighAccuracy: true });
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;
  } catch (err) {
    const denied = err?.code === 1;
    return denied
      ? "I need your location to show directions. Please allow location access, then try again."
      : `Couldn't get your location: ${err.message || "unknown error"}`;
  }

  const [property] = await fetchPropertiesByIds([entry.propertyId]);
  if (!property) return "Property not found.";
  if (!property.latitude || !property.longitude) {
    return "This property doesn't have map coordinates yet, so directions cannot be shown.";
  }

  const card = {
    card: "directions_map",
    title: `Route to ${property.heading || "Property"}`,
    propertyCode: code,
    userLatitude: userLat,
    userLongitude: userLng,
    property: {
      _id: property._id,
      heading: property.heading,
      latitude: property.latitude,
      longitude: property.longitude,
      landmark: property.landmark,
      city: property.city,
      uploadedPhotos: property.uploadedPhotos,
    },
  };

  return wrapCard(
    card,
    `Showing driving directions from your location to **${property.heading || code}** (#${code}):`,
  );
}

export async function handlePropertiesMap(text) {
  const codes = extractCodesFromMessage(text);
  let properties = [];

  if (codes.length > 0) {
    const ids = codes.map((c) => lookupPropertyCode(c)?.propertyId).filter(Boolean);
    if (ids.length) properties = await fetchPropertiesByIds(ids);
  } else {
    properties = getLastSearchProperties();
  }

  const withCoords = properties.filter((p) => p.latitude && p.longitude);
  if (withCoords.length === 0) {
    return "No properties with map locations available. Search for properties first, or mention property **#codes**.";
  }

  const avgLat = withCoords.reduce((s, p) => s + Number(p.latitude), 0) / withCoords.length;
  const avgLng = withCoords.reduce((s, p) => s + Number(p.longitude), 0) / withCoords.length;

  const mapCard = {
    card: "nearby_map",
    title: codes.length ? `Map — ${codes.map((c) => `#${c}`).join(", ")}` : `Properties Map (${withCoords.length})`,
    latitude: avgLat,
    longitude: avgLng,
    radiusKm: 10,
    showUserMarker: false,
    showCircle: false,
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

  return wrapCard(mapCard, `Here is the map view for **${withCoords.length}** ${withCoords.length === 1 ? "property" : "properties"}:`);
}

/** Register codes for properties returned in search results */
export function registerSearchPropertyCodes(properties) {
  if (!Array.isArray(properties)) return;
  properties.forEach((p) => getOrCreatePropertyCode(p));
}
