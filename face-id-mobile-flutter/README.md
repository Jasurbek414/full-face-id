# WorkTrack Pro - Flutter Mobile App

Yuz aniqlash (Face ID) orqali xodimlar davomatini boshqarish uchun Flutter mobil ilovasi.

## Texnologiyalar

- **Flutter** 3.x (Dart 3.2+)
- **State management**: Provider
- **Navigation**: GoRouter
- **HTTP**: Dio
- **Storage**: flutter_secure_storage + shared_preferences
- **Camera**: camera paketi
- **Charts**: fl_chart
- **UI**: Material Design 3 + Google Fonts (Inter)

## Loyiha strukturasi

```
lib/
├── main.dart                 # Kirish nuqtasi
├── theme/
│   └── app_theme.dart        # Ranglar va stil
├── router/
│   └── app_router.dart       # Navigatsiya (GoRouter)
├── models/
│   ├── user_model.dart       # Foydalanuvchi modeli
│   └── attendance_model.dart # Davomat modeli
├── services/
│   └── api_service.dart      # Barcha API so'rovlar (Dio)
├── providers/
│   ├── auth_provider.dart    # Autentifikatsiya holati
│   ├── attendance_provider.dart # Davomat holati
│   └── user_provider.dart    # Xodimlar holati
├── screens/
│   ├── auth/
│   │   ├── splash_screen.dart    # Ochilish ekrani
│   │   ├── login_screen.dart     # Kirish (email/telefon)
│   │   ├── register_screen.dart  # Ro'yxatdan o'tish
│   │   └── otp_verify_screen.dart # OTP tasdiqlash
│   └── main/
│       ├── main_shell.dart       # BottomNavigationBar wrapper
│       ├── home_screen.dart      # Asosiy ekran (dashboard)
│       ├── checkin_screen.dart   # Face ID kirish/chiqish
│       ├── attendance_screen.dart # Davomat jurnali
│       ├── employees_screen.dart  # Xodimlar ro'yxati
│       ├── reports_screen.dart    # Hisobotlar
│       ├── profile_screen.dart    # Profil va sozlamalar
│       └── notifications_screen.dart # Bildirishnomalar
└── widgets/
    ├── app_text_field.dart  # Umumiy matn kiritish
    └── app_button.dart      # Umumiy tugmalar
```

## Ishga tushirish

### Talablar
- Flutter SDK 3.x
- Dart 3.2+
- Android Studio yoki VS Code
- Android 6.0+ / iOS 14+ qurilma

### O'rnatish

```bash
# Bog'liqliklarni o'rnatish
flutter pub get

# Android uchun ishga tushirish
flutter run --dart-define=API_URL=http://YOUR_SERVER_IP:8000

# iOS uchun ishga tushirish
flutter run -d ios --dart-define=API_URL=http://YOUR_SERVER_IP:8000

# Release APK yaratish
flutter build apk --release --dart-define=API_URL=https://your-domain.com

# Release iOS yaratish
flutter build ios --release --dart-define=API_URL=https://your-domain.com
```

### Environment o'zgaruvchilari

| O'zgaruvchi | Tavsif | Default |
|-------------|--------|---------|
| `API_URL` | Backend server manzili | `http://10.0.2.2:8000` |

> **Eslatma**: Android emulatorida `10.0.2.2` localhost manzili hisoblanadi. Haqiqiy qurilmada serverning IP manzilini kiriting.

## Backend bilan ulanish

Backend `D:/loyihalar/face-id-platforma-master/` papkasida joylashgan.

### Backend ishga tushirish (Local)

```bash
cd D:/loyihalar/face-id-platforma-master/backend

# Virtual environment yaratish
python -m venv venv
venv\Scripts\activate  # Windows

# Bog'liqliklarni o'rnatish
pip install -r requirements.txt

# .env faylini yaratish
copy .env.example .env
# .env faylini tahrirlang

# Migratsiyalarni qo'llash
python manage.py migrate

# Superadmin yaratish
python manage.py shell -c "from apps.accounts.models import User; User.objects.create_superuser(phone='+998901234567', password='admin123')"

# Serverni ishga tushirish
python manage.py runserver 0.0.0.0:8000
```

## Asosiy funksiyalar

### Kirish usullari
- ✅ Email + parol
- ✅ Telefon + parol
- ✅ Face ID (kamera orqali)
- ✅ PIN kod

### Davomat
- ✅ Bugungi holat
- ✅ Jurnal (oylik/kunlik)
- ✅ Statistika
- ✅ Kirish/chiqish vaqti
- ✅ Ishlangan soatlar

### Xodimlar
- ✅ Ro'yxat
- ✅ Qidirish
- ✅ Profil ko'rish

### Hisobotlar
- ✅ Oylik statistika
- ✅ Doiraviy diagramma
- ✅ Ustunli diagramma

### Profil
- ✅ Foydalanuvchi ma'lumotlari
- ✅ Face ID yangilash
- ✅ Sozlamalar
- ✅ Chiqish

## SuperAdmin Panel

Web SuperAdmin paneli: `http://localhost:3000/sa/login`

Default login: `.env.example` faylidagi `SA_JWT_SECRET` bilan

## Litsenziya

WorkTrack Pro - Barcha huquqlar himoyalangan.
