const PieChart = ({ percentage, size = 200, strokeWidth = 20, color = '#3b82f6', backgroundColor = '#BC8F8F', showPercentage = true, label = '', children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={backgroundColor} strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700 ease-in-out" style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-3xl font-bold" style={{ color: color }}>
            {Math.round(percentage)}%
          </span>
        )}
        {label && <span className="text-sm text-gray-600 mt-1 font-medium">{label}</span>}
        {children}
      </div>
    </div>
  );
};

export default PieChart;
