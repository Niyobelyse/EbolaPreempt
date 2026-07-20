import { useEffect, useState } from 'react';
import { Filter, FlaskConical, X } from 'lucide-react';
import { getBacktest } from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';

const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 6;

function MetricTile({ label, value, sub }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </Card>
  );
}

function getPageNumbers(current, total, max = MAX_PAGE_BUTTONS) {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(max / 2));
  const end = Math.min(total, start + max - 1);
  start = Math.max(1, end - max + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="mr-1 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg width="9" height="16" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 1L2 9.24242L11 17" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" className="text-gray-500 dark:text-gray-400" />
        </svg>
      </button>

      <div className="flex gap-2 text-gray-500 text-sm">
        {getPageNumbers(page, totalPages).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex items-center justify-center active:scale-95 w-8 h-8 aspect-square rounded-md transition-all ${
              n === page
                ? 'bg-[#06B6D4] text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="Next"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="ml-1 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg width="9" height="16" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L10 9.24242L1 17" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" className="text-gray-500 dark:text-gray-400" />
        </svg>
      </button>
    </div>
  );
}

function Backtest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekFilter, setWeekFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getBacktest()
      .then(setData)
      .catch(() => setError('Failed to load backtest results'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [weekFilter, districtFilter, alertFilter]);

  const weeks = data ? ['All', ...data.weeks_backtested] : ['All'];
  const districts = data
    ? ['All', ...Array.from(new Set(data.results.map((row) => row.district))).sort()]
    : ['All'];
  const rows = data
    ? data.results.filter((row) => {
        if (weekFilter !== 'All' && row.week !== weekFilter) return false;
        if (districtFilter !== 'All' && row.district !== districtFilter) return false;
        if (alertFilter === 'HIGH' && row.anomaly_flag !== 1) return false;
        if (alertFilter === 'LOW' && row.anomaly_flag !== 0) return false;
        return true;
      })
    : [];
  const hasFilters = weekFilter !== 'All' || districtFilter !== 'All' || alertFilter !== 'All';
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const clearFilters = () => {
    setWeekFilter('All');
    setDistrictFilter('All');
    setAlertFilter('All');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={22} className="text-[#06B6D4]" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Backtest Results</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6"></p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Running backtest...</p>
          ) : data ? (
            <>
              {/* Metric tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MetricTile
                  label="Rank Correlation"
                  value={data.spearman_correlation}
                  sub="predicted risk vs real cases"
                />
                <MetricTile
                  label="Districts Correct (top 5)"
                  value={`${Math.round(data.precision_at_5 * 100)}%`}
                  sub="right districts flagged per week"
                />
                <MetricTile
                  label="Risk in active weeks"
                  value={data.mean_risk_cases_gt_0 !== null ? `${Math.round(data.mean_risk_cases_gt_0 * 100)}%` : 'N/A'}
                  sub="weeks with reported cases"
                />
                <MetricTile
                  label="Risk in quiet weeks"
                  value={data.mean_risk_cases_eq_0 !== null ? `${Math.round(data.mean_risk_cases_eq_0 * 100)}%` : 'N/A'}
                  sub="weeks with no reported cases"
                />
              </div>

              {/* Results table */}
              <Card className="!p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Backtest Predictions
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                      aria-label="Filter by week"
                      value={weekFilter}
                      onChange={(e) => setWeekFilter(e.target.value)}
                      className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {weeks.map((week) => <option key={week} value={week}>{week === 'All' ? 'All weeks' : week}</option>)}
                    </select>
                    <select
                      aria-label="Filter by district"
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {districts.map((district) => <option key={district} value={district}>{district === 'All' ? 'All districts' : district}</option>)}
                    </select>
                    <select
                      aria-label="Filter by alert level"
                      value={alertFilter}
                      onChange={(e) => setAlertFilter(e.target.value)}
                      className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <option value="All">All alerts</option>
                      <option value="HIGH">High risk</option>
                      <option value="LOW">Low risk</option>
                    </select>
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        <X size={14} /> Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">District</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Week (held out)</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Predicted Risk</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actual Cases</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {pagedRows.map((r, i) => {
                        const score = Math.round(r.risk_score * 100);
                        const barColor = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E';
                        return (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{r.district}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.week}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{ width: `${score}%`, backgroundColor: barColor }}
                                  />
                                </div>
                                <span
                                  className="text-xs font-bold"
                                  style={{ color: barColor }}
                                >
                                  {score}%
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.actual_cases}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                r.anomaly_flag === 1
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-green-50 text-green-700'
                              }`}>
                                {r.anomaly_flag === 1 ? 'HIGH' : 'LOW'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Showing {rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length} predictions
                  </span>
                  <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
                </div>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Backtest;
