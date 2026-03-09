from django.db import migrations

PERMISSIONS = [
    ('attendance.view_own', "O'z davomatini ko'rish", 'attendance'),
    ('attendance.view_dept', "Bo'lim davomatini ko'rish", 'attendance'),
    ('attendance.view_all', "Barcha davomatni ko'rish", 'attendance'),
    ('attendance.manual_edit', "Davomatni qo'lda tahrirlash", 'attendance'),
    ('attendance.export', 'Davomatni eksport qilish', 'attendance'),
    ('attendance.live_view', 'Jonli monitoring', 'attendance'),
    ('employees.view', "Xodimlarni ko'rish", 'employees'),
    ('employees.create', "Xodim qo'shish", 'employees'),
    ('employees.edit', 'Xodimni tahrirlash', 'employees'),
    ('employees.delete', "Xodimni o'chirish", 'employees'),
    ('employees.assign_role', 'Rol belgilash', 'employees'),
    ('employees.view_salary', "Maoshni ko'rish", 'employees'),
    ('reports.daily', 'Kunlik hisobot', 'reports'),
    ('reports.monthly', 'Oylik hisobot', 'reports'),
    ('reports.analytics', 'Analitika', 'reports'),
    ('settings.roles', 'Rollarni boshqarish', 'settings'),
    ('settings.company', 'Kompaniya sozlamalari', 'settings'),
    ('payroll.view_own', "O'z maoshini ko'rish", 'payroll'),
    ('payroll.view_all', "Barcha maoshlarni ko'rish", 'payroll'),
    ('payroll.calculate', 'Maosh hisoblash', 'payroll'),
    ('payroll.approve', 'Maoshni tasdiqlash', 'payroll'),
    ('payroll.export', 'Maoshni eksport qilish', 'payroll'),
    ('leaves.request', "Ta'til so'rash", 'leaves'),
    ('leaves.approve_dept', "Bo'lim ta'tilini tasdiqlash", 'leaves'),
    ('leaves.approve_all', "Barcha ta'tillarni tasdiqlash", 'leaves'),
    ('devices.view', "Qurilmalarni ko'rish", 'devices'),
    ('devices.manage', 'Qurilmalarni boshqarish', 'devices'),
]


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model('roles', 'Permission')
    for code, name, module in PERMISSIONS:
        Permission.objects.get_or_create(code=code, defaults={'name': name, 'module': module})


def remove_permissions(apps, schema_editor):
    Permission = apps.get_model('roles', 'Permission')
    codes = [p[0] for p in PERMISSIONS]
    Permission.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_permissions, remove_permissions),
    ]
