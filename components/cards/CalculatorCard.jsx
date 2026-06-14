import { motion } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, IndianRupee, Scale, Building2, Percent, ArrowRightLeft } from "lucide-react";

const TYPE_CONFIG = {
  stamp_duty: { icon: Building2, color: "#6366f1", label: "Stamp Duty Calculator" },
  rental_yield: { icon: TrendingUp, color: "#10b981", label: "Rental Yield" },
  affordability: { icon: IndianRupee, color: "#f59e0b", label: "Affordability Calculator" },
  capital_gains: { icon: Scale, color: "#ef4444", label: "Capital Gains Tax" },
  tds: { icon: Percent, color: "#8b5cf6", label: "TDS Calculator" },
  roi: { icon: TrendingUp, color: "#06b6d4", label: "ROI / CAGR" },
  area_converter: { icon: ArrowRightLeft, color: "#ec4899", label: "Area Converter" },
};

function formatINR(num) {
  if (!num && num !== 0) return "N/A";
  const n = Number(num);
  if (isNaN(n)) return String(num);
  return "₹" + n.toLocaleString("en-IN");
}

export default function CalculatorCard({ data }) {
  const config = TYPE_CONFIG[data.type] || { icon: Calculator, color: "#6366f1", label: "Calculator" };
  const Icon = config.icon;
  const result = data.result || {};
  const breakdown = data.breakdown || [];
  const notes = data.notes || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-calc-card"
      style={{ "--calc-accent": config.color }}
    >
      {/* Header */}
      <div className="cb-calc-header">
        <div className="cb-calc-icon-wrap" style={{ background: config.color + "18" }}>
          <Icon className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <div>
          <h3 className="cb-calc-title">{data.title || config.label}</h3>
          {data.type && <span className="cb-calc-type">{config.label}</span>}
        </div>
      </div>

      {/* Primary Result */}
      {result.verdict && (
        <div className={`cb-calc-verdict cb-calc-verdict--${result.verdict?.toLowerCase()?.replace(/\s+/g, "-") || "average"}`}>
          {result.verdict}
        </div>
      )}

      {/* Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="cb-calc-breakdown">
          {breakdown.map((item, i) => (
            <div key={i} className="cb-calc-row">
              <span className="cb-calc-row-label">{item.label}</span>
              <span className="cb-calc-row-value">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Result key-value pairs (auto-generated if no breakdown) */}
      {breakdown.length === 0 && Object.keys(result).length > 0 && (
        <div className="cb-calc-breakdown">
          {Object.entries(result).filter(([k]) => !["verdict", "comparison", "budgetNote", "note", "exemptionOptions", "bestOption"].includes(k)).map(([key, val]) => {
            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
            let display = val;
            if (typeof val === "number") {
              display = val > 999 ? formatINR(val) : val.toLocaleString("en-IN");
            }
            return (
              <div key={key} className="cb-calc-row">
                <span className="cb-calc-row-label">{label}</span>
                <span className="cb-calc-row-value">{String(display)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison chart (for ROI) */}
      {result.comparison && (
        <div className="cb-calc-comparison">
          <div className="cb-calc-comp-title">Investment Comparison</div>
          {Object.entries(result.comparison).map(([key, val]) => {
            const numVal = parseFloat(val) || 0;
            const isProperty = key === "property";
            return (
              <div key={key} className="cb-calc-comp-row">
                <span className="cb-calc-comp-label">{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}</span>
                <div className="cb-calc-comp-bar-wrap">
                  <div
                    className={`cb-calc-comp-bar ${isProperty ? "cb-calc-comp-bar--primary" : ""}`}
                    style={{ width: `${Math.min(numVal * 5, 100)}%` }}
                  />
                </div>
                <span className="cb-calc-comp-value">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      {(notes.length > 0 || result.note || result.budgetNote) && (
        <div className="cb-calc-notes">
          {result.budgetNote && <p>{result.budgetNote}</p>}
          {result.note && <p>{result.note}</p>}
          {notes.map((n, i) => <p key={i}>💡 {n}</p>)}
        </div>
      )}

      {/* Exemption Options */}
      {result.exemptionOptions && result.exemptionOptions.length > 0 && (
        <div className="cb-calc-exemptions">
          <div className="cb-calc-exemption-title">Tax Saving Options</div>
          {result.exemptionOptions.map((opt, i) => (
            <div key={i} className="cb-calc-exemption-item">
              <span className="cb-calc-exemption-bullet">✓</span> {opt}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
