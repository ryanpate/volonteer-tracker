import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteersAPI } from '../services/api';
import { FiSearch, FiPhone, FiMail, FiMessageSquare, FiUsers, FiEye, FiEyeOff } from 'react-icons/fi';
import { format } from 'date-fns';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showArchived, setShowArchived] = useState(false); // NEW: Toggle for archived

  useEffect(() => {
    loadVolunteers();
  }, [page, search, showArchived]); // NEW: Reload when showArchived changes

  const loadVolunteers = async () => {
    setLoading(true);
    try {
      // NEW: Pass showArchived parameter to API
      const response = await volunteersAPI.getAll({ 
        page, 
        search,
        show_archived: showArchived 
      });
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
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading volunteers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with accent bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-gradient-to-b from-[#3B7EA1] to-[#2B5E7A] rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volunteers</h1>
            <p className="text-gray-600 mt-1">
              {pagination?.total || 0} volunteer{pagination?.total !== 1 ? 's' : ''} 
              {showArchived ? ' (including archived)' : ' (active only)'}
            </p>
          </div>
        </div>
        <Link to="/interactions/new" className="btn-primary">
          Log Interaction
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search volunteers by name, email, or phone..."
              value={search}
              onChange={handleSearch}
              className="input"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          
          {/* NEW: Show Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`btn-secondary flex items-center gap-2 whitespace-nowrap ${
              showArchived ? 'bg-gray-300' : ''
            }`}
          >
            {showArchived ? (
              <>
                <FiEyeOff className="h-4 w-4" />
                Hide Archived
              </>
            ) : (
              <>
                <FiEye className="h-4 w-4" />
                Show Archived
              </>
            )}
          </button>
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(volunteers || []).map((volunteer) => (
          <Link
            key={volunteer.id}
            to={`/volunteers/${volunteer.id}`}
            className={`card hover:shadow-lg transition-all duration-200 cursor-pointer group ${
              volunteer.is_archived ? 'opacity-60 border-2 border-gray-300' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#9AAF92] transition-colors">
                    {volunteer.full_name}
                  </h3>
                  {/* NEW: Archived Badge */}
                  {volunteer.is_archived && (
                    <span className="badge badge-rose text-xs">
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  {volunteer.interaction_count > 0 && (
                    <span className="flex items-center">
                      <FiMessageSquare className="h-4 w-4 mr-1" />
                      {volunteer.interaction_count} interaction{volunteer.interaction_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              {volunteer.days_since_last_interaction !== null && (
                <span className={`badge ${
                  volunteer.days_since_last_interaction > 60
                    ? 'badge-rose'
                    : volunteer.days_since_last_interaction > 30
                    ? 'badge-gold'
                    : 'badge-teal'
                }`}>
                  {volunteer.days_since_last_interaction}d ago
                </span>
              )}
            </div>

            <div className="space-y-2">
              {volunteer.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiMail className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{volunteer.email}</span>
                </div>
              )}
              {volunteer.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiPhone className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                  {volunteer.phone}
                </div>
              )}
            </div>

            {volunteer.teams && volunteer.teams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                {volunteer.teams.slice(0, 3).map((team, idx) => (
                  <span key={idx} className="badge badge-blue">
                    {team}
                  </span>
                ))}
                {volunteer.teams.length > 3 && (
                  <span className="text-xs text-gray-500 self-center">
                    +{volunteer.teams.length - 3} more
                  </span>
                )}
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
        <div className="text-center py-16">
          <FiUsers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No volunteers found</h3>
          <p className="text-gray-500 mb-6">
            {search 
              ? 'Try adjusting your search terms'
              : 'Sync from Planning Center to get started'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-gray-700 font-medium">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}