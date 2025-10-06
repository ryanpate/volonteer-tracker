import { useState, useEffect } from 'react';
import { interactionsAPI, volunteersAPI } from '../../services/api';
import { FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';

export default function AdminInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState(null);
  const [formData, setFormData] = useState({
    volunteer: '',
    interaction_date: new Date().toISOString().split('T')[0],
    discussion_notes: '',
    topics: '',
    needs_followup: false,
    followup_date: '',
    followup_notes: '',
    followup_completed: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [interactionsRes, volunteersRes] = await Promise.all([
        interactionsAPI.getAll(),
        volunteersAPI.getAll({ limit: 1000 }),
      ]);
      
      setInteractions(interactionsRes.data.results || interactionsRes.data || []);
      
      // Collect all volunteers from all pages
      let allVolunteers = volunteersRes.data.results || volunteersRes.data || [];
      setVolunteers(allVolunteers);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (interaction = null) => {
    if (interaction) {
      setEditingInteraction(interaction);
      setFormData({
        volunteer: interaction.volunteer,
        interaction_date: interaction.interaction_date,
        discussion_notes: interaction.discussion_notes,
        topics: Array.isArray(interaction.topics) ? interaction.topics.join(', ') : '',
        needs_followup: interaction.needs_followup || false,
        followup_date: interaction.followup_date || '',
        followup_notes: interaction.followup_notes || '',
        followup_completed: interaction.followup_completed || false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInteraction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        topics: formData.topics ? formData.topics.split(',').map(t => t.trim()) : [],
      };

      // If needs_followup is false, remove followup fields
      if (!dataToSubmit.needs_followup) {
        delete dataToSubmit.followup_date;
        delete dataToSubmit.followup_notes;
        delete dataToSubmit.followup_completed;
      } else {
        // If needs_followup is true but fields are empty, send null instead of empty string
        if (!dataToSubmit.followup_date) {
          dataToSubmit.followup_date = null;
        }
        if (!dataToSubmit.followup_notes) {
          dataToSubmit.followup_notes = '';
        }
      }

      if (editingInteraction) {
        await interactionsAPI.update(editingInteraction.id, dataToSubmit);
        alert('Interaction updated successfully');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error saving interaction:', error);
      console.error('Response data:', error.response?.data);
      alert('Failed to save interaction: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message));
    }
  };

  const handleDelete = async (interaction) => {
    if (!confirm(`Are you sure you want to delete this interaction? This action cannot be undone.`)) {
      return;
    }
    try {
      await interactionsAPI.delete(interaction.id);
      alert('Interaction deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting interaction:', error);
      alert('Failed to delete interaction');
    }
  };

  const filteredInteractions = interactions.filter(interaction =>
    interaction.volunteer_name?.toLowerCase().includes(search.toLowerCase()) ||
    interaction.discussion_notes?.toLowerCase().includes(search.toLowerCase()) ||
    interaction.team_member_name?.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-gradient-to-b from-[#2A8B88] to-[#1A6B68] rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Interactions</h1>
          <p className="text-gray-600 mt-1">{interactions.length} total interactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search interactions by volunteer, notes, or team member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Interactions List */}
      <div className="space-y-4">
        {filteredInteractions.map((interaction) => (
          <div key={interaction.id} className="card">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interaction.volunteer_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(interaction.interaction_date), 'MMMM d, yyyy')} • by {interaction.team_member_name}
                    </p>
                  </div>
                  {interaction.needs_followup && !interaction.followup_completed && (
                    <span className="badge badge-gold">Follow-up</span>
                  )}
                </div>
                <p className="text-gray-700 mt-2">{interaction.discussion_notes}</p>
                {interaction.topics && interaction.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interaction.topics.map((topic, idx) => (
                      <span key={idx} className="badge badge-sage">{topic}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={() => handleOpenModal(interaction)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <FiEdit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(interaction)}
                  className="text-sm py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors flex items-center gap-2"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredInteractions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No interactions found</p>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Interaction</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Volunteer *</label>
                  <select
                    value={formData.volunteer}
                    onChange={(e) => setFormData({ ...formData, volunteer: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select volunteer...</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>{v.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    value={formData.interaction_date}
                    onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Discussion Notes *</label>
                  <textarea
                    value={formData.discussion_notes}
                    onChange={(e) => setFormData({ ...formData, discussion_notes: e.target.value })}
                    rows="6"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Topics (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.topics}
                    onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                    className="input"
                    placeholder="family, spiritual growth, serving"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="needs_followup"
                      checked={formData.needs_followup}
                      onChange={(e) => setFormData({ ...formData, needs_followup: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-[#9AAF92] focus:ring-[#9AAF92]"
                    />
                    <label htmlFor="needs_followup" className="ml-2 text-gray-700 font-medium">
                      Needs Follow-up
                    </label>
                  </div>

                  {formData.needs_followup && (
                    <div className="space-y-4 pl-6 border-l-4 border-[#F0B545] bg-[#FEF3D9] bg-opacity-20 rounded-r-lg p-4">
                      <div>
                        <label className="label">Follow-up Date (optional)</label>
                        <input
                          type="date"
                          value={formData.followup_date}
                          onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Follow-up Notes (optional)</label>
                        <textarea
                          value={formData.followup_notes}
                          onChange={(e) => setFormData({ ...formData, followup_notes: e.target.value })}
                          rows="3"
                          className="input"
                          placeholder="Optional notes about the follow-up needed..."
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="followup_completed"
                          checked={formData.followup_completed}
                          onChange={(e) => setFormData({ ...formData, followup_completed: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-[#2A8B88] focus:ring-[#2A8B88]"
                        />
                        <label htmlFor="followup_completed" className="ml-2 text-gray-700 font-medium">
                          Follow-up Completed
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Interaction
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