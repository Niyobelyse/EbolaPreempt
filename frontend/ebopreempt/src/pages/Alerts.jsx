import { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Calendar, X, MapPin } from 'lucide-react';
import { getAlerts, acknowledgeAlert } from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';

const STATUS_FILTERS = [
  { value: 'all',            label: 'All' },
  { value: 'unacknowledged', label: 'Unacknowledged' },
  { value: 'acknowledged',   label: 'Acknowledged' },
  { value: 'high',           label: 'High Risk' },
];

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [acknowledging, setAcknowledging] = useState(null);
  const [locationFilter, setLocationFilter] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAlerts();
      const results = data.results || data;
      setAlerts(Array.isArray(results) ? results : []);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (id) => {
    setAcknowledging(id);
    try {
      const updated = await acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: updated.acknowledged } : a))
      );
    } catch {
      setError('Failed to acknowledge alert');
    } finally {
      setAcknowledging(null);
    }
  };

  const clearDates = () => { setDateFrom(''); setDateTo(''); };

  const locationOptions = [...new Set(alerts.map((a) => a.district).filter(Boolean))].sort();

  const filtered = alerts.filter((a) => {
    // Location filter (driven by filter bar dropdown)
    if (locationFilter && a.district !== locationFilter) return false;

    // Status filter
    if (filter === 'unacknowledged' && a.acknowledged) return false;
    if (filter === 'acknowledged'   && !a.acknowledged) return false;
    if (filter === 'high'           && a.alert_level !== 'HIGH') return false;

    // Date range filter
    const sentAt = new Date(a.sent_at);
    if (dateFrom && sentAt < new Date(dateFrom)) return false;
    if (dateTo) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59, 999);
      if (sentAt > toEnd) return false;
    }

    return true;
  });

  const highCount  = alerts.filter((a) => a.alert_level === 'HIGH' && !a.acknowledged).length;
  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Bell size={22} className="text-[#06B6D4]" />
              Alerts
            </h2>

          </div>

          {/* Filter bar */}
          <Card className="mb-4 !p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

              {/* Status filter buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filter === value
                        ? 'bg-[#1E3A5F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              {/* Date range */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500 shrink-0">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white text-gray-700"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500 shrink-0">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white text-gray-700"
                  />
                </div>
                {hasDateFilter && (
                  <button
                    onClick={clearDates}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear date filter"
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              {/* Location filter */}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white text-gray-700"
                >
                  <option value="">All Locations</option>
                  {locationOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {locationFilter && (
                  <button
                    onClick={() => setLocationFilter('')}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear location filter"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </Card>

          {error && (
            <div className="bg-red-50 text-[#EF4444] px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <p className="text-gray-500 text-sm">Loading alerts...</p>
          ) : (
            <Card className="!p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                        Risk
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Message
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                        Location
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-36">
                        Status
                      </th>
                      <th className="px-5 py-3 w-32" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                          No alerts match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((alert) => (
                        <tr
                          key={alert.id}
                          className={`transition-colors ${
                            !alert.acknowledged ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'
                          }`}
                        >
                          {/* Risk */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                                alert.alert_level === 'HIGH'
                                  ? 'bg-red-100 text-[#EF4444]'
                                  : 'bg-green-100 text-[#22C55E]'
                              }`}
                            >
                              {alert.alert_level === 'HIGH'
                                ? <AlertTriangle size={11} />
                                : <CheckCircle size={11} />
                              }
                              {alert.alert_level}
                            </span>
                          </td>

                          {/* Message */}
                          <td className="px-5 py-3.5 text-gray-700 max-w-xs">
                            <p className="truncate" title={alert.message}>{alert.message}</p>
                          </td>

                          {/* Location */}
                          <td className="px-5 py-3.5 text-gray-600 text-xs">
                            {alert.district || '—'}, Rwanda
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            <div>{new Date(alert.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-gray-400">
                              {new Date(alert.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Acknowledgement Status */}
                          <td className="px-5 py-3.5">
                            {alert.acknowledged ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                <CheckCircle size={11} />
                                Acknowledged
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                <AlertTriangle size={11} />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-5 py-3.5 text-right">
                            {!alert.acknowledged && (
                              <button
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={acknowledging === alert.id}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4] hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {acknowledging === alert.id ? 'Saving…' : 'Acknowledge'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer count */}
              {filtered.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                  Showing {filtered.length} of {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                  {locationFilter && ` · ${locationFilter}`}
                  {hasDateFilter && ' · date filtered'}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;
