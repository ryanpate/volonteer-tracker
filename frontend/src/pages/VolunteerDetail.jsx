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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading volunteer details...</p>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Volunteer not found</p>
        <Link to="/volunteers" className="btn-primary mt-4 inline-block">
          Back to Volunteers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-12 bg-gradient-to-b from-[#9AAF92] to-[#6B8263] rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{volunteer.full_name}</h1>
            <p className="text-gray-600 mt-1">
              {interactions.length} interaction{interactions.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <Link to={`/interactions/new?volunteer=${id}`} className="btn-primary">
          Log Interaction
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info & AI Summary */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-[#3B7EA1] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-4">
              {volunteer.email && (
                <div className="flex items-start">
                  <FiMail className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a 
                      href={`mailto:${volunteer.email}`} 
                      className="text-[#9AAF92] hover:text-[#6B8263] font-medium break-all"
                    >
                      {volunteer.email}
                    </a>
                  </div>
                </div>
              )}
              {volunteer.phone && (
                <div className="flex items-start">
                  <FiPhone className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <a 
                      href={`tel:${volunteer.phone}`} 
                      className="text-[#9AAF92] hover:text-[#6B8263] font-medium"
                    >
                      {volunteer.phone}
                    </a>
                  </div>
                </div>
              )}
              {volunteer.address && (
                <div className="flex items-start">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900">{volunteer.address}</p>
                  </div>
                </div>
              )}
              {volunteer.teams && volunteer.teams.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Teams</p>
                  <div className="flex flex-wrap gap-2">
                    {volunteer.teams.map((team, idx) => (
                      <span key={idx} className="badge badge-teal">
                        {team}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Summary */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-[#B25667] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
            </div>
            {summary ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
                <button
                  onClick={loadAISummary}
                  disabled={loadingSummary}
                  className="btn-secondary mt-4 text-sm"
                >
                  Regenerate Summary
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 mb-4">
                  Generate an AI-powered summary of all interactions with this volunteer
                </p>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#2A8B88] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Interaction History</h2>
            </div>
            {interactions.length > 0 ? (
              <div className="space-y-6">
                {(interactions || []).map((interaction) => (
                  <div key={interaction.id} className="interaction-item">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {format(new Date(interaction.interaction_date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-600">
                          by {interaction.team_member_first_name} {interaction.team_member_last_name}
                        </p>
                      </div>
                      {interaction.needs_followup && !interaction.followup_completed && (
                        <span className="badge badge-gold">
                          Follow-up needed
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed mb-3">{interaction.discussion_notes}</p>
                    
                    {/* Topics */}
                    {interaction.topics && interaction.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {interaction.topics.map((topic, idx) => (
                          <span key={idx} className="badge badge-sage">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Follow-up Info */}
                    {interaction.needs_followup && interaction.followup_date && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        <FiCalendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#F0B545]" />
                        <div>
                          <span className="font-medium">Follow-up: </span>
                          {format(new Date(interaction.followup_date), 'MMM d, yyyy')}
                          {interaction.followup_notes && (
                            <span className="block mt-1 text-gray-700">{interaction.followup_notes}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FiMessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interactions recorded yet</h3>
                <p className="text-gray-500 mb-6">Start building a connection by logging your first interaction</p>
                <Link to={`/interactions/new?volunteer=${id}`} className="btn-primary inline-block">
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