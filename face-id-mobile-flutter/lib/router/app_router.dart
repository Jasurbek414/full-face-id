import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/otp_verify_screen.dart';
import '../screens/main/main_shell.dart';
import '../screens/main/home_screen.dart';
import '../screens/main/attendance_screen.dart';
import '../screens/main/employees_screen.dart';
import '../screens/main/profile_screen.dart';
import '../screens/main/reports_screen.dart';
import '../screens/main/checkin_screen.dart';
import '../screens/main/notifications_screen.dart';

class AppRouter {
  static GoRouter router(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/splash',
      refreshListenable: auth,
      redirect: (context, state) {
        final isSplash = state.matchedLocation == '/splash';
        final isAuth = state.matchedLocation.startsWith('/auth');

        if (auth.status == AuthStatus.unknown) {
          return isSplash ? null : '/splash';
        }
        if (auth.status == AuthStatus.unauthenticated) {
          return isAuth ? null : '/auth/login';
        }
        if (auth.status == AuthStatus.authenticated) {
          if (isSplash || isAuth) return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          builder: (ctx, _) => const SplashScreen(),
        ),
        GoRoute(
          path: '/auth/login',
          builder: (ctx, _) => const LoginScreen(),
        ),
        GoRoute(
          path: '/auth/register',
          builder: (ctx, _) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/auth/otp',
          builder: (ctx, state) {
            final email = state.extra as String? ?? '';
            return OtpVerifyScreen(email: email);
          },
        ),
        ShellRoute(
          builder: (ctx, state, child) => MainShell(child: child),
          routes: [
            GoRoute(
              path: '/home',
              builder: (ctx, _) => const HomeScreen(),
            ),
            GoRoute(
              path: '/attendance',
              builder: (ctx, _) => const AttendanceScreen(),
            ),
            GoRoute(
              path: '/employees',
              builder: (ctx, _) => const EmployeesScreen(),
            ),
            GoRoute(
              path: '/reports',
              builder: (ctx, _) => const ReportsScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (ctx, _) => const ProfileScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/checkin',
          builder: (ctx, _) => const CheckInScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (ctx, _) => const NotificationsScreen(),
        ),
      ],
      errorBuilder: (ctx, state) => Scaffold(
        body: Center(child: Text('Sahifa topilmadi: ${state.error}')),
      ),
    );
  }
}
