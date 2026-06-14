import { useEffect, useState } from "react";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { Navigation, MapPin, Eye } from "lucide-react";
import { resolveImageUrl } from "../../lib/api.js";
import dummyImg from "../../../images/dummyImage.webp";

const mapStyle = { width: "100%", height: "360px", borderRadius: "14px" };

function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      existing.addEventListener("error", () => {
        clearInterval(check);
        reject(new Error("Maps failed to load"));
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&libraries=geometry,places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Maps failed to load"));
    document.head.appendChild(script);
  });
}

export default function DirectionsMapCard({ data }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(!!window.google?.maps);
  const [error, setError] = useState("");
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const userLat = Number(data.userLatitude);
  const userLng = Number(data.userLongitude);
  const prop = data.property || {};
  const propLat = Number(prop.latitude);
  const propLng = Number(prop.longitude);
  const origin = { lat: userLat, lng: userLng };
  const destination = { lat: propLat, lng: propLng };

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!ready || !userLat || !propLat) return;
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteInfo({
              distance: leg.distance?.text,
              duration: leg.duration?.text,
            });
          }
        } else {
          setError("Could not calculate a driving route. Try opening in Google Maps.");
        }
      },
    );
  }, [ready, userLat, userLng, propLat, propLng]);

  const photo = Array.isArray(prop.uploadedPhotos) && prop.uploadedPhotos[0]
    ? resolveImageUrl(prop.uploadedPhotos[0])
    : dummyImg;

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${propLat},${propLng}&travelmode=driving`;

  if (error && !directions) {
    return (
      <div className="cb-map-error">
        <p>{error}</p>
        <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="cb-directions-ext-btn">
          Open in Google Maps
        </a>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="cb-map-placeholder">
        <span className="cb-map-spinner" />
        <span>Calculating route…</span>
      </div>
    );
  }

  const center = {
    lat: (userLat + propLat) / 2,
    lng: (userLng + propLng) / 2,
  };

  return (
    <div className="cb-directions-card">
      <div className="cb-map-card-header">
        <Navigation className="h-5 w-5 text-indigo-600" />
        <span>{data.title || "Directions"}</span>
        {data.propertyCode && <span className="cb-directions-code">#{data.propertyCode}</span>}
      </div>

      <div className="cb-directions-summary">
        <div className="cb-directions-prop">
          <img src={photo} alt={prop.heading} className="cb-directions-prop-img" />
          <div>
            <h4>{prop.heading || "Property"}</h4>
            <p><MapPin className="h-3.5 w-3.5 inline" /> {[prop.landmark, prop.city].filter(Boolean).join(", ")}</p>
          </div>
        </div>
        {routeInfo && (
          <div className="cb-directions-route-info">
            <span><strong>{routeInfo.duration}</strong> drive</span>
            <span>{routeInfo.distance}</span>
          </div>
        )}
      </div>

      <GoogleMap mapContainerStyle={mapStyle} center={center} zoom={12} options={{ mapTypeControl: false }}>
        <Marker position={origin} title="Your location" label="You" />
        <Marker position={destination} title={prop.heading} label="P" />
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>

      <div className="cb-directions-actions">
        <button type="button" className="cb-directions-btn" onClick={() => navigate(`/details/${prop._id}`)}>
          <Eye className="h-4 w-4" /> View Property
        </button>
        <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="cb-directions-btn cb-directions-btn--outline">
          <Navigation className="h-4 w-4" /> Open in Google Maps
        </a>
      </div>
    </div>
  );
}
