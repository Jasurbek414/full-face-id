import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000', // Android emulator localhost
  );

  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final companyId = await _storage.read(key: 'company_id');
          if (companyId != null) {
            options.headers['X-Company-ID'] = companyId;
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Try to refresh token
            final refreshed = await _refreshToken();
            if (refreshed) {
              final token = await _storage.read(key: 'access_token');
              error.requestOptions.headers['Authorization'] = 'Bearer $token';
              final response = await _dio.fetch(error.requestOptions);
              handler.resolve(response);
              return;
            }
            // Clear tokens on failed refresh
            await _clearTokens();
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    try {
      final refresh = await _storage.read(key: 'refresh_token');
      if (refresh == null) return false;
      final response = await Dio().post(
        '$_baseUrl/api/v1/auth/refresh/',
        data: {'refresh': refresh},
      );
      await _storage.write(key: 'access_token', value: response.data['access']);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _clearTokens() async {
    await _storage.deleteAll();
  }

  Future<void> saveTokens({
    required String access,
    required String refresh,
    String? companyId,
  }) async {
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
    if (companyId != null) {
      await _storage.write(key: 'company_id', value: companyId);
    }
  }

  Future<void> clearTokens() => _clearTokens();

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  Future<Response> loginWithEmail(String email, String password) {
    return _dio.post('/api/v1/auth/email-login/', data: {
      'email': email,
      'password': password,
    });
  }

  Future<Response> loginWithPhone(String phone, String password) {
    return _dio.post('/api/v1/auth/login/', data: {
      'phone': phone,
      'password': password,
    });
  }

  Future<Response> registerInit({
    required String email,
    required String phone,
    required String password,
    required String firstName,
    required String lastName,
    required String companyName,
  }) {
    return _dio.post('/api/v1/auth/email-register/', data: {
      'email': email,
      'phone': phone,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'company_name': companyName,
    });
  }

  Future<Response> verifyOtp(String email, String code) {
    return _dio.post('/api/v1/auth/email-verify/', data: {
      'email': email,
      'code': code,
    });
  }

  Future<Response> resendEmailOtp(String email) {
    return _dio.post('/api/v1/auth/email-register/resend/', data: {
      'email': email,
    });
  }

  Future<Response> getMe() => _dio.get('/api/v1/auth/me/');

  Future<Response> updateMe(Map<String, dynamic> data) =>
      _dio.patch('/api/v1/auth/me/', data: data);

  Future<Response> changePassword(String oldPw, String newPw) {
    return _dio.post('/api/v1/auth/change-password/', data: {
      'old_password': oldPw,
      'new_password': newPw,
    });
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post('/api/v1/auth/logout/', data: {'refresh': refreshToken});
    } catch (_) {}
    await _clearTokens();
  }

  // ── Attendance ────────────────────────────────────────────────────────────

  Future<Response> getAttendanceSummary({
    String? dateFrom,
    String? dateTo,
  }) {
    return _dio.get('/api/v1/reports/summary/', queryParameters: {
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
    });
  }

  Future<Response> getDailyReport({String? date}) {
    return _dio.get('/api/v1/reports/daily/', queryParameters: {
      if (date != null) 'date': date,
    });
  }

  Future<Response> getMonthlyReport(String month) {
    return _dio.get('/api/v1/reports/monthly/', queryParameters: {
      'month': month,
    });
  }

  Future<Response> checkIn({
    required String method,
    String? latitude,
    String? longitude,
    String? deviceId,
    String? pin,
  }) {
    return _dio.post('/api/v1/attendance/check-in/', data: {
      'method': method,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (deviceId != null) 'device_id': deviceId,
      if (pin != null) 'pin': pin,
    });
  }

  Future<Response> checkOut({String? note}) {
    return _dio.post('/api/v1/attendance/check-out/', data: {
      if (note != null) 'note': note,
    });
  }

  Future<Response> getMyAttendance({
    String? dateFrom,
    String? dateTo,
    int page = 1,
  }) {
    return _dio.get('/api/v1/attendance/', queryParameters: {
      if (dateFrom != null) 'date_from': dateFrom,
      if (dateTo != null) 'date_to': dateTo,
      'page': page,
    });
  }

  Future<Response> getTodayStatus() {
    return _dio.get('/api/v1/attendance/today/');
  }

  // ── Face Recognition ──────────────────────────────────────────────────────

  Future<Response> uploadFaceEncoding(List<int> imageBytes) {
    final formData = FormData.fromMap({
      'image': MultipartFile.fromBytes(imageBytes, filename: 'face.jpg'),
    });
    return _dio.post('/api/v1/face/encode/', data: formData);
  }

  Future<Response> faceCheckIn(List<int> imageBytes, {String? deviceId}) {
    final formData = FormData.fromMap({
      'image': MultipartFile.fromBytes(imageBytes, filename: 'checkin.jpg'),
      if (deviceId != null) 'device_id': deviceId,
    });
    return _dio.post('/api/v1/face/checkin/', data: formData);
  }

  // ── Employees ─────────────────────────────────────────────────────────────

  Future<Response> getEmployees({String? search, int page = 1}) {
    return _dio.get('/api/v1/auth/company-users/', queryParameters: {
      if (search != null) 'search': search,
      'page': page,
    });
  }

  // ── Leaves ────────────────────────────────────────────────────────────────

  Future<Response> getLeaves({int page = 1}) {
    return _dio.get('/api/v1/leaves/requests/', queryParameters: {'page': page});
  }

  Future<Response> createLeaveRequest(Map<String, dynamic> data) {
    return _dio.post('/api/v1/leaves/requests/', data: data);
  }

  // ── Payroll ───────────────────────────────────────────────────────────────

  Future<Response> getPayroll({String? month}) {
    return _dio.get('/api/v1/payroll/', queryParameters: {
      if (month != null) 'month': month,
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  Future<Response> getNotifications({int page = 1}) {
    return _dio.get('/api/v1/notifications/', queryParameters: {'page': page});
  }

  Future<Response> markNotificationRead(String id) {
    return _dio.post('/api/v1/notifications/$id/read/');
  }

  // ── Devices ───────────────────────────────────────────────────────────────

  Future<Response> getDevices() {
    return _dio.get('/api/v1/devices/');
  }

  // ── Subscription status ────────────────────────────────────────────────────

  Future<Response> getSubscriptionStatus() {
    return _dio.get('/api/v1/subscriptions/status/');
  }

  Future<Response> getAvailablePlans() {
    return _dio.get('/api/v1/subscriptions/plans/');
  }
}
