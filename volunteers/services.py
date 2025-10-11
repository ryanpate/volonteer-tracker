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
        """Sync all volunteers from PCO Services and capture their status"""
        results = {
            'synced': 0,
            'updated': 0,
            'archived': 0,
            'errors': []
        }

        try:
            logger.info('Starting PCO volunteer sync...')

            all_people = []
            # Fetch all people (both active and archived) so we can update status
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

                            # Track archived count
                            if person_data.get('is_archived'):
                                results['archived'] += 1

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

            logger.info(
                f"Fetched {len(all_people)} people from PCO ({results['archived']} archived)")

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
                            'status': person_data.get('status', 'active'),
                            'is_archived': person_data.get('is_archived', False),
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
                f"Sync complete: {results['synced']} new, {results['updated']} updated, "
                f"{results['archived']} archived, {len(results['errors'])} errors"
            )
            return results

        except Exception as e:
            logger.error(f"Critical error during sync: {e}")
            results['errors'].append({
                'error': 'Critical sync failure',
                'message': str(e)
            })
            return results

    def _extract_person_data(self, person, included):
        """Extract person data from PCO response including status"""
        attributes = person.get('attributes', {})
        relationships = person.get('relationships', {})

        # Get status - PCO may use 'status' or 'archived' attribute
        status = attributes.get('status', 'active')
        archived = attributes.get('archived', False)

        # Determine if archived
        is_archived = (
            status and status.lower() == 'archived' or
            archived is True
        )

        # Basic info
        person_data = {
            'pco_person_id': person['id'],
            'first_name': attributes.get('first_name', ''),
            'last_name': attributes.get('last_name', ''),
            'status': 'archived' if is_archived else 'active',
            'is_archived': is_archived,
        }

        # Extract email from included data
        emails_data = relationships.get('emails', {}).get('data', [])
        if emails_data:
            email_id = emails_data[0]['id']
            email_obj = next(
                (item for item in included if item['type']
                 == 'Email' and item['id'] == email_id),
                None
            )
            if email_obj:
                person_data['email'] = email_obj.get(
                    'attributes', {}).get('address')

        # Extract phone from included data
        phone_data = relationships.get('phone_numbers', {}).get('data', [])
        if phone_data:
            phone_id = phone_data[0]['id']
            phone_obj = next(
                (item for item in included if item['type'] ==
                 'PhoneNumber' and item['id'] == phone_id),
                None
            )
            if phone_obj:
                person_data['phone'] = phone_obj.get(
                    'attributes', {}).get('number')

        # Extract address from included data
        address_data = relationships.get('addresses', {}).get('data', [])
        if address_data:
            address_id = address_data[0]['id']
            address_obj = next(
                (item for item in included if item['type']
                 == 'Address' and item['id'] == address_id),
                None
            )
            if address_obj:
                addr_attrs = address_obj.get('attributes', {})
                address_parts = [
                    addr_attrs.get('street'),
                    addr_attrs.get('city'),
                    addr_attrs.get('state'),
                    addr_attrs.get('zip')
                ]
                person_data['address'] = ', '.join(filter(None, address_parts))

        return person_data

    def fetch_person_teams(self, pco_person_id):
        """Fetch team assignments for a specific person"""
        try:
            url = f'{self.base_url}/services/v2/people/{pco_person_id}/team_memberships?include=team'
            response = requests.get(url, auth=self.auth)
            response.raise_for_status()
            data = response.json()

            teams = []
            included = data.get('included', [])

            for membership in data.get('data', []):
                team_rel = membership.get('relationships', {}).get(
                    'team', {}).get('data')
                if team_rel:
                    team_id = team_rel['id']
                    team_obj = next(
                        (item for item in included if item['type']
                         == 'Team' and item['id'] == team_id),
                        None
                    )
                    if team_obj:
                        team_name = team_obj.get('attributes', {}).get('name')
                        if team_name:
                            teams.append(team_name)

            return teams
        except Exception as e:
            logger.error(
                f"Error fetching teams for person {pco_person_id}: {e}")
            return []

    def test_connection(self):
        """Test connection to PCO API"""
        try:
            url = f'{self.base_url}/services/v2/people?per_page=1'
            response = requests.get(url, auth=self.auth)
            response.raise_for_status()

            data = response.json()
            people_count = data.get('meta', {}).get('total_count', 0)

            return {
                'success': True,
                'message': 'PCO connection successful',
                'people_count': people_count
            }
        except requests.RequestException as e:
            return {
                'success': False,
                'message': 'PCO connection failed',
                'error': str(e)
            }


class LLMService:
    """Service for LLM-based summarization"""

    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.use_anthropic = bool(self.anthropic_key)

    def summarize_interactions(self, interactions, volunteer):
        """Generate a summary of volunteer interactions"""
        if not self.openai_key and not self.anthropic_key:
            return "AI summarization is not available. Please configure an API key."

        # Build context from interactions
        interaction_texts = []
        for interaction in interactions:
            date = interaction.interaction_date.strftime('%Y-%m-%d')
            text = f"[{date}] {interaction.discussion_notes}"
            if interaction.topics:
                text += f" Topics: {', '.join(interaction.topics)}"
            interaction_texts.append(text)

        context = "\n\n".join(interaction_texts)

        prompt = f"""Please provide a concise summary of the following interactions with {volunteer.full_name}. 
Focus on:
- Key themes and topics discussed
- Volunteer's interests and involvement
- Any patterns or progression over time
- Important follow-up items or concerns

Interactions:
{context}

Provide a brief, well-organized summary (2-3 paragraphs max)."""

        try:
            if self.use_anthropic:
                return self._summarize_with_anthropic(prompt)
            else:
                return self._summarize_with_openai(prompt)
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"Failed to generate summary: {str(e)}"

    def _summarize_with_openai(self, prompt):
        """Use OpenAI to generate summary"""
        import openai
        openai.api_key = self.openai_key

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes volunteer interactions for church ministry leaders."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )

        return response.choices[0].message.content

    def _summarize_with_anthropic(self, prompt):
        """Use Anthropic Claude to generate summary"""
        import anthropic
        import httpx

        # Create httpx client without proxy auto-detection
        # This prevents the 'proxies' error in containerized environments
        http_client = httpx.Client(
            proxies=None,  # Explicitly disable proxies
            timeout=60.0
        )

        try:
            client = anthropic.Anthropic(
                api_key=self.anthropic_key,
                http_client=http_client
            )

            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=500,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return message.content[0].text
        finally:
            # Clean up the http client
            http_client.close()
