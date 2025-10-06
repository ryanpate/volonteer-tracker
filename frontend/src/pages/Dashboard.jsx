import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, volunteersAPI } from '../services/api';
import { FiUsers, FiMessageSquare, FiAlertCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { format } from 'date-fns';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewRes, myStatsRes, recentRes, followupsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getMyStats(),
        dashboardAPI.getRecentInteractions(5),
        dashboardAPI.getUpcomingFollowups(7),
      ]);

      setOverview(overviewRes.data.overview);
      setMyStats(myStatsRes.data.my_stats);
      setRecentInteractions(recentRes.data.recent_interactions);
      setUpcomingFollowups(followupsRes.data.upcoming_followups);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await volunteersAPI.sync();
      alert('Volunteers synced successfully!');
      loadDashboardData();
    } catch (error) {
      alert('Sync failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
      { 
        name: 'Total Volunteers', 
        value: overview?.total_volunteers || 0, 
        icon: FiUsers, 
        color: 'bg-[#3B7EA1]',
        accentClass: 'accent-blue',
        link: '/volunteers'
      },
      { 
        name: 'Total Interactions', 
        value: overview?.total_interactions || 0, 
        icon: FiMessageSquare, 
        color: 'bg-[#2A8B88]',
        accentClass: 'accent-teal',
        link: '/interactions'
      },
      { 
        name: 'This Month', 
        value: overview?.interactions_this_month || 0, 
        icon: FiTrendingUp, 
        color: 'bg-[#B25667]',
        accentClass: 'accent-rose',
        link: '/interactions?filter=this-month'
      },
      { 
        name: 'Pending Follow-ups', 
        value: overview?.pending_followups || 0, 
        icon: FiClock, 
        color: 'bg-[#F0B545]',
        accentClass: 'accent-gold',
        link: '/interactions?filter=followup'
      },
      { 
        name: 'Overdue', 
        value: overview?.overdue_followups || 0, 
        icon: FiAlertCircle, 
        color: 'bg-[#C55A5A]',
        accentClass: 'accent-rose',
        link: '/interactions?filter=overdue'
      },
    ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of volunteer interactions and team activity</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSync} disabled={syncing} className="btn-secondary">
            {syncing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
              </span>
            ) : (
              'Sync from PCO'
            )}
          </button>
          <Link to="/interactions/new" className="btn-primary">
            New Interaction
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className={`stat-card ${stat.accentClass}`}>
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg shadow-sm`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Stats */}
      {myStats && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-[#9AAF92] to-[#6B8263] rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Your Activity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">Total Interactions</p>
              <p className="text-3xl font-bold text-[#9AAF92]">{myStats.total_interactions}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-3xl font-bold text-[#2A8B88]">{myStats.interactions_this_month}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">This Week</p>
              <p className="text-3xl font-bold text-[#B25667]">{myStats.interactions_this_week}</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600 mb-1">Volunteers Contacted</p>
              <p className="text-3xl font-bold text-[#3B7EA1]">{myStats.volunteers_contacted}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Interactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#9AAF92] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Interactions</h2>
            </div>
            <Link to="/interactions" className="text-sm text-[#9AAF92] hover:text-[#6B8263] font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentInteractions.length > 0 ? (
              recentInteractions.map((interaction) => (
                <div key={interaction.id} className="interaction-item">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{interaction.volunteer_name}</p>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{interaction.discussion_notes}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {format(new Date(interaction.interaction_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiMessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent interactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#F0B545] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Follow-ups</h2>
            </div>
            <Link to="/interactions?filter=followup" className="text-sm text-[#9AAF92] hover:text-[#6B8263] font-medium">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingFollowups.length > 0 ? (
              upcomingFollowups.map((followup) => (
                <div key={followup.id} className="border-l-4 border-[#F0B545] pl-4 py-2 bg-[#FEF3D9] bg-opacity-30 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{followup.volunteer_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{followup.followup_notes}</p>
                    </div>
                    <span className="text-xs font-medium text-[#9A6B1E] ml-4 whitespace-nowrap">
                      {format(new Date(followup.followup_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiClock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming follow-ups</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}