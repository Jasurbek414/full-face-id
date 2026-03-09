import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../models/attendance_model.dart';
import '../../theme/app_theme.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  DateTime _selectedMonth = DateTime.now();

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  void _loadData() {
    final firstDay = DateTime(_selectedMonth.year, _selectedMonth.month, 1);
    final lastDay = DateTime(_selectedMonth.year, _selectedMonth.month + 1, 0);
    context.read<AttendanceProvider>().loadRecords(
      dateFrom: DateFormat('yyyy-MM-dd').format(firstDay),
      dateTo: DateFormat('yyyy-MM-dd').format(lastDay),
    );
  }

  @override
  Widget build(BuildContext context) {
    final att = context.watch<AttendanceProvider>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Davomat jurnali'),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Jurnal'),
            Tab(text: 'Statistika'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined),
            onPressed: _pickMonth,
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _AttendanceList(records: att.records, isLoading: att.isLoading),
          _AttendanceStats(records: att.records),
        ],
      ),
    );
  }

  Future<void> _pickMonth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedMonth,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      initialDatePickerMode: DatePickerMode.year,
    );
    if (picked != null) {
      setState(() => _selectedMonth = picked);
      _loadData();
    }
  }
}

class _AttendanceList extends StatelessWidget {
  final List<AttendanceRecord> records;
  final bool isLoading;

  const _AttendanceList({required this.records, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (records.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy_outlined, size: 56, color: AppColors.textMuted),
            SizedBox(height: 12),
            Text('Davomat ma\'lumotlari topilmadi', style: TextStyle(color: AppColors.textMuted)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: records.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _AttendanceCard(record: records[i]),
    );
  }
}

class _AttendanceCard extends StatelessWidget {
  final AttendanceRecord record;
  const _AttendanceCard({required this.record});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
        border: Border(left: BorderSide(color: record.statusColor, width: 4)),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Date
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: record.statusBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  DateFormat('d').format(record.date),
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: record.statusColor),
                ),
                Text(
                  DateFormat('MMM', 'uz').format(record.date),
                  style: TextStyle(fontSize: 9, color: record.statusColor, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: record.statusBgColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(record.statusLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: record.statusColor)),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(20)),
                      child: Text(record.methodLabel, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _TimeChip(icon: Icons.login, time: record.checkInFormatted, color: AppColors.teal),
                    const SizedBox(width: 8),
                    _TimeChip(icon: Icons.logout, time: record.checkOutFormatted, color: AppColors.error),
                    const Spacer(),
                    if (record.netSeconds > 0)
                      Text(record.netHoursFormatted, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  final IconData icon;
  final String time;
  final Color color;

  const _TimeChip({required this.icon, required this.time, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 3),
        Text(time, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}

class _AttendanceStats extends StatelessWidget {
  final List<AttendanceRecord> records;
  const _AttendanceStats({required this.records});

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const Center(child: Text('Ma\'lumot yo\'q', style: TextStyle(color: AppColors.textMuted)));
    }

    final present = records.where((r) => r.status == 'on_time' || r.status == 'late').length;
    final late = records.where((r) => r.status == 'late').length;
    final absent = records.where((r) => r.status == 'absent').length;
    final totalSecs = records.fold<int>(0, (sum, r) => sum + r.netSeconds);
    final totalHours = totalSecs / 3600;
    final rate = records.isEmpty ? 0.0 : present / records.length * 100;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Main stats
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.4,
            children: [
              _StatCard(label: 'Keldi', value: '$present', color: AppColors.success, icon: Icons.check_circle_outline),
              _StatCard(label: 'Kechikkan', value: '$late', color: AppColors.late, icon: Icons.access_time_rounded),
              _StatCard(label: 'Kelmagan', value: '$absent', color: AppColors.absent, icon: Icons.cancel_outlined),
              _StatCard(label: 'Jami soat', value: '${totalHours.toStringAsFixed(1)}s', color: AppColors.primary, icon: Icons.timer_outlined),
            ],
          ),
          const SizedBox(height: 16),

          // Attendance rate
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Davomat foizi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  Text('${rate.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.primary)),
                ]),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: rate / 100,
                    minHeight: 10,
                    backgroundColor: AppColors.divider,
                    valueColor: AlwaysStoppedAnimation(rate >= 90 ? AppColors.success : rate >= 75 ? AppColors.late : AppColors.absent),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  rate >= 90 ? 'Ajoyib davomat!' : rate >= 75 ? 'Qoniqarli davomat' : 'Davomatni yaxshilang',
                  style: TextStyle(fontSize: 12, color: rate >= 90 ? AppColors.success : rate >= 75 ? AppColors.late : AppColors.absent, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _StatCard({required this.label, required this.value, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 22),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: color)),
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
}
