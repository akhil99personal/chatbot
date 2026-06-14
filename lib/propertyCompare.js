/** Score and format properties for the compare card (mirrors server logic). */

export function scoreProperty(p) {
  let score = 50;
  const price = parseFloat(String(p.expectedPrice || p.pricePerMonth || "0").replace(/[^0-9.]/g, "")) || 0;
  const area = parseFloat(String(p.carpetArea || p.areaSqft || "0").replace(/[^0-9.]/g, "")) || 0;
  const ppsqft = area > 0 && price > 0 ? price / area : 0;
  const amenityCount = (p.amenities || []).length + (p.selectedRoom || []).length;
  const photoCount = (p.uploadedPhotos || []).length;

  if (p.featured) score += 10;
  if (amenityCount >= 8) score += 10;
  else if (amenityCount >= 5) score += 7;
  else if (amenityCount >= 3) score += 4;
  if (photoCount >= 5) score += 5;
  else if (photoCount >= 3) score += 3;
  if (p.selectedFurnishing === "Furnished") score += 8;
  else if (p.selectedFurnishing === "Semi-Furnished") score += 5;
  if (p.latitude && p.longitude) score += 3;
  if (p.uniqueFeatures) score += 2;

  score = Math.min(score, 100);

  return {
    _id: String(p._id),
    heading: p.heading,
    city: p.city,
    landmark: p.landmark,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    carpetArea: p.carpetArea || p.areaSqft,
    price,
    priceFormatted: price ? `₹${price.toLocaleString("en-IN")}` : "N/A",
    pricePerSqft: ppsqft ? `₹${Math.round(ppsqft).toLocaleString("en-IN")}` : "N/A",
    sellType: p.sellType,
    propertyCategory: p.propertyCategory,
    furnishing: p.selectedFurnishing || "N/A",
    amenities: (p.amenities || []).slice(0, 6),
    amenityCount,
    facing: p.facing || "N/A",
    floorInfo: p.floorNo && p.totalFloors ? `${p.floorNo} of ${p.totalFloors}` : "N/A",
    featured: !!p.featured,
    photoCount,
    firstPhoto: (p.uploadedPhotos || [])[0] || null,
    score,
    propertyContains: Array.isArray(p.propertyContains) ? p.propertyContains[0] : p.propertyContains,
  };
}

export function buildCompareCardData(properties, codes = []) {
  const scored = properties.map(scoreProperty);
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const codeLabel = codes.length ? ` (${codes.join(" vs ")})` : "";

  return {
    card: "compare",
    properties: scored,
    fullProperties: properties,
    codes,
    winner: { id: winner._id, heading: winner.heading, score: winner.score },
    recommendation: `Based on price, amenities, photos, and overall value${codeLabel}, **${winner.heading || "Property 1"}** is the best pick with a score of **${winner.score}/100**.`,
  };
}
