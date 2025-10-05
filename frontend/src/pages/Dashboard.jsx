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
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { name: 'Total Volunteers', value: overview?.total_volunteers || 0, icon: FiUsers, color: 'bg-blue-500' },
    { name: 'Total Interactions', value: overview?.total_interactions || 0, icon: FiMessageSquare, color: 'bg-green-500' },
    { name: 'This Month', value: overview?.interactions_this_month || 0, icon: FiTrendingUp, color: 'bg-purple-500' },
    { name: 'Pending Follow-ups', value: overview?.pending_followups || 0, icon: FiClock, color: 'bg-yellow-500' },
    { name: 'Overdue', value: overview?.overdue_followups || 0, icon: FiAlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of volunteer interactions and team activity</p>
        </div>
        <div className="space-x-3">
          <button onClick={handleSync} disabled={syncing} className="btn-secondary">
            {syncing ? 'Syncing...' : 'Sync from PCO'}
          </button>
          <Link to="/interactions/new" className="btn-primary">
            New Interaction
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Interactions</p>
              <p className="text-2xl font-bold text-gray-900">{myStats.total_interactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{myStats.interactions_this_month}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{myStats.interactions_this_week}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Volunteers Contacted</p>
              <p className="text-2xl font-bold text-gray-900">{myStats.volunteers_contacted}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Interactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Interactions</h2>
            <Link to="/interactions" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentInteractions.length > 0 ? (
              recentInteractions.map((interaction) => (
                <div key={interaction.id} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{interaction.volunteer_name}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{interaction.discussion_notes}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(interaction.interaction_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent interactions</p>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Follow-ups</h2>
            <Link to="/interactions?filter=followup" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingFollowups.length > 0 ? (
              upcomingFollowups.map((followup) => (
                <div key={followup.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{followup.volunteer_name}</p>
                      <p className="text-sm text-gray-600">{followup.followup_notes}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(followup.followup_date), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming follow-ups</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}