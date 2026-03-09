import React, { useState } from "react";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { saAPI } from "../api/saClient";

const BRAND = {
    primary: "#1A237E",
    bg: "#F5F7FA",
};

export function SALoginPage() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data } = await saAPI.login({ phone, password });
            localStorage.setItem("sa_access_token", data.access);
            navigate("/sa/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid SuperAdmin credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
            <div style={{ backgroundColor: "#fff", padding: 40, borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.05)", width: "100%", maxWidth: 400 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: BRAND.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={32} color="#fff" />
                    </div>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", textAlign: "center", margin: 0 }}>SuperAdmin Access</h1>
                <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, marginBottom: 32 }}>Sign in to manage the WorkTrack system.</p>

                {error && (
                    <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", color: "#DC2626", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Phone Number</label>
                        <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+998"
                            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 15, outlineColor: BRAND.primary }}
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Secret Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 15, outlineColor: BRAND.primary }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: 14, borderRadius: 8, border: "none", backgroundColor: BRAND.primary, color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
                    >
                        {loading ? "Authenticating..." : "Enter Portal"}
                    </button>
                </form>
            </div>
        </div>
    );
}
