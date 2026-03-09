export type AttendanceStatus = "on-time" | "late" | "absent" | "off";
export type EmployeeStatus = "inside" | "outside";
export type CheckMethod = "Face ID" | "PIN" | "Manual";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar: string;
  status: EmployeeStatus;
  checkIn: string;
  checkOut: string | null;
  employeeId: string;
  phone: string;
  joinDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string;
  status: AttendanceStatus;
  method: CheckMethod;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  lastActivity: string;
  enabled: boolean;
  coverage: string;
  resolution: string;
  ip: string;
}

export const avatars = {
  man1: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  woman1: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  asianMan: "https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  blackWoman: "https://images.unsplash.com/photo-1769636929266-8057f2c5ed52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  latinaWoman: "https://images.unsplash.com/photo-1680204438122-93a6f91a52d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  youngMan: "https://images.unsplash.com/photo-1758873272350-a2ec04e1240b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
};

export const employees: Employee[] = [
  { id: "1", name: "Marcus Rivera", email: "m.rivera@company.com", department: "Engineering", role: "Senior Developer", avatar: avatars.man1, status: "inside", checkIn: "08:54", checkOut: null, employeeId: "EMP-001", phone: "+1 (555) 234-5678", joinDate: "2021-03-15" },
  { id: "2", name: "Sarah Chen", email: "s.chen@company.com", department: "Design", role: "UX Lead", avatar: avatars.woman1, status: "inside", checkIn: "09:02", checkOut: null, employeeId: "EMP-002", phone: "+1 (555) 345-6789", joinDate: "2020-07-22" },
  { id: "3", name: "James Park", email: "j.park@company.com", department: "Engineering", role: "Backend Engineer", avatar: avatars.asianMan, status: "outside", checkIn: "09:15", checkOut: "12:30", employeeId: "EMP-003", phone: "+1 (555) 456-7890", joinDate: "2022-01-10" },
  { id: "4", name: "Amara Osei", email: "a.osei@company.com", department: "HR", role: "HR Manager", avatar: avatars.blackWoman, status: "inside", checkIn: "08:45", checkOut: null, employeeId: "EMP-004", phone: "+1 (555) 567-8901", joinDate: "2019-11-05" },
  { id: "5", name: "Sofia Martinez", email: "s.martinez@company.com", department: "Marketing", role: "Marketing Director", avatar: avatars.latinaWoman, status: "inside", checkIn: "09:30", checkOut: null, employeeId: "EMP-005", phone: "+1 (555) 678-9012", joinDate: "2020-04-18" },
  { id: "6", name: "David Kim", email: "d.kim@company.com", department: "Finance", role: "Financial Analyst", avatar: avatars.youngMan, status: "outside", checkIn: "08:58", checkOut: "11:45", employeeId: "EMP-006", phone: "+1 (555) 789-0123", joinDate: "2021-09-30" },
  { id: "7", name: "Elena Vasquez", email: "e.vasquez@company.com", department: "Sales", role: "Sales Manager", avatar: avatars.latinaWoman, status: "inside", checkIn: "09:10", checkOut: null, employeeId: "EMP-007", phone: "+1 (555) 890-1234", joinDate: "2022-06-14" },
  { id: "8", name: "Tyler Brooks", email: "t.brooks@company.com", department: "Engineering", role: "DevOps Engineer", avatar: avatars.youngMan, status: "inside", checkIn: "08:30", checkOut: null, employeeId: "EMP-008", phone: "+1 (555) 901-2345", joinDate: "2023-02-28" },
  { id: "9", name: "Priya Nair", email: "p.nair@company.com", department: "Product", role: "Product Manager", avatar: avatars.woman1, status: "inside", checkIn: "09:05", checkOut: null, employeeId: "EMP-009", phone: "+1 (555) 012-3456", joinDate: "2021-08-03" },
  { id: "10", name: "Omar Hassan", email: "o.hassan@company.com", department: "Engineering", role: "Frontend Engineer", avatar: avatars.asianMan, status: "outside", checkIn: "", checkOut: null, employeeId: "EMP-010", phone: "+1 (555) 123-4567", joinDate: "2023-05-20" },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: "a1", employeeId: "1", employeeName: "Marcus Rivera", employeeAvatar: avatars.man1, department: "Engineering", date: "2026-03-03", checkIn: "08:54", checkOut: "18:02", duration: "9h 08m", status: "on-time", method: "Face ID" },
  { id: "a2", employeeId: "2", employeeName: "Sarah Chen", employeeAvatar: avatars.woman1, department: "Design", date: "2026-03-03", checkIn: "09:02", checkOut: "17:45", duration: "8h 43m", status: "on-time", method: "Face ID" },
  { id: "a3", employeeId: "3", employeeName: "James Park", employeeAvatar: avatars.asianMan, department: "Engineering", date: "2026-03-03", checkIn: "09:45", checkOut: "18:30", duration: "8h 45m", status: "late", method: "PIN" },
  { id: "a4", employeeId: "4", employeeName: "Amara Osei", employeeAvatar: avatars.blackWoman, department: "HR", date: "2026-03-03", checkIn: "08:45", checkOut: "17:30", duration: "8h 45m", status: "on-time", method: "Face ID" },
  { id: "a5", employeeId: "5", employeeName: "Sofia Martinez", employeeAvatar: avatars.latinaWoman, department: "Marketing", date: "2026-03-03", checkIn: "09:30", checkOut: null, duration: "—", status: "late", method: "Manual" },
  { id: "a6", employeeId: "6", employeeName: "David Kim", employeeAvatar: avatars.youngMan, department: "Finance", date: "2026-03-03", checkIn: "08:58", checkOut: "17:55", duration: "8h 57m", status: "on-time", method: "Face ID" },
  { id: "a7", employeeId: "7", employeeName: "Elena Vasquez", employeeAvatar: avatars.latinaWoman, department: "Sales", date: "2026-03-03", checkIn: "09:10", checkOut: "18:15", duration: "9h 05m", status: "late", method: "PIN" },
  { id: "a8", employeeId: "8", employeeName: "Tyler Brooks", employeeAvatar: avatars.youngMan, department: "Engineering", date: "2026-03-03", checkIn: "08:30", checkOut: "17:30", duration: "9h 00m", status: "on-time", method: "Face ID" },
  { id: "a9", employeeId: "9", employeeName: "Priya Nair", employeeAvatar: avatars.woman1, department: "Product", date: "2026-03-03", checkIn: "09:05", checkOut: "18:00", duration: "8h 55m", status: "on-time", method: "Face ID" },
  { id: "a10", employeeId: "10", employeeName: "Omar Hassan", employeeAvatar: avatars.asianMan, department: "Engineering", date: "2026-03-03", checkIn: "", checkOut: null, duration: "—", status: "absent", method: "Manual" },
  { id: "a11", employeeId: "1", employeeName: "Marcus Rivera", employeeAvatar: avatars.man1, department: "Engineering", date: "2026-03-02", checkIn: "08:52", checkOut: "17:58", duration: "9h 06m", status: "on-time", method: "Face ID" },
  { id: "a12", employeeId: "2", employeeName: "Sarah Chen", employeeAvatar: avatars.woman1, department: "Design", date: "2026-03-02", checkIn: "09:18", checkOut: "17:45", duration: "8h 27m", status: "late", method: "Face ID" },
  { id: "a13", employeeId: "3", employeeName: "James Park", employeeAvatar: avatars.asianMan, department: "Engineering", date: "2026-03-02", checkIn: "", checkOut: null, duration: "—", status: "absent", method: "Manual" },
  { id: "a14", employeeId: "4", employeeName: "Amara Osei", employeeAvatar: avatars.blackWoman, department: "HR", date: "2026-03-02", checkIn: "08:40", checkOut: "17:30", duration: "8h 50m", status: "on-time", method: "Face ID" },
];

export const cameras: Camera[] = [
  { id: "c1", name: "Main Entrance", location: "Lobby", status: "online", lastActivity: "2 min ago", enabled: true, coverage: "Full entrance area", resolution: "4K", ip: "192.168.1.101" },
  { id: "c2", name: "Reception Desk", location: "Ground Floor", status: "online", lastActivity: "5 min ago", enabled: true, coverage: "Reception counter", resolution: "1080p", ip: "192.168.1.102" },
  { id: "c3", name: "Floor 2 – East", location: "2nd Floor", status: "online", lastActivity: "1 min ago", enabled: true, coverage: "East wing corridor", resolution: "1080p", ip: "192.168.1.103" },
  { id: "c4", name: "Floor 2 – West", location: "2nd Floor", status: "offline", lastActivity: "3 hours ago", enabled: false, coverage: "West wing corridor", resolution: "1080p", ip: "192.168.1.104" },
  { id: "c5", name: "Cafeteria", location: "Basement", status: "online", lastActivity: "8 min ago", enabled: true, coverage: "Full cafeteria", resolution: "1080p", ip: "192.168.1.105" },
  { id: "c6", name: "Server Room", location: "Basement", status: "online", lastActivity: "Just now", enabled: true, coverage: "Server racks", resolution: "4K", ip: "192.168.1.106" },
  { id: "c7", name: "Parking Lot A", location: "Exterior", status: "online", lastActivity: "12 min ago", enabled: true, coverage: "Parking area A", resolution: "2K", ip: "192.168.1.107" },
  { id: "c8", name: "Emergency Exit", location: "3rd Floor", status: "offline", lastActivity: "1 day ago", enabled: false, coverage: "Emergency stairwell", resolution: "1080p", ip: "192.168.1.108" },
];

