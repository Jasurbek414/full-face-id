import { createBrowserRouter, redirect } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveMonitoringPage } from "./pages/LiveMonitoringPage";
import { AttendancePage } from "./pages/AttendancePage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeProfilePage } from "./pages/EmployeeProfilePage";
import { CameraManagementPage } from "./pages/CameraManagementPage";
import { ReportsPage } from "./pages/ReportsPage";
import { LeavesPage } from "./pages/LeavesPage";
import { PayrollPage } from "./pages/PayrollPage";
import { SALoginPage } from "./pages/SALoginPage";
import { SADashboardPage } from "./pages/SADashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";


export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/login"),
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/sa/login",
    Component: SALoginPage,
  },
  {
    path: "/sa/dashboard",
    Component: SADashboardPage,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        Component: Layout,
        children: [
          { index: true, loader: () => redirect("/app/dashboard") },
          { path: "dashboard", Component: DashboardPage },
          { path: "monitoring", Component: LiveMonitoringPage },
          { path: "attendance", Component: AttendancePage },
          { path: "leaves", Component: LeavesPage },
          { path: "payroll", Component: PayrollPage },
          { path: "employees", Component: EmployeesPage },
          { path: "employees/:id", Component: EmployeeProfilePage },
          { path: "cameras", Component: CameraManagementPage },
          { path: "team", Component: UsersPage },
          { path: "reports", Component: ReportsPage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
]);
