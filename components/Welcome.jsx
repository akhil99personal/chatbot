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
    ? `Welcome back, ${userName.split(" ")[0]}`
    : "How can I help you today?";

  const subtitle = isLoggedIn
    ? "Your AI real estate assistant — search properties, view analytics, get AI recommendations, ask in multiple languages"
    : "AI-powered real estate assistant. Find properties, calculate EMIs, get legal documents. Ask in English, Hindi, Marathi, Telugu, and more";

  return (
    <div className="cb-welcome">
      <motion.div
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', width: '100%' }}
      >
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Logo size={56} />
          </motion.div>
        </div>
        <h1>{greeting}</h1>
        <p>{subtitle}</p>
      </motion.div>

      <div className="cb-suggestions">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(0.1 + i * 0.05, 0.5) }}
            onClick={() => onPick(s.label)}
            className="cb-suggestion"
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <span className="cb-suggestion-icon">
              <s.icon className="h-5 w-5" />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
              <span className="cb-suggestion-tag">{s.tag}</span>
              <span className="cb-suggestion-text">{s.label}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Language Support Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="cb-welcome-lang-hint"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>English · हिंदी · मराठी · తెలుగు · ಕನ್ನಡ · தமிழ் · বাংলা</span>
      </motion.div>
    </div>
  );
}
