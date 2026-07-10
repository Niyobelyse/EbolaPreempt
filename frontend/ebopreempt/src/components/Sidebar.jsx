import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Bell, LogOut, Menu, X, History, TrendingUp, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const NAV_ITEMS = [
  { label: 'Risk Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Predictions', icon: TrendingUp, path: '/predictions' },
  { label: 'Alerts', icon: Bell, path: '/alerts' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Backtest', icon: FlaskConical, path: '/backtest' },
];

function Sidebar() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-white">
          <Activity size={22} className="text-[#06B6D4]" />
          <span className="font-bold text-lg tracking-tight">EbolaPreempt</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white border-l-2 border-[#06B6D4]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>



      {/* Logout */}
      <div className="mt-auto px-6 py-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 border border-white/20 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1E3A5F] text-white">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-[#06B6D4]" />
          <span className="font-bold">EbolaPreempt</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#1E3A5F]">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#1E3A5F] flex flex-col">
            <div className="flex justify-end px-4 pt-4">
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white/70">
                <X size={22} />
              </button>
            </div>
            {content}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export default Sidebar;
