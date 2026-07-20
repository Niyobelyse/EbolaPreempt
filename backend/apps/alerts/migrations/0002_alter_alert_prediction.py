# Generated manually to enforce the one-alert-per-prediction invariant.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='alert',
            name='prediction',
            field=models.OneToOneField(
                on_delete=models.deletion.CASCADE,
                related_name='alerts',
                to='prediction.prediction',
            ),
        ),
    ]
