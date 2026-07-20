import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Eye, MapPin, Gauge } from 'lucide-react';
import { register } from '../api/auth';
import heroImg from '../assets/hero.png';


function Register() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.username, form.email, form.password, form.confirmPassword);
      setSuccess(data?.message || 'Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const d = err?.response?.data;
      if (d?.username) setError(`Username: ${d.username[0]}`);
      else if (d?.email) setError(`Email: ${d.email[0]}`);
      else if (d?.password) setError(`Password: ${d.password[0]}`);
      else setError(d?.error || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-slate-950">

      {/* ── Left panel (desktop only) ── */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B2E]/95 via-[#1E3A5F]/85 to-[#0D1B2E]/90" />

        <div className="relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white"
          >
            <Activity size={22} className="text-[#06B6D4]" />
            <span className="font-bold text-lg tracking-tight">EbolaPreempt</span>
          </button>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <span className="inline-block px-3 py-1 bg-[#06B6D4]/15 text-[#06B6D4] text-xs font-semibold rounded-full uppercase tracking-widest mb-4">
              Rwanda Early Warning System
            </span>
            <h2 className="text-3xl font-bold text-white leading-snug mb-3">
               Created an Account to<br />Gain access to Ebola risk Dashbord
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              EbolaPreempt is an Automated machine learning early warning system built to help Rwanda detect potential Ebola risks before they become outbreaks.
            </p>
          </div>


        </div>

        <div className="relative z-10">
          <p className="text-white/25 text-xs">
          © 2026 EbolaPreempt · Belyse NIYONSENGA
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">

        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-2 mb-10">
          <Activity size={22} className="text-[#06B6D4]" />
          <span className="font-bold text-lg text-[#1E3A5F] dark:text-white tracking-tight">
            EbolaPreempt
          </span>
        </div>

        <div className="w-full max-w-md mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-[#06B6D4] dark:hover:text-[#06B6D4] transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to home
          </button>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Request access to the EbolaPreempt dashboard and early warning system.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={set('username')}
                required
                autoComplete="username"
                placeholder="please enter your username"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4] transition"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                placeholder="please enter your email address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4] transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                placeholder="please enter your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4] transition"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
                autoComplete="new-password"
                placeholder="please confirm your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/50 focus:border-[#06B6D4] transition"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] active:bg-[#0e7490] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-[#06B6D4] hover:text-[#0891B2] transition-colors"
            >
              Sign in
            </button>
          </p>

          <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center leading-relaxed">
              For authorised public health officers and administrators only.
              <br />
              REC Ethics Clearance · M26-BSE-071
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
