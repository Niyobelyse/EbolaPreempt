import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { getBacktest } from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';

function MetricTile({ label, value, sub }) {
  return (
    <Card>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

function Backtest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekFilter, setWeekFilter] = useState('All');

  useEffect(() => {
    getBacktest()
      .then(setData)
      .catch(() => setError('Failed to load backtest results'))
      .finally(() => setLoading(false));
  }, []);

  const weeks = data ? ['All', ...data.weeks_backtested] : ['All'];
  const rows = data
    ? (weekFilter === 'All'
        ? data.results
        : data.results.filter((r) => r.week === weekFilter))
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={22} className="text-[#06B6D4]" />
            <h2 className="text-xl font-bold text-gray-800">Backtest Results</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6"></p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
          )}

          {loading ? (
            <p className="text-gray-500 text-sm">Running backtest...</p>
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
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    All Predictions ({data.total_predictions})
                  </span>
                  <select
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                    className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white text-gray-700"
                  >
                    {weeks.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">District</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Week (held out)</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Predicted Risk</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actual Cases</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((r, i) => {
                        const score = Math.round(r.risk_score * 100);
                        const barColor = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E';
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{r.district}</td>
                            <td className="px-5 py-3 text-gray-600">{r.week}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
                            <td className="px-5 py-3 text-gray-600">{r.actual_cases}</td>
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
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                  {rows.length} predictions shown
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
