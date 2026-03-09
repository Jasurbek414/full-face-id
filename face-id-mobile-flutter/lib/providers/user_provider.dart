import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class UserProvider extends ChangeNotifier {
  List<UserModel> _employees = [];
  bool _isLoading = false;
  String? _error;
  int _unreadNotifications = 0;

  List<UserModel> get employees => _employees;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadNotifications => _unreadNotifications;

  final ApiService _api = ApiService();

  Future<void> loadEmployees({String? search}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.getEmployees(search: search);
      final data = res.data;
      final list = (data is List) ? data : (data['results'] ?? []);
      _employees = (list as List).map((j) => UserModel.fromJson(j)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadNotificationCount() async {
    try {
      final res = await _api.getNotifications();
      final data = res.data;
      final list = (data is List) ? data : (data['results'] ?? []);
      _unreadNotifications = (list as List).where((n) => n['is_read'] == false).length;
      notifyListeners();
    } catch (_) {}
  }
}
