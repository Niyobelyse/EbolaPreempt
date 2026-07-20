import { useNavigate } from 'react-router-dom';
import { ArrowRight, Target, Heart, Users } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';


function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <PublicNavbar />

      {/* Page header */}
      <section className="bg-[#1E3A5F] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[#06B6D4] text-xs font-semibold uppercase tracking-widest mb-3">About</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What is EbolaPreempt?
          </h1>
          <p className="text-white/60 text-base max-w-2xl leading-relaxed">
          EbolaPreempt is a machine learning early warning system built to help Rwanda detect potential Ebola cross-border risks before they become outbreaks without manual intervention.

          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center mb-4">
              <Heart size={20} className="text-[#06B6D4]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Because of a passion for healthcare, EbolaPreempt was built to help Rwanda detect
              Ebola threats early and strengthen public health preparedness before the disease
              reaches the country.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Rwanda shares a western border with the Democratic Republic of Congo, which has
              experienced seventeen Ebola outbreaks since 1976 including an active outbreak
              in Ituri Province that began in May 2026 and reached 1,460 confirmed cases and
              452 deaths by 1 July 2026. EbolaPreempt exists to turn that threat into a
              continuously updated, data-driven number that public health officers can act on.
            </p>
          </div>
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center mb-4">
              <Target size={20} className="text-[#06B6D4]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">The Problem It Solves</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Rwanda's existing preparedness relies on manual border screening and periodic WHO
              situation reports. No tool existed to automatically generate a district-level
              Ebola risk score for Rwanda using real, continuously updated data from the DRC
              outbreak zone.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              EbolaPreempt fills that gap. It ingests four open data sources daily, applies an
              Isolation Forest anomaly detection model trained on real DRC epidemiological data,
              and delivers a risk score for every district automatically, every day at 20:00 CAT.
            </p>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-gray-700/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center mb-4">
            <Users size={20} className="text-[#06B6D4]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-8">Who It Is For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Public Health Officers',
                desc: 'Officers across Rwanda\'s 30 districts who need a daily, data-driven view of cross-border Ebola risk to support surveillance decisions and resource pre-positioning.',
              },
              {
                title: 'District Health Administrators',
                desc: 'Administrators who need to understand which districts are under the most exposure pressure in a given week and allocate preparedness resources accordingly.',
              },
              {
                title: 'Researchers and Evaluators',
                desc: 'Academic evaluators and public health researchers who want to understand how unsupervised anomaly detection performs in a real, low-resource surveillance context.',
              },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-[#F8FAFC] dark:bg-slate-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="bg-[#1E3A5F] py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Want to see it in action?</h2>
            <p className="text-white/60 text-sm">Log in to view live district risk scores and alerts.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/how-it-works')}
              className="px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white text-sm font-semibold rounded-lg hover:bg-[#0891B2] transition-colors"
            >
              Log In <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default About;
