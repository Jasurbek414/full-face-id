import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../theme/app_theme.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _selectedMonthDate = DateTime.now();
  String get _selectedMonth => DateFormat('yyyy-MM').format(_selectedMonthDate);

  void _loadData() {
    final firstDay = DateTime(_selectedMonthDate.year, _selectedMonthDate.month, 1);
    final lastDay = DateTime(_selectedMonthDate.year, _selectedMonthDate.month + 1, 0);
    context.read<AttendanceProvider>().loadSummary(
      dateFrom: DateFormat('yyyy-MM-dd').format(firstDay),
      dateTo: DateFormat('yyyy-MM-dd').format(lastDay),
    );
    context.read<AttendanceProvider>().loadRecords(
      dateFrom: DateFormat('yyyy-MM-dd').format(firstDay),
      dateTo: DateFormat('yyyy-MM-dd').format(lastDay),
    );
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  Widget build(BuildContext context) {
    final att = context.watch<AttendanceProvider>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Hisobotlar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined),
            onPressed: () => _pickMonth(context),
          ),
        ],
      ),
      body: att.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Summary cards
                  if (att.summary != null) ...[
                    _buildSummaryCards(att.summary!),
                    const SizedBox(height: 20),
                  ],

                  // Pie chart
                  if (att.summary != null) ...[
                    _buildPieChart(att.summary!),
                    const SizedBox(height: 20),
                  ],

                  // Weekly bar chart from records
                  if (att.records.isNotEmpty) ...[
                    _buildBarChart(att.records),
                    const SizedBox(height: 20),
                  ],

                  // Month selector
                  _MonthSelector(
                    current: _selectedMonth,
                    onTap: () => _pickMonth(context),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryCards(dynamic summary) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _SummaryCard('Jami xodimlar', '${summary.totalEmployees}', AppColors.primary, Icons.people_rounded),
        _SummaryCard('Keldi', '${summary.present}', AppColors.success, Icons.check_circle_rounded),
        _SummaryCard('Kechikkan', '${summary.late}', AppColors.late, Icons.schedule_rounded),
        _SummaryCard('Kelmagan', '${summary.absent}', AppColors.absent, Icons.cancel_rounded),
      ],
    );
  }

  Widget _buildPieChart(dynamic summary) {
    final total = summary.present + summary.late + summary.absent;
    if (total == 0) return const SizedBox();

    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Davomat taqsimoti', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 140, height: 140,
                child: PieChart(PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: [
                    PieChartSectionData(value: summary.present.toDouble(), color: AppColors.success, title: '${summary.present}', radius: 30, titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                    PieChartSectionData(value: summary.late.toDouble(), color: AppColors.late, title: '${summary.late}', radius: 30, titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                    PieChartSectionData(value: summary.absent.toDouble(), color: AppColors.absent, title: '${summary.absent}', radius: 30, titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                )),
              ),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _Legend('Keldi', AppColors.success, summary.present, total),
                  const SizedBox(height: 8),
                  _Legend('Kechikkan', AppColors.late, summary.late, total),
                  const SizedBox(height: 8),
                  _Legend('Kelmagan', AppColors.absent, summary.absent, total),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(List records) {
    final last7 = records.take(7).toList().reversed.toList();
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)]),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('So\'nggi 7 kun', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          SizedBox(
            height: 120,
            child: BarChart(BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: 10,
              barGroups: last7.asMap().entries.map((e) {
                final status = e.value.status as String;
                final color = status == 'on_time' ? AppColors.success : status == 'late' ? AppColors.late : AppColors.absent;
                return BarChartGroupData(x: e.key, barRods: [
                  BarChartRodData(toY: status == 'absent' ? 2 : 8, color: color, width: 16, borderRadius: const BorderRadius.vertical(top: Radius.circular(6))),
                ]);
              }).toList(),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx >= last7.length) return const Text('');
                    final date = last7[idx].date as DateTime;
                    return Text(DateFormat('dd').format(date), style: const TextStyle(fontSize: 10, color: AppColors.textMuted));
                  },
                )),
              ),
              gridData: const FlGridData(show: false),
              borderData: FlBorderData(show: false),
            )),
          ),
        ],
      ),
    );
  }

  Future<void> _pickMonth(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedMonthDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      initialDatePickerMode: DatePickerMode.year,
    );
    if (picked != null) {
      setState(() => _selectedMonthDate = DateTime(picked.year, picked.month));
      _loadData();
    }
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _SummaryCard(this.label, this.value, this.color, this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final String label;
  final Color color;
  final int value;
  final int total;

  const _Legend(this.label, this.color, this.value, this.total);

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (value / total * 100).toStringAsFixed(0) : '0';
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 6),
        Text('$label ($pct%)', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _MonthSelector extends StatelessWidget {
  final String current;
  final VoidCallback onTap;

  const _MonthSelector({required this.current, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(color: const Color(0xFFEEF0FB), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.calendar_month_outlined, size: 18, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tanlangan oy', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  Text(current, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
          ],
        ),
      ),
    );
  }
}
