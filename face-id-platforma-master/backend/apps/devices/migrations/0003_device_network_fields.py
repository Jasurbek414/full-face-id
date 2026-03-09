from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('devices', '0002_device_check_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='device',
            name='device_type',
            field=models.CharField(
                choices=[('camera', 'Kamera'), ('face_id', 'Yuz ID qurilmasi')],
                default='face_id',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='device',
            name='ip_address',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='device',
            name='port',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='device',
            name='mac_address',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='device',
            name='rtsp_url',
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='device',
            name='device_username',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='device',
            name='device_password',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='device',
            name='connection_status',
            field=models.CharField(
                choices=[('online', 'Online'), ('offline', 'Offline'), ('unknown', "Noma'lum")],
                default='unknown',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='device',
            name='last_ping',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
