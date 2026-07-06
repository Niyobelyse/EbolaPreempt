const DISTRICTS = [
  { id: 'Rubavu',     label: 'Rubavu',     cx: 155, cy: 135, r: 38, borderDistrict: true },
  { id: 'Rusizi',     label: 'Rusizi',     cx: 130, cy: 235, r: 32, borderDistrict: true },
  { id: 'Karongi',   label: 'Karongi',    cx: 200, cy: 195, r: 28, borderDistrict: true },
  { id: 'Nyamasheke', label: 'Nyamasheke', cx: 155, cy: 280, r: 26, borderDistrict: true },
  { id: 'Kigali',    label: 'Kigali',     cx: 310, cy: 160, r: 28, borderDistrict: false },
  { id: 'Musanze',   label: 'Musanze',    cx: 220, cy: 85,  r: 24, borderDistrict: false },
  { id: 'Huye',      label: 'Huye',       cx: 265, cy: 280, r: 22, borderDistrict: false },
];

function riskColor(score) {
  if (score === null) return '#94A3B8';
  if (score >= 70) return '#EF4444';
  if (score >= 40) return '#F59E0B';
  return '#22C55E';
}

function riskLabel(score) {
  if (score === null) return 'No data';
  if (score >= 70) return 'HIGH RISK';
  if (score >= 40) return 'MODERATE';
  return 'LOW RISK';
}

export default function RiskZoneMap({ selectedDistrict, riskScore }) {
  const color = riskColor(riskScore);
  const label = riskLabel(riskScore);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <svg
        viewBox="0 0 460 380"
        className="w-full sm:w-80 shrink-0 rounded-lg bg-[#F0F9FF] border border-gray-100"
        aria-label="Rwanda border risk zone map"
      >
        {/* DRC label */}
        <text x="48" y="30" fontSize="11" fill="#94A3B8" fontWeight="600">DRC (North Kivu)</text>
        <line x1="90" y1="35" x2="90" y2="320" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 3" />
        <text x="14" y="180" fontSize="9" fill="#94A3B8" transform="rotate(-90 14 180)">← DRC border</text>

        {/* Uganda label */}
        <text x="340" y="30" fontSize="11" fill="#94A3B8" fontWeight="600">Uganda</text>
        <line x1="400" y1="35" x2="400" y2="150" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Rwanda outline (simplified polygon) */}
        <polygon
          points="95,60 230,50 410,100 430,200 370,330 220,350 95,310"
          fill="#E0F2FE"
          stroke="#BAE6FD"
          strokeWidth="1.5"
        />

        {/* Districts */}
        {DISTRICTS.map((d) => {
          const isSelected = d.id === selectedDistrict;
          const isBorder = d.borderDistrict;
          const fill = isSelected ? color : isBorder ? '#FEF3C7' : '#DBEAFE';
          const stroke = isSelected ? color : isBorder ? '#F59E0B' : '#93C5FD';

          return (
            <g key={d.id}>
              <circle
                cx={d.cx}
                cy={d.cy}
                r={d.r}
                fill={fill}
                fillOpacity={isSelected ? 0.85 : 0.7}
                stroke={stroke}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              {isSelected && (
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.6"
                />
              )}
              <text
                x={d.cx}
                y={d.cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isSelected ? '10' : '9'}
                fontWeight={isSelected ? '700' : '500'}
                fill={isSelected ? '#1E3A5F' : '#475569'}
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Lake Kivu (decorative) */}
        <ellipse cx="110" cy="200" rx="18" ry="40" fill="#BAE6FD" opacity="0.6" />
        <text x="96" y="202" fontSize="7" fill="#64748B">Lake</text>
        <text x="96" y="212" fontSize="7" fill="#64748B">Kivu</text>

        {/* Legend */}
        <rect x="310" y="270" width="130" height="95" rx="6" fill="white" fillOpacity="0.9" stroke="#E2E8F0" />
        <text x="318" y="287" fontSize="9" fontWeight="700" fill="#475569">RISK LEVEL</text>
        {[
          { col: '#22C55E', lbl: 'Low (< 40%)' },
          { col: '#F59E0B', lbl: 'Moderate (40–70%)' },
          { col: '#EF4444', lbl: 'High (≥ 70%)' },
          { col: '#94A3B8', lbl: 'No data' },
        ].map(({ col, lbl }, i) => (
          <g key={lbl}>
            <circle cx="320" cy={300 + i * 15} r="5" fill={col} />
            <text x="330" y={304 + i * 15} fontSize="8" fill="#475569">{lbl}</text>
          </g>
        ))}
      </svg>

      {/* Side info panel */}
      <div className="flex-1 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Selected District
          </p>
          <p className="text-lg font-bold text-[#1E3A5F]">{selectedDistrict}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Current Risk Level
          </p>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {label}
          </span>
        </div>

        {riskScore !== null && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Risk Score
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${riskScore}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-sm font-bold" style={{ color }}>{riskScore}%</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-amber-600">Yellow circles</span> = DRC border districts under active monitoring.
            The highlighted district shows the current prediction result.
          </p>
        </div>
      </div>
    </div>
  );
}
