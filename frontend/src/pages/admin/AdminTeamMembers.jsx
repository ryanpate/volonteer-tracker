import { useState, useEffect } from 'react';
import { teamAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiUserX, FiKey } from 'react-icons/fi';

export default function AdminTeamMembers() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'member',
    is_active: true,
    password: '',
    password_confirm: '',
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await teamAPI.getAll();
      setTeamMembers(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      alert('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        username: member.username,
        email: member.email || '',
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        role: member.role || 'member',
        is_active: member.is_active,
        password: '',
        password_confirm: '',
      });
    } else {
      setEditingMember(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'member',
        is_active: true,
        password: '',
        password_confirm: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'member',
      is_active: true,
      password: '',
      password_confirm: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      
      // Check if passwords match when creating a new user
      if (!editingMember && dataToSend.password !== dataToSend.password_confirm) {
        alert('Passwords do not match!');
        return;
      }
      
      // Don't send password fields if it's empty during edit
      if (editingMember && !dataToSend.password) {
        delete dataToSend.password;
        delete dataToSend.password_confirm;
      }
      
      console.log('Submitting data:', dataToSend);
      
      if (editingMember) {
        await teamAPI.update(editingMember.id, dataToSend);
        alert('Team member updated successfully');
      } else {
        await teamAPI.create(dataToSend);
        alert('Team member created successfully');
      }
      handleCloseModal();
      loadTeamMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request data:', error.config?.data);
      
      const errorMessage = error.response?.data?.detail 
        || JSON.stringify(error.response?.data)
        || error.message;
      alert('Failed to save team member: ' + errorMessage);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      if (member.is_active) {
        await teamAPI.deactivate(member.id);
      } else {
        await teamAPI.activate(member.id);
      }
      loadTeamMembers();
    } catch (error) {
      console.error('Error toggling member status:', error);
      alert('Failed to update member status');
    }
  };

  const handleDelete = async (member) => {
    if (!confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await teamAPI.delete(member.id);
      alert('Team member deleted successfully');
      loadTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-gradient-to-b from-[#3B7EA1] to-[#2B5E7A] rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-1">{teamMembers.length} team members</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center">
          <FiPlus className="mr-2" />
          Add Team Member
        </button>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div key={member.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.first_name} {member.last_name}
                </h3>
                <p className="text-sm text-gray-600">@{member.username}</p>
              </div>
              <span className={`badge ${member.is_active ? 'badge-teal' : 'badge-rose'}`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {member.email && (
              <p className="text-sm text-gray-600 mb-2">{member.email}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className="badge badge-sage capitalize">{member.role || 'member'}</span>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleOpenModal(member)}
                className="flex-1 text-sm py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center justify-center gap-2"
              >
                <FiEdit2 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(member)}
                className={`flex-1 text-sm py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 ${
                  member.is_active
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                {member.is_active ? <FiUserX className="h-4 w-4" /> : <FiUserCheck className="h-4 w-4" />}
                {member.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(member)}
                className="text-sm py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No team members found</p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Add First Team Member
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Last Name *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                    required
                    disabled={!!editingMember}
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                {!editingMember && (
                  <>
                    <div>
                      <label className="label">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        required={!editingMember}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="label">Confirm Password *</label>
                      <input
                        type="password"
                        value={formData.password_confirm}
                        onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                        className="input"
                        required={!editingMember}
                        placeholder="Confirm password"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="leader">Leader</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#9AAF92] focus:ring-[#9AAF92]"
                  />
                  <label htmlFor="is_active" className="ml-2 text-gray-700 font-medium">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingMember ? 'Update' : 'Create'} Team Member
                  </button>
                  <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}