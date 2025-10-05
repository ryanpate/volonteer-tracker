import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { interactionsAPI, volunteersAPI } from '../services/api';

export default function CreateInteraction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVolunteerId = searchParams.get('volunteer');

  const [formData, setFormData] = useState({
    volunteer: preselectedVolunteerId || '',
    interaction_date: new Date().toISOString().split('T')[0],
    discussion_notes: '',
    topics: '',
    needs_followup: false,
    followup_date: '',
    followup_notes: '',
  });

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadVolunteers();
  }, []);

  const loadVolunteers = async () => {
    try {
      let allVolunteers = [];
      let nextUrl = null;
      let page = 1;
      
      // Fetch all pages of volunteers
      do {
        const response = await volunteersAPI.getAll({ page, limit: 100 });
        allVolunteers = [...allVolunteers, ...(response.data.results || [])];
        nextUrl = response.data.next;
        page++;
      } while (nextUrl);
      
      setVolunteers(allVolunteers);
    } catch (error) {
      console.error('Error loading volunteers:', error);
      setVolunteers([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const dataToSubmit = {
        ...formData,
        topics: formData.topics ? formData.topics.split(',').map(t => t.trim()) : [],
      };

      await interactionsAPI.create(dataToSubmit);
      navigate(`/volunteers/${formData.volunteer}`);
    } catch (error) {
      console.error('Error creating interaction:', error);
      setErrors(error.response?.data || { general: 'Failed to create interaction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header with accent bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-10 bg-gradient-to-b from-[#9AAF92] to-[#6B8263] rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log New Interaction</h1>
          <p className="text-sm text-gray-600 mt-1">Record a conversation with a volunteer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {errors.general && (
          <div className="alert alert-error">
            {errors.general}
          </div>
        )}

        {/* Volunteer */}
        <div>
          <label className="label">Volunteer *</label>
          <select 
            name="volunteer" 
            value={formData.volunteer} 
            onChange={handleChange} 
            className="input" 
            required
          >
            <option value="">Select a volunteer...</option>
            {(volunteers || []).map(v => (
              <option key={v.id} value={v.id}>{v.full_name}</option>
            ))}
          </select>
          {errors.volunteer && (
            <p className="text-[#C55A5A] text-sm mt-1">{errors.volunteer}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="label">Interaction Date *</label>
          <input 
            type="date" 
            name="interaction_date" 
            value={formData.interaction_date} 
            onChange={handleChange} 
            className="input" 
            required 
          />
        </div>

        {/* Discussion Notes */}
        <div>
          <label className="label">Discussion Notes *</label>
          <textarea 
            name="discussion_notes" 
            value={formData.discussion_notes} 
            onChange={handleChange} 
            rows="6" 
            className="input" 
            required 
            placeholder="Describe your conversation with the volunteer..."
          ></textarea>
          {errors.discussion_notes && (
            <p className="text-[#C55A5A] text-sm mt-1">{errors.discussion_notes}</p>
          )}
        </div>

        {/* Topics */}
        <div>
          <label className="label">Topics (comma-separated)</label>
          <input 
            type="text" 
            name="topics" 
            value={formData.topics} 
            onChange={handleChange} 
            className="input" 
            placeholder="family, spiritual growth, serving" 
          />
          <p className="text-sm text-gray-500 mt-1">Separate topics with commas</p>
        </div>

        {/* Follow-up Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              id="needs_followup" 
              name="needs_followup" 
              checked={formData.needs_followup} 
              onChange={handleChange} 
              className="h-4 w-4 rounded border-gray-300 text-[#9AAF92] focus:ring-[#9AAF92]" 
            />
            <label htmlFor="needs_followup" className="ml-2 text-gray-700 font-medium">
              Needs Follow-up
            </label>
          </div>

          {formData.needs_followup && (
            <div className="space-y-4 pl-6 border-l-4 border-[#F0B545] bg-[#FEF3D9] bg-opacity-20 rounded-r-lg p-4">
              <div>
                <label className="label">Follow-up Date *</label>
                <input 
                  type="date" 
                  name="followup_date" 
                  value={formData.followup_date} 
                  onChange={handleChange} 
                  className="input" 
                  required={formData.needs_followup} 
                />
              </div>
              <div>
                <label className="label">Follow-up Notes</label>
                <textarea 
                  name="followup_notes" 
                  value={formData.followup_notes} 
                  onChange={handleChange} 
                  rows="3" 
                  className="input" 
                  placeholder="What needs to be followed up on?"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Interaction'
            )}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}