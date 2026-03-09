import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_button.dart';

class OtpVerifyScreen extends StatefulWidget {
  final String email;
  const OtpVerifyScreen({super.key, required this.email});

  @override
  State<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends State<OtpVerifyScreen> {
  final List<TextEditingController> _ctrls = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());
  Timer? _resendTimer;
  int _resendCooldown = 0;

  @override
  void initState() {
    super.initState();
    _startResendCooldown(60);
  }

  void _startResendCooldown(int seconds) {
    setState(() => _resendCooldown = seconds);
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() => _resendCooldown--);
      if (_resendCooldown <= 0) t.cancel();
    });
  }

  @override
  void dispose() {
    for (final c in _ctrls) c.dispose();
    for (final n in _nodes) n.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  String get _code => _ctrls.map((c) => c.text).join();

  Future<void> _verify() async {
    if (_code.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('6 xonali kodni kiriting'), backgroundColor: AppColors.error),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok = await auth.verifyOtp(widget.email, _code);
    if (!ok && mounted && auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.errorMessage!), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0F1B5C), AppColors.primary],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Kodni tasdiqlash', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                        Text('Email orqali yuborilgan kod', style: TextStyle(fontSize: 13, color: Colors.white60)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppColors.bg,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 12),
                      const Icon(Icons.mark_email_read_outlined, size: 56, color: AppColors.primary),
                      const SizedBox(height: 20),
                      const Text('Emailni tekshiring', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      const SizedBox(height: 8),
                      Text(
                        '${widget.email} manziliga 6 xonali tasdiqlash kodi yuborildi.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 32),
                      // OTP input boxes
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(6, (i) => _OtpBox(
                          controller: _ctrls[i],
                          focusNode: _nodes[i],
                          onChanged: (val) {
                            if (val.isNotEmpty && i < 5) _nodes[i + 1].requestFocus();
                            if (val.isEmpty && i > 0) _nodes[i - 1].requestFocus();
                          },
                        )),
                      ),
                      const SizedBox(height: 32),
                      Consumer<AuthProvider>(
                        builder: (_, auth, __) => AppButton(
                          label: 'Tasdiqlash',
                          onPressed: _verify,
                          isLoading: auth.isLoading,
                          icon: Icons.check_circle_outline,
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextButton(
                        onPressed: _resendCooldown > 0
                            ? null
                            : () async {
                                final auth = context.read<AuthProvider>();
                                final ok = await auth.sendOtp(widget.email);
                                if (mounted) {
                                  if (ok) {
                                    _startResendCooldown(60);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Kod qayta yuborildi'), backgroundColor: AppColors.success),
                                    );
                                  } else if (auth.errorMessage != null) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(auth.errorMessage!), backgroundColor: AppColors.error),
                                    );
                                  }
                                }
                              },
                        child: Text(
                          _resendCooldown > 0
                              ? 'Qayta yuborish ($_resendCooldown s)'
                              : 'Kodni qayta yuborish',
                          style: TextStyle(
                            color: _resendCooldown > 0 ? AppColors.textMuted : AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final void Function(String) onChanged;

  const _OtpBox({required this.controller, required this.focusNode, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        maxLength: 1,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary),
        decoration: InputDecoration(
          counterText: '',
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
          contentPadding: EdgeInsets.zero,
        ),
        onChanged: onChanged,
      ),
    );
  }
}