export const weeklyAttendanceData = [
  { day: "Mon", present: 138, late: 12, absent: 7 },
  { day: "Tue", present: 142, late: 8, absent: 7 },
  { day: "Wed", present: 135, late: 15, absent: 7 },
  { day: "Thu", present: 140, late: 10, absent: 7 },
  { day: "Fri", present: 130, late: 18, absent: 9 },
  { day: "Sat", present: 45, late: 5, absent: 2 },
  { day: "Today", present: 142, late: 18, absent: 7 },
];

export const recentCheckIns = [
  { id: "r1", name: "Tyler Brooks", avatar: avatars.youngMan, time: "08:30", status: "on-time" as AttendanceStatus, method: "Face ID" },
  { id: "r2", name: "Amara Osei", avatar: avatars.blackWoman, time: "08:45", status: "on-time" as AttendanceStatus, method: "Face ID" },
  { id: "r3", name: "Marcus Rivera", avatar: avatars.man1, time: "08:54", status: "on-time" as AttendanceStatus, method: "Face ID" },
  { id: "r4", name: "David Kim", avatar: avatars.youngMan, time: "08:58", status: "on-time" as AttendanceStatus, method: "Face ID" },
  { id: "r5", name: "Sarah Chen", avatar: avatars.woman1, time: "09:02", status: "on-time" as AttendanceStatus, method: "Face ID" },
  { id: "r6", name: "Priya Nair", avatar: avatars.woman1, time: "09:05", status: "on-time" as AttendanceStatus, method: "PIN" },
  { id: "r7", name: "Elena Vasquez", avatar: avatars.latinaWoman, time: "09:10", status: "late" as AttendanceStatus, method: "PIN" },
  { id: "r8", name: "James Park", avatar: avatars.asianMan, time: "09:45", status: "late" as AttendanceStatus, method: "Manual" },
];

export const monthlyCalendar = [
  { date: 1, status: "on-time" }, { date: 2, status: "on-time" }, { date: 3, status: "on-time" },
  { date: 4, status: "on-time" }, { date: 5, status: "on-time" }, { date: 6, status: "off" },
  { date: 7, status: "off" }, { date: 8, status: "on-time" }, { date: 9, status: "late" },
  { date: 10, status: "on-time" }, { date: 11, status: "on-time" }, { date: 12, status: "on-time" },
  { date: 13, status: "off" }, { date: 14, status: "off" }, { date: 15, status: "on-time" },
  { date: 16, status: "absent" }, { date: 17, status: "on-time" }, { date: 18, status: "on-time" },
  { date: 19, status: "on-time" }, { date: 20, status: "off" }, { date: 21, status: "off" },
  { date: 22, status: "on-time" }, { date: 23, status: "late" }, { date: 24, status: "on-time" },
  { date: 25, status: "on-time" }, { date: 26, status: "on-time" }, { date: 27, status: "off" },
  { date: 28, status: "off" }, { date: 29, status: "on-time" }, { date: 30, status: "on-time" },
  { date: 31, status: "on-time" },
];
