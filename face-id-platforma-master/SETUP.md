# WorkTrack Pro — To'liq o'rnatish qo'llanmasi

## Tizim talablari

- Python 3.11+
- Node.js 18+
- Redis (lokal yoki Docker)
- PostgreSQL 15+ (ixtiyoriy; SQLite ham ishlatiladi)
- Flutter 3.x (mobil ilova uchun)

---

## 1. Backend (Django) — Lokal ishga tushirish

```bash
cd D:\loyihalar\face-id-platforma-master\backend

# Virtual muhit yaratish
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Bog'liqliklarni o'rnatish
pip install -r requirements.txt

# .env faylini yaratish
copy .env.example .env       # Windows
# cp .env.example .env       # Linux/Mac

# .env faylini tahrirlang (kamida DJANGO_SECRET_KEY va SA_JWT_SECRET)

# RSA kalitlarini yaratish (JWT uchun)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Migratsiyalarni qo'llash
python manage.py migrate

# SuperAdmin foydalanuvchisi yaratish
python manage.py shell -c "
from apps.accounts.models import User
if not User.objects.filter(phone='+998901234567').exists():
    u = User.objects.create_superuser(phone='+998901234567', password='Admin@12345')
    u.is_staff = True
    u.is_superuser = True
    u.save()
    print('SuperAdmin yaratildi: +998901234567 / Admin@12345')
else:
    print('SuperAdmin allaqachon mavjud')
"

# Boshlang'ich tariflarni yaratish
python manage.py shell -c "
from apps.subscriptions.models import Plan
if not Plan.objects.exists():
    Plan.objects.create(name='TRIAL', price_per_month=0, max_employees=20, description='7 kunlik bepul sinov')
    Plan.objects.create(name='BASIC', price_per_month=299000, max_employees=50, description='Kichik korxonalar uchun')
    Plan.objects.create(name='PREMIUM', price_per_month=599000, max_employees=200, description='O\'rta va yirik korxonalar')
    Plan.objects.create(name='ENTERPRISE', price_per_month=1199000, max_employees=9999, description='Cheklovsiz xodimlar')
    print('Tariflar yaratildi!')
"

# Serverni ishga tushirish
python manage.py runserver 0.0.0.0:8000
```

---

## 2. Backend (Django) — Redis bilan (to'liq rejim)

Redis kerak bo'lsa, Docker orqali ishga tushiring:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Celery worker va beat:
```bash
# Yangi terminal
celery -A backend_project worker -l info

# Yana bir yangi terminal
celery -A backend_project beat -l info
```

---

## 3. Frontend (React) — Lokal ishga tushirish

```bash
cd D:\loyihalar\face-id-platforma-master\frontend

# Bog'liqliklarni o'rnatish
npm install

# .env.local faylini yaratish
echo VITE_API_URL=http://localhost:8000 > .env.local

# Development serverni ishga tushirish
npm run dev
```

Web ilova: `http://localhost:5173`
SuperAdmin panel: `http://localhost:5173/sa/login`

---

## 4. SuperAdmin panelga kirish

1. `http://localhost:5173/sa/login` ga o'ting
2. Telefon: `+998901234567`
3. Parol: `Admin@12345`

### SuperAdmin funksiyalari:
- ✅ Kompaniyalar ro'yxati (qidiruv, filtrlash)
- ✅ Bloklash / Blokdan ochish
- ✅ Tarif belgilash (TRIAL, BASIC, PREMIUM, ENTERPRISE)
- ✅ Oylik narx belgilash (har bir kompaniyaga alohida)
- ✅ To'lov kiritish (avtomatik blokdan chiqarish)
- ✅ Obunani uzaytirish
- ✅ Grace muddat belgilash
- ✅ To'lovlar tarixi
- ✅ Admin izohlari
- ✅ Audit log
- ✅ Tizim holati (DB, Redis, Celery)
- ✅ Daromad statistikasi (MRR)
- ✅ 7 kun ichida tugaydigan obunalar

---

## 5. Flutter mobil ilova

```bash
cd D:\loyihalar\face-id-mobile-flutter

# Bog'liqliklarni o'rnatish
flutter pub get

# Android emulatorida ishga tushirish
flutter run --dart-define=API_URL=http://10.0.2.2:8000

# Haqiqiy qurilmada (Wi-Fi orqali)
# Avval kompyuteringizning IP manzilin toping (ipconfig)
flutter run --dart-define=API_URL=http://192.168.X.X:8000

# Release APK yaratish
flutter build apk --release --dart-define=API_URL=https://your-domain.com
```

---

## 6. Docker Compose (Production)

```bash
cd D:\loyihalar\face-id-platforma-master

# .env faylini yaratish
copy .env.example .env
# .env ni tahrirlang (PostgreSQL va boshqa sozlamalar)

# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# Migratsiyalar
docker-compose exec api python manage.py migrate

# SuperAdmin yaratish
docker-compose exec api python manage.py shell -c "
from apps.accounts.models import User
User.objects.create_superuser(phone='+998901234567', password='Admin@12345')
"
```

---

## 7. Abonent (Kampaniya) hayot davri

```
Ro'yxatdan o'tish → TRIAL (7 kun) → Muddati tugaydi → GRACE (3 kun) → BLOCKED
                                  ↑                           ↑
                         To'lov kiritilsa ACTIVE      To'lov kiritilsa ACTIVE
```

**Avtomatik jarayonlar (Celery):**
- Har soat: `auto_block_expired` — TRIAL/ACTIVE → GRACE → BLOCKED
- Har 15 daqiqa: `auto_unblock_paid` — To'langan BLOCKED → ACTIVE

---

## 8. API endpointlar

### Umumiy
- `POST /api/v1/auth/email-register/` — Ro'yxatdan o'tish (OTP yuborish)
- `POST /api/v1/auth/email-verify/` — OTP tasdiqlash va akkaunt yaratish
- `POST /api/v1/auth/email-login/` — Email orqali kirish
- `GET  /api/v1/auth/me/` — Joriy foydalanuvchi

### SuperAdmin (JWT bilan)
- `POST /_sa/api/auth/login/` — SA kirish
- `GET  /_sa/api/dashboard/` — Statistika
- `GET  /_sa/api/companies/` — Kompaniyalar ro'yxati
- `POST /_sa/api/companies/{id}/block/` — Bloklash
- `POST /_sa/api/companies/{id}/unblock/` — Ochish
- `POST /_sa/api/companies/{id}/activate-plan/` — Tarif faollashtirish
- `POST /_sa/api/companies/{id}/set-price/` — Oylik narx belgilash
- `POST /_sa/api/companies/{id}/record-payment/` — To'lov kiritish
- `GET  /_sa/api/companies/{id}/payments/` — To'lovlar tarixi
- `POST /_sa/api/companies/{id}/extend/` — Uzaytirish
- `GET  /_sa/api/plans/` — Tariflar ro'yxati
- `POST /_sa/api/plans/` — Yangi tarif
- `GET  /_sa/api/audit-log/` — Audit log
- `GET  /_sa/api/revenue/` — Daromad
