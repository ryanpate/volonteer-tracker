# core/management/commands/create_admin.py
from django.core.management.base import BaseCommand
from core.models import TeamMember

class Command(BaseCommand):
    help = 'Create an admin user interactively'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Create Admin User ===\n'))
        
        username = input('Username: ')
        email = input('Email: ')
        first_name = input('First Name: ')
        last_name = input('Last Name: ')
        password = input('Password (min 8 characters): ')
        
        if not all([username, email, first_name, last_name, password]):
            self.stdout.write(self.style.ERROR('All fields are required'))
            return
        
        if len(password) < 8:
            self.stdout.write(self.style.ERROR('Password must be at least 8 characters'))
            return
        
        if TeamMember.objects.filter(username=username).exists():
            self.stdout.write(self.style.ERROR(f'Username "{username}" already exists'))
            return
        
        if TeamMember.objects.filter(email=email).exists():
            self.stdout.write(self.style.ERROR(f'Email "{email}" already exists'))
            return
        
        try:
            user = TeamMember.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='admin'
            )
            
            self.stdout.write(self.style.SUCCESS('\n✅ Admin user created successfully!'))
            self.stdout.write(self.style.SUCCESS(f'\nUsername: {user.username}'))
            self.stdout.write(self.style.SUCCESS(f'Email: {user.email}'))
            self.stdout.write(self.style.SUCCESS(f'Name: {user.full_name}'))
            self.stdout.write(self.style.SUCCESS(f'Role: {user.role}'))
            self.stdout.write(self.style.SUCCESS('\nYou can now login with these credentials.\n'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating admin user: {e}'))


