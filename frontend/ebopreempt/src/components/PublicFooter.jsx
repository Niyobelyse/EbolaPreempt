import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const EXPLORE_LINKS = [
  { label: 'About', path: '/about' },
  { label: 'How It Works', path: '/how-it-works' },
];

const PROJECT_LINKS = [
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Login', path: '/login' },
  { label: 'Sign Up', path: '/register' },
];

function PublicFooter() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0A1628] pt-16 px-4">
      <footer className="bg-[#0D1F3C] w-full max-w-[1350px] mx-auto text-white pt-10 lg:pt-14 px-6 sm:px-10 md:px-16 lg:px-24 rounded-tl-3xl rounded-tr-3xl overflow-hidden">

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-10 md:gap-12">

          {/* Brand + description + socials */}
          <div className="lg:col-span-3 space-y-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Activity size={22} className="text-[#06B6D4]" />
              <span className="font-bold text-lg text-white tracking-tight">EbolaPreempt</span>
            </button>

            <p className="text-sm leading-relaxed text-white/60 max-w-sm">
            EbolaPreempt is an Automated machine learning early warning system built to help Rwanda detect potential Ebola risks before they become outbreaks.

            </p>

            <div className="flex gap-5">
              {/* GitHub */}
              <a
                href="https://github.com/Niyobelyse"
                target="_blank"
                rel="noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                  <path d="M9 18c-4.51 2-5-2-7-2"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/belyse-niyonsenga-29520a293"
                target="_blank"
                rel="noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect width="4" height="12" x="2" y="9"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-8 md:gap-10 lg:gap-16 items-start">
            <div>
              <h3 className="font-semibold text-sm text-white mb-4">Explore</h3>
              <ul className="space-y-3 text-sm text-white/55">
                {EXPLORE_LINKS.map(({ label, path }) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(path)}
                      className="hover:text-white/90 transition-colors text-left"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-white mb-4">Project</h3>
              <ul className="space-y-3 text-sm text-white/55">
                {PROJECT_LINKS.map(({ label, path }) => (
                  <li key={label}>
                    <button
                      onClick={() => navigate(path)}
                      className="hover:text-white/90 transition-colors text-left"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-4 border-t border-white/10 flex justify-between items-center">
          <p className="text-white/40 text-sm">© 2026 EbolaPreempt · Belyse NIYONSENGA · </p>
          <p className="text-sm text-white/40">All rights reserved.</p>
        </div>

        {/* Large watermark */}
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl h-full max-h-64 bg-[#06B6D4] rounded-full blur-[170px] opacity-10 pointer-events-none" />
          <h3
            className="text-center font-extrabold leading-[0.75] text-transparent mt-6"
            style={{
              fontSize: 'clamp(3rem, 14vw, 14rem)',
              WebkitTextStroke: '1px rgba(6,182,212,0.25)',
            }}
          >
            EbolaPreempt
          </h3>
        </div>
      </footer>
    </div>
  );
}

export default PublicFooter;
