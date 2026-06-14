import { useState } from 'react';
import { Activity, LayoutDashboard, Bell, MapPin, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DRC_BORDER_DISTRICTS = ['Rubavu', 'Rusizi', 'Karongi', 'Nyamasheke'];

function Sidebar({ selectedDistrict, onSelectDistrict, districts }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  const navItems = [
    { label: 'Risk Dashboard', icon: LayoutDashboard, active: true },
    { label: 'Alerts', icon: Bell, active: false },
  ];

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-6 ">
        <div className="flex items-center gap-2 text-white">
          <Activity size={22} className="text-[#06B6D4]" />
          <span className="font-bold text-lg tracking-tight">EbolaPreempt</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-white/10 text-white border-l-2 border-[#06B6D4]'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* District selector */}
      <div className="px-6 py-4 ">
        <label htmlFor="district-select" className="text-xs font-semibold text-white/50 uppercase tracking-wide">
          Monitoring District
        </label>
        <select
          id="district-select"
          value={selectedDistrict}
          onChange={(e) => onSelectDistrict(e.target.value)}
          className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
        >
          {districts.length === 0 && <option value="Rubavu">Rubavu</option>}
          {districts.map((d) => (
            <option key={d} value={d} className="text-gray-800">{d}</option>
          ))}
        </select>
      </div>

      {/* DRC border watch */}
      <div className="px-6 py-4 ">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
          DRC Border Districts
        </p>
        <div className="space-y-1">
          {DRC_BORDER_DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => onSelectDistrict(d)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                selectedDistrict === d
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MapPin size={14} />
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-auto px-6 py-4 ">
        <button
          onClick={logout}
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
