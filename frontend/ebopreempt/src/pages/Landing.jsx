import { useNavigate } from 'react-router-dom';
import { Shield, Zap, BarChart2, Bell, ArrowRight } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import heroImg from '../assets/hero.png';
import ebolaImg from '../assets/ebola.jpeg';

const STATS = [
  { value: '30', label: 'Districts Monitored' },
  { value: 'Daily', label: 'Auto-Predictions' },
  { value: 'Live', label: 'WHO & HDX Data' },
  { value: '34', label: 'Automated Tests' },
];


function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative flex items-center min-h-[88vh]">
        <img
          src={heroImg}
          alt="EbolaPreempt hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0F2744]/80" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-[#06B6D4]/20 text-[#06B6D4] text-xs font-semibold rounded-full uppercase tracking-widest mb-6">
              Early Warning System 
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Ebola Risk Intelligence{' '}
              <span className="text-[#06B6D4]">for Every District</span>
            </h1>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              EbolaPreempt is an Automated machine learning early warning system built to help Rwanda detect potential Ebola risks before they become outbreaks.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-white font-semibold rounded-lg hover:bg-[#0891B2] transition-colors"
              >
                Get Started <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Log In
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-12">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-white/50 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-[#06B6D4] text-xs font-semibold uppercase tracking-widest mb-2">What We Do</p>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Everything a public health officer needs</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 max-w-xl">
          One system that monitors all 30 Rwandan districts, generates risk scores automatically,
          and alerts officers before the situation escalates.
        </p>

        <div className="flex flex-col gap-5">
          {/* Row 1 */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Wide card with image */}
            <div className="md:w-[60%] md:h-60 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 p-5 flex flex-col md:flex-row gap-5">
              <img
                src={heroImg}
                alt="District risk scoring"
                className="w-full h-48 md:h-full md:w-[45%] object-cover rounded-2xl"
              />
              <div className="flex flex-col mt-2">
                <div className="w-11 h-11 bg-[#1E3A5F] dark:bg-[#0D1B2E] rounded-lg flex items-center justify-center mb-5 shrink-0">
                  <Shield size={20} className="text-[#06B6D4]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">District-Level Risk Scores</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed">
                  Every one of Rwanda's 30 districts receives an Ebola cross-border risk score from 0–100%,
                  generated daily by an Isolation Forest model trained on real DRC outbreak data.
                </p>
              </div>
            </div>

            {/* Narrow card */}
            <div className="md:w-[40%] bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 px-6 py-6 md:pt-7">
              <div className="w-11 h-11 bg-[#1E3A5F] dark:bg-[#0D1B2E] rounded-lg flex items-center justify-center mb-5">
                <Bell size={20} className="text-[#06B6D4]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Instant HIGH Risk Alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed">
                When a district is flagged HIGH risk, an alert is created automatically.
                Public health officers can acknowledge, filter, and track alerts in real time.
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Narrow card */}
            <div className="md:w-[40%] bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 px-6 py-6 md:pt-7">
              <div className="w-11 h-11 bg-[#1E3A5F] dark:bg-[#0D1B2E] rounded-lg flex items-center justify-center mb-5">
                <Zap size={20} className="text-[#06B6D4]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Automated Daily Updates</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed">
                A GitHub Actions cron job runs every day at 20:00 CAT, pulling the latest WHO and HDX
                data and refreshing all 30 district predictions without any manual intervention.
              </p>
            </div>

            {/* Wide card with image */}
            <div className="md:w-[60%] md:h-60 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-300 p-5 flex flex-col md:flex-row gap-5">
              <img
                src={ebolaImg}
                alt="Backtest validation"
                className="w-full h-48 md:h-full md:w-[45%] object-cover rounded-2xl"
              />
              <div className="flex flex-col mt-2">
                <div className="w-11 h-11 bg-[#1E3A5F] dark:bg-[#0D1B2E] rounded-lg flex items-center justify-center mb-5 shrink-0">
                  <BarChart2 size={20} className="text-[#06B6D4]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Backtested and Validated</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed">
                  A Leave-One-Week-Out backtest across 7 weeks showed 66% Precision@5 — nearly 4× the
                  random baseline — giving officers an honest picture of real model performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#1E3A5F] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Ready to monitor Rwanda's risk?</h2>
            <p className="text-white/60 text-sm">Create a free account or log in to access real-time district risk scores and automated alerts.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-6 py-3 bg-[#06B6D4] text-white font-semibold rounded-lg hover:bg-[#0891B2] transition-colors whitespace-nowrap"
            >
              Sign Up Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default Landing;
