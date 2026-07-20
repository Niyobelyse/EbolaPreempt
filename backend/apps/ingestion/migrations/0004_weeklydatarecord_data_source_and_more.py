from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ingestion', '0003_remove_weeklydatarecord_cases_lag_1wk_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='weeklydatarecord',
            name='data_source',
            field=models.CharField(default='seeded_dataset', max_length=50),
        ),
        migrations.AddField(
            model_name='weeklydatarecord',
            name='source_reported_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='weeklydatarecord',
            name='source_url',
            field=models.URLField(blank=True, default=''),
        ),
    ]
