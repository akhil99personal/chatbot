import React from "react";
import NewPropertyCard from "../../../user-pages/searchpage/NewPropertyCard.jsx";

/** Chat wrapper — same NewPropertyCard as /search, only adds chatMode for #code overlay */
function PropertyCard({ property, viewMode = "card" }) {
  if (!property) return null;
  return <NewPropertyCard property={property} viewMode={viewMode} chatMode />;
}

function propertyFingerprint(property, viewMode) {
  if (!property) return "";
  const id = property._id || property.id || "";
  const photo = Array.isArray(property.uploadedPhotos)
    ? property.uploadedPhotos[0]
    : property.uploadedPhotos || "";
  return `${id}|${photo}|${viewMode}`;
}

export default React.memo(
  PropertyCard,
  (prev, next) =>
    propertyFingerprint(prev.property, prev.viewMode) === propertyFingerprint(next.property, next.viewMode),
);
