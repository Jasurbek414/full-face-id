import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, Search, Filter, UserPlus, ArrowRight, Clock, MapPin } from "lucide-react";
import { useEmployees } from "../hooks/useEmployees";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import { apiClient } from "../api/client";

const BRAND = {
    primary: "#1A237E",
    accent: "#3949AB",
    teal: "#00897B",
    bg: "#F5F7FA",
};

export function EmployeesPage() {
    const navigate = useNavigate();
    const { list } = useEmployees();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        first_name: '', last_name: '',
        phone: '', password: '',
        department: '', system_role: 'employee',
        photo: ''
    });

    const inputStyle = {
        width: '100%', padding: '10px 14px',
        border: '1.5px solid #E8EAF0',
        borderRadius: 8, marginBottom: 12,
        fontSize: 14, outline: 'none',
        boxSizing: 'border-box' as const
    };

    const handleAddEmployee = async () => {
        try {
            await apiClient.post('/api/v1/employees/', newEmployee);
            setShowAddModal(false);
            setNewEmployee({
                first_name: '', last_name: '',
                phone: '', password: '', department: '',
                system_role: 'employee', photo: ''
            });
            fetchEmployees();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Xatolik yuz berdi');
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await list({ search: searchTerm });
            setEmployees(data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchEmployees();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    return (
        <div style={{ fontFamily: "Inter, sans-serif" }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Employees</h1>
                    <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>Manage and monitor your team members</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 18px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: BRAND.primary,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(26, 35, 126, 0.2)",
                    }}
                >
                    <UserPlus size={18} />
                    Add Employee
                </button>
            </div>

            {/* Filters & Search */}
            <div
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 20,
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
            >
                <div style={{ position: "relative", flex: 1 }}>
                    <Search
                        size={18}
                        color="#9CA3AF"
                        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                        placeholder="Search by name, phone or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 12px 10px 40px",
                            borderRadius: 8,
                            border: "1.5px solid #E8EAF0",
                            fontSize: 14,
                            outline: "none",
                            color: "#374151",
                        }}
                    />
                </div>
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0 16px",
                        borderRadius: 8,
                        border: "1.5px solid #E8EAF0",
                        backgroundColor: "#fff",
                        color: "#374151",
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    <Filter size={16} />
                    Filters
                </button>
            </div>

            {/* Employee List */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                            {["Employee", "Role & Dept", "Today Status", "Check-in", "Actions"].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "14px 20px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#6B7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.025em",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                                    Ma'lumotlar yuklanmoqda...
                                </td>
                            </tr>
                        ) : employees.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                                    Xodimlar topilmadi.
                                </td>
                            </tr>
                        ) : (
                            employees.map((emp) => {
                                const deptName = typeof emp.department === 'object' ? emp.department?.name : emp.department ?? 'General';
                                const roleName = typeof emp.system_role === 'object' ? emp.system_role?.name : emp.system_role ?? 'User';

                                return (
                                    <tr
                                        key={emp.id}
                                        style={{ borderBottom: "1px solid #F3F4F6", transition: "background-color 0.1s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FBFBFF")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <UserAvatar src={emp.photo} name={`${emp.first_name} ${emp.last_name}`} size={40} />
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                                                        {emp.first_name} {emp.last_name}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{emp.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                                                {typeof emp.system_role === 'object'
                                                    ? emp.system_role?.name
                                                    : emp.system_role || ''}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                                {typeof emp.department === 'object'
                                                    ? emp.department?.name
                                                    : emp.department || ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <StatusBadge status={emp.today_status} />
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            {emp.today_status !== "absent" && emp.today_status !== "off" ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>
                                                    <Clock size={14} color="#9CA3AF" />
                                                    {emp.last_check_in || "N/A"}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: "#9CA3AF" }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <button
                                                onClick={() => navigate(`/app/employees/${emp.id}`)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    border: "1.5px solid #EEF0FB",
                                                    backgroundColor: "#fff",
                                                    color: BRAND.primary,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                Profil
                                                <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: 16, padding: 32,
                        width: 480, maxWidth: '90vw'
                    }}>
                        <h2 style={{
                            marginBottom: 24,
                            color: '#1A237E', fontSize: 20,
                            fontWeight: 700
                        }}>
                            Yangi xodim qo'shish
                        </h2>

                        {/* Ism */}
                        <input placeholder="Ism"
                            value={newEmployee.first_name}
                            onChange={e => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                            style={inputStyle} />

                        {/* Familiya */}
                        <input placeholder="Familiya"
                            value={newEmployee.last_name}
                            onChange={e => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                            style={inputStyle} />

                        {/* Telefon */}
                        <input placeholder="Telefon (998901234567)"
                            value={newEmployee.phone}
                            onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                            style={inputStyle} />

                        {/* Rasm yuklash */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                fontSize: 13, color: '#374151',
                                fontWeight: 500, display: 'block', marginBottom: 6
                            }}>
                                Rasm (ixtiyoriy)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        setNewEmployee({
                                            ...newEmployee,
                                            photo: reader.result as string
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                style={{
                                    width: '100%', padding: '8px',
                                    border: '1.5px solid #E8EAF0',
                                    borderRadius: 8, fontSize: 13,
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        {/* Parol */}
                        <input type="password" placeholder="Parol"
                            value={newEmployee.password}
                            onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                            style={inputStyle} />

                        {/* Tugmalar */}
                        <div style={{
                            display: 'flex', gap: 12,
                            justifyContent: 'flex-end', marginTop: 24
                        }}>
                            <button onClick={() => setShowAddModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    border: '1.5px solid #E8EAF0',
                                    borderRadius: 8, cursor: 'pointer',
                                    backgroundColor: 'white'
                                }}>
                                Bekor qilish
                            </button>
                            <button onClick={handleAddEmployee}
                                style={{
                                    padding: '10px 24px',
                                    backgroundColor: '#1A237E',
                                    color: 'white', border: 'none',
                                    borderRadius: 8, cursor: 'pointer',
                                    fontWeight: 600
                                }}>
                                Qo'shish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
