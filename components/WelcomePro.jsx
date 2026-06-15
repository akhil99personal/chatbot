import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import { Building2, Calculator, FileText, Map, Heart, BarChart3, Sparkles, Globe } from "lucide-react";
import Logo from "./Logo.jsx";

// Subtle 3D Background Scene
function BackgroundScene() {
  return (
    <group>
      {/* Soft ambient lighting */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#10a37f" />
      <pointLight position={[-10, -10, 5]} intensity={0.3} color="#f0fdf4" />
      
      {/* Subtle geometric shapes for depth */}
      <mesh position={[-3, 1, -5]} scale={1.2} rotation={[0.3, 0.5, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#10a37f" opacity={0.08} transparent />
      </mesh>
      
      <mesh position={[3, -0.5, -4]} scale={0.8} rotation={[0.1, -0.3, 0.4]}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color="#0e9d77" opacity={0.06} transparent />
      </mesh>
      
      <mesh position={[0, -2, -3]} scale={1.5} rotation={[0.4, 0.2, -0.1]}>
        <octahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#10a37f" opacity={0.05} transparent />
      </mesh>

      {/* Very subtle moving elements */}
      <motion.group
        animate={{ rotateY: Math.PI * 2 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <mesh position={[2, 1.5, -6]} scale={0.6}>
          <tetrahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#d1f2eb" opacity={0.04} transparent />
        </mesh>
      </motion.group>
    </group>
  );
}

// 3D Canvas wrapper
function WelcomeBackground() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      zIndex: 0,
      overflow: "hidden",
    }}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        performance={{ min: 0.5 }}
        gl={{ alpha: true, antialias: false }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={75} />
        <Suspense fallback={null}>
          <BackgroundScene />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI * 0.6}
          minPolarAngle={Math.PI * 0.4}
        />
      </Canvas>
      {/* Gradient overlay for better text contrast */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

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

export default function WelcomePro({ onPick, isLoggedIn, userName }) {
  const [canRender3D, setCanRender3D] = useState(true);
  
  useEffect(() => {
    // Check if 3D rendering is supported
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) setCanRender3D(false);
  }, []);

  const suggestions = isLoggedIn
    ? [...LOGGED_IN_SUGGESTIONS, ...DEFAULT_SUGGESTIONS.slice(0, 2)]
    : [...DEFAULT_SUGGESTIONS, ...MULTILINGUAL_SUGGESTIONS.slice(0, 2)];

  const greeting = isLoggedIn && userName
    ? `Welcome back, ${userName.split(" ")[0]}!`
    : "How can I help you with real estate?";

  const subtitle = isLoggedIn
    ? "Your personal AI assistant — search properties, view analytics, get recommendations."
    : "Powered by Gemini · Find homes, projects, EMIs and documents in one chat.";

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      overflow: "hidden",
    }}>
      {/* 3D Background */}
      {canRender3D && <WelcomeBackground />}
      
      {/* Content overlay */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "640px",
        padding: "60px 20px",
        textAlign: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <Logo size={52} />
          </div>
          
          {/* Heading */}
          <h1 style={{
            margin: "16px 0 12px",
            fontSize: "32px",
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}>
            {greeting}
          </h1>
          
          {/* Subtitle */}
          <p style={{
            margin: 0,
            fontSize: "15px",
            color: "#565869",
            lineHeight: "1.6",
          }}>
            {subtitle}
          </p>
        </motion.div>

        {/* Suggestions Grid */}
        <div style={{
          marginTop: "40px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "12px",
        }}>
          {suggestions.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              onClick={() => onPick(s.label)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid #e5e5e5",
                background: "#ffffff",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f9f9f9";
                e.currentTarget.style.borderColor = "#10a37f";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.borderColor = "#e5e5e5";
              }}
              className="cb-suggestion"
            >
              <span style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#d1f2eb",
                color: "#10a37f",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: "18px",
              }}>
                <s.icon className="h-5 w-5" />
              </span>
              <span style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#8b8b8b",
                  marginBottom: "2px",
                }}>
                  {s.tag}
                </span>
                <span style={{
                  fontSize: "14px",
                  color: "#1a1a1a",
                  fontWeight: 500,
                  textAlign: "left",
                }}>
                  {s.label}
                </span>
              </span>
            </motion.button>
          ))}
        </div>

        {/* Language hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#8b8b8b",
          }}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>English · Hindi · Marathi · Telugu · Kannada · Tamil</span>
        </motion.div>
      </div>
    </div>
  );
}
