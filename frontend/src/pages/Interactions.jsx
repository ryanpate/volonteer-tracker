import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interactionsAPI } from '../services/api';
import { format } from 'date-fns';
import { FiPlus } from 'react-icons/fi';

export default function Interactions() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    try {
      const response = await interactionsAPI.getAll();
      setInteractions(response.data.interactions || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Interactions</h1>
        <Link to="/interactions/new" className="btn-primary flex items-center">
          <FiPlus className="mr-2" />
          New Interaction
        </Link>
      </div>

      <div className="space-y-4">
        {(interactions || []).map(interaction => (
          <div key={interaction.id} className="card">
            <div className="flex justify-between">
              <div className="flex-1">
                <Link to={`/volunteers/${interaction.volunteer}`} className="font-semibold text-primary-600 hover:text-primary-700">
                  {interaction.volunteer_name}
                </Link>
                <p className="text-sm text-gray-600">
                  {format(new Date(interaction.interaction_date), 'MMM d, yyyy')} by {interaction.team_member_name}
                </p>
                <p className="text-gray-700 mt-2">{interaction.discussion_notes}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {interactions.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No interactions found</p>
        </div>
      )}
    </div>
  );
}