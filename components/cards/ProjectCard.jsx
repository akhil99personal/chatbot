import { motion } from "framer-motion";
import { Building, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import PropertyImage from "./PropertyImage.jsx";

export default function ProjectCard({ project: p }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-card"
    >
      <div className="cb-proj-img">
        <PropertyImage query={p.imageQuery} alt={p.name} />
        <div className="cb-proj-overlay" />
        <div className="cb-proj-meta">
          <div className="cb-proj-developer">{p.developer}</div>
          <h3 className="cb-proj-name">{p.name}</h3>
        </div>
      </div>
      <div className="cb-proj-stats">
        <Stat icon={Building} label="Configs" value={(p.configurations || []).join(" · ")} />
        <Stat icon={Calendar} label="Possession" value={p.possessionDate} />
        <Stat icon={Sparkles} label="Price range" value={p.priceRange} />
        {p.reraId && <Stat icon={ShieldCheck} label="RERA" value={p.reraId} />}
      </div>
      <div className="cb-card-body">
        <div className="cb-proj-stat-label" style={{ marginBottom: '8px' }}>Amenities</div>
        <div className="cb-amenities">
          {(p.amenities || []).map((a) => (
            <span key={a} className="cb-amenity">{a}</span>
          ))}
        </div>
        {p.highlights?.length > 0 && (
          <ul className="cb-md" style={{ marginTop: '12px' }}>
            {p.highlights.map((h) => <li key={h} className="cb-msg-text">{h}</li>)}
          </ul>
        )}
      </div>
    </motion.article>
  );
}
function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="cb-proj-stat-label">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="cb-proj-stat-value">{value}</div>
    </div>
  );
}