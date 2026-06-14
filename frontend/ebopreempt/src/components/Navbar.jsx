import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

function Navbar() {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-lg font-bold">EbolaPreempt</h1>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-lg font-medium text-sm border border-white/30 text-white hover:bg-white/10 transition-colors"
      >
      Logout
      </button>
    </nav>
  );
}

export default Navbar;
