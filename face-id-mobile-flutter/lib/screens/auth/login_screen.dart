import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/app_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePw = true;
  bool _usePhone = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    bool ok;
    if (_usePhone) {
      ok = await auth.loginWithPhone(_emailCtrl.text.trim(), _passwordCtrl.text);
    } else {
      ok = await auth.loginWithEmail(_emailCtrl.text.trim(), _passwordCtrl.text);
    }
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
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(Icons.face_retouching_natural, size: 38, color: Colors.white),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Xush kelibsiz!',
                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hisobingizga kiring',
                      style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.65)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

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
                          // Toggle email/phone
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              children: [
                                Expanded(child: _ToggleBtn(
                                  label: 'Email',
                                  icon: Icons.email_outlined,
                                  selected: !_usePhone,
                                  onTap: () => setState(() => _usePhone = false),
                                )),
                                Expanded(child: _ToggleBtn(
                                  label: 'Telefon',
                                  icon: Icons.phone_outlined,
                                  selected: _usePhone,
                                  onTap: () => setState(() => _usePhone = true),
                                )),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),

                          AppTextField(
                            controller: _emailCtrl,
                            label: _usePhone ? 'Telefon raqam' : 'Email manzil',
                            hint: _usePhone ? '+998901234567' : 'email@kompaniya.uz',
                            keyboardType: _usePhone
                                ? TextInputType.phone
                                : TextInputType.emailAddress,
                            prefixIcon: _usePhone ? Icons.phone_outlined : Icons.email_outlined,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return _usePhone ? 'Telefon raqam kiriting' : 'Email kiriting';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          AppTextField(
                            controller: _passwordCtrl,
                            label: 'Parol',
                            hint: '••••••••',
                            obscureText: _obscurePw,
                            prefixIcon: Icons.lock_outline,
                            suffixIcon: _obscurePw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            onSuffixTap: () => setState(() => _obscurePw = !_obscurePw),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Parol kiriting';
                              if (v.length < 6) return 'Parol kamida 6 ta belgi';
                              return null;
                            },
                          ),
                          const SizedBox(height: 28),

                          Consumer<AuthProvider>(
                            builder: (_, auth, __) => AppButton(
                              label: 'Kirish',
                              onPressed: _submit,
                              isLoading: auth.isLoading,
                              icon: Icons.login_rounded,
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Divider
                          Row(children: [
                            const Expanded(child: Divider()),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text('yoki', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                            ),
                            const Expanded(child: Divider()),
                          ]),
                          const SizedBox(height: 16),

                          // Face ID login
                          OutlinedButton.icon(
                            onPressed: () => context.push('/checkin'),
                            icon: const Icon(Icons.face_retouching_natural),
                            label: const Text('Face ID orqali kirish'),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(double.infinity, 52),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Register link
                          Center(
                            child: GestureDetector(
                              onTap: () => context.push('/auth/register'),
                              child: RichText(
                                text: TextSpan(
                                  text: 'Akkauntingiz yo\'qmi? ',
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                                  children: [
                                    TextSpan(
                                      text: 'Ro\'yxatdan o\'tish',
                                      style: const TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700,
                                      ),
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

class _ToggleBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ToggleBtn({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: selected ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
