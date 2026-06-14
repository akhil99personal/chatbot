import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BedDouble, Bath, Maximize, MapPin, Sofa, Tag,
  User, Phone, Mail, Compass, Calendar, Building,
  ArrowLeft, ArrowRight, Eye, Image as ImageIcon, Sparkles, AlertCircle, Lock, Unlock, MailOpen
} from "lucide-react";
import toast from "react-hot-toast";
import dummyImg from "../../../images/dummyImage.webp";
import { resolveImageUrl, fetchPropertiesByIds } from "../../lib/api.js";

const AMENITY_ICONS = {
  Lift: "fa-solid fa-elevator",
  Parking: "fa-solid fa-square-parking",
  "Swimming Pool": "fa-solid fa-water-ladder",
  Gym: "fa-solid fa-dumbbell",
  Security: "fa-solid fa-shield-halved",
  "Power Backup": "fa-solid fa-bolt",
  "Club House": "fa-solid fa-building-columns",
  Garden: "fa-solid fa-leaf",
  "Children Play Area": "fa-solid fa-children",
  CCTV: "fa-solid fa-camera",
  AC: "fa-solid fa-snowflake",
  Internet: "fa-solid fa-wifi",
  "Modular Kitchen": "fa-solid fa-kitchen-set",
  "Gas Pipeline": "fa-solid fa-fire-flame-simple",
  Intercom: "fa-solid fa-phone",
  "Rainwater Harvesting": "fa-solid fa-droplet",
  "Solar Energy": "fa-solid fa-solar-panel",
  Terrace: "fa-solid fa-building",
};

export default function PropertyDetailsCard({ data }) {
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [propertyData, setPropertyData] = useState(data.property || data);
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [enquired, setEnquired] = useState(false);
  const [enquiring, setEnquiring] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const p = propertyData;
  const pId = p?._id || p?.id;

  // Self-hydrate if essential data is missing
  useEffect(() => {
    const initialProp = data.property || data;
    if (initialProp._id && (!initialProp.uploadedPhotos || !initialProp.ownerPhone || !initialProp.expectedPrice)) {
      setLoading(true);
      fetchPropertiesByIds([initialProp._id]).then(res => {
        if (res && res.length > 0) {
          setPropertyData(res[0]);
        }
        setLoading(false);
      });
    }
  }, [data]);

  // Check unlock status on mount/load
  useEffect(() => {
    if (pId) {
      const token = localStorage.getItem("auth");
      if (token) {
        fetch(`${process.env.REACT_APP_BASE_URL || "https://api.milestono.com:6005"}/api/contact-viewed/${pId}`, {
          headers: { Authorization: token }
        })
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.viewed) {
              setUnlocked(true);
            }
          })
          .catch(err => console.error("Error checking contact unlock status:", err));
      }
    }
  }, [pId]);

  const rawPhotos = p.uploadedPhotos || [];
  const photos = Array.isArray(rawPhotos) && rawPhotos.length > 0
    ? rawPhotos.map(resolveImageUrl).filter(Boolean)
    : [dummyImg];

  const handleNextPhoto = () => setPhotoIndex((prev) => (prev + 1) % photos.length);
  const handlePrevPhoto = () => setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);

  // Pricing
  const isSell = (p.sellType || "").toLowerCase() === "sell" || (p.sellType || "").toLowerCase() === "buy";
  const rawPrice = isSell ? (p.expectedPrice || p.price) : (p.pricePerMonth || p.price);
  const price = rawPrice ? `₹${Number(rawPrice).toLocaleString("en-IN")}` : "Price on Request";
  const suffix = isSell ? "" : "/mo";

  const location = [p.landmark, p.city].filter(Boolean).join(", ") || p.location || "Location N/A";

  const amenities = [
    ...(Array.isArray(p.amenities) ? p.amenities : []),
    ...(Array.isArray(p.selectedRoom) ? p.selectedRoom : []),
  ];

  const handleAuthRedirect = () => {
    sessionStorage.setItem("loginRedirect", window.location.pathname + window.location.search);
    navigate("/login");
  };

  const handleUnlockContact = async () => {
    const token = localStorage.getItem("auth");
    if (!token) {
      handleAuthRedirect();
      return;
    }
    if (!pId) return;

    setUnlocking(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL || "https://api.milestono.com:6005"}/api/contact-viewed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ property_id: pId }),
      });
      const resData = await res.json();
      if (res.ok) {
        setUnlocked(true);
        toast.success("Contact details unlocked successfully!");
      } else {
        toast.error(resData.error || resData.message || "Failed to unlock contact details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendEnquiry = async () => {
    const token = localStorage.getItem("auth");
    if (!token) {
      handleAuthRedirect();
      return;
    }
    if (!pId) return;

    setEnquiring(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BASE_URL || "https://api.milestono.com:6005"}/api/property-enquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ property_id: pId }),
      });
      const resData = await res.json();
      if (res.ok) {
        setEnquired(true);
        toast.success("Property enquiry submitted successfully!");
      } else {
        toast.error(resData.error || resData.message || "Failed to submit property enquiry.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setEnquiring(false);
    }
  };

  const displayPhone = unlocked ? (p.ownerPhone || p.phnumber || "N/A") : "XXXXXXXXXX";
  const displayEmail = unlocked ? (p.ownerEmail || "N/A") : "XXXXXXXXXX@gmail.com";

  if (loading) {
    return (
      <div className="cb-card cb-details-canvas cb-details-canvas--loading">
        <div className="cb-typing-dots">
          <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
        </div>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-card cb-details-canvas"
    >
      {/* Canvas Header - Hero Gallery with all property images */}
      <div className="cb-details-canvas-header">
        <div className="cb-details-hero-gallery">
          <div className="cb-details-main-img-wrap">
            <AnimatePresence mode="wait">
              <motion.img
                key={photoIndex}
                src={photos[photoIndex]}
                alt={p.heading || "Property details"}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="cb-details-main-img"
              />
            </AnimatePresence>
            <div className="cb-details-gallery-badge" style={{ position: "absolute", left: "14px", top: "14px" }}>
              {p.sellType || "Property"}
            </div>
            {photos.length > 1 && (
              <div className="cb-details-gallery-nav" style={{ position: "absolute", right: "14px", top: "14px", display: "flex", gap: "8px" }}>
                <button onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }} className="cb-details-gallery-btn cb-details-gallery-btn--prev" style={{ position: "static", transform: "none" }}><ArrowLeft className="h-4 w-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }} className="cb-details-gallery-btn cb-details-gallery-btn--next" style={{ position: "static", transform: "none" }}><ArrowRight className="h-4 w-4" /></button>
              </div>
            )}
            <div className="cb-details-gallery-counter">
              {photoIndex + 1} / {photos.length}
            </div>
          </div>
          {photos.length > 1 && (
            <div className="cb-details-thumbnails">
              {photos.map((ph, idx) => (
                <img
                  key={idx}
                  src={ph}
                  alt=""
                  className={`cb-details-thumb ${idx === photoIndex ? "cb-details-thumb--active" : ""}`}
                  onClick={() => setPhotoIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cb-details-canvas-body">
        {/* Title and Price Section */}
        <div className="cb-canvas-section cb-canvas-title-sec">
          <div className="cb-canvas-title-wrap">
            <h3>{p.heading || `${p.bedrooms || ""} BHK Property`}</h3>
            <div className="cb-canvas-location">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </div>
          </div>
          <div className="cb-canvas-price-wrap">
            <div className="cb-canvas-price">{price}<span>{suffix}</span></div>
            {p.pricePerSqFt && <div className="cb-canvas-psqft">₹{Number(p.pricePerSqFt).toLocaleString("en-IN")}/sqft</div>}
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div className="cb-canvas-section cb-canvas-specs-sec">
          <div className="cb-canvas-spec-card"><BedDouble className="h-4 w-4" /><div><small>Bedrooms</small><p>{p.bedrooms || "N/A"}</p></div></div>
          <div className="cb-canvas-spec-card"><Bath className="h-4 w-4" /><div><small>Bathrooms</small><p>{p.bathrooms || "N/A"}</p></div></div>
          <div className="cb-canvas-spec-card"><Maximize className="h-4 w-4" /><div><small>Area</small><p>{p.carpetArea || p.areaSqft ? `${p.carpetArea || p.areaSqft} sqft` : "N/A"}</p></div></div>
          <div className="cb-canvas-spec-card"><Sofa className="h-4 w-4" /><div><small>Furnishing</small><p>{p.selectedFurnishing || p.furnishing || "N/A"}</p></div></div>
          <div className="cb-canvas-spec-card"><Compass className="h-4 w-4" /><div><small>Facing</small><p>{p.facing || "N/A"}</p></div></div>
          <div className="cb-canvas-spec-card"><Building className="h-4 w-4" /><div><small>Floor</small><p>{p.floorNo ? `${p.floorNo}/${p.totalFloors}` : "N/A"}</p></div></div>
        </div>

        {/* Description Section */}
        {p.uniqueFeatures && (
          <div className="cb-canvas-section cb-canvas-desc-sec">
            <h4><AlertCircle className="h-4 w-4 mr-1.5" /> Description</h4>
            <p>{p.uniqueFeatures}</p>
          </div>
        )}

        {/* Amenities Section */}
        {amenities.length > 0 && (
          <div className="cb-canvas-section cb-canvas-amenities-sec">
            <h4><Sparkles className="h-4 w-4 mr-1.5" /> Amenities</h4>
            <div className="cb-canvas-amenities-grid">
              {amenities.map((a) => (
                <div key={a} className="cb-canvas-amenity-item">
                  <i className={`${AMENITY_ICONS[a] || "fa-solid fa-circle-check"}`} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secured Owner Details Section */}
        <div className="cb-canvas-section cb-canvas-contact-sec">
          <h4 style={{ display: "flex", alignItems: "center", justifyItems: "center" }}>
            {unlocked ? <Unlock className="h-4 w-4 mr-1.5 text-emerald-500" /> : <Lock className="h-4 w-4 mr-1.5 text-indigo-500" />}
            <span>Contact Information ({p.sellerType || "Owner"})</span>
          </h4>
          <div className="cb-canvas-contact-card" style={{ position: "relative", padding: "16px", background: unlocked ? "rgba(240, 253, 250, 0.5)" : "rgba(248, 250, 252, 0.95)" }}>
            <div className="cb-canvas-contact-name">{p.ownerName || "Milestono Partner"}</div>
            <div className="cb-canvas-contact-details">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>{displayPhone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>{displayEmail}</span>
              </div>
            </div>
          </div>

          {/* Interactive buttons: Enquiry and Unlock Contact */}
          <div className="cb-details-action-buttons">
            <button
              onClick={handleSendEnquiry}
              disabled={enquired || enquiring}
              className="cb-details-btn-enquiry"
            >
              <MailOpen className="h-4 w-4" />
              <span>{enquired ? "Enquiry Sent" : enquiring ? "Sending..." : "Send Enquiry"}</span>
            </button>

            {unlocked ? (
              <div className="cb-details-btn-unlocked">
                <Unlock className="h-4 w-4 text-emerald-500" />
                <span>Unlocked</span>
              </div>
            ) : (
              <button
                onClick={handleUnlockContact}
                disabled={unlocking}
                className="cb-details-btn-unlock"
              >
                <Lock className="h-4 w-4" />
                <span>{unlocking ? "Unlocking..." : "Unlock Contact"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="cb-card-footer cb-details-canvas-footer">
        <button className="cb-btn cb-btn-primary" onClick={() => navigate(`/details/${pId}`)}>
          <Eye className="h-4 w-4 mr-2" /> View Full Page
        </button>
      </div>
    </motion.article>
  );
}
