import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ebolaImg from '../assets/ebola.jpeg';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      auth.login();
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage:
          'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundColor: '#f8fafc',
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Hero image */}
        <img
          src={ebolaImg}
          alt="Ebola research"
          className="w-full h-72 object-cover"
        />

        {/* Card body */}
        <div className="px-10 py-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">
            Welcome to EbolaPreempt!
          </h1>
          <p className="text-base text-gray-500 mb-6">
            Sign in to access the outbreak risk dashboard and early warning alerts.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#06B6D4] text-gray-700"
              placeholder="Username"
            />

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#06B6D4] text-gray-700"
              placeholder="Password"
            />

            {error && (
              <p className="text-sm text-[#EF4444] bg-red-50 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#1E3A5F] hover:bg-[#16304f] text-white font-semibold text-base transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
