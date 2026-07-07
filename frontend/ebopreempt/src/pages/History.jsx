import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { History as HistoryIcon, Calendar, X, Download, Filter } from 'lucide-react';
import { getRecords, getDistricts } from '../api/data';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import DistrictFilter from '../components/DistrictFilter';

function History() {
  const [records, setRecords] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('Rubavu');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDistricts()
      .then((data) => setDistricts(data))
      .catch(() => setDistricts([]));
  }, []);

  const loadRecords = async (district) => {
    setLoading(true);
    setError('');
    try {
      const data = await getRecords(district || undefined);
      const results = data.results || data;
      setRecords(Array.isArray(results) ? results : []);
    } catch {
      setError('Failed to load historical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(filterDistrict || selectedDistrict);
  }, [filterDistrict, selectedDistrict]);

  const clearFilters = () => {
    setFilterDistrict('');
    setDateFrom('');
    setDateTo('');
  };

  const districtOptions = [...new Set(districts)];

  const filtered = records.filter((r) => {
    if (filterDistrict && r.district !== filterDistrict) return false;
    const weekDate = new Date(r.week_start_date);
    if (dateFrom && weekDate < new Date(dateFrom)) return false;
    if (dateTo) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59, 999);
      if (weekDate > toEnd) return false;
    }
    return true;
  });

  const chartData = [...filtered]
    .sort((a, b) => new Date(a.week_start_date) - new Date(b.week_start_date))
    .map((r) => ({
      week: new Date(r.week_start_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      cases: r.active_regional_cases,
    }));

  const handleExport = () => {
    if (filtered.length === 0) return;
    const headers = [
      'District', 'Week Start', 'Active Regional Cases', 'Distance to Outbreak (km)',
      'Border Inflow Count', 'Transit Hub Count', 'Isolation Capacity Score',
    ];
    const rows = filtered.map((r) => [
      r.district,
      r.week_start_date,
      r.active_regional_cases,
      r.distance_to_outbreak_km,
      r.border_inflow_count,
      r.transit_hub_count,
      r.isolation_capacity_score,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebolapreempt-history-${filterDistrict || selectedDistrict}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = filterDistrict || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-6xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <HistoryIcon size={22} className="text-[#06B6D4]" />
                District History
              </h2>
              <DistrictFilter districts={districts} value={selectedDistrict} onChange={setSelectedDistrict} />
            </div>
            <button
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>

          {/* Filter bar */}
          <Card className="mb-4 !p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

              {/* District filter */}
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white text-gray-700"
                >
                  <option value="">All Districts</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {filterDistrict && (
                  <button
                    onClick={() => setFilterDistrict('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear district filter"
                  >
                    <X size={13} />
                  </button>
                )}
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
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={13} />
                    Clear all
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

          {loading ? (
            <p className="text-gray-500 text-sm">Loading history...</p>
          ) : (
            <>
              {/* Cases trend chart */}
              {chartData.length > 0 && (
                <Card className="mb-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">
                    Weekly Active Regional Cases
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="cases" name="Active Regional Cases" fill="#EF4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Records table */}
              <Card className="!p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">District</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Week Start</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Active Cases</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Distance to Outbreak (km)</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Border Inflow</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Transit Hubs</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Isolation Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                            No records match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{r.district}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {new Date(r.week_start_date).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-semibold ${r.active_regional_cases > 0 ? 'text-[#EF4444]' : 'text-gray-700'}`}>
                                {r.active_regional_cases}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">{r.distance_to_outbreak_km != null ? r.distance_to_outbreak_km.toFixed(1) : '—'}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{r.border_inflow_count}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{r.transit_hub_count}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{r.isolation_capacity_score}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filtered.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                    Showing {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
                    {filterDistrict && ` · ${filterDistrict}`}
                    {(dateFrom || dateTo) && ' · date filtered'}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
