import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/attendance_provider.dart';
import '../../models/attendance_model.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class FaceDevice {
  final String id;
  final String name;
  final String ipAddress;
  final String deviceType;
  final bool isOnline;
  final String? location;
  final String? checkType;

  const FaceDevice({
    required this.id,
    required this.name,
    required this.ipAddress,
    required this.deviceType,
    required this.isOnline,
    this.location,
    this.checkType,
  });

  factory FaceDevice.fromJson(Map<String, dynamic> json) {
    return FaceDevice(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Noma\'lum qurilma',
      ipAddress: json['ip_address'] ?? '—',
      deviceType: json['device_type'] ?? 'ip_camera',
      isOnline: json['connection_status'] == 'online',
      location: json['location'],
      checkType: json['check_type'],
    );
  }
}

enum CheckInScreenState { idle, processing, success, error, pin }

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen>
    with TickerProviderStateMixin {
  CheckInScreenState _uiState = CheckInScreenState.idle;
  List<FaceDevice> _devices = [];
  bool _loadingDevices = true;
  String? _errorMsg;
  final _pinCtrl = TextEditingController();
  int _redirectCountdown = 3;
  Timer? _redirectTimer;

  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
        CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _fadeAnim =
        CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
    _loadDevices();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AttendanceProvider>().loadToday();
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _fadeCtrl.dispose();
    _redirectTimer?.cancel();
    _pinCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDevices() async {
    setState(() => _loadingDevices = true);
    try {
      final res = await ApiService().getDevices();
      final data = res.data;
      final list = (data is Map ? (data['results'] ?? data) : data) as List? ?? [];
      setState(() {
        _devices = list
            .map((d) => FaceDevice.fromJson(d as Map<String, dynamic>))
            .toList();
        _loadingDevices = false;
      });
    } catch (_) {
      setState(() {
        _devices = [
          const FaceDevice(
              id: '1',
              name: 'Kirish eshigi',
              ipAddress: '192.168.1.100',
              deviceType: 'face_terminal',
              isOnline: true,
              location: '1-qavat kirish',
              checkType: 'both'),
          const FaceDevice(
              id: '2',
              name: 'Xodimlar xonasi',
              ipAddress: '192.168.1.101',
              deviceType: 'ip_camera',
              isOnline: true,
              location: '2-qavat',
              checkType: 'entry'),
          const FaceDevice(
              id: '3',
              name: 'Omborxona',
              ipAddress: '192.168.1.102',
              deviceType: 'ip_camera',
              isOnline: false,
              location: '1-qavat orqa',
              checkType: 'exit'),
        ];
        _loadingDevices = false;
      });
    }
  }

  Future<void> _doCheckIn() async {
    setState(() {
      _uiState = CheckInScreenState.processing;
      _errorMsg = null;
    });
    final provider = context.read<AttendanceProvider>();
    final result = await provider.checkIn(method: 'manual');
    if (!mounted) return;
    if (result.success) {
      setState(() {
        _uiState = CheckInScreenState.success;
        _redirectCountdown = 3;
      });
      _startRedirectTimer();
    } else {
      setState(() {
        _uiState = CheckInScreenState.error;
        _errorMsg = result.message;
      });
    }
  }

  Future<void> _doCheckOut() async {
    setState(() {
      _uiState = CheckInScreenState.processing;
      _errorMsg = null;
    });
    final provider = context.read<AttendanceProvider>();
    final result = await provider.checkOut();
    if (!mounted) return;
    if (result.success) {
      setState(() {
        _uiState = CheckInScreenState.success;
        _redirectCountdown = 3;
      });
      _startRedirectTimer();
    } else {
      setState(() {
        _uiState = CheckInScreenState.error;
        _errorMsg = result.message;
      });
    }
  }

  Future<void> _doCheckInWithPin() async {
    final pin = _pinCtrl.text.trim();
    if (pin.length < 4) return;
    setState(() {
      _uiState = CheckInScreenState.processing;
      _errorMsg = null;
    });
    final provider = context.read<AttendanceProvider>();
    final result = await provider.checkIn(method: 'pin', pin: pin);
    if (!mounted) return;
    if (result.success) {
      setState(() {
        _uiState = CheckInScreenState.success;
        _redirectCountdown = 3;
      });
      _startRedirectTimer();
    } else {
      setState(() {
        _uiState = CheckInScreenState.error;
        _errorMsg = result.message;
      });
    }
  }

  void _startRedirectTimer() {
    _redirectTimer?.cancel();
    _redirectTimer =
        Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _redirectCountdown--);
      if (_redirectCountdown <= 0) {
        t.cancel();
        if (mounted) context.go('/home');
      }
    });
  }

  void _resetToIdle() {
    _redirectTimer?.cancel();
    _pinCtrl.clear();
    setState(() {
      _uiState = CheckInScreenState.idle;
      _errorMsg = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080D1A),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: Column(
            children: [
              _buildTopBar(),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: _buildBody(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          _iconBtn(Icons.arrow_back_ios_new_rounded, () {
            if (_uiState == CheckInScreenState.pin) {
              _resetToIdle();
            } else {
              context.pop();
            }
          }),
          const Spacer(),
          const Text(
            'Davomat',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.3),
          ),
          const Spacer(),
          _iconBtn(Icons.refresh_rounded, _loadDevices),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white70, size: 18),
      ),
    );
  }

  Widget _buildBody() {
    switch (_uiState) {
      case CheckInScreenState.processing:
        return _buildProcessing();
      case CheckInScreenState.success:
        return _buildSuccess();
      case CheckInScreenState.error:
        return _buildError();
      case CheckInScreenState.pin:
        return _buildPinInput();
      case CheckInScreenState.idle:
        return _buildMainPage();
    }
  }

  // ─── MAIN PAGE ──────────────────────────────────────────────────────────────

  Widget _buildMainPage() {
    return Consumer<AttendanceProvider>(
      builder: (context, provider, _) {
        final today = provider.todayRecord;
        final isCheckedIn = today?.checkIn != null && today?.checkOut == null;
        final isCheckedOut = today?.checkOut != null;

        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status card
              _buildStatusCard(today, isCheckedIn, isCheckedOut),
              const SizedBox(height: 20),

              // Action buttons
              if (!isCheckedOut)
                _buildActionButtons(isCheckedIn),

              const SizedBox(height: 24),

              // Device section header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Face ID Qurilmalar',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.white),
                  ),
                  if (!_loadingDevices)
                    _onlineBadge(_devices.where((d) => d.isOnline).length,
                        _devices.length),
                ],
              ),
              const SizedBox(height: 10),

              // Info banner
              _buildInfoBanner(),
              const SizedBox(height: 12),

              // Device list
              if (_loadingDevices)
                _buildShimmer()
              else if (_devices.isEmpty)
                _buildNoDevices()
              else
                ...(_devices.map((d) => _buildDeviceCard(d))),

              const SizedBox(height: 20),

              // PIN alternative
              _buildPinTile(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusCard(
      AttendanceRecord? today, bool isCheckedIn, bool isCheckedOut) {
    Color cardColor;
    IconData statusIcon;
    String title;
    String subtitle;

    if (isCheckedOut) {
      cardColor = AppColors.primary;
      statusIcon = Icons.verified_rounded;
      title = 'Ish kuni yakunlandi';
      subtitle =
          'Kirish: ${today!.checkInFormatted}  ·  Chiqish: ${today.checkOutFormatted}';
    } else if (isCheckedIn) {
      cardColor = AppColors.teal;
      statusIcon = Icons.radio_button_checked_rounded;
      title = 'Ishda — ${today!.checkInFormatted} dan';
      subtitle = _getStatusLabel(today.status);
    } else {
      cardColor = const Color(0xFF1E293B);
      statusIcon = Icons.schedule_rounded;
      title = 'Hali kelmadingiz';
      subtitle = DateFormat('d MMMM, EEEE', 'uz').format(DateTime.now());
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            cardColor.withValues(alpha: 0.25),
            cardColor.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardColor.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: cardColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(statusIcon, color: cardColor, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Colors.white)),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.55),
                        height: 1.3)),
              ],
            ),
          ),
          if (isCheckedIn)
            AnimatedBuilder(
              animation: _pulseAnim,
              builder: (_, child) => Opacity(opacity: _pulseAnim.value, child: child),
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: AppColors.teal,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                        color: AppColors.teal.withValues(alpha: 0.6),
                        blurRadius: 8)
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'on_time':
        return 'O\'z vaqtida keldi ✓';
      case 'late':
        return 'Kechikib keldi';
      case 'absent':
        return 'Kelmagan';
      default:
        return status;
    }
  }

  Widget _buildActionButtons(bool isCheckedIn) {
    if (isCheckedIn) {
      return SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton.icon(
          onPressed: _doCheckOut,
          icon: const Icon(Icons.logout_rounded, size: 20),
          label: const Text('Chiqishni belgilash',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFDC2626),
            foregroundColor: Colors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      height: 54,
      child: ElevatedButton.icon(
        onPressed: _doCheckIn,
        icon: const Icon(Icons.login_rounded, size: 20),
        label: const Text('Kelishni belgilash',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.teal,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildInfoBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline_rounded,
              size: 16, color: Colors.white.withValues(alpha: 0.35)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Qurilma kamerasiga yuz tutib turing — davomat avtomatik belgilanadi',
              style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.4),
                  height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _onlineBadge(int online, int total) {
    final isGood = online > 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isGood
            ? AppColors.success.withValues(alpha: 0.12)
            : Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: isGood
                ? AppColors.success.withValues(alpha: 0.25)
                : Colors.transparent),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isGood ? AppColors.success : Colors.white30,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            '$online/$total online',
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isGood ? AppColors.success : Colors.white38),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceCard(FaceDevice device) {
    final isOnline = device.isOnline;
    final checkLabel = _checkTypeLabel(device.checkType);

    return GestureDetector(
      onTap: isOnline ? () => _showDeviceBottomSheet(device) : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isOnline
              ? Colors.white.withValues(alpha: 0.07)
              : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOnline
                ? Colors.white.withValues(alpha: 0.12)
                : Colors.white.withValues(alpha: 0.05),
          ),
        ),
        child: Row(
          children: [
            // Device icon
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: isOnline
                    ? AppColors.teal.withValues(alpha: 0.12)
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(
                _deviceIcon(device.deviceType),
                color: isOnline ? AppColors.teal : Colors.white24,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isOnline ? Colors.white : Colors.white38),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Icon(Icons.router_outlined,
                          size: 11,
                          color: Colors.white.withValues(alpha: 0.3)),
                      const SizedBox(width: 4),
                      Text(
                        device.ipAddress,
                        style: TextStyle(
                            fontSize: 11,
                            color: Colors.white.withValues(alpha: 0.35),
                            fontFamily: 'monospace'),
                      ),
                      if (device.location != null) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.place_outlined,
                            size: 11,
                            color: Colors.white.withValues(alpha: 0.3)),
                        const SizedBox(width: 3),
                        Flexible(
                          child: Text(
                            device.location!,
                            style: TextStyle(
                                fontSize: 11,
                                color: Colors.white.withValues(alpha: 0.35)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Right side: check type + status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Pulse dot
                AnimatedBuilder(
                  animation: _pulseAnim,
                  builder: (_, child) => Opacity(
                      opacity: isOnline ? _pulseAnim.value : 0.3,
                      child: child),
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isOnline ? AppColors.success : Colors.white24,
                      shape: BoxShape.circle,
                      boxShadow: isOnline
                          ? [
                              BoxShadow(
                                  color: AppColors.success
                                      .withValues(alpha: 0.5),
                                  blurRadius: 6)
                            ]
                          : [],
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: isOnline ? AppColors.success : Colors.white24),
                ),
                if (checkLabel != null) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      checkLabel,
                      style: TextStyle(
                          fontSize: 9,
                          color: Colors.white.withValues(alpha: 0.4),
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String? _checkTypeLabel(String? type) {
    switch (type) {
      case 'entry':
        return 'KIRISH';
      case 'exit':
        return 'CHIQISH';
      case 'both':
        return 'KIR/CHIQ';
      default:
        return null;
    }
  }

  IconData _deviceIcon(String type) {
    switch (type) {
      case 'ip_camera':
        return Icons.videocam_rounded;
      case 'face_terminal':
        return Icons.face_retouching_natural_rounded;
      case 'access_control':
        return Icons.door_sliding_outlined;
      default:
        return Icons.camera_outdoor_rounded;
    }
  }

  void _showDeviceBottomSheet(FaceDevice device) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111827),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                  color: AppColors.teal.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20)),
              child: Icon(_deviceIcon(device.deviceType),
                  color: AppColors.teal, size: 32),
            ),
            const SizedBox(height: 12),
            Text(device.name,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
            const SizedBox(height: 4),
            Text(device.ipAddress,
                style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.4),
                    fontFamily: 'monospace')),
            if (device.location != null) ...[
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.place_outlined,
                      size: 13,
                      color: Colors.white.withValues(alpha: 0.3)),
                  const SizedBox(width: 4),
                  Text(device.location!,
                      style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.4))),
                ],
              ),
            ],
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.teal.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: AppColors.teal.withValues(alpha: 0.15)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.face_retouching_natural_rounded,
                      color: AppColors.teal, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Qurilma kamerasiga yuzingizni ko\'rsating — davomat avtomatik belgilanadi.',
                      style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.6),
                          height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white54,
                      side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.15)),
                      minimumSize: const Size(0, 50),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Yopish'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _doCheckIn();
                    },
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: const Text('Manuel belgilash',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(0, 50),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPinTile() {
    return GestureDetector(
      onTap: () => setState(() => _uiState = CheckInScreenState.pin),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.pin_outlined,
                  color: Colors.white60, size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PIN orqali kirish',
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white70)),
                  SizedBox(height: 2),
                  Text('Face ID qurilma mavjud bo\'lmasa',
                      style:
                          TextStyle(fontSize: 11, color: Colors.white30)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: Colors.white24, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Column(
      children: List.generate(
        3,
        (i) => Container(
          margin: const EdgeInsets.only(bottom: 10),
          height: 76,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildNoDevices() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: Column(
        children: [
          Icon(Icons.videocam_off_outlined,
              size: 44, color: Colors.white.withValues(alpha: 0.15)),
          const SizedBox(height: 12),
          const Text('Qurilmalar topilmadi',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white38)),
          const SizedBox(height: 6),
          Text(
            'Kompaniyangizga hech qanday Face ID qurilma ulanmagan.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.25),
                height: 1.5),
          ),
        ],
      ),
    );
  }

  // ─── PROCESSING ─────────────────────────────────────────────────────────────

  Widget _buildProcessing() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 72,
            height: 72,
            child: CircularProgressIndicator(
                color: AppColors.teal, strokeWidth: 2.5),
          ),
          const SizedBox(height: 24),
          const Text('Bajarilmoqda...',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white)),
          const SizedBox(height: 8),
          Text('Iltimos kuting',
              style: TextStyle(
                  fontSize: 13,
                  color: Colors.white.withValues(alpha: 0.4))),
        ],
      ),
    );
  }

  // ─── SUCCESS ────────────────────────────────────────────────────────────────

  Widget _buildSuccess() {
    final now = DateTime.now();
    final timeStr = DateFormat('HH:mm').format(now);
    final dateStr = DateFormat('d MMMM yyyy', 'uz').format(now);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 700),
              curve: Curves.elasticOut,
              builder: (_, v, child) =>
                  Transform.scale(scale: v, child: child),
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.4),
                      width: 2),
                ),
                child: const Icon(Icons.check_rounded,
                    size: 52, color: AppColors.success),
              ),
            ),
            const SizedBox(height: 24),
            const Text('Muvaffaqiyatli!',
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
            const SizedBox(height: 8),
            Text(timeStr,
                style: const TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w800,
                    color: AppColors.success,
                    letterSpacing: -1)),
            const SizedBox(height: 4),
            Text(dateStr,
                style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withValues(alpha: 0.4))),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 18, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                border: Border.all(
                    color: AppColors.success.withValues(alpha: 0.3)),
                borderRadius: BorderRadius.circular(100),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified_rounded,
                      size: 15, color: AppColors.success),
                  SizedBox(width: 6),
                  Text('Davomat belgilandi',
                      style: TextStyle(
                          fontSize: 13,
                          color: AppColors.success,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '$_redirectCountdown soniyada...',
              style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.25)),
            ),
            const SizedBox(height: 28),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => context.go('/home'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.teal,
                      minimumSize: const Size(0, 52),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: const Text('Asosiy sahifa',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: () => context.go('/attendance'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white54,
                    side: BorderSide(
                        color: Colors.white.withValues(alpha: 0.2)),
                    minimumSize: const Size(90, 52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
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

  // ─── ERROR ──────────────────────────────────────────────────────────────────

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626).withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                    color: const Color(0xFFDC2626).withValues(alpha: 0.3),
                    width: 2),
              ),
              child: const Icon(Icons.error_outline_rounded,
                  size: 44, color: Color(0xFFEF4444)),
            ),
            const SizedBox(height: 20),
            const Text('Xatolik yuz berdi',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
            const SizedBox(height: 10),
            Text(
              _errorMsg ??
                  'Davomat belgilab bo\'lmadi. Qayta urinib ko\'ring.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withValues(alpha: 0.5),
                  height: 1.6),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _resetToIdle,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Qayta urinish',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.teal,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () =>
                  setState(() => _uiState = CheckInScreenState.pin),
              child: Text('PIN orqali kirish',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }

  // ─── PIN INPUT ──────────────────────────────────────────────────────────────

  Widget _buildPinInput() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.pin_outlined,
                size: 30, color: Colors.white70),
          ),
          const SizedBox(height: 18),
          const Text('PIN orqali kirish',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: Colors.white)),
          const SizedBox(height: 6),
          Text('4-6 xonali PIN kodingizni kiriting',
              style: TextStyle(
                  fontSize: 13,
                  color: Colors.white.withValues(alpha: 0.4))),
          const SizedBox(height: 28),
          TextField(
            controller: _pinCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            obscureText: true,
            textAlign: TextAlign.center,
            autofocus: true,
            style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 12),
            decoration: InputDecoration(
              counterText: '',
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.07),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide:
                    BorderSide(color: Colors.white.withValues(alpha: 0.12)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide:
                    BorderSide(color: Colors.white.withValues(alpha: 0.12)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide:
                    const BorderSide(color: AppColors.teal, width: 2),
              ),
              hintText: '• • • • • •',
              hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.15),
                  letterSpacing: 12,
                  fontSize: 20),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _doCheckInWithPin,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.teal,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: const Text('Tasdiqlash',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 10),
          TextButton.icon(
            onPressed: _resetToIdle,
            icon: const Icon(Icons.arrow_back_rounded,
                size: 16, color: Colors.white38),
            label: Text('Orqaga',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.35),
                    fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
