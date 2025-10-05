import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interactionsAPI } from '../services/api';
import { format } from 'date-fns';
import { FiPlus, FiMessageSquare } from 'react-icons/fi';

export default function Interactions() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    try {
      const response = await interactionsAPI.getAll();
      // Django REST Framework returns paginated data in 'results'
      // Handle both paginated and non-paginated responses
      const interactionsData = response.data.results || response.data.interactions || response.data || [];
      setInteractions(interactionsData);
    } catch (error) {
      console.error('Error loading interactions:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with accent bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-gradient-to-b from-[#2A8B88] to-[#1A6B68] rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Interactions</h1>
            <p className="text-gray-600 mt-1">{interactions.length} total interactions</p>
          </div>
        </div>
        <Link to="/interactions/new" className="btn-primary flex items-center">
          <FiPlus className="mr-2" />
          New Interaction
        </Link>
      </div>

      <div className="space-y-4">
        {(interactions || []).map(interaction => (
          <div key={interaction.id} className="interaction-item">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <Link 
                  to={`/volunteers/${interaction.volunteer}`} 
                  className="font-semibold text-[#9AAF92] hover:text-[#6B8263] transition-colors text-lg"
                >
                  {interaction.volunteer_name}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(interaction.interaction_date), 'MMMM d, yyyy')} • by {interaction.team_member_name}
                </p>
                <p className="text-gray-700 mt-2 leading-relaxed">{interaction.discussion_notes}</p>
                
                {/* Topics */}
                {interaction.topics && interaction.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {interaction.topics.map((topic, idx) => (
                      <span key={idx} className="badge badge-sage">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {interactions.length === 0 && !loading && (
        <div className="text-center py-16">
          <FiMessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interactions yet</h3>
          <p className="text-gray-500 mb-6">Get started by logging your first volunteer interaction</p>
          <Link to="/interactions/new" className="btn-primary inline-flex items-center">
            <FiPlus className="mr-2" />
            Log First Interaction
          </Link>
        </div>
      )}
    </div>
  );
}