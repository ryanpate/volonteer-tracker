# volunteers/management/commands/sync_pco.py
from django.core.management.base import BaseCommand
from volunteers.services import PCOService

class Command(BaseCommand):
    help = 'Sync volunteers from Planning Center Online'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting PCO sync...'))
        
        try:
            pco_service = PCOService()
            result = pco_service.sync_volunteers()
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ Sync completed!'))
            self.stdout.write(self.style.SUCCESS(f'  New volunteers: {result["synced"]}'))
            self.stdout.write(self.style.SUCCESS(f'  Updated volunteers: {result["updated"]}'))
            
            if result['errors']:
                self.stdout.write(self.style.WARNING(f'  Errors: {len(result["errors"])}'))
                for error in result['errors'][:5]:  # Show first 5 errors
                    self.stdout.write(self.style.WARNING(f'    - {error}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Sync failed: {e}'))


