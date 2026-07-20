from django.core.management.base import BaseCommand, CommandError

from apps.ingestion.services import LiveIngestionError, sync_who_ebola_data


class Command(BaseCommand):
    help = 'Fetch the latest WHO Ebola regional total and create estimated district risk records.'

    def add_arguments(self, parser):
        parser.add_argument('--source-url')
        parser.add_argument('--force', action='store_true')

    def handle(self, *args, **options):
        try:
            result = sync_who_ebola_data(options['source_url'], options['force'])
        except LiveIngestionError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(self.style.SUCCESS(
            f"Synced {result['districts_updated']} districts for {result['week']} "
            f"from {result['confirmed_cases']} WHO-reported confirmed cases."
        ))
