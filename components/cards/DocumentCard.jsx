import { motion } from "framer-motion";
import { FileCheck2 } from "lucide-react";

const KIND_LABEL = { legal: "Legal", financial: "Financial", checklist: "Checklist", agreement: "Agreement", report: "Report" };

export default function DocumentCard({ doc: d }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-card"
    >
      <div className="cb-doc-header">
        <div className="cb-doc-icon">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cb-doc-kind">{KIND_LABEL[d.kind] || "Document"}</div>
          <h3 className="cb-doc-title">{d.title}</h3>
          {d.subtitle && <div className="cb-doc-subtitle">{d.subtitle}</div>}
        </div>
      </div>
      <div className="cb-doc-sections">
        {(d.sections || []).map((s, i) => (
          <section key={i} className="cb-doc-section">
            <h4>{s.heading}</h4>
            {s.body && <p>{s.body}</p>}
            {s.bullets?.length > 0 && (
              <ul>
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      {d.footer && (
        <div className="cb-card-footer">
          {d.footer}
        </div>
      )}
    </motion.article>
  );
}