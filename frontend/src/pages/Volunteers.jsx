import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteersAPI } from '../services/api';
import { FiSearch, FiPhone, FiMail, FiMessageSquare } from 'react-icons/fi';
import { format } from 'date-fns';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadVolunteers();
  }, [page, search]);

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      const response = await volunteersAPI.getAll({ page, search });
      setVolunteers(response.data.results || []);
      setPagination({
        total: response.data.count,
        totalPages: Math.ceil(response.data.count / 50),
      });
    } catch (error) {
      console.error('Error loading volunteers:', error);
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (loading && volunteers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading volunteers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-gray-600 mt-1">
            {pagination?.total || 0} volunteers in your ministry
          </p>
        </div>
        <Link to="/interactions/new" className="btn-primary">
          Log Interaction
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search volunteers by name, email, or phone..."
            value={search}
            onChange={handleSearch}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(volunteers || []).map((volunteer) => (
          <Link
            key={volunteer.id}
            to={`/volunteers/${volunteer.id}`}
            className="card hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {volunteer.full_name}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  {volunteer.interaction_count > 0 && (
                    <span className="flex items-center">
                      <FiMessageSquare className="h-4 w-4 mr-1" />
                      {volunteer.interaction_count} interactions
                    </span>
                  )}
                </div>
              </div>
              {volunteer.days_since_last_interaction !== null && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  volunteer.days_since_last_interaction > 60
                    ? 'bg-red-100 text-red-700'
                    : volunteer.days_since_last_interaction > 30
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {volunteer.days_since_last_interaction}d ago
                </span>
              )}
            </div>

            <div className="space-y-2">
              {volunteer.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiMail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{volunteer.email}</span>
                </div>
              )}
              {volunteer.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiPhone className="h-4 w-4 mr-2 flex-shrink-0" />
                  {volunteer.phone}
                </div>
              )}
            </div>

            {volunteer.teams && volunteer.teams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {volunteer.teams.map((team, idx) => (
                  <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {team}
                  </span>
                ))}
              </div>
            )}

            {volunteer.last_interaction_date && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last contact: {format(new Date(volunteer.last_interaction_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {volunteers.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No volunteers found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}