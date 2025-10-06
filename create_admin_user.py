# create_admin_user.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'volunteer_tracker.settings')
django.setup()

from core.models import TeamMember

username = 'ryanpate'
email = 'ryan@cherryhillsfamily.org'
first_name = 'Ryan'
last_name = 'Pate'
password = 'gish4474'  # Change this after first login!

if TeamMember.objects.filter(username=username).exists():
    print(f'User {username} already exists!')
else:
    user = TeamMember.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role='admin'
    )
    print(f'✅ Admin user created successfully!')
    print(f'Username: {user.username}')
    print(f'Email: {user.email}')