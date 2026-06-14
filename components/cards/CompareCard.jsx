import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Trophy, Eye, Download, BedDouble, Bath, Maximize,
  MapPin, Sofa, Star, Check, Crown, Compass,
  Building, Image as ImageIcon, Sparkles, Tag, ArrowRight
} from "lucide-react";
import dummyImg from "../../../images/dummyImage.webp";
import { resolveImageUrl } from "../../lib/api.js";
import NewPropertyCard from "../../../user-pages/searchpage/NewPropertyCard.jsx";

function ScoreCircle({ score, size = 48 }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="cb-compare-score-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3fa" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="cb-compare-score-val" style={{ color, fontSize: size / 3.5 }}>{score}</span>
    </div>
  );
}

function CompareRow({ label, values, highlight = null, icon: Icon }) {
  return (
    <div className="cb-compare-canvas-row">
      <div className="cb-compare-canvas-label">
        {Icon && <Icon className="h-4 w-4 text-slate-400 mr-2" />}
        <span>{label}</span>
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          className={`cb-compare-canvas-value ${highlight === i ? "cb-compare-canvas-value--best" : ""}`}
        >
          {highlight === i && <Check className="h-3.5 w-3.5 text-emerald-600 inline mr-1" />}
          <span>{val || "N/A"}</span>
        </div>
      ))}
    </div>
  );
}

export default function CompareCard({ data }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const properties = data.properties || data.comparison || [];
  const fullProperties = data.fullProperties || [];
  const codes = data.codes || [];
  const winner = data.winner || {};
  const recommendation = data.recommendation || "";

  if (properties.length < 2) return null;

  // Determine best values for highlighting
  const findBestIdx = (key, mode = "max") => {
    const vals = properties.map((p) => {
      const v = typeof p[key] === "string" ? parseFloat(p[key].replace(/[^0-9.]/g, "")) : p[key];
      return isNaN(v) ? null : v;
    });
    if (vals.every((v) => v === null)) return null;
    if (mode === "min") return vals.indexOf(Math.min(...vals.filter((v) => v !== null)));
    return vals.indexOf(Math.max(...vals.filter((v) => v !== null)));
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = cardRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(28, 32, 80);
      pdf.rect(0, 0, pageWidth, 25, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("Property Comparison", 14, 16);

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 30, imgWidth, Math.min(imgHeight, pageHeight - 40));

      pdf.save(`Milestono_Comparison_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF download failed. Check console for details.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-card cb-compare-canvas"
    >
      <div className="cb-compare-canvas-header">
        <div className="cb-compare-canvas-title">
          <Trophy className="h-5 w-5" /> Property Comparison
        </div>
        <button className="cb-btn cb-btn-outline" onClick={downloadPDF} disabled={downloading}>
          <Download className="h-4 w-4 mr-1.5" /> {downloading ? "Saving..." : "PDF"}
        </button>
      </div>

      <div ref={cardRef} className="cb-compare-canvas-body">
        {/* Recommendation Header */}
        {(recommendation || winner.heading) && (
          <div className="cb-compare-canvas-recommendation">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500 mr-3" />
            <p>{recommendation || `Based on our analysis, **${winner.heading}** is highly recommended.`}</p>
          </div>
        )}

        <div className="cb-compare-canvas-matrix">
          {/* Column Headers (Property Cards) */}
          <div className="cb-compare-canvas-header-row">
            <div className="cb-compare-canvas-label-col"></div>
            {properties.map((p, i) => (
              <div key={i} className={`cb-compare-canvas-prop-col ${winner.id === p._id ? "winner" : ""}`}>
                <div className="cb-compare-canvas-img-wrap">
                  <img src={resolveImageUrl(p.firstPhoto) || dummyImg} alt={p.heading} />
                  {winner.id === p._id && (
                    <div className="cb-compare-canvas-crown"><Crown className="h-3 w-3" /> Best Pick</div>
                  )}
                  {codes[i] && <div className="cb-compare-canvas-code">#{codes[i]}</div>}
                </div>
                <div className="cb-compare-canvas-prop-title">{p.heading || `Property ${i + 1}`}</div>
                <div className="cb-compare-canvas-score-wrap">
                  <ScoreCircle score={p.score || 0} size={36} />
                  <span>Overall Score</span>
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="cb-compare-canvas-rows">
            <CompareRow label="Price" values={properties.map((p) => p.priceFormatted)} highlight={findBestIdx("price", "min")} icon={Tag} />
            <CompareRow label="Price/Sq.Ft" values={properties.map((p) => p.pricePerSqft)} highlight={findBestIdx("pricePerSqft", "min")} icon={Maximize} />
            <CompareRow label="Area" values={properties.map((p) => p.carpetArea ? `${p.carpetArea} sq.ft` : "N/A")} highlight={findBestIdx("carpetArea", "max")} icon={Maximize} />
            <CompareRow label="Bedrooms" values={properties.map((p) => p.bedrooms || "N/A")} icon={BedDouble} />
            <CompareRow label="Bathrooms" values={properties.map((p) => p.bathrooms || "N/A")} icon={Bath} />
            <CompareRow label="Sell Type" values={properties.map((p) => p.sellType || "N/A")} icon={Tag} />
            <CompareRow label="Furnishing" values={properties.map((p) => p.furnishing)} icon={Sofa} />
            <CompareRow label="Facing" values={properties.map((p) => p.facing)} icon={Compass} />
            <CompareRow label="Location" values={properties.map((p) => [p.landmark, p.city].filter(Boolean).join(", ") || "N/A")} icon={MapPin} />
            <CompareRow label="Amenities" values={properties.map((p) => `${p.amenityCount} items`)} highlight={findBestIdx("amenityCount", "max")} icon={Sparkles} />
          </div>
        </div>
      </div>

      <div className="cb-card-footer cb-compare-canvas-footer">
        {properties.map((p, i) => (
          <button
            key={i}
            className={`cb-btn ${winner.id === p._id ? "cb-btn-primary" : "cb-btn-outline"}`}
            onClick={() => navigate(`/details/${p._id}`)}
          >
            <Eye className="h-4 w-4 mr-1.5" /> View Property {i + 1}
          </button>
        ))}
      </div>
    </motion.article>
  );
}
