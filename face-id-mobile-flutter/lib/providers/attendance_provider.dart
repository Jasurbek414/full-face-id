import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/attendance_model.dart';
import '../services/api_service.dart';

class AttendanceProvider extends ChangeNotifier {
  AttendanceSummary? _summary;
  List<AttendanceRecord> _records = [];
  AttendanceRecord? _todayRecord;
  bool _isLoading = false;
  bool _checkInLoading = false;
  String? _error;

  AttendanceSummary? get summary => _summary;
  List<AttendanceRecord> get records => _records;
  AttendanceRecord? get todayRecord => _todayRecord;
  bool get isLoading => _isLoading;
  bool get checkInLoading => _checkInLoading;
  String? get error => _error;

  bool get isCheckedIn => _todayRecord?.checkIn != null && _todayRecord?.checkOut == null;
  bool get isCheckedOut => _todayRecord?.checkOut != null;

  final ApiService _api = ApiService();

  Future<void> loadToday() async {
    try {
      final res = await _api.getTodayStatus();
      if (res.data != null && res.data is Map) {
        _todayRecord = AttendanceRecord.fromJson(res.data);
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadSummary({String? dateFrom, String? dateTo}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.getAttendanceSummary(
        dateFrom: dateFrom,
        dateTo: dateTo,
      );
      _summary = AttendanceSummary.fromJson(res.data);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadRecords({String? dateFrom, String? dateTo}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.getMyAttendance(
        dateFrom: dateFrom,
        dateTo: dateTo,
      );
      final data = res.data;
      final list = (data is List) ? data : (data['results'] ?? []);
      _records = (list as List).map((j) => AttendanceRecord.fromJson(j)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CheckInResult> checkIn({
    required String method,
    double? latitude,
    double? longitude,
    String? pin,
    List<int>? faceImageBytes,
  }) async {
    _checkInLoading = true;
    _error = null;
    notifyListeners();

    try {
      Response? res;
      if (method == 'face_id' && faceImageBytes != null) {
        res = await _api.faceCheckIn(faceImageBytes);
      } else {
        res = await _api.checkIn(
          method: method,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
          pin: pin,
        );
      }

      _todayRecord = AttendanceRecord.fromJson(res.data);
      _checkInLoading = false;
      notifyListeners();
      return CheckInResult.success(record: _todayRecord);
    } catch (e) {
      _checkInLoading = false;
      final msg = _parseError(e);
      _error = msg;
      notifyListeners();
      return CheckInResult.failure(message: msg);
    }
  }

  Future<CheckInResult> checkOut({String? note}) async {
    _checkInLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _api.checkOut(note: note);
      _todayRecord = AttendanceRecord.fromJson(res.data);
      _checkInLoading = false;
      notifyListeners();
      return CheckInResult.success(record: _todayRecord);
    } catch (e) {
      _checkInLoading = false;
      final msg = _parseError(e);
      _error = msg;
      notifyListeners();
      return CheckInResult.failure(message: msg);
    }
  }

  String _parseError(dynamic e) {
    final str = e.toString();
    if (str.contains('detail')) {
      final match = RegExp(r'"detail":"([^"]+)"').firstMatch(str);
      if (match != null) return match.group(1) ?? 'Xatolik.';
    }
    return 'Xatolik yuz berdi.';
  }
}

class CheckInResult {
  final bool success;
  final AttendanceRecord? record;
  final String? message;

  CheckInResult.success({this.record}) : success = true, message = null;
  CheckInResult.failure({required this.message}) : success = false, record = null;
}
