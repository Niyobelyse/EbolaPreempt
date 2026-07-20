import Card from './Card';

function StatCard({ label, value, subtext, icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-[#1E3A5F] dark:text-[#06B6D4] mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
        </div>
        {icon && <div className="text-[#06B6D4]">{icon}</div>}
      </div>
    </Card>
  );
}

export default StatCard;
