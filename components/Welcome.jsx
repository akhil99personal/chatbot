import { motion } from "framer-motion";
import { Building2, Calculator, FileText, Map, Heart, BarChart3, Sparkles, Globe } from "lucide-react";
import Logo from "./Logo.jsx";

const DEFAULT_SUGGESTIONS = [
  { icon: Map,       label: "Give me properties nearby",                           tag: "Nearby" },
  { icon: Building2, label: "Show me 3 BHK apartments in Whitefield under ₹1.5 Cr", tag: "Properties" },
  { icon: Map,       label: "Compare Hinjewadi vs Wakad for investment in 2026",   tag: "Localities" },
  { icon: Calculator, label: "Calculate EMI for ₹75 lakh @ 8.5% for 20 years",     tag: "Finance" },
  { icon: FileText,  label: "Checklist of documents for buying a resale flat",     tag: "Legal" },
];

const MULTILINGUAL_SUGGESTIONS = [
  { icon: Globe,     label: "पुणे में 2BHK फ्लैट दिखाओ 50 लाख के अंदर",           tag: "हिंदी" },
  { icon: Globe,     label: "Pune madhe 1BHK flat havi 10 lakh madhe",             tag: "मराठी" },
  { icon: Calculator, label: "Stamp duty kitna lagega Maharashtra mein 80 lakh pe", tag: "Hinglish" },
  { icon: Building2, label: "Hyderabad lo 3BHK flats chupinchandi",                tag: "Telugu" },
];

const LOGGED_IN_SUGGESTIONS = [
  { icon: Heart,     label: "Show my saved properties",                            tag: "My Saved" },
  { icon: Building2, label: "Show my listed properties",                           tag: "My Properties" },
  { icon: Sparkles,  label: "Recommend me properties based on my preferences",     tag: "AI Suggest" },
  { icon: BarChart3, label: "Show my dashboard analytics",                         tag: "Analytics" },
];

export default function Welcome({ onPick, isLoggedIn, userName }) {
  const suggestions = isLoggedIn
    ? [...LOGGED_IN_SUGGESTIONS, ...DEFAULT_SUGGESTIONS.slice(0, 2)]
    : [...DEFAULT_SUGGESTIONS, ...MULTILINGUAL_SUGGESTIONS.slice(0, 2)];

  const greeting = isLoggedIn && userName
    ? `Welcome back, ${userName.split(" ")[0]}! 🏠`
    : "How can I help you with real estate today?";

  const subtitle = isLoggedIn
    ? "Your personal AI assistant — search properties, view analytics, get recommendations, or ask in any language."
    : "Powered by Gemini · Find homes, projects, EMIs and documents in one chat. Ask in Hindi, Marathi, Telugu, Kannada or English!";

  return (
    <div className="cb-welcome">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={56} />
        </div>
        <h1>{greeting}</h1>
        <p>{subtitle}</p>
      </motion.div>
      <div className="cb-suggestions">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            onClick={() => onPick(s.label)}
            className="cb-suggestion"
          >
            <span className="cb-suggestion-icon">
              <s.icon className="h-5 w-5" />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="cb-suggestion-tag">{s.tag}</span>
              <span className="cb-suggestion-text">{s.label}</span>
            </span>
          </motion.button>
        ))}
      </div>

      {/* Language hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="cb-welcome-lang-hint"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>Supports: English · Hindi · Marathi · Telugu · Kannada · Tamil · Bengali · Hinglish</span>
      </motion.div>
    </div>
  );
}