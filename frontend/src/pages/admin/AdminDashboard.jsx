import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiMessageSquare, FiSettings, FiActivity, FiShield } from 'react-icons/fi';
import { teamAPI, interactionsAPI } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTeamMembers: 0,
    activeTeamMembers: 0,
    totalInteractions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [teamResponse, interactionsResponse] = await Promise.all([
        teamAPI.getAll(),
        interactionsAPI.getAll(),
      ]);

      const teamMembers = teamResponse.data.results || teamResponse.data || [];
      const interactions = interactionsResponse.data.results || interactionsResponse.data || [];
      
      setStats({
        totalTeamMembers: teamMembers.length,
        activeTeamMembers: teamMembers.filter(m => m.is_active).length,
        totalInteractions: interactions.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Team Members',
      description: 'Manage team member accounts and permissions',
      icon: FiUsers,
      color: 'bg-[#3B7EA1]',
      link: '/admin/team-members',
      stats: `${stats.activeTeamMembers} active / ${stats.totalTeamMembers} total`,
    },
    {
      title: 'Interactions',
      description: 'Edit and manage volunteer interactions',
      icon: FiMessageSquare,
      color: 'bg-[#2A8B88]',
      link: '/admin/interactions',
      stats: `${stats.totalInteractions} total`,
    },
    {
      title: 'Settings',
      description: 'Configure categories, topics, and system settings',
      icon: FiSettings,
      color: 'bg-[#B25667]',
      link: '/admin/settings',
      stats: 'Categories, Topics, More',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-12 bg-gradient-to-b from-[#B25667] to-[#8B3A47] rounded-full"></div>
        <div>
          <div className="flex items-center gap-3">
            <FiShield className="h-8 w-8 text-[#B25667]" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 mt-1">Manage team members, data, and system settings</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card accent-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Team Members</p>
              <p className="text-3xl font-bold text-[#3B7EA1]">{stats.totalTeamMembers}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeTeamMembers} active</p>
            </div>
            <FiUsers className="h-12 w-12 text-[#3B7EA1] opacity-20" />
          </div>
        </div>

        <div className="stat-card accent-teal">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Interactions</p>
              <p className="text-3xl font-bold text-[#2A8B88]">{stats.totalInteractions}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <FiMessageSquare className="h-12 w-12 text-[#2A8B88] opacity-20" />
          </div>
        </div>

        <div className="stat-card accent-rose">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">System Status</p>
              <p className="text-2xl font-bold text-[#2A8B88]">Operational</p>
              <p className="text-xs text-gray-500 mt-1">All systems running</p>
            </div>
            <FiActivity className="h-12 w-12 text-[#2A8B88] opacity-20" />
          </div>
        </div>
      </div>

      {/* Admin Sections */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link
              key={section.title}
              to={section.link}
              className="card hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className={`${section.color} p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#9AAF92] transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{section.stats}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="alert alert-warning">
        <div className="flex items-start gap-3">
          <FiShield className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Administrator Access</p>
            <p className="text-sm">
              You have full access to modify team members, interactions, and system settings. 
              Changes made here will affect all users. Please use caution when making modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}