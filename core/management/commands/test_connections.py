# core/management/commands/test_connections.py
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from volunteers.services import PCOService, LLMService

class Command(BaseCommand):
    help = 'Test all external connections'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Testing All Connections ===\n'))
        
        # Test Database
        self.stdout.write('1. Testing Database Connection...')
        try:
            connection.ensure_connection()
            self.stdout.write(self.style.SUCCESS('   ✅ Database connected successfully\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Database connection failed: {e}\n'))
        
        # Test PCO
        self.stdout.write('2. Testing Planning Center Online Connection...')
        try:
            pco_service = PCOService()
            result = pco_service.test_connection()
            if result['success']:
                self.stdout.write(self.style.SUCCESS(f'   ✅ {result["message"]}'))
                self.stdout.write(self.style.SUCCESS(f'   Total people in PCO: {result["people_count"]}\n'))
            else:
                self.stdout.write(self.style.ERROR(f'   ❌ {result["message"]}: {result.get("error")}\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ PCO connection test failed: {e}\n'))
        
        # Test LLM
        self.stdout.write('3. Testing LLM API Connection...')
        try:
            llm_service = LLMService()
            provider = 'Anthropic Claude' if llm_service.use_anthropic else 'OpenAI'
            self.stdout.write(self.style.SUCCESS(f'   ✅ LLM API configured ({provider})\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ LLM API not configured: {e}\n'))
        
        # Environment Check
        self.stdout.write('4. Environment Variables Check...')
        required_vars = ['SECRET_KEY', 'DATABASE_URL', 'PCO_APP_ID', 'PCO_SECRET']
        optional_vars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']
        
        all_required = True
        for var in required_vars:
            if getattr(settings, var, None):
                self.stdout.write(self.style.SUCCESS(f'   ✅ {var} is set'))
            else:
                self.stdout.write(self.style.ERROR(f'   ❌ {var} is NOT set'))
                all_required = False
        
        self.stdout.write('\n   Optional (at least one recommended):')
        for var in optional_vars:
            if getattr(settings, var, None):
                self.stdout.write(self.style.SUCCESS(f'   ✅ {var} is set'))
            else:
                self.stdout.write(self.style.WARNING(f'   ⚠️  {var} is NOT set'))
        
        self.stdout.write(self.style.SUCCESS('\n=== Test Complete ===\n'))