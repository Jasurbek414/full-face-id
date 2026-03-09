import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Activity, CheckCircle2, Star, Shield, BarChart3, Users,
  Smartphone, Globe, ArrowRight, Mail, Phone, Menu, X,
} from "lucide-react";

const BRAND = {
  primary: "#1A237E",
  accent: "#3949AB",
  teal: "#00897B",
};

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    { icon: "🎯", title: "Face ID kirish", desc: "Yuz tanish texnologiyasi orqali xodimlar avtomatik ro'yxatdan o'tadi. Karta yoki PIN kerak emas." },
    { icon: "📊", title: "Real-vaqt hisobotlar", desc: "Davomat, kechikishlar, statistika — hammasi bir vaqtning o'zida ko'rinadi." },
    { icon: "📱", title: "Mobil ilova", desc: "iOS va Android ilovasidan ham kirish mumkin. Xodimlar ham o'z davomatini kuzata oladi." },
    { icon: "🔔", title: "Avtomatik bildirishnomalar", desc: "Kechikish va kelmaslik holatlari darhol rahbarga xabar qiladi." },
    { icon: "💰", title: "Maosh hisoblash", desc: "Ish soatlari va davomat asosida maosh avtomatik hisoblanadi." },
    { icon: "🔒", title: "Xavfsiz ma'lumotlar", desc: "Barcha ma'lumotlar shifrlangan va xavfsiz serverda saqlanadi." },
  ];

  const plans = [
    {
      name: "Starter",
      price: "99,000",
      period: "so'm/oy",
      desc: "Kichik kompaniyalar uchun",
      features: ["50 xodimagacha", "1 ta qurilma", "Asosiy hisobotlar", "Email qo'llab-quvvatlash"],
      color: "#E8EAF6",
      textColor: BRAND.primary,
      popular: false,
    },
    {
      name: "Business",
      price: "299,000",
      period: "so'm/oy",
      desc: "O'rta korxonalar uchun",
      features: ["200 xodimagacha", "5 ta qurilma", "Kengaytirilgan hisobotlar", "Maosh moduli", "24/7 qo'llab-quvvatlash"],
      color: BRAND.primary,
      textColor: "#fff",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Aloqaga chiqing",
      period: "",
      desc: "Katta tashkilotlar uchun",
      features: ["Cheksiz xodimlar", "Cheksiz qurilmalar", "API integratsiya", "Maxsus xususiyatlar", "Shaxsiy menejer"],
      color: "#E0F2F1",
      textColor: "#00695C",
      popular: false,
    },
  ];

  const testimonials = [
    { name: "Bobur Yusupov", role: "IT Director, Texnopark", text: "WorkTrack Pro bilan davomat tizimimiz 100% avtomatlashdi. Juda qulay!" },
    { name: "Nilufar Rashidova", role: "HR Manager, MegaGroup", text: "Xodimlar endi qog'oz varaqlarga imzo chekmaydi. Vaqt va pul tejadik." },
    { name: "Jasur Toshmatov", role: "CEO, IT Solutions", text: "Hisobotlar shunchalik aniq va tezki, endi biz qaror qabul qilishda muammo yo'q." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8EAF0", height: 64,
        display: "flex", alignItems: "center", padding: "0 40px",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: BRAND.primary }}>WorkTrack Pro</span>
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {["Xususiyatlar", "Narxlar", "Aloqa"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: 14, color: "#374151", textDecoration: "none", fontWeight: 500 }}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/login")}
            style={{ padding: "9px 20px", borderRadius: 8, border: `1.5px solid ${BRAND.primary}`, background: "transparent", color: BRAND.primary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Kirish
          </button>
          <button
            onClick={() => navigate("/register")}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(26,35,126,0.3)" }}
          >
            Bepul boshlash →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #0A0F3D 0%, ${BRAND.primary} 50%, #1565C0 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px 40px 60px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Background decorations */}
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: `rgba(0,137,123,0.12)`, pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px",
            marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <span style={{ fontSize: 16 }}>🚀</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>O'zbekistondagi #1 davomat tizimi</span>
          </div>

          <h1 style={{ fontSize: 56, fontWeight: 900, color: "#fff", margin: "0 0 20px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Face ID orqali<br />
            <span style={{ background: `linear-gradient(90deg, #4DD0E1, #80DEEA)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Xodimlar Davomati
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", marginBottom: 40, lineHeight: 1.7 }}>
            Zamonaviy yuz tanish texnologiyasi bilan xodimlar davomatini avtomatik boshqaring.
            Qog'oz daftarlar, kartalar va PIN kodlarga xayrlashing.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "16px 36px", borderRadius: 12, border: "none",
                background: "#fff", color: BRAND.primary,
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              7 kun bepul sinab ko'ring
              <ArrowRight size={18} />
            </button>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "16px 32px", borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.4)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)",
              }}
            >
              <Smartphone size={18} />
              Ilovani yuklash
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            {[
              { icon: "✅", text: "Kartasiz kirish" },
              { icon: "⚡", text: "2 soniyada ro'yxat" },
              { icon: "🔒", text: "100% xavfsiz" },
              { icon: "📊", text: "Real-vaqt hisobotlar" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: "#fff", padding: "60px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, textAlign: "center" }}>
          {[
            { value: "500+", label: "Kompaniyalar", icon: "🏢" },
            { value: "50,000+", label: "Xodimlar", icon: "👥" },
            { value: "99.9%", label: "Ishlash vaqti", icon: "⚡" },
            { value: "2 soniya", label: "Kirish tezligi", icon: "🎯" },
          ].map(({ value, label, icon }) => (
            <div key={label}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: BRAND.primary, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 14, color: "#6B7280", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="xususiyatlar" style={{ background: "#F5F7FA", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#111827", margin: 0 }}>Nima uchun WorkTrack Pro?</h2>
            <p style={{ fontSize: 16, color: "#6B7280", marginTop: 12 }}>Bizning platforma sizga kerakli barcha vositalarni taqdim etadi</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {features.map((f) => (
              <div key={f.title} style={{
                background: "#fff", borderRadius: 16, padding: "28px 24px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: "1px solid #E8EAF0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(26,35,126,0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="narxlar" style={{ background: "#fff", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: "#111827", margin: 0 }}>Narxlar</h2>
            <p style={{ fontSize: 16, color: "#6B7280", marginTop: 12 }}>Har qanday hajmdagi korxona uchun mos tarif</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "center" }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{
                background: plan.color, borderRadius: 20,
                padding: plan.popular ? "36px 28px" : "28px 24px",
                position: "relative", overflow: "hidden",
                boxShadow: plan.popular ? "0 20px 60px rgba(26,35,126,0.3)" : "0 2px 12px rgba(0,0,0,0.06)",
                transform: plan.popular ? "scale(1.05)" : "none",
                border: plan.popular ? "none" : "1px solid #E8EAF0",
              }}>
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: 16, right: -28, background: BRAND.teal,
                    color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 32px",
                    transform: "rotate(45deg)", letterSpacing: "0.05em",
                  }}>
                    MASHHUR
                  </div>
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: plan.textColor, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.7)" : "#9CA3AF", marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: plan.textColor }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 14, color: plan.popular ? "rgba(255,255,255,0.7)" : "#9CA3AF", marginLeft: 4 }}>{plan.period}</span>}
                </div>
                <div style={{ marginBottom: 28 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <CheckCircle2 size={16} color={plan.popular ? BRAND.teal : BRAND.primary} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: plan.textColor, opacity: plan.popular ? 1 : 0.8 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(plan.price === "Aloqaga chiqing" ? "#aloqa" : "/register")}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, border: "none",
                    background: plan.popular ? "#fff" : BRAND.primary,
                    color: plan.popular ? BRAND.primary : "#fff",
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {plan.price === "Aloqaga chiqing" ? "Murojaat qilish" : "Boshlash"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: "#F5F7FA", padding: "80px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 48 }}>Mijozlarimiz fikri</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {testimonials.map((t) => (
              <div key={t.name} style={{ background: "#fff", borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", marginBottom: 12 }}>
                  {[1,2,3,4,5].map((s) => <Star key={s} size={16} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{t.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="aloqa" style={{
        background: `linear-gradient(135deg, #0A0F3D 0%, ${BRAND.primary} 100%)`,
        padding: "80px 40px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: "#fff", margin: "0 0 16px" }}>Boshlashga tayyormisiz?</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 40 }}>
            7 kunlik bepul sinov muddatida barcha imkoniyatlardan foydalaning
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "16px 40px", borderRadius: 12, border: "none",
                background: "#fff", color: BRAND.primary,
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              }}
            >
              Bepul boshlash →
            </button>
            <a
              href="tel:+998901234567"
              style={{
                padding: "16px 32px", borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,0.4)",
                color: "#fff", fontSize: 15, fontWeight: 600,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Phone size={18} />
              +998 90 123 45 67
            </a>
          </div>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
            <Mail size={16} color="rgba(255,255,255,0.6)" />
            <a href="mailto:info@worktrackpro.uz" style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, textDecoration: "none" }}>
              info@worktrackpro.uz
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0A0F3D", padding: "32px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.teal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} color="#fff" />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>WorkTrack Pro</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Maxfiylik siyosati", "Foydalanish shartlari", "Cookie"].map((item) => (
              <a key={item} href="#" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textDecoration: "none" }}>{item}</a>
            ))}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>© 2026 WorkTrack Pro. Barcha huquqlar himoyalangan.</div>
        </div>
      </footer>
    </div>
  );
}
