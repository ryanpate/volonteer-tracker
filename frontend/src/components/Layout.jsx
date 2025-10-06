import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiUsers, FiMessageSquare, FiSettings, 
  FiLogOut, FiUserPlus, FiMenu, FiX, FiShield 
} from 'react-icons/fi';
import { useState } from 'react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Volunteers', href: '/volunteers', icon: FiUsers },
    { name: 'Interactions', href: '/interactions', icon: FiMessageSquare },
    ...(isAdmin ? [{ name: 'Team', href: '/team', icon: FiUserPlus }] : []),
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: FiShield }] : []),
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #9AAF92 0%, #6B8263 100%)' }}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ fontFamily: "'Brandon Grotesque', sans-serif", color: '#6B8263' }}>ch</span>
                </div>
                <span className="text-lg font-bold text-white">Volunteer Tracker</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-200">
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`${
                    isActive(item.href)
                      ? 'bg-[#9AAF92] text-white'
                      : 'text-gray-700 hover:bg-[#F0F4EE]'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-4 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #9AAF92 0%, #6B8263 100%)' }}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-white text-xl font-bold" style={{ fontFamily: "'Brandon Grotesque', sans-serif" }}>ch</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">Volunteer Tracker</div>
                <div className="text-xs text-white text-opacity-90 leading-tight">Cherry Hills</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-[#9AAF92] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-[#F0F4EE]'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
                {item.name === 'Admin' && (
                  <span className="ml-auto badge badge-rose text-xs py-0.5 px-2">Admin</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 bg-[#F8F7F4]">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9AAF92] to-[#6B8263] flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                to="/profile"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
              >
                <FiSettings className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors"
              >
                <FiLogOut className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none hover:text-[#9AAF92]"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9AAF92] to-[#6B8263] flex items-center justify-center">
                <span className="text-white text-sm font-bold" style={{ fontFamily: "'Brandon Grotesque', sans-serif" }}>ch</span>
              </div>
              <span className="text-base font-semibold text-gray-900">Volunteer Tracker</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-6 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-600 italic leading-relaxed">
              "Pursuing life together with Jesus in community, in formation, and on mission"
            </p>
            <p className="mt-2 text-xs text-gray-500">
              © {new Date().getFullYear()} Cherry Hills Church | 
              <a href="mailto:chc@cherryhillsfamily.org" className="ml-1 text-[#9AAF92] hover:text-[#6B8263] transition-colors">
                chc@cherryhillsfamily.org
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}