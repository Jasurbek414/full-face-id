import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

// Qurilma modeli
class FaceDevice {
  final String id;
  final String name;
  final String ipAddress;
  final String deviceType;
  final bool isOnline;
  final String? location;

  const FaceDevice({
    required this.id,
    required this.name,
    required this.ipAddress,
    required this.deviceType,
    required this.isOnline,
    this.location,
  });

  factory FaceDevice.fromJson(Map<String, dynamic> json) {
    return FaceDevice(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Noma\'lum qurilma',
      ipAddress: json['ip_address'] ?? '—',
      deviceType: json['device_type'] ?? 'ip_camera',
      isOnline: json['is_active'] ?? false,
      location: json['location'],
    );
  }
}

enum CheckInState { devices, processing, success, error, pin }

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> with TickerProviderStateMixin {
  CheckInState _state = CheckInState.devices;
  List<FaceDevice> _devices = [];
  bool _loadingDevices = true;
  String? _errorMsg;
  final _pinCtrl = TextEditingController();
  int _redirectCountdown = 3;
  Timer? _redirectTimer;
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.95, end: 1.05).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _loadDevices();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _redirectTimer?.cancel();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDevices() async {
    setState(() => _loadingDevices = true);
    try {
      final res = await ApiService().getDevices();
      final list = (res.data['results'] ?? res.data) as List? ?? [];
      setState(() {
        _devices = list.map((d) => FaceDevice.fromJson(d as Map<String, dynamic>)).toList();
        _loadingDevices = false;
      });
    } catch (_) {
      // Demo qurilmalar (backend ulanmagan bo'lsa)
      setState(() {
        _devices = [
          const FaceDevice(id: '1', name: 'Kirish eshigi kamerasi', ipAddress: '192.168.1.100', deviceType: 'ip_camera', isOnline: true, location: '1-qavat kirish'),
          const FaceDevice(id: '2', name: 'Xodimlar xonasi', ipAddress: '192.168.1.101', deviceType: 'ip_camera', isOnline: true, location: '2-qavat'),
          const FaceDevice(id: '3', name: 'Omborxona', ipAddress: '192.168.1.102', deviceType: 'ip_camera', isOnline: false, location: '1-qavat orqa'),
        ];
        _loadingDevices = false;
      });
    }
  }

  Future<void> _checkInManual() async {
    setState(() { _state = CheckInState.processing; _errorMsg = null; });
    final provider = context.read<AttendanceProvider>();
    final result = await provider.checkIn(method: 'manual');
    if (mounted) {
      if (result.success) {
        setState(() { _state = CheckInState.success; _redirectCountdown = 3; });
        _startRedirectTimer();
      } else {
        setState(() { _state = CheckInState.error; _errorMsg = result.message; });
      }
    }
  }

  Future<void> _checkInWithPin() async {
    final pin = _pinCtrl.text.trim();
    if (pin.length < 4) return;
    setState(() { _state = CheckInState.processing; _errorMsg = null; });
    final provider = context.read<AttendanceProvider>();
    final result = await provider.checkIn(method: 'pin', pin: pin);
    if (mounted) {
      if (result.success) {
        setState(() { _state = CheckInState.success; _redirectCountdown = 3; });
        _startRedirectTimer();
      } else {
        setState(() { _state = CheckInState.error; _errorMsg = result.message; });
      }
    }
  }

  void _startRedirectTimer() {
    _redirectTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() => _redirectCountdown--);
      if (_redirectCountdown <= 0) {
        t.cancel();
        if (mounted) context.go('/home');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0F1E),
      body: SafeArea(
        child: Column(
          children: [
            _buildTopBar(),
            Expanded(child: _buildBody()),
            if (_state == CheckInState.devices || _state == CheckInState.error)
              _buildBottomActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 18),
            ),
          ),
          const Spacer(),
          const Text(
            'Davomat Belgilash',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const Spacer(),
          // Reload button
          GestureDetector(
            onTap: _loadDevices,
            child: Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.refresh_rounded, color: Colors.white54, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_state) {
      case CheckInState.devices:
        return _buildDevicesPage();
      case CheckInState.processing:
        return _buildProcessing();
      case CheckInState.success:
        return _buildSuccess();
      case CheckInState.error:
        return _buildError();
      case CheckInState.pin:
        return _buildPinInput();
    }
  }

  Widget _buildDevicesPage() {
    final onlineCount = _devices.where((d) => d.isOnline).length;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Face ID tushuntirish karti
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.teal.withValues(alpha: 0.2), AppColors.primary.withValues(alpha: 0.3)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.teal.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.teal.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.camera_outdoor_rounded, color: AppColors.teal, size: 26),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'IP Kamera orqali Face ID',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Yuzni tanish qurilma kamerasi orqali amalga oshiriladi. Quyidagi ulangan qurilmalardan birini tanlang.',
                        style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.6), height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Qurilmalar sarlavhasi
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Ulangan qurilmalar',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: onlineCount > 0 ? AppColors.success.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$onlineCount/${_devices.length} online',
                  style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700,
                    color: onlineCount > 0 ? AppColors.success : Colors.white54,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Qurilmalar ro'yxati
          if (_loadingDevices)
            _buildLoadingShimmer()
          else if (_devices.isEmpty)
            _buildNoDevices()
          else
            ...(_devices.map((d) => _buildDeviceCard(d))),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDeviceCard(FaceDevice device) {
    final isOnline = device.isOnline;
    return GestureDetector(
      onTap: isOnline ? () => _showDeviceInfo(device) : null,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: isOnline ? 0.08 : 0.04),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOnline ? AppColors.teal.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.08),
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: isOnline ? AppColors.teal.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _deviceIcon(device.deviceType),
                color: isOnline ? AppColors.teal : Colors.white38,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name,
                    style: TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w700,
                      color: isOnline ? Colors.white : Colors.white54,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.lan_outlined, size: 11, color: Colors.white.withValues(alpha: 0.35)),
                      const SizedBox(width: 4),
                      Text(
                        device.ipAddress,
                        style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4), fontFamily: 'monospace'),
                      ),
                      if (device.location != null) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.location_on_outlined, size: 11, color: Colors.white.withValues(alpha: 0.35)),
                        const SizedBox(width: 2),
                        Text(
                          device.location!,
                          style: TextStyle(fontSize: 11, color: Colors.white.withValues(alpha: 0.4)),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Status indicator
            Column(
              children: [
                AnimatedBuilder(
                  animation: _pulseAnim,
                  builder: (_, child) => Transform.scale(
                    scale: isOnline ? _pulseAnim.value : 1.0,
                    child: child,
                  ),
                  child: Container(
                    width: 10, height: 10,
                    decoration: BoxDecoration(
                      color: isOnline ? AppColors.success : Colors.white24,
                      shape: BoxShape.circle,
                      boxShadow: isOnline ? [BoxShadow(color: AppColors.success.withValues(alpha: 0.5), blurRadius: 6)] : [],
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isOnline ? 'Online' : 'Offline',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isOnline ? AppColors.success : Colors.white30),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _deviceIcon(String type) {
    switch (type) {
      case 'ip_camera': return Icons.camera_outdoor_rounded;
      case 'face_terminal': return Icons.face_retouching_natural;
      case 'access_control': return Icons.door_front_door_outlined;
      default: return Icons.videocam_outlined;
    }
  }

  void _showDeviceInfo(FaceDevice device) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131929),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(color: AppColors.teal.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(18)),
              child: Icon(_deviceIcon(device.deviceType), color: AppColors.teal, size: 32),
            ),
            const SizedBox(height: 14),
            Text(device.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 6),
            Text(device.ipAddress, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.5), fontFamily: 'monospace')),
            if (device.location != null) ...[
              const SizedBox(height: 4),
              Text(device.location!, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4))),
            ],
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: Colors.white38, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Bu qurilma yuzingizni avtomatik taniydi. Qurilma oldiga boring va kamerasiga qarang — davomat avtomatik belgilanadi.',
                      style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.5), height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () { Navigator.pop(ctx); _checkInManual(); },
                icon: const Icon(Icons.check_circle_outline_rounded, size: 20),
                label: const Text('Davomatni belgilash', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return Column(
      children: List.generate(3, (i) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 80,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
        ),
      )),
    );
  }

  Widget _buildNoDevices() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(Icons.videocam_off_outlined, size: 48, color: Colors.white.withValues(alpha: 0.2)),
          const SizedBox(height: 14),
          const Text('Qurilmalar topilmadi', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white54)),
          const SizedBox(height: 6),
          Text(
            'Kompaniyangizga Face ID qurilmalar ulanmagan. Administrator bilan bog\'laning.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.35), height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildProcessing() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 80, height: 80,
            child: CircularProgressIndicator(color: AppColors.teal, strokeWidth: 3),
          ),
          const SizedBox(height: 24),
          const Text('Davomatlanmoqda...', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 8),
          Text('Iltimos kuting', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.4))),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    final now = DateTime.now();
    final timeStr = DateFormat('HH:mm').format(now);
    final dateStr = DateFormat('d MMMM yyyy', 'uz').format(now);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 600),
              curve: Curves.elasticOut,
              builder: (_, v, child) => Transform.scale(scale: v, child: child),
              child: const Icon(Icons.check_circle_rounded, size: 100, color: AppColors.success),
            ),
            const SizedBox(height: 24),
            const Text('Muvaffaqiyatli!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 6),
            Text(timeStr, style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: AppColors.success)),
            const SizedBox(height: 4),
            Text(dateStr, style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.5))),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.15),
                border: Border.all(color: AppColors.success.withValues(alpha: 0.4)),
                borderRadius: BorderRadius.circular(100),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_rounded, size: 16, color: AppColors.success),
                  SizedBox(width: 6),
                  Text('Davomat belgilandi', style: TextStyle(fontSize: 13, color: AppColors.success, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '$_redirectCountdown soniyada asosiy sahifaga...',
              style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.35)),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.go('/home'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      minimumSize: const Size(0, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Asosiy sahifa', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: () => context.go('/attendance'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white54,
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                    minimumSize: const Size(90, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Jurnal', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 80, color: Color(0xFFEF4444)),
            const SizedBox(height: 20),
            const Text('Xatolik!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 8),
            Text(
              _errorMsg ?? 'Davomat belgilab bo\'lmadi. Qayta urinib ko\'ring.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.5), height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPinInput() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(18)),
            child: const Icon(Icons.pin_outlined, size: 32, color: Colors.white70),
          ),
          const SizedBox(height: 20),
          const Text('PIN orqali kirish', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 8),
          Text('4-6 xonali PIN kodingizni kiriting', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.4))),
          const SizedBox(height: 28),
          TextField(
            controller: _pinCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            obscureText: true,
            textAlign: TextAlign.center,
            autofocus: true,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 10),
            decoration: InputDecoration(
              counterText: '',
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.08),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.teal, width: 2),
              ),
              hintText: '• • • • • •',
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.2), letterSpacing: 10),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity, height: 52,
            child: ElevatedButton(
              onPressed: _checkInWithPin,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.teal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Tasdiqlash', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions() {
    if (_state == CheckInState.error) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          children: [
            SizedBox(
              width: double.infinity, height: 52,
              child: ElevatedButton.icon(
                onPressed: () => setState(() { _state = CheckInState.devices; _errorMsg = null; }),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Qayta urinish', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity, height: 52,
              child: OutlinedButton.icon(
                onPressed: () => setState(() => _state = CheckInState.pin),
                icon: const Icon(Icons.pin_outlined, color: Colors.white54),
                label: const Text('PIN orqali kirish', style: TextStyle(color: Colors.white54, fontSize: 14)),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Devices state — PIN tugmasi
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(
        children: [
          if (_state == CheckInState.pin)
            SizedBox(
              width: double.infinity, height: 52,
              child: OutlinedButton.icon(
                onPressed: () => setState(() => _state = CheckInState.devices),
                icon: const Icon(Icons.camera_outdoor_rounded, color: Colors.white54, size: 18),
                label: const Text('Qurilmalarni ko\'rish', style: TextStyle(color: Colors.white54, fontSize: 14)),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            )
          else
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => setState(() => _state = CheckInState.pin),
                    icon: const Icon(Icons.pin_outlined, color: Colors.white54, size: 18),
                    label: const Text('PIN', style: TextStyle(color: Colors.white54, fontSize: 14)),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 52),
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: _checkInManual,
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                    label: const Text('Manuel kirish', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      minimumSize: const Size(0, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
