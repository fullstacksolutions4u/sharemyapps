import React from 'react';

const AnimatedCoin = ({
  className = "w-6 h-6",
  textSize = "text-xs",
  fromColor = "from-yellow-300",
  toColor = "to-yellow-600",
  borderColor = "border-yellow-200",
  textColor = "text-yellow-900"
}) => {
  return (
    <div className={`relative ${className} perspective-1000`}>
      <div className="w-full h-full animate-coin-rotate preserve-3d">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${fromColor} ${toColor} border ${borderColor} flex items-center justify-center shadow-md`}>
          <span className={`${textColor} font-bold ${textSize}`}>$</span>
        </div>
      </div>
      <style>{`
        @keyframes coin-rotate {
          0% { transform: rotateY(0); }
          100% { transform: rotateY(360deg); }
        }
        .animate-coin-rotate {
          animation: coin-rotate 2s linear infinite;
          transform-style: preserve-3d;
        }
        .perspective-1000 {
            perspective: 1000px;
        }
        .preserve-3d {
            transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default AnimatedCoin;
