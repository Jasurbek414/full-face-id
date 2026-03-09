Design a complete UI design system and screens for "WorkTrack Pro" — 
an employee attendance and time tracking SaaS platform.

BRAND:
- Primary: #1A237E (deep indigo), Accent: #3949AB, 
  Teal: #00897B, Background: #F5F7FA, White: #FFFFFF
- Font: Inter (headings bold, body regular)
- Style: Professional, clean, modern SaaS — similar to Linear or Notion

DESIGN SYSTEM (create these components first):
- Color palette tokens, typography scale (12/14/16/20/24/32px)
- Button variants: primary, secondary, ghost, danger (all states)
- Input fields, dropdowns, date pickers
- Badge/status chips: green "On Time", orange "Late", red "Absent", gray "Off"
- Avatar with online indicator dot
- Sidebar navigation component
- Data table rows with checkbox and action menu
- KPI stat card (icon + number + label + trend arrow)
- Toast notifications (success, warning, error)

WEB SCREENS (Desktop 1440px):
1. LOGIN PAGE — centered card, email/password fields, 
   "Sign in with Face ID" button with camera icon, company logo area
2. DASHBOARD — left sidebar nav, top header with company name + user avatar,
   4 KPI cards (Present Today / Late / Absent / Total Hours), 
   bar chart (weekly attendance), live feed list (last 8 check-ins with photo+name+time+status badge)
3. LIVE MONITORING — full-width grid of employee cards showing 
   "Inside" / "Outside" status with avatar, name, check-in time
4. ATTENDANCE LOG TABLE — searchable, filterable table with columns: 
   Employee, Date, Check-in, Check-out, Duration, Status, Method (Face ID/PIN/Manual), Actions
5. EMPLOYEE PROFILE — two-column layout: left = avatar + face ID setup button + 
   basic info; right = this month attendance calendar heatmap + stats
6. CAMERA MANAGEMENT — grid of camera cards with live status indicator, 
   location name, last activity, enable/disable toggle
7. REPORTS PAGE — date range picker, report type selector, 
   preview table, export buttons (PDF / Excel / CSV)

MOBILE SCREENS (390px iPhone):
1. SPLASH / ONBOARDING — dark indigo background, logo animation placeholder, tagline
2. LOGIN — minimal, email + password, large "Login with Face ID" CTA button
3. HOME — greeting header, large "Check In" / "Check Out" CTA button with status indicator,
   today's status card (arrived 09:02, 6h 24m worked), 
   mini weekly bar chart, quick nav bottom tabs
4. CHECK-IN CAMERA — full screen camera view, face detection oval overlay 
   with animated scanning ring, "Scanning..." label, 
   success state: green checkmark + "Checked In — 09:02"
5. MY ATTENDANCE — monthly calendar view with color dots per day, 
   below: list of recent records
6. PROFILE — avatar + name + role, face ID re-enroll button, 
   stats row (this month: present/late/absent), settings list items

STYLE NOTES:
- Web: sidebar should be 240px collapsible, content area has card-based layout
- Mobile: bottom tab bar with 5 icons (Home, Attendance, Check-in FAB center, Reports, Profile)
- Check-in FAB on mobile: large teal circle button, elevated shadow
- Use subtle shadows (0 2px 8px rgba(0,0,0,0.08)) on cards
- Tables: alternating row colors (#F5F7FA / white), sticky header
- Status colors consistent: #00C853 present, #FF6D00 late, #D50000 absent
- All charts use brand colors with 60% opacity fills