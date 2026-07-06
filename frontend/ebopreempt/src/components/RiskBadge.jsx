function RiskBadge({ alertFlag }) {
  const isHighRisk = alertFlag === 1;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
        isHighRisk
          ? 'bg-red-100 text-[#EF4444]'
          : 'text-[#22C55E]'
      }`}
    >
      {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
    </span>
  );
}

export default RiskBadge;
