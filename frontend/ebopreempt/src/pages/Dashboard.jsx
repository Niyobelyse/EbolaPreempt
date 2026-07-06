import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, Activity, MapPin, RefreshCw, Download } from 'lucide-react';
import {
  getDistricts, getLatestRisk, getPredictions, getAlerts, runPrediction,
} from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import RiskZoneMap from '../components/RiskZoneMap';

function Dashboard() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Rubavu');
  const [latestRisk, setLatestRisk] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getDistricts()
      .then((data) => setDistricts(data))
      .catch(() => setDistricts([]));
  }, []);

  const loadData = async (district) => {
    setLoading(true);
    setError('');
    try {
      const [riskRes, predRes, alertRes] = await Promise.allSettled([
        getLatestRisk(district),
        getPredictions(district),
        getAlerts(district),
      ]);

      setLatestRisk(riskRes.status === 'fulfilled' ? riskRes.value : null);

      if (predRes.status === 'fulfilled') {
        const results = predRes.value.results || predRes.value;
        setPredictions(Array.isArray(results) ? results : []);
      } else {
        setPredictions([]);
      }

      if (alertRes.status === 'fulfilled') {
        const results = alertRes.value.results || alertRes.value;
        setAlerts(Array.isArray(results) ? results : []);
      } else {
        setAlerts([]);
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDistrict);
  }, [selectedDistrict]);

  const handleRunPrediction = async () => {
    setRefreshing(true);
    setError('');
    try {
      await runPrediction(selectedDistrict);
      await loadData(selectedDistrict);
    } catch {
      setError('Failed to run prediction');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    if (predictions.length === 0) return;
    const headers = ['Date', 'Risk Score (%)', 'Alert'];
    const rows = [...predictions]
      .sort((a, b) => new Date(a.predicted_at) - new Date(b.predicted_at))
      .map((p) => [
        new Date(p.predicted_at).toLocaleDateString(),
        Math.round(p.risk_score * 100),
        p.early_warning_alert === 1 ? 'HIGH' : 'LOW',
      ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebolapreempt-${selectedDistrict}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = [...predictions]
    .sort((a, b) => new Date(a.predicted_at) - new Date(b.predicted_at))
    .map((p) => ({
      date: new Date(p.predicted_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      risk_score: Math.round(p.risk_score * 100),
    }));

  const riskScore = latestRisk ? Math.round(latestRisk.risk_score * 100) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
        districts={districts}
      />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Risk Dashboard</h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={predictions.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Export prediction history as CSV"
              >
                <Download size={15} />
                Export CSV
              </button>

              <Button onClick={handleRunPrediction} disabled={refreshing}>
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Running...' : 'Run Prediction'}
                </span>
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-[#EF4444] px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading dashboard...</p>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                  label="Current Risk Score"
                  value={riskScore !== null ? `${riskScore}%` : 'N/A'}
                  icon={<Activity size={28} />}
                />
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Alert Status</p>
                      <div className="mt-1 -ml-3">
                        {latestRisk ? (
                          <RiskBadge alertFlag={latestRisk.early_warning_alert} />
                        ) : (
                          <p className="text-gray-400 text-sm">No prediction yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                <StatCard
                  label="District"
                  value={selectedDistrict}
                  icon={<MapPin size={28} />}
                />
              </div>

              {/* Risk zone map */}
              <Card className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-4">
                  Border Risk Zone
                </h3>
                <RiskZoneMap selectedDistrict={selectedDistrict} riskScore={riskScore} />
              </Card>

              {/* Trend chart */}
              <Card className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-4">Risk Score Trend</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Risk Score']} />
                      <Line
                        type="monotone"
                        dataKey="risk_score"
                        stroke="#06B6D4"
                        strokeWidth={2}
                        dot={{ fill: '#06B6D4' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No prediction history yet for {selectedDistrict}. Click "Run Prediction" to generate one.
                  </p>
                )}
              </Card>

              {/* Recent alerts */}
              <Card>
                <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#EF4444]" />
                  Recent Alerts
                </h3>
                {alerts.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {alerts.map((alert) => (
                      <li key={alert.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(alert.sent_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            alert.alert_level === 'HIGH'
                              ? 'bg-red-100 text-[#EF4444]'
                              : 'bg-green-100 text-[#22C55E]'
                          }`}
                        >
                          {alert.alert_level}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No alerts yet.</p>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
