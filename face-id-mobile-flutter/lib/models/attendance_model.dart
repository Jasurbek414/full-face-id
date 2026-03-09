import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AttendanceRecord {
  final String id;
  final String userId;
  final String? userName;
  final DateTime date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String status;
  final String method;
  final int netSeconds;
  final int lateSeconds;
  final int overtimeSeconds;
  final String? note;

  AttendanceRecord({
    required this.id,
    required this.userId,
    this.userName,
    required this.date,
    this.checkIn,
    this.checkOut,
    required this.status,
    required this.method,
    required this.netSeconds,
    required this.lateSeconds,
    required this.overtimeSeconds,
    this.note,
  });

  String get statusLabel {
    switch (status.toLowerCase()) {
      case 'on_time': return 'O\'z vaqtida';
      case 'late': return 'Kechikkan';
      case 'absent': return 'Kelmagan';
      case 'early_leave': return 'Erta ketgan';
      default: return status;
    }
  }

  Color get statusColor {
    switch (status.toLowerCase()) {
      case 'on_time': return AppColors.onTime;
      case 'late': return AppColors.late;
      case 'absent': return AppColors.absent;
      case 'early_leave': return AppColors.earlyLeave;
      default: return AppColors.textSecondary;
    }
  }

  Color get statusBgColor {
    switch (status.toLowerCase()) {
      case 'on_time': return const Color(0xFFE8F5E9);
      case 'late': return const Color(0xFFFFF3E0);
      case 'absent': return const Color(0xFFFFEBEE);
      case 'early_leave': return const Color(0xFFE3F2FD);
      default: return const Color(0xFFF3F4F6);
    }
  }

  String get methodLabel {
    switch (method.toLowerCase()) {
      case 'face_id': return 'Face ID';
      case 'pin': return 'PIN';
      case 'qr': return 'QR Kod';
      case 'gps': return 'GPS';
      case 'manual': return 'Qo\'lda';
      default: return method;
    }
  }

  String get netHoursFormatted {
    final h = netSeconds ~/ 3600;
    final m = (netSeconds % 3600) ~/ 60;
    if (h > 0) return '${h}s ${m}d';
    return '${m}d';
  }

  String get checkInFormatted {
    if (checkIn == null) return '—';
    final h = checkIn!.hour.toString().padLeft(2, '0');
    final m = checkIn!.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String get checkOutFormatted {
    if (checkOut == null) return '—';
    final h = checkOut!.hour.toString().padLeft(2, '0');
    final m = checkOut!.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id']?.toString() ?? '',
      userId: json['user']?.toString() ?? '',
      userName: json['user_name'],
      date: json['date'] != null
          ? DateTime.tryParse(json['date']) ?? DateTime.now()
          : DateTime.now(),
      checkIn: json['check_in'] != null ? DateTime.tryParse(json['check_in']) : null,
      checkOut: json['check_out'] != null ? DateTime.tryParse(json['check_out']) : null,
      status: json['status'] ?? 'absent',
      method: json['check_in_method'] ?? json['method'] ?? 'manual',
      netSeconds: json['net_seconds'] ?? 0,
      lateSeconds: json['late_seconds'] ?? 0,
      overtimeSeconds: json['overtime_seconds'] ?? 0,
      note: json['note'],
    );
  }
}

class AttendanceSummary {
  final int totalEmployees;
  final int present;
  final int absent;
  final int late;
  final int onTime;
  final double averageAttendanceRate;

  AttendanceSummary({
    required this.totalEmployees,
    required this.present,
    required this.absent,
    required this.late,
    required this.onTime,
    required this.averageAttendanceRate,
  });

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) {
    return AttendanceSummary(
      totalEmployees: json['total_employees'] ?? 0,
      present: json['present'] ?? 0,
      absent: json['absent'] ?? 0,
      late: json['late'] ?? 0,
      onTime: json['on_time'] ?? 0,
      averageAttendanceRate: (json['average_attendance_rate'] ?? 0.0).toDouble(),
    );
  }
}
