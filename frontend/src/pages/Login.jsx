import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock } from 'react-icons/fi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Starting login...');
    const result = await login(username, password);
    console.log('Login result:', result);

    if (result.success) {
      console.log('Login successful, navigating to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      console.log('Navigate called');
    } else {
      console.log('Login failed:', result.error);
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-container px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#9AAF92] to-[#6B8263] mb-4 shadow-lg">
            <span className="text-white text-5xl font-bold" style={{ fontFamily: "'Brandon Grotesque', sans-serif" }}>
              ch
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ 
            background: 'linear-gradient(135deg, #9AAF92 0%, #6B8263 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Brandon Grotesque', sans-serif"
          }}>
            Volunteer Tracker
          </h1>
          <p className="text-gray-600 font-medium">Cherry Hills Church</p>
          <p className="text-sm text-gray-500 mt-1">Worship Arts Team Leadership Portal</p>
        </div>
        {/* Login Card */}
        <div className="login-card">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-600 mt-1">Sign in to continue</p>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              <strong>Login Failed:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Track volunteer interactions and build stronger connections in your ministry
            </p>
            <p className="text-xs text-gray-500 mt-3 italic">
              "Creating something beautiful for the people we love, to encounter the God we love."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:chc@cherryhillsfamily.org" className="text-[#9AAF92] hover:text-[#6B8263] font-medium">
              chc@cherryhillsfamily.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}