import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { label: 'About', path: '/about' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Privacy Policy', path: '/privacy' },
];

function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-[#1E3A5F] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white"
        >
          <Activity size={22} className="text-[#06B6D4]" />
          <span className="font-bold text-lg tracking-tight">EbolaPreempt</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {LINKS.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'text-[#06B6D4]'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          <ThemeToggle className="text-white/60 hover:text-white hover:bg-white/10" />
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="ml-2 px-4 py-2 bg-[#06B6D4] text-white text-sm font-semibold rounded-lg hover:bg-[#0891B2] transition-colors"
          >
            Sign Up
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-6 py-4 space-y-3">
            {LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setOpen(false); }}
                className="block w-full text-left text-sm text-white/70 hover:text-white py-1"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => { navigate('/login'); setOpen(false); }}
              className="w-full px-4 py-2 border border-[#06B6D4] text-[#06B6D4] text-sm font-semibold rounded-lg"
            >
              Login
            </button>
            <button
              onClick={() => { navigate('/register'); setOpen(false); }}
              className="w-full px-4 py-2 bg-[#06B6D4] text-white text-sm font-semibold rounded-lg"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default PublicNavbar;
