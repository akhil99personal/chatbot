import React, { useEffect, useState, useRef } from "react";
import { GoogleMap, Marker, Circle, InfoWindow } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

import dummyImg from "../../../images/dummyImage.webp";
import { resolveImageUrl } from "../../lib/api.js";
import PropTypes from "prop-types";

import { Eye, BedDouble, Tag } from "lucide-react"


const mapContainerStyle = {
  width: "100%",
  height: "320px",
  borderRadius: "14px",
};

export default function NearbyMapCard({ data }) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(!!window.google);
  const [scriptError, setScriptError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const mapRef = useRef(null);

  // Ensure Google Maps script is loaded and handle errors
  useEffect(() => {
    if (window.google) {
      setLoaded(true);
      return;
    }
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      const check = setInterval(() => {
        if (window.google) {
          setLoaded(true);
          clearInterval(check);
        }
      }, 100);
      const handleLoad = () => {
        setLoaded(true);
        clearInterval(check);
      };
      existing.addEventListener("load", handleLoad);
      const handleError = () => {
        setScriptError(true);
        clearInterval(check);
      };
      existing.addEventListener("error", handleError);
      return () => {
        existing.removeEventListener("load", handleLoad);
        existing.removeEventListener("error", handleError);
        clearInterval(check);
      };
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&libraries=geometry,places`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, []);
  let userLat = Number(data.latitude || 0);
  let userLng = Number(data.longitude || 0);
  const radiusMeters = Number(data.radiusKm || 5) * 1000;
  const properties = data.properties || [];




  if (scriptError) {
    return (
      <div className="cb-map-error">
        <p>Unable to load Google Maps. Please check your API key and network connection.</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="cb-map-placeholder">
        <span className="cb-map-spinner" />
        <span>Loading map view…</span>
      </div>
    );
  }

  const parsedProperties = properties
    .map((p) => {
      const lng = p.longitude != null ? p.longitude : p.location?.coordinates?.[0];
      const lat = p.latitude != null ? p.latitude : p.location?.coordinates?.[1];
      if (lat == null || lng == null) return null;
      return {
        ...p,
        coords: { lat: Number(lat), lng: Number(lng) },
      };
    })
    .filter(Boolean);

  if (userLat === 0 && userLng === 0) {
    if (parsedProperties.length > 0) {
      const sumLat = parsedProperties.reduce((sum, p) => sum + p.coords.lat, 0);
      const sumLng = parsedProperties.reduce((sum, p) => sum + p.coords.lng, 0);
      userLat = sumLat / parsedProperties.length;
      userLng = sumLng / parsedProperties.length;
    } else {
      userLat = 18.5204; // default Pune
      userLat = 18.5204;
      userLng = 73.8567;
    }
  }

  const mapCenter = { lat: userLat, lng: userLng };

  const isCitySearch = !data.latitude && !data.longitude;
  const showCenterMarker = isCitySearch ? false : (data.showUserMarker ?? true);
  const showRadiusCircle = isCitySearch ? false : (data.showCircle ?? true);

  // Determine appropriate zoom level
  const baseZoom = isCitySearch ? 12 : 13;
  const zoom = data.properties && data.properties.length > 10 ? 11 : baseZoom;

  return (
    <div className="cb-map-card">
      <div className="cb-map-card-header">
        <i className="fa-solid fa-map-location-dot text-indigo-600 mr-2" />
        <span>{data.title || `Properties Map View (${parsedProperties.length} found)`}</span>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {showCenterMarker && (
          <Marker
            position={mapCenter}
            title="Search Center"
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {showRadiusCircle && (
          <Circle
            center={mapCenter}
            radius={radiusMeters}
            options={{
              strokeColor: "#323a82",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#323a82",
              fillOpacity: 0.15,
              clickable: false,
            }}
          />
        )}

        {parsedProperties.map((p) => (
          <Marker
            key={p._id || p.id}
            position={p.coords}
            title={p.heading}
            onClick={() => setSelectedProperty(p)}
          />
        ))}

        {selectedProperty && (
          <InfoWindow
            position={selectedProperty.coords}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="cb-map-info-window">
              <img
                src={
                  Array.isArray(selectedProperty.uploadedPhotos) &&
                    selectedProperty.uploadedPhotos.length > 0
                    ? resolveImageUrl(selectedProperty.uploadedPhotos[0])
                    : dummyImg
                }
                alt={selectedProperty.heading}
                className="cb-map-info-img"
              />
              <div className="cb-map-info-content">
                <h4 className="cb-map-info-title">{selectedProperty.heading}</h4>
                <div className="cb-map-info-meta">
                  <span>
                    <BedDouble className="h-3 w-3 inline mr-1" />
                    {selectedProperty.bedrooms} BHK
                  </span>
                  <span className="cb-map-info-price">
                    <Tag className="h-3 w-3 inline mr-1" />
                    {selectedProperty.expectedPrice
                      ? `₹${Number(selectedProperty.expectedPrice).toLocaleString("en-IN")}`
                      : selectedProperty.price || "N/A"}
                  </span>
                </div>
                <button
                  className="cb-map-info-btn"
                  onClick={() => navigate(`/details/${selectedProperty._id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Details
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

NearbyMapCard.propTypes = {
  data: PropTypes.shape({
    latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    radiusKm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    properties: PropTypes.array,
    title: PropTypes.string,
    showUserMarker: PropTypes.bool,
    showCircle: PropTypes.bool,
  }).isRequired,
};
