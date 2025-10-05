import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { volunteersAPI } from '../services/api';
import { FiMail, FiPhone, FiMapPin, FiMessageSquare, FiCalendar, FiLoader } from 'react-icons/fi';
import { format } from 'date-fns';

export default function VolunteerDetail() {
  const { id } = useParams();
  const [volunteer, setVolunteer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadVolunteerData();
  }, [id]);

  const loadVolunteerData = async () => {
    try {
      const response = await volunteersAPI.getHistory(id);
      setVolunteer(response.data.volunteer);
      setInteractions(response.data.interactions || []);
      
      // Fetch teams on-demand if not already loaded
      if (!response.data.volunteer.teams || response.data.volunteer.teams.length === 0) {
        fetchTeams();
      }
    } catch (error) {
      console.error('Error loading volunteer:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await volunteersAPI.getTeams(id);
      setVolunteer(prev => ({
        ...prev,
        teams: response.data.teams || []
      }));
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadAISummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await volunteersAPI.getSummary(id);
      setSummary(response.data.summary);
    } catch (error) {
      alert('Failed to generate summary: ' + error.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!volunteer) {
    return <div className="text-center py-12">
      <p className="text-gray-500">Volunteer not found</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{volunteer.full_name}</h1>
          <p className="text-gray-600 mt-1">{interactions.length} interactions recorded</p>
        </div>
        <Link to={`/interactions/new?volunteer=${id}`} className="btn-primary">
          Log Interaction
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              {volunteer.email && (
                <div className="flex items-start">
                  <FiMail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${volunteer.email}`} className="text-primary-600 hover:text-primary-700">
                      {volunteer.email}
                    </a>
                  </div>
                </div>
              )}
              {volunteer.phone && (
                <div className="flex items-start">
                  <FiPhone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${volunteer.phone}`} className="text-primary-600 hover:text-primary-700">
                      {volunteer.phone}
                    </a>
                  </div>
                </div>
              )}
              {volunteer.address && (
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-gray-900">{volunteer.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">AI Summary</h2>
            {summary ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <button
                  onClick={loadAISummary}
                  disabled={loadingSummary}
                  className="btn-primary"
                >
                  {loadingSummary ? (
                    <>
                      <FiLoader className="animate-spin inline mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate AI Summary'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Interaction History */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Interaction History</h2>
            {interactions.length > 0 ? (
              <div className="space-y-6">
                {(interactions || []).map((interaction) => (
                  <div key={interaction.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(interaction.interaction_date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          by {interaction.team_member_first_name} {interaction.team_member_last_name}
                        </p>
                      </div>
                      {interaction.needs_followup && !interaction.followup_completed && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Follow-up needed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{interaction.discussion_notes}</p>
                    {interaction.topics && interaction.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {interaction.topics.map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    {interaction.needs_followup && interaction.followup_date && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <FiCalendar className="h-4 w-4 mr-1" />
                        Follow-up: {format(new Date(interaction.followup_date), 'MMM d, yyyy')}
                        {interaction.followup_notes && ` - ${interaction.followup_notes}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No interactions recorded yet</p>
                <Link to={`/interactions/new?volunteer=${id}`} className="btn-primary mt-4 inline-block">
                  Log First Interaction
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}