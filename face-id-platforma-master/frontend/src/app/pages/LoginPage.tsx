import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, ArrowRight, Mail, Activity } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
};

const inputWrap = (focused: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: `1.5px solid ${focused ? "#3949AB" : "#E5E7EB"}`,
  borderRadius: 12,
  padding: "12px 16px",
  backgroundColor: focused ? "#FAFBFF" : "#fff",
  transition: "all 0.2s",
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email va parolni kiriting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Email yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F1B5C 0%, #1A237E 45%, #1565C0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -150, right: -150, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 450, height: 450, borderRadius: "50%", background: "rgba(0,137,123,0.12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", left: "5%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.02)", pointerEvents: "none" }} />

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 24,
          width: "100%",
          maxWidth: 440,
          padding: "48px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #1A237E 0%, #00897B 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 10px 24px rgba(26,35,126,0.35)",
            }}
          >
            <Activity size={30} color="#fff" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0F1B5C", letterSpacing: "-0.03em" }}>
            WorkTrack Pro
          </div>
          <div style={{ fontSize: 14, color: "#9CA3AF", marginTop: 6 }}>
            Xodimlarni boshqarish platformasi
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Tizimga kirish</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Gmail va parol bilan kiring</div>
        </div>

        <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />

        {/* Email field */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
            Gmail manzil
          </label>
          <div style={inputWrap(focusedField === "email")}>
            <Mail size={17} color={focusedField === "email" ? "#3949AB" : "#9CA3AF"} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#111827", backgroundColor: "transparent" }}
              placeholder="sizning@gmail.com"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
            Parol
          </label>
          <div style={inputWrap(focusedField === "password")}>
            <Lock size={17} color={focusedField === "password" ? "#3949AB" : "#9CA3AF"} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#111827", backgroundColor: "transparent" }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9CA3AF", display: "flex" }}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#DC2626",
              fontSize: 13,
              marginBottom: 4,
              marginTop: 12,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            background: loading
              ? "#9CA3AF"
              : "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
            border: "none",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 20,
            marginBottom: 16,
            boxShadow: loading ? "none" : "0 4px 16px rgba(26,35,126,0.3)",
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Kirilmoqda...
            </>
          ) : (
            <>
              Kirish
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Akkauntingiz yo'qmi? </span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#3949AB", fontWeight: 700, padding: 0 }}
          >
            Ro'yxatdan o'ting →
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#D1D5DB", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          Tizimga kirib, siz{" "}
          <span style={{ color: "#3949AB", cursor: "pointer" }}>Foydalanish shartlari</span>
          {" va "}
          <span style={{ color: "#3949AB", cursor: "pointer" }}>Maxfiylik siyosati</span>
          ga rozilik bildirasiz
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
