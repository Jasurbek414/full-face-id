import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/app_button.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _pwCtrl = TextEditingController();
  final _pw2Ctrl = TextEditingController();
  bool _obscurePw = true;
  bool _obscurePw2 = true;

  @override
  void dispose() {
    _firstCtrl.dispose(); _lastCtrl.dispose();
    _emailCtrl.dispose(); _phoneCtrl.dispose();
    _companyCtrl.dispose(); _pwCtrl.dispose(); _pw2Ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      email: _emailCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      password: _pwCtrl.text,
      firstName: _firstCtrl.text.trim(),
      lastName: _lastCtrl.text.trim(),
      companyName: _companyCtrl.text.trim(),
    );
    if (ok && mounted) {
      context.push('/auth/otp', extra: _emailCtrl.text.trim());
    } else if (!ok && mounted && auth.errorMessage != null) {
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
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Ro\'yxatdan o\'tish', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                        Text('7 kunlik bepul sinov', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.65))),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Form card
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: AppColors.bg,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: AppTextField(controller: _firstCtrl, label: 'Ism', hint: 'Jasur', validator: (v) => v!.trim().isEmpty ? 'Ism kiriting' : null)),
                              const SizedBox(width: 12),
                              Expanded(child: AppTextField(controller: _lastCtrl, label: 'Familiya', hint: 'Toshmatov', validator: (v) => v!.trim().isEmpty ? 'Familiya kiriting' : null)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            controller: _companyCtrl,
                            label: 'Kompaniya nomi',
                            hint: 'Biznesim LLC',
                            prefixIcon: Icons.business_outlined,
                            validator: (v) => v!.trim().isEmpty ? 'Kompaniya nomini kiriting' : null,
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            controller: _emailCtrl,
                            label: 'Email manzil',
                            hint: 'email@kompaniya.uz',
                            keyboardType: TextInputType.emailAddress,
                            prefixIcon: Icons.email_outlined,
                            validator: (v) {
                              if (v!.trim().isEmpty) return 'Email kiriting';
                              if (!v.contains('@')) return 'Noto\'g\'ri email';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            controller: _phoneCtrl,
                            label: 'Telefon raqam',
                            hint: '+998901234567',
                            keyboardType: TextInputType.phone,
                            prefixIcon: Icons.phone_outlined,
                            validator: (v) => v!.trim().isEmpty ? 'Telefon kiriting' : null,
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            controller: _pwCtrl,
                            label: 'Parol',
                            hint: '••••••••',
                            obscureText: _obscurePw,
                            prefixIcon: Icons.lock_outline,
                            suffixIcon: _obscurePw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            onSuffixTap: () => setState(() => _obscurePw = !_obscurePw),
                            validator: (v) {
                              if (v!.isEmpty) return 'Parol kiriting';
                              if (v.length < 8) return 'Kamida 8 ta belgi';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          AppTextField(
                            controller: _pw2Ctrl,
                            label: 'Parolni tasdiqlang',
                            hint: '••••••••',
                            obscureText: _obscurePw2,
                            prefixIcon: Icons.lock_outline,
                            suffixIcon: _obscurePw2 ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            onSuffixTap: () => setState(() => _obscurePw2 = !_obscurePw2),
                            validator: (v) {
                              if (v != _pwCtrl.text) return 'Parollar mos kelmadi';
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),

                          // Trial info
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFDE68A)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 18),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    '7 kunlik bepul sinov muddati. Undan keyin to\'lov kerak bo\'ladi.',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          Consumer<AuthProvider>(
                            builder: (_, auth, __) => AppButton(
                              label: 'Ro\'yxatdan o\'tish',
                              onPressed: _submit,
                              isLoading: auth.isLoading,
                              icon: Icons.person_add_outlined,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: GestureDetector(
                              onTap: () => context.pop(),
                              child: RichText(
                                text: const TextSpan(
                                  text: 'Allaqachon akkauntingiz bormi? ',
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                  children: [
                                    TextSpan(
                                      text: 'Kirish',
                                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
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
