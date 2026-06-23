const CoinIcon = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coinFace" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#FFF176" />
          <stop offset="30%"  stopColor="#FFD600" />
          <stop offset="70%"  stopColor="#F9A800" />
          <stop offset="100%" stopColor="#B8730A" />
        </radialGradient>
        <radialGradient id="coinEdge" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#D4900A" />
          <stop offset="100%" stopColor="#7A4800" />
        </radialGradient>
        <filter id="coinShadow">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#7A4800" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#coinShadow)">
        <circle cx="16" cy="17.5" r="12.5" fill="url(#coinEdge)" />
        <circle cx="16" cy="15.5" r="12.5" fill="url(#coinFace)" />
      </g>

      <circle cx="16" cy="15.5" r="10.2" fill="none" stroke="#C47A00" strokeWidth="1" opacity="0.5" />

      <text x="16" y="20" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Georgia, serif" fill="#7A4800" opacity="0.9">C</text>
      <line x1="15.2" y1="10.5" x2="15.2" y2="21" stroke="#7A4800" strokeWidth="1.1" opacity="0.75" />
      <line x1="17.4" y1="10.5" x2="17.4" y2="21" stroke="#7A4800" strokeWidth="1.1" opacity="0.75" />

      <ellipse cx="11.5" cy="10.5" rx="3.5" ry="2" fill="white" opacity="0.35" transform="rotate(-30 11.5 10.5)" />
      <circle cx="19.5" cy="9" r="1" fill="white" opacity="0.18" />
    </svg>
  );
};

export default CoinIcon;
