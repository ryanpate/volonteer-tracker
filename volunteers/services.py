import requests
from django.conf import settings
from django.utils import timezone
from .models import Volunteer
import logging

logger = logging.getLogger(__name__)


class PCOService:
    """Service for syncing volunteers from Planning Center Online"""

    def __init__(self):
        self.base_url = 'https://api.planningcenteronline.com'
        self.auth = (settings.PCO_APP_ID, settings.PCO_SECRET)

    def sync_volunteers(self):
        """Sync all volunteers from PCO Services"""
        results = {
            'synced': 0,
            'updated': 0,
            'errors': []
        }

        try:
            logger.info('Starting PCO volunteer sync...')

            all_people = []
            next_url = f'{self.base_url}/services/v2/people?per_page=100&include=emails,phone_numbers,addresses'

            while next_url:
                try:
                    response = requests.get(next_url, auth=self.auth)
                    response.raise_for_status()
                    data = response.json()

                    people = data.get('data', [])
                    included = data.get('included', [])

                    for person in people:
                        try:
                            person_data = self._extract_person_data(
                                person, included)
                            all_people.append(person_data)
                        except Exception as e:
                            logger.error(
                                f"Error processing person {person.get('id')}: {e}")
                            results['errors'].append({
                                'id': person.get('id'),
                                'error': str(e)
                            })

                    # Get next page
                    links = data.get('links', {})
                    next_url = links.get('next')

                except requests.RequestException as e:
                    logger.error(f"Error fetching from PCO: {e}")
                    results['errors'].append({
                        'error': 'Failed to fetch from PCO',
                        'message': str(e)
                    })
                    break

            logger.info(f"Fetched {len(all_people)} people from PCO")

            # Update database
            for person_data in all_people:
                try:
                    volunteer, created = Volunteer.objects.update_or_create(
                        pco_person_id=person_data['pco_person_id'],
                        defaults={
                            'first_name': person_data['first_name'],
                            'last_name': person_data['last_name'],
                            'email': person_data.get('email'),
                            'phone': person_data.get('phone'),
                            'address': person_data.get('address'),
                            'teams': person_data.get('teams', []),
                            'last_synced_at': timezone.now(),
                        }
                    )

                    if created:
                        results['synced'] += 1
                    else:
                        results['updated'] += 1

                except Exception as e:
                    logger.error(
                        f"Error saving volunteer {person_data['pco_person_id']}: {e}")
                    results['errors'].append({
                        'id': person_data['pco_person_id'],
                        'error': str(e)
                    })

            logger.info(
                f"Sync complete: {results['synced']} new, {results['updated']} updated, {len(results['errors'])} errors")
            return results

        except Exception as e:
            logger.error(f"Sync volunteers error: {e}")
            raise

    def _extract_person_data(self, person, included):
        """Extract person data from PCO API response"""
        person_data = {
            'pco_person_id': person['id'],
            'first_name': person['attributes'].get('first_name', ''),
            'last_name': person['attributes'].get('last_name', ''),
            'email': None,
            'phone': None,
            'address': None,
            'teams': [],  # Teams will be fetched on-demand
        }

        # Extract email
        relationships = person.get('relationships', {})
        if 'emails' in relationships and relationships['emails'].get('data'):
            email_ids = [e['id'] for e in relationships['emails']['data']]
            emails = [item for item in included if item['type']
                      == 'Email' and item['id'] in email_ids]
            if emails:
                primary_email = next(
                    (e for e in emails if e['attributes'].get('primary')), emails[0])
                person_data['email'] = primary_email['attributes'].get(
                    'address')

        # Extract phone
        if 'phone_numbers' in relationships and relationships['phone_numbers'].get('data'):
            phone_ids = [p['id']
                         for p in relationships['phone_numbers']['data']]
            phones = [item for item in included if item['type']
                      == 'PhoneNumber' and item['id'] in phone_ids]
            if phones:
                primary_phone = next(
                    (p for p in phones if p['attributes'].get('primary')), phones[0])
                person_data['phone'] = primary_phone['attributes'].get(
                    'number')

        # Extract address
        if 'addresses' in relationships and relationships['addresses'].get('data'):
            address_ids = [a['id'] for a in relationships['addresses']['data']]
            addresses = [item for item in included if item['type']
                         == 'Address' and item['id'] in address_ids]
            if addresses:
                primary_address = next(
                    (a for a in addresses if a['attributes'].get('primary')), addresses[0])
                addr_attrs = primary_address['attributes']
                person_data['address'] = ', '.join(filter(None, [
                    addr_attrs.get('street'),
                    addr_attrs.get('city'),
                    addr_attrs.get('state'),
                    addr_attrs.get('zip')
                ]))

        return person_data

    def fetch_person_teams(self, person_id):
        """Fetch team assignments for a specific person (called on-demand)"""
        teams = []
        try:
            # Fetch all team positions with team data included
            url = f'{self.base_url}/services/v2/people/{person_id}/team_positions?include=team'
            logger.info(f"Fetching from URL: {url}")

            response = requests.get(url, auth=self.auth)
            logger.info(f"Response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                logger.info(f"Response data: {data}")
                
                team_positions = data.get('data', [])
                included = data.get('included', [])

                # Extract unique team names from included team data
                for position in team_positions:
                    # Get team ID from relationships
                    team_rel = position.get(
                        'relationships', {}).get('team', {})
                    if team_rel.get('data'):
                        team_id = team_rel['data']['id']

                        # Find the team in included data
                        team = next(
                            (item for item in included if item['type'] == 'Team' and item['id'] == team_id), None)
                        if team:
                            team_name = team.get('attributes', {}).get('name')
                            if team_name and team_name not in teams:
                                teams.append(team_name)
            else:
                logger.warning(
                    f"Could not fetch teams for person {person_id}: Status {response.status_code}")

        except Exception as e:
            logger.error(f"Error fetching teams for person {person_id}: {e}")

        return teams

    def test_connection(self):
        """Test PCO API connection"""
        try:
            response = requests.get(
                f'{self.base_url}/services/v2/people?per_page=1',
                auth=self.auth
            )
            response.raise_for_status()
            data = response.json()

            return {
                'success': True,
                'message': 'Successfully connected to Planning Center Online',
                'people_count': data.get('meta', {}).get('total_count', 0)
            }
        except Exception as e:
            logger.error(f"PCO connection test failed: {e}")
            return {
                'success': False,
                'message': 'Failed to connect to Planning Center Online',
                'error': str(e)
            }


class LLMService:
    """Service for generating AI summaries using OpenAI or Anthropic"""

    def __init__(self):
        self.use_openai = bool(settings.OPENAI_API_KEY)
        self.use_anthropic = bool(settings.ANTHROPIC_API_KEY)

        if not self.use_openai and not self.use_anthropic:
            raise ValueError(
                'No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY')

    def summarize_interactions(self, interactions, volunteer):
        """Generate summary of volunteer interactions"""

        # Prepare interaction text
        interaction_texts = []
        for i, interaction in enumerate(interactions, 1):
            date = interaction.interaction_date.strftime('%Y-%m-%d')
            topics = f"\nTopics: {', '.join(interaction.topics)}" if interaction.topics else ''
            followup = f"\nFollow-up needed: {interaction.followup_notes or 'Yes'}" if interaction.needs_followup else ''

            interaction_texts.append(
                f"Interaction {i} ({date}):\n"
                f"Discussion: {interaction.discussion_notes}{topics}{followup}"
            )

        interaction_text = '\n\n'.join(interaction_texts)

        prompt = f"""You are helping church worship arts leadership track their interactions with volunteers. Please provide a thoughtful, pastoral summary of the following volunteer interactions.

Volunteer: {volunteer.full_name}

Focus on:
1. Key themes and patterns across interactions
2. Personal life updates (family, work, life circumstances)
3. Spiritual growth and walk with Christ
4. Any concerns, prayer requests, or pastoral care needs
5. Follow-up items or action steps needed
6. Overall engagement and connection with the team

Interactions:
{interaction_text}

Please provide a warm, pastoral summary that helps leadership understand where this volunteer is at spiritually and personally, and how best to support and care for them."""

        if self.use_anthropic:
            return self._generate_with_anthropic(prompt)
        else:
            return self._generate_with_openai(prompt)


    def _generate_with_openai(self, prompt):
        """Generate summary using OpenAI"""
        try:
            import openai
            logger.info(f"OpenAI version: {openai.__version__}")

            from openai import OpenAI

            # Log what we're about to do
            logger.info("Creating OpenAI client...")

            # Create client with explicit parameters only
            client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                timeout=30.0,
            )

            logger.info("Client created successfully, making API call...")

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for church worship arts leadership."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.7
            )

            logger.info("API call successful")
            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise Exception(f"Failed to generate summary with OpenAI: {str(e)}")
        

    def _generate_with_anthropic(self, prompt):
        """Generate summary using Anthropic Claude"""
        try:
            import anthropic
            import httpx

            logger.info(f"Anthropic version: {anthropic.__version__}")
            logger.info("Creating custom HTTP client...")

            # Create a custom httpx client without proxy parameters
            http_client = httpx.Client(
                timeout=60.0,
                trust_env=False  # Don't trust environment variables for proxies
            )

            logger.info("Creating Anthropic client with custom HTTP client...")

            client = anthropic.Anthropic(
                api_key=settings.ANTHROPIC_API_KEY,
                http_client=http_client,
                max_retries=2,
            )

            logger.info("Making API call...")

            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            logger.info("API call successful")
            return message.content[0].text

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
                raise Exception(f"Failed to generate summary with Anthropic: {str(e)}")
