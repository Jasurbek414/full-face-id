from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscription',
            name='monthly_price',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                help_text='Per-company custom monthly price (overrides plan price)',
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='grace_period_days',
            field=models.PositiveIntegerField(
                default=3,
                help_text='Days after expiry before hard block',
            ),
        ),
        migrations.AddField(
            model_name='subscription',
            name='notes',
            field=models.TextField(blank=True, help_text='Admin notes about this subscription'),
        ),
        migrations.AddField(
            model_name='subscription',
            name='last_payment_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='subscription',
            name='plan',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='subscriptions',
                to='subscriptions.plan',
            ),
        ),
    ]
