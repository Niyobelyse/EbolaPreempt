import { useNavigate } from 'react-router-dom';
import { Database, Cpu, BarChart2, Bell, RefreshCw, Activity } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';


const STEPS = [
  {
    number: '01',
    icon: Database,
    title: 'Data Ingestion',
    desc: 'Four open HDX datasets (DRC confirmed cases by health zone, population mobility detection rates, DRC health zone shapefiles, and Rwanda health facility locations) were used during data preparation to build the seeded feature dataset. Every day at 20:00 CAT, the live pipeline scrapes the WHO AFRO Ebola topic page to get the latest DRC confirmed-case total and create new district estimates.',
  },
  {
    number: '02',
    icon: Activity,
    title: 'Feature Engineering',
    desc: 'For each of Rwanda\'s 30 districts, four raw features are used in the model: Active Regional Cases (cases within 200 km), Distance to Outbreak (km), Border Inflow Count (mobility-weighted pressure score), and Isolation Capacity Score. Three temporal features are then engineered at runtime: Case_Trend, National_Weekly_Cases, and Week_Number — giving 7 total model features.',
  },
  {
    number: '03',
    icon: Cpu,
    title: 'Isolation Forest Model',
    desc: 'An Isolation Forest anomaly detection model (n_estimators=200, contamination=0.1, random_state=42) scores each district\'s feature vector. An unsupervised approach was chosen because Rwanda has no historical Ebola case data to use as labelled training examples. The model identifies weeks that look statistically abnormal compared to the overall pattern.',
  },
  {
    number: '04',
    icon: BarChart2,
    title: 'Risk Score Normalisation',
    desc: 'The Isolation Forest\'s raw decision function score is normalised to a [0, 1] range using the minimum and maximum bounds recorded during training, then expressed as a percentage. A StandardScaler is applied before inference to ensure all features contribute equally regardless of their original scale.',
  },
  {
    number: '05',
    icon: Bell,
    title: 'Alert Generation',
    desc: 'Every prediction produces an alert record in the database. Districts scoring above the anomaly threshold are classified HIGH risk; others are LOW. All alerts are visible on the Alerts page and require explicit acknowledgement by a public health officer — no automated field response is ever triggered.',
  },
  {
    number: '06',
    icon: RefreshCw,
    title: 'Daily Automation',
    desc: 'A GitHub Actions cron job runs at 18:00 UTC (20:00 CAT) every day. It authenticates to the Django REST API, calls POST /api/predictions/run-all/, and refreshes predictions for all 30 districts. The cron also handles data sync from WHO\'s public Ebola topic page for the latest confirmed case totals.',
  },
];

const FEATURES = [
  { name: 'Active Regional Cases', type: 'Raw', desc: 'Sum of confirmed DRC cases in health zones within 200 km of the district' },
  { name: 'Distance to Outbreak (km)', type: 'Raw', desc: 'Geodesic distance from district centroid to nearest active outbreak zone' },
  { name: 'Border Inflow Count', type: 'Raw', desc: 'Mobility-weighted cross-border pressure: cases × detection rate ÷ distance' },
  { name: 'Isolation Capacity Score', type: 'Raw', desc: 'Hospital density scaled 1–10; higher means better patient isolation capacity' },
  { name: 'Case_Trend', type: 'Engineered', desc: 'Week-over-week change in Active Regional Cases for this district' },
  { name: 'National_Weekly_Cases', type: 'Engineered', desc: 'Sum of Active Regional Cases across all 30 districts for the week' },
  { name: 'Week_Number', type: 'Engineered', desc: 'ISO week number extracted from the week identifier string' },
];

function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <PublicNavbar />

      {/* Header */}
      <section className="bg-[#1E3A5F] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h1>
          <p className="text-white/60 text-base max-w-2xl leading-relaxed">
            Six stages from raw open data to a district-level Ebola risk score fully automated.
          </p>
        </div>
      </section>

      {/* Pipeline steps */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {STEPS.map(({ number, icon: Icon, title, desc }) => (
            <div key={number} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700/50 shadow-sm flex gap-5">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                  <Icon size={20} className="text-[#06B6D4]" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-[#06B6D4] tracking-widest">STEP {number}</span>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-1 mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature table */}
      <section className="bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-gray-700/50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Dataset Features</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
            4 raw features from open data sources + 3 features engineered at inference time = 7 total model features.
            Seeded dataset: 210 records (30 districts × 7 weeks, W20–W26 2026).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Feature</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {FEATURES.map(({ name, type, desc }) => (
                  <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        type === 'Engineered'
                          ? 'bg-[#06B6D4]/10 text-[#06B6D4]'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Backtest results */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Model Validation</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-2xl">
          Because Rwanda has no labelled historical Ebola case data, a Leave-One-Week-Out (LOWO)
          backtest was used. In each of 7 folds, the model was retrained on 6 weeks and tested
          on the held-out 7th week.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { metric: '66%', label: 'Precision@5', sub: 'vs 17% random baseline' },
            { metric: '0.09', label: 'Spearman r', sub: 'predicted risk vs real cases' },
            { metric: '40%', label: 'Risk in active weeks', sub: 'weeks with reported cases' },
            { metric: '7', label: 'Backtest folds', sub: 'W20 through W26 2026' },
          ].map(({ metric, label, sub }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 shadow-sm">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{metric}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          The strongest result was week 2026-W24: Musanze (92%), Nyagatare (86%), Nyabihu (84%),
          Gicumbi (80%), and Burera (79%) were all correctly identified as the top-5 highest-risk
          districts and all five recorded genuine case activity in the held-out data.
        </p>
      </section>

      {/* CTA */}
      <section className="bg-[#1E3A5F] py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">See the live backtest results</h2>
            <p className="text-white/60 text-sm">Log in to explore all 210 held-out predictions and validation metrics.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-[#06B6D4] text-white font-semibold rounded-lg hover:bg-[#0891B2] transition-colors whitespace-nowrap"
          >
            Log In
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

export default HowItWorks;
