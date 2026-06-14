import { motion } from "framer-motion";
import PropertyImage from "./PropertyImage.jsx";

export default function ImageGallery({ gallery: g }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {g.caption && <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cb-brand-500)' }}>{g.caption}</div>}
      <div className="cb-gallery-grid">
        {(g.images || []).map((im, i) => (
          <div key={i} className="cb-gallery-item">
            <PropertyImage query={im.query} alt={im.label || im.query} />
            {im.label && (
              <div className="cb-gallery-label">
                {im.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}