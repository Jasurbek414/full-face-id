import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiService().getNotifications();
      final data = res.data;
      final list = (data is List) ? data : (data['results'] ?? []);
      setState(() {
        _notifications = List<Map<String, dynamic>>.from(list);
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await ApiService().markNotificationRead(id);
      setState(() {
        final idx = _notifications.indexWhere((n) => n['id'].toString() == id);
        if (idx != -1) _notifications[idx]['is_read'] = true;
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Bildirishnomalar'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _notifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_off_outlined, size: 56, color: AppColors.textMuted),
                      SizedBox(height: 12),
                      Text('Bildirishnomalar yo\'q', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final n = _notifications[i];
                    final isRead = n['is_read'] == true;
                    return GestureDetector(
                      onTap: () => _markRead(n['id'].toString()),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isRead ? Colors.white : const Color(0xFFEEF0FB),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
                          border: isRead ? null : Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                        ),
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Container(
                              width: 40, height: 40,
                              decoration: BoxDecoration(
                                color: isRead ? const Color(0xFFF3F4F6) : AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                _getIcon(n['notification_type']?.toString()),
                                color: isRead ? AppColors.textMuted : AppColors.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    n['title'] ?? 'Bildirishnoma',
                                    style: TextStyle(fontSize: 14, fontWeight: isRead ? FontWeight.w500 : FontWeight.w700, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    n['message'] ?? '',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            if (!isRead)
                              Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  IconData _getIcon(String? type) {
    switch (type) {
      case 'attendance': return Icons.access_time_rounded;
      case 'leave': return Icons.beach_access_rounded;
      case 'subscription': return Icons.payment_rounded;
      case 'device': return Icons.videocam_outlined;
      default: return Icons.notifications_outlined;
    }
  }
}
