import { MapPin } from 'lucide-react';

function DistrictFilter({ districts, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <MapPin size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06B6D4] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
      >
        {districts.length === 0 && <option value="Rubavu">Rubavu</option>}
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}

export default DistrictFilter;
