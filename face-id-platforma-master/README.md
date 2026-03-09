# WorkTrack Pro

**Xodimlarni boshqarish va davomat nazorat platformasi**

Kamera va Yuz ID qurilmalari orqali xodimlar davomatini avtomatik kuzatuvchi SaaS tizim. Har bir ro'yxatdan o'tgan kompaniya o'z mustaqil platformasiga ega.

---

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Backend | Python 3.11, Django 4.2, DRF, Daphne (ASGI), Celery |
| Database | PostgreSQL 15 |
| Cache / Broker | Redis 7 |
| Frontend | React 18, TypeScript, Vite, React Router v7 |
| Auth | JWT (RS256 users, HS256 superadmin) |
| Deployment | Docker Compose, Nginx |

---

## Asosiy imkoniyatlar

- **Ko'p kompaniyali (multi-tenant)** — har bir ro'yxatdan o'tgan kompaniya izolyatsiya qilingan
- **Email + parol bilan kirish** (Gmail)
- **Rol tizimi** — OWNER, MANAGER, ACCOUNTANT, HR, EMPLOYEE, GUARD
- **Davomat** — Yuz ID / PIN / QR / GPS / Manual
- **Kamera boshqaruvi** — IP kamera va Yuz ID qurilmalarini ulash, TCP ulanishni tekshirish
- **Maosh hisoblash** — soatlik/kunlik/oylik tarif, qo'shimcha ish soatlari
- **Ta'tillar** — so'rov, tasdiqlash, rad etish
- **Superadmin panel** — barcha kompaniyalarni boshqarish, bloklash/ochish
- **Real-time WebSocket** bildirishnomalar

---

## Ishga tushirish

### 1. Talablar

- Python 3.11+
- Node.js 20+
- PostgreSQL 15
- Redis 7

### 2. Repozitoriyani klonlash

```bash
git clone https://github.com/USERNAME/worktrackpro.git
cd worktrackpro
```

### 3. Environment o'rnatish

```bash
cp .env.example .env
# .env faylini o'z ma'lumotlaringiz bilan to'ldiring
```

### 4. Backend

```bash
cd backend

# Virtual muhit (ixtiyoriy)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Backend: http://localhost:8000

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## Docker bilan ishga tushirish (production)

```bash
# 1. .env faylini tayyorlang
cp .env.example .env
# .env ichidagi barcha qiymatlarni o'zgartiring

# 2. Ishga tushirish
docker compose up -d --build

# 3. Superadmin yaratish
docker compose exec api python manage.py createsuperuser
```

Platforma: http://localhost

---

## JWT kalitlarini yaratish

```bash
cd backend
python gen_keys.py
# private.pem va public.pem yaratiladi
# Ularning mazmunini .env ga qo'ying
```

---

## Superadmin panel

```
URL:      http://localhost:5173/sa/login
Login:    /_sa/api/auth/login/
```

Superadmin DB'ga to'g'ridan-to'g'ri `create_su.py` orqali yaratiladi.

---

## API hujjatlar

Backend ishga tushgandan so'ng:
- Admin panel: http://localhost:8000/admin/
- API root: http://localhost:8000/api/v1/

---

## Loyiha tuzilmasi

```
worktrackpro/
├── backend/               Django backend
│   ├── apps/
│   │   ├── accounts/      Foydalanuvchilar, auth
│   │   ├── attendance/    Davomat yozuvlari
│   │   ├── companies/     Kompaniyalar, bo'limlar
│   │   ├── devices/       Kamera va Yuz ID qurilmalari
│   │   ├── employees/     Xodimlar profili
│   │   ├── face/          Yuz tanish (FaceEncoding, FaceAttempt)
│   │   ├── leaves/        Ta'tillar
│   │   ├── notifications/ Bildirishnomalar
│   │   ├── payroll/       Maosh hisoblash
│   │   ├── reports/       Hisobotlar
│   │   ├── roles/         Rol va ruxsatlar tizimi
│   │   ├── schedules/     Ish jadvali
│   │   ├── subscriptions/ Obuna (Trial/Monthly/Yearly)
│   │   └── superadmin/    Superadmin panel API
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              React + TypeScript
│   ├── src/app/
│   │   ├── pages/         Sahifalar
│   │   ├── components/    Komponentlar
│   │   ├── api/           API klientlar
│   │   ├── hooks/         Custom hooklar
│   │   └── context/       Auth context
│   └── Dockerfile
├── nginx/                 Nginx konfiguratsiya
├── docker-compose.yml     Production deploy
├── .env.example           Environment namunasi
└── README.md
```
