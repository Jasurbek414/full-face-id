import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.unknown;
  UserModel? _user;
  String? _errorMessage;
  bool _isLoading = false;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  final ApiService _api = ApiService();

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final loggedIn = await _api.isLoggedIn();
    if (loggedIn) {
      try {
        final res = await _api.getMe();
        _user = UserModel.fromJson(res.data);
        _status = AuthStatus.authenticated;
      } catch (_) {
        _status = AuthStatus.unauthenticated;
      }
    } else {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> loginWithEmail(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.loginWithEmail(email, password);
      final data = res.data;
      await _api.saveTokens(
        access: data['access'],
        refresh: data['refresh'],
        companyId: data['user']?['company']?['id']?.toString(),
      );
      _user = UserModel.fromJson(data['user']);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithPhone(String phone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _api.loginWithPhone(phone, password);
      final data = res.data;
      await _api.saveTokens(
        access: data['access'],
        refresh: data['refresh'],
        companyId: data['user']?['company']?['id']?.toString(),
      );
      _user = UserModel.fromJson(data['user']);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendOtp(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _api.resendEmailOtp(email);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String phone,
    required String password,
    required String firstName,
    required String lastName,
    required String companyName,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _api.registerInit(
        email: email,
        phone: phone,
        password: password,
        firstName: firstName,
        lastName: lastName,
        companyName: companyName,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtp(String email, String code) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final res = await _api.verifyOtp(email, code);
      final data = res.data;
      await _api.saveTokens(
        access: data['access'],
        refresh: data['refresh'],
        companyId: data['user']?['company']?['id']?.toString(),
      );
      _user = UserModel.fromJson(data['user']);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.clearTokens();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      final res = await _api.getMe();
      _user = UserModel.fromJson(res.data);
      notifyListeners();
    } catch (_) {}
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  String _parseError(dynamic e) {
    if (e is Exception) {
      final str = e.toString();
      if (str.contains('detail')) {
        final match = RegExp(r'"detail":"([^"]+)"').firstMatch(str);
        if (match != null) return match.group(1) ?? 'Xatolik yuz berdi.';
      }
      if (str.contains('401')) return 'Email yoki parol noto\'g\'ri.';
      if (str.contains('403')) return 'Akkaunt bloklangan.';
      if (str.contains('429')) return 'Juda ko\'p urinish. Keyinroq urinib ko\'ring.';
      if (str.contains('SocketException') || str.contains('Connection')) {
        return 'Internet bilan muammo. Aloqani tekshiring.';
      }
    }
    return 'Xatolik yuz berdi. Qayta urinib ko\'ring.';
  }
}
