import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Eye, EyeOff, Activity, User, Phone, Lock, ArrowRight,
  Mail, Building2, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/client";

const inputWrap = (focused: boolean, hasError: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: `1.5px solid ${hasError ? "#FECACA" : focused ? "#3949AB" : "#E5E7EB"}`,
  borderRadius: 12,
  padding: "11px 14px",
  backgroundColor: hasError ? "#FFF5F5" : focused ? "#FAFBFF" : "#fff",
  transition: "all 0.2s",
  boxSizing: "border-box",
  width: "100%",
});

const inputStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  color: "#111827",
  backgroundColor: "transparent",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  display: "block",
  marginBottom: 7,
};

const errorText: React.CSSProperties = {
  fontSize: 12,
  color: "#DC2626",
  marginTop: 5,
  paddingLeft: 2,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.first_name.trim()) errs.first_name = "Ismni kiriting";
    if (!formData.last_name.trim()) errs.last_name = "Familiyani kiriting";
    if (!formData.company_name.trim()) errs.company_name = "Kompaniya nomini kiriting";
    if (!formData.email.trim()) {
      errs.email = "Emailni kiriting";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Email formati noto'g'ri";
    }
    if (!formData.phone.trim()) errs.phone = "Telefon raqamni kiriting";
    if (!formData.password) {
      errs.password = "Parolni kiriting";
    } else if (formData.password.length < 8) {
      errs.password = "Parol kamida 8 ta belgi bo'lishi kerak";
    }
    if (formData.password !== formData.confirm_password) {
      errs.confirm_password = "Parollar mos tushmadi";
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const { data } = await apiClient.post("/api/v1/auth/email-direct-register/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      if (data.user?.company?.id) {
        localStorage.setItem("company_id", data.user.company.id);
      }
      setSuccess(true);
      setTimeout(() => navigate("/app/dashboard"), 1500);
    } catch (e: any) {
      const data = e.response?.data;
      if (data && typeof data === "object") {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          mapped[k] = Array.isArray(v) ? (v[0] as string) : String(v);
        }
        setErrors(mapped);
      } else {
        setErrors({ general: "Xatolik yuz berdi. Qaytadan urinib ko'ring." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0F1B5C 0%, #1A237E 45%, #1565C0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: "60px 48px",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #10B981)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(5,150,105,0.3)",
            }}
          >
            <CheckCircle2 size={36} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 10 }}>
            Muvaffaqiyatli!
          </div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>
            Akkauntingiz yaratildi. Dashboardga o'tilmoqda...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F1B5C 0%, #1A237E 45%, #1565C0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: "40px 20px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", top: -150, right: -150, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 450, height: 450, borderRadius: "50%", background: "rgba(0,137,123,0.12)", pointerEvents: "none" }} />

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 24,
          width: "100%",
          maxWidth: 500,
          padding: "44px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #1A237E 0%, #00897B 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 10px 24px rgba(26,35,126,0.35)",
            }}
          >
            <Activity size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F1B5C", letterSpacing: "-0.02em" }}>
            Ro'yxatdan o'tish
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 5 }}>
            WorkTrack Pro — yangi akkaunt yarating
          </div>
        </div>

        <div style={{ height: 1, background: "#F3F4F6", marginBottom: 22 }} />

        {/* First name + Last name row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={labelStyle}>Ism</label>
            <div style={inputWrap(focusedField === "first_name", !!errors.first_name)}>
              <User size={15} color={focusedField === "first_name" ? "#3949AB" : errors.first_name ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onFocus={() => setFocusedField("first_name")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                placeholder="Ism"
              />
            </div>
            {errors.first_name && <div style={errorText}>{errors.first_name}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={labelStyle}>Familiya</label>
            <div style={inputWrap(focusedField === "last_name", !!errors.last_name)}>
              <User size={15} color={focusedField === "last_name" ? "#3949AB" : errors.last_name ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onFocus={() => setFocusedField("last_name")}
                onBlur={() => setFocusedField(null)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                placeholder="Familiya"
              />
            </div>
            {errors.last_name && <div style={errorText}>{errors.last_name}</div>}
          </div>
        </div>

        {/* Company */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Kompaniya nomi</label>
          <div style={inputWrap(focusedField === "company_name", !!errors.company_name)}>
            <Building2 size={15} color={focusedField === "company_name" ? "#3949AB" : errors.company_name ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              onFocus={() => setFocusedField("company_name")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="Sizning kompaniyangiz"
            />
          </div>
          {errors.company_name && <div style={errorText}>{errors.company_name}</div>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Gmail manzil</label>
          <div style={inputWrap(focusedField === "email", !!errors.email)}>
            <Mail size={15} color={focusedField === "email" ? "#3949AB" : errors.email ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="sizning@gmail.com"
              autoComplete="email"
            />
          </div>
          {errors.email && <div style={errorText}>{errors.email}</div>}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Telefon raqam</label>
          <div style={inputWrap(focusedField === "phone", !!errors.phone)}>
            <Phone size={15} color={focusedField === "phone" ? "#3949AB" : errors.phone ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="998901234567"
            />
          </div>
          {errors.phone && <div style={errorText}>{errors.phone}</div>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Parol</label>
          <div style={inputWrap(focusedField === "password", !!errors.password)}>
            <Lock size={15} color={focusedField === "password" ? "#3949AB" : errors.password ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="Kamida 8 ta belgi"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9CA3AF", display: "flex", flexShrink: 0 }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <div style={errorText}>{errors.password}</div>}
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 6 }}>
          <label style={labelStyle}>Parolni tasdiqlash</label>
          <div style={inputWrap(focusedField === "confirm_password", !!errors.confirm_password)}>
            <Lock size={15} color={focusedField === "confirm_password" ? "#3949AB" : errors.confirm_password ? "#DC2626" : "#9CA3AF"} style={{ flexShrink: 0 }} />
            <input
              type={showConfirm ? "text" : "password"}
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              onFocus={() => setFocusedField("confirm_password")}
              onBlur={() => setFocusedField(null)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9CA3AF", display: "flex", flexShrink: 0 }}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirm_password && <div style={errorText}>{errors.confirm_password}</div>}
        </div>

        {(errors.general || errors.detail || errors.non_field_errors) && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#DC2626",
              fontSize: 13,
              marginTop: 12,
            }}
          >
            {errors.general || errors.detail || errors.non_field_errors}
          </div>
        )}

        <button
          onClick={handleSubmit}
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
            boxSizing: "border-box",
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Ro'yxatdan o'tilmoqda...
            </>
          ) : (
            <>
              Ro'yxatdan o'tish
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Akkauntingiz bormi? </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#3949AB",
              fontWeight: 700,
              padding: 0,
            }}
          >
            Kirish →
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
