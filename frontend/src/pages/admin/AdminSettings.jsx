import { useState } from 'react';
import { FiTag, FiFolder, FiSave, FiPlus, FiX } from 'react-icons/fi';

export default function AdminSettings() {
  const [topics, setTopics] = useState([
    'Family',
    'Spiritual Growth',
    'Serving',
    'Prayer',
    'Worship',
    'Community',
    'Ministry',
    'Personal Development',
  ]);
  const [categories, setCategories] = useState([
    'General Check-in',
    'Ministry Opportunity',
    'Pastoral Care',
    'Team Building',
    'Training',
    'Feedback',
  ]);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [saved, setSaved] = useState(false);

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeTopic = (topic) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (category) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleSave = () => {
    // In a real implementation, you would save to the backend
    localStorage.setItem('volunteer_topics', JSON.stringify(topics));
    localStorage.setItem('volunteer_categories', JSON.stringify(categories));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-gradient-to-b from-[#B25667] to-[#8B3A47] rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage categories, topics, and system settings</p>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success">
          Settings saved successfully!
        </div>
      )}

      {/* Topics */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#9AAF92] rounded-full"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
            <p className="text-sm text-gray-600">Common topics for volunteer interactions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTopic()}
              placeholder="Add new topic..."
              className="input flex-1"
            />
            <button onClick={addTopic} className="btn-primary flex items-center gap-2">
              <FiPlus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <div key={index} className="badge badge-sage flex items-center gap-2 text-sm py-2 px-3">
                <FiTag className="h-3 w-3" />
                {topic}
                <button
                  onClick={() => removeTopic(topic)}
                  className="ml-1 hover:text-red-700 transition-colors"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {topics.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No topics added yet</p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#3B7EA1] rounded-full"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Interaction Categories</h2>
            <p className="text-sm text-gray-600">Types of interactions with volunteers</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Add new category..."
              className="input flex-1"
            />
            <button onClick={addCategory} className="btn-primary flex items-center gap-2">
              <FiPlus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <div key={index} className="badge badge-blue flex items-center gap-2 text-sm py-2 px-3">
                <FiFolder className="h-3 w-3" />
                {category}
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-1 hover:text-red-700 transition-colors"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">No categories added yet</p>
          )}
        </div>
      </div>

      {/* System Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#F0B545] rounded-full"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
            <p className="text-sm text-gray-600">General application settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Follow-up Reminder Days</label>
            <input type="number" defaultValue="7" className="input" />
            <p className="text-sm text-gray-500 mt-1">Number of days to show upcoming follow-ups</p>
          </div>

          <div>
            <label className="label">Overdue Threshold (Days)</label>
            <input type="number" defaultValue="30" className="input" />
            <p className="text-sm text-gray-500 mt-1">Mark volunteers as needing check-in after this many days</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="email_notifications"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-[#9AAF92] focus:ring-[#9AAF92]"
            />
            <label htmlFor="email_notifications" className="ml-2 text-gray-700">
              Enable email notifications for follow-ups
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_sync"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-[#9AAF92] focus:ring-[#9AAF92]"
            />
            <label htmlFor="auto_sync" className="ml-2 text-gray-700">
              Auto-sync with Planning Center Online daily
            </label>
          </div>
        </div>
      </div>

      {/* Planning Center Integration */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#2A8B88] rounded-full"></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Planning Center Integration</h2>
            <p className="text-sm text-gray-600">Configure your Planning Center Online connection</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Application ID</label>
            <input
              type="text"
              defaultValue="57899137ae34a9eb82a09b09af25b39b65ef0ea1ec0c4e8d84d44c9aa1c6b2d4"
              className="input font-mono text-sm"
              readOnly
            />
          </div>

          <div>
            <label className="label">API Secret</label>
            <input
              type="password"
              defaultValue="Configured in environment variables"
              className="input font-mono text-sm"
              readOnly
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> API credentials are configured in your environment variables. 
              Contact your system administrator to update these values.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <FiSave className="h-4 w-4" />
          Save All Settings
        </button>
      </div>
    </div>
  );
}