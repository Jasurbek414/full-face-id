import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/attendance_provider.dart';
import '../../providers/user_provider.dart';
import '../../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AttendanceProvider>().loadToday();
      context.read<AttendanceProvider>().loadSummary();
      context.read<UserProvider>().loadNotificationCount();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final attendance = context.watch<AttendanceProvider>();
    final user = context.watch<UserProvider>();
    final now = DateTime.now();
    final dateStr = DateFormat('EEEE, d MMMM yyyy', 'uz').format(now);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          await context.read<AttendanceProvider>().loadToday();
          await context.read<AttendanceProvider>().loadSummary();
        },
        child: CustomScrollView(
          slivers: [
            // Header
            SliverAppBar(
              expandedHeight: 160,
              pinned: true,
              backgroundColor: AppColors.primary,
              elevation: 0,
              automaticallyImplyLeading: false,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0F1B5C), AppColors.primary, Color(0xFF283593)],
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  child: SafeArea(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Avatar
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: Colors.white.withValues(alpha: 0.2),
                              child: Text(
                                auth.user?.initials ?? '?',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Xush kelibsiz,',
                                    style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.65)),
                                  ),
                                  Text(
                                    '${auth.user?.firstName ?? ''} 👋',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                            // Notification
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                GestureDetector(
                                  onTap: () => context.push('/notifications'),
                                  child: Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                                  ),
                                ),
                                if (user.unreadNotifications > 0)
                                  Positioned(
                                    top: -4, right: -4,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFF6D00),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: AppColors.primary, width: 1.5),
                                      ),
                                      child: Text(
                                        user.unreadNotifications > 99 ? '99+' : '${user.unreadNotifications}',
                                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6))),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: Column(
                children: [
                  // Check-in card
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: _CheckInCard(attendance: attendance),
                  ),
                  const SizedBox(height: 16),

                  // Today summary
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _TodaySummaryCard(attendance: attendance),
                  ),
                  const SizedBox(height: 16),

                  // Quick actions
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _QuickActions(),
                  ),
                  const SizedBox(height: 16),

                  // Team summary
                  if (attendance.summary != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _TeamSummaryCard(summary: attendance.summary!),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckInCard extends StatelessWidget {
  final AttendanceProvider attendance;
  const _CheckInCard({required this.attendance});

  @override
  Widget build(BuildContext context) {
    final isIn = attendance.isCheckedIn;
    final isOut = attendance.isCheckedOut;
    final record = attendance.todayRecord;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Joriy holat', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        width: 8, height: 8,
                        decoration: BoxDecoration(
                          color: isIn ? AppColors.success : AppColors.textMuted,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isIn ? 'Ishda' : isOut ? 'Ketdi' : 'Kelmagan',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                ],
              ),
              if (isIn && record != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Keldi', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    Text(
                      record.checkInFormatted,
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.primary),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 16),
          // Action button
          if (!isOut)
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: attendance.checkInLoading
                    ? null
                    : () {
                        if (!isIn) {
                          context.push('/checkin');
                        } else {
                          _doCheckOut(context, attendance);
                        }
                      },
                icon: attendance.checkInLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Icon(isIn ? Icons.logout_rounded : Icons.face_retouching_natural, size: 22),
                label: Text(
                  isIn ? 'Chiqish' : 'Face ID orqali kirish',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isIn ? AppColors.error : AppColors.teal,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Bugun: ${record?.checkInFormatted ?? ''} - ${record?.checkOutFormatted ?? ''}  ·  ${record?.netHoursFormatted ?? ''}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.onTime),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _doCheckOut(BuildContext context, AttendanceProvider provider) async {
    final result = await provider.checkOut();
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result.success ? 'Muvaffaqiyatli chiqildi!' : result.message ?? 'Xatolik'),
        backgroundColor: result.success ? AppColors.success : AppColors.error,
      ));
    }
  }
}

class _TodaySummaryCard extends StatelessWidget {
  final AttendanceProvider attendance;
  const _TodaySummaryCard({required this.attendance});

  @override
  Widget build(BuildContext context) {
    final record = attendance.todayRecord;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Bugungi ko'rsatkichlar", style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _StatBox(label: 'Keldi', value: record?.checkInFormatted ?? '—', color: AppColors.teal, bgColor: const Color(0xFFE0F2F1), icon: Icons.login_rounded)),
              const SizedBox(width: 10),
              Expanded(child: _StatBox(label: 'Ishladi', value: record?.netHoursFormatted ?? '—', color: AppColors.primary, bgColor: const Color(0xFFEEF0FB), icon: Icons.timer_outlined)),
              const SizedBox(width: 10),
              Expanded(child: _StatBox(
                label: 'Holat',
                value: record?.statusLabel ?? '—',
                color: record?.statusColor ?? AppColors.textMuted,
                bgColor: record?.statusBgColor ?? const Color(0xFFF3F4F6),
                icon: Icons.trending_up_rounded,
              )),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final Color bgColor;
  final IconData icon;

  const _StatBox({required this.label, required this.value, required this.color, required this.bgColor, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: color), textAlign: TextAlign.center),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      (Icons.access_time_filled_rounded, 'Davomat', AppColors.primary, '/attendance'),
      (Icons.people_rounded, 'Xodimlar', AppColors.teal, '/employees'),
      (Icons.bar_chart_rounded, 'Hisobot', const Color(0xFF7C3AED), '/reports'),
      (Icons.beach_access_rounded, 'Ta\'til', const Color(0xFFD97706), '/notifications'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tez harakatlar', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: actions.map((a) => _ActionBtn(
              icon: a.$1,
              label: a.$2,
              color: a.$3,
              onTap: () => context.go(a.$4),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _TeamSummaryCard extends StatelessWidget {
  final dynamic summary;
  const _TeamSummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10)],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Jamoa holati', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text(
                '${summary.averageAttendanceRate.toStringAsFixed(1)}% davomat',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.teal),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _TeamStat(value: '${summary.present}', label: 'Keldi', color: AppColors.success),
              const SizedBox(width: 12),
              _TeamStat(value: '${summary.late}', label: 'Kechikkan', color: AppColors.late),
              const SizedBox(width: 12),
              _TeamStat(value: '${summary.absent}', label: 'Kelmagan', color: AppColors.absent),
            ],
          ),
        ],
      ),
    );
  }
}

class _TeamStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;

  const _TeamStat({required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text('$value $label', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}
