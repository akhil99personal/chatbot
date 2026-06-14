import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Copy, User, Volume2, VolumeX } from "lucide-react";
import Logo from "./Logo.jsx";
import { isSpeaking, speak, stopSpeaking, subscribeTts, parseCards } from "../lib/speech.js";
import PropertyResults from "./cards/PropertyResults.jsx";
import ProjectCard from "./cards/ProjectCard.jsx";
import DocumentCard from "./cards/DocumentCard.jsx";
import EmiCalculator from "./cards/EmiCalculator.jsx";
import ImageGallery from "./cards/ImageGallery.jsx";
import CalculatorCard from "./cards/CalculatorCard.jsx";
import CompareCard from "./cards/CompareCard.jsx";
import NearbyMapCard from "./cards/NearbyMapCard.jsx";
import DirectionsMapCard from "./cards/DirectionsMapCard.jsx";
import PropertyDetailsCard from "./cards/PropertyDetailsCard.jsx";

export default function MessageRow({ message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="cb-msg-row"
    >
      <div className="cb-msg-inner">
        <Avatar isUser={isUser} />
        <div className="cb-msg-body">
          <div className="cb-msg-label">
            {isUser ? "You" : "Milestono"}
          </div>
          {isUser ? (
            <div className="cb-msg-text">{message.content}</div>
          ) : (
            <AssistantBody id={message.id} content={message.content} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Avatar({ isUser }) {
  if (isUser) {
    return (
      <div className="cb-avatar cb-avatar-user">
        <User className="h-5 w-5" />
      </div>
    );
  }
  return <div className="cb-avatar"><Logo size={36} /></div>;
}

function AssistantBody({ id, content }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const update = () => setPlaying(isSpeaking(id));
    update();
    return subscribeTts(update);
  }, [id]);

  const segments = parseCards(content || "");
  const plain = (content || "").replace(/```json[\s\S]*?```/g, "").trim();

  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <div key={i} className="cb-md cb-msg-text">
            <ReactMarkdown>{seg.content}</ReactMarkdown>
          </div>
        ) : (
          <div key={i} style={{ marginTop: '12px', marginBottom: '12px' }}>
            <CardRenderer data={seg.data} />
          </div>
        )
      )}

      <div className="cb-msg-actions">
        <IconButton
          label={playing ? "Stop reading" : "Read aloud"}
          onClick={() => (playing ? stopSpeaking() : speak(id, plain || content))}
        >
          {playing ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </IconButton>
        <IconButton label="Copy" onClick={() => navigator.clipboard?.writeText(plain || content)}>
          <Copy className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({ children, label, onClick }) {
  return (
    <button
      type="button" onClick={onClick} aria-label={label} title={label}
      className="cb-msg-action-btn"
    >
      {children}
    </button>
  );
}

function CardRenderer({ data }) {
  switch (data.card) {
    case "properties":
      return <PropertyResults data={data} />;
    case "project":  return <ProjectCard project={data} />;
    case "document": return <DocumentCard doc={data} />;
    case "emi":      return <EmiCalculator init={data} />;
    case "gallery":  return <ImageGallery gallery={data} />;
    case "calculator": return <CalculatorCard data={data} />;
    case "compare":  return <CompareCard data={data} />;
    case "map":
    case "nearby_map":
      return <NearbyMapCard data={data} />;
    case "directions_map":
      return <DirectionsMapCard data={data} />;
    case "property_details":
      return <PropertyDetailsCard data={data} />;
    case "action_confirm": return <ActionConfirmCard data={data} />;
    default:
      return null;
  }
}

function ActionConfirmCard({ data }) {
  const iconMap = {
    enquiry: "📋",
    feedback: "⭐",
    service_request: "🔧",
  };
  const icon = iconMap[data.type] || "✅";

  return (
    <div className="cb-confirm">
      <div className="cb-confirm-inner">
        <span className="cb-confirm-icon">{icon}</span>
        <div style={{ flex: 1 }}>
          <h4 className="cb-confirm-title">{data.title}</h4>
          <p className="cb-confirm-msg">{data.message}</p>
          {data.details && (
            <div className="cb-confirm-details">
              {Object.entries(data.details).map(([k, v]) => (
                <div key={k}><span className="cb-confirm-detail-key">{k}:</span> {String(v)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AssistantTyping({ message = "Finding the best results for you…" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="cb-typing"
    >
      <div style={{ width: 36, height: 36, flexShrink: 0 }}>
        <Logo size={36} />
      </div>
      <div className="cb-typing-body">
        <p className="cb-typing-message">{message}</p>
        <div className="cb-typing-skeleton">
          <div className="cb-skeleton-line" />
          <div className="cb-skeleton-line" style={{ width: "90%" }} />
          <div className="cb-skeleton-line" style={{ width: "75%" }} />
        </div>
      </div>
    </motion.div>
  );
}
