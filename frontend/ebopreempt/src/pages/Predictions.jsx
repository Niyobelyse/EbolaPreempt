import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { getDistricts, getPredictions, runPrediction } from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import DistrictFilter from '../components/DistrictFilter';

function riskColor(score) {
  if (score >= 70) return { text: 'text-[#EF4444]', bg: 'bg-red-100' };
  if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50' };
  return { text: 'text-[#22C55E]', bg: 'bg-green-50' };
}

function Predictions() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Rubavu');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, []);

  const load = async (district) => {
    setLoading(true);
    setError('');
    try {
      const data = await getPredictions(district);
      const results = data.results || data;
      setPredictions(Array.isArray(results) ? results : []);
    } catch {
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedDistrict);
  }, [selectedDistrict]);

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      await runPrediction(selectedDistrict);
      await load(selectedDistrict);
    } catch {
      setError('Failed to run prediction');
    } finally {
      setRunning(false);
    }
  };

  const sorted = [...predictions].sort(
    (a, b) => new Date(b.predicted_at) - new Date(a.predicted_at)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={22} className="text-[#06B6D4]" />
                Predictions
              </h2>
              <DistrictFilter districts={districts} value={selectedDistrict} onChange={setSelectedDistrict} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EFF6FF] border border-blue-100 text-xs text-blue-700">
                <Clock size={13} className="shrink-0 text-[#06B6D4]" />
                <span>Daily Auto Prediction <strong>at 20:00 CAT</strong></span>
                {sorted.length > 0 && (
                  <span className="text-blue-400 ml-1">
                    · Last run {new Date(sorted[0].predicted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#16304f] text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                <RefreshCw size={15} className={running ? 'animate-spin' : ''} />
                {running ? 'Running...' : 'Run Prediction'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-[#EF4444] px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-gray-500 text-sm">Loading predictions...</p>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Week</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk Score</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Alert Level</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Predicted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                          No predictions yet for {selectedDistrict}. Click "Run Prediction" to generate one.
                        </td>
                      </tr>
                    ) : (
                      sorted.map((p) => {
                        const score = Math.round(p.risk_score * 100);
                        const { text, bg } = riskColor(score);
                        const isHigh = p.early_warning_alert === 1;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 text-gray-700 font-medium">
                              {p.record?.week ?? '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{
                                      width: `${score}%`,
                                      backgroundColor: score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#22C55E',
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${text}`}>{score}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                isHigh ? 'bg-red-100 text-[#EF4444]' : `${bg} ${text}`
                              }`}>
                                {isHigh ? 'HIGH' : 'LOW'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 text-xs">
                              <div>{new Date(p.predicted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-gray-400">{new Date(p.predicted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {sorted.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                  {sorted.length} prediction{sorted.length !== 1 ? 's' : ''} for {selectedDistrict}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Predictions;
