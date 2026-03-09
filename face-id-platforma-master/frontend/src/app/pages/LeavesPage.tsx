import React, { useState } from "react";
import { Plus, X, Calendar as CalendarIcon, FileText } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useLeaveBalance, useLeaveRequests, useLeaveTypes } from "../hooks/useLeaves";
import { leavesAPI } from "../api/leaves";

const BRAND = {
    primary: "#1A237E",
    teal: "#00897B",
    bg: "#F5F7FA",
};

export function LeavesPage() {
    const { balance, loading: loadingBalance, refetch: refetchBalance } = useLeaveBalance();
    const { requests, loading: loadingRequests, refetch: refetchRequests } = useLeaveRequests();
    const { types } = useLeaveTypes();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ leave_type: "", start_date: "", end_date: "", reason: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await leavesAPI.createRequest(formData);
            setIsModalOpen(false);
            setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
            refetchBalance();
            refetchRequests();
        } catch (error) {
            console.error(error);
            alert("Error submitting request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ fontFamily: "Inter, sans-serif" }}>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Leaves</h1>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Manage your leave balances and requests.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8,
                        border: "none", backgroundColor: BRAND.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                >
                    <Plus size={16} /> New Request
                </button>
            </div>

            {/* Balance Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
                {loadingBalance ? <p>Loading limits...</p> : balance.map((b: any) => (
                    <div key={b.name} style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginBottom: 8 }}>{b.name}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: BRAND.primary }}>{b.remaining_days} <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 500 }}>left</span></div>
                        <div style={{ marginTop: 12, height: 6, backgroundColor: "#E8EAF0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(b.used_days / b.max_days_per_year) * 100}%`, backgroundColor: BRAND.teal }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginTop: 8 }}>
                            <span>Used: {b.used_days}</span>
                            <span>Total: {b.max_days_per_year}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Requests Table */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: BRAND.bg, borderBottom: "1px solid #E8EAF0" }}>
                            {["Type", "Start Date", "End Date", "Days", "Reason", "Status"].map((h) => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loadingRequests ? <tr><td colSpan={6} style={{ padding: 16 }}>Loading requests...</td></tr> : requests.map((req: any, i) => (
                            <tr key={req.id} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: i % 2 === 0 ? "#fff" : BRAND.bg }}>
                                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#111827" }}>{req.leave_type_name}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{req.start_date}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{req.end_date}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{req.days}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{req.reason}</td>
                                <td style={{ padding: "12px 16px" }}><StatusBadge status={req.status} size="sm" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
                    <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 400, borderRadius: 16, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111827" }}>New Leave Request</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Leave Type</label>
                                <select required value={formData.leave_type} onChange={e => setFormData({ ...formData, leave_type: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }}>
                                    <option value="" disabled>Select a type</option>
                                    {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><CalendarIcon size={12} style={{ marginRight: 4 }} /> Start</label>
                                    <input type="date" required value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><CalendarIcon size={12} style={{ marginRight: 4 }} /> End</label>
                                    <input type="date" required value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><FileText size={12} style={{ marginRight: 4 }} /> Reason</label>
                                <textarea required rows={3} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Why do you need this leave?" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, resize: "none" }} />
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#374151" }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: BRAND.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>{submitting ? "Submitting..." : "Submit Request"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
