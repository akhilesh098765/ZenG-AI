import React from 'react';

interface ZILogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const ZILogo: React.FC<ZILogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    xs: { box: 'w-6 h-6', svg: 'w-4 h-4', text: 'text-sm', sub: 'text-[8px]' },
    sm: { box: 'w-8 h-8', svg: 'w-5 h-5', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10', svg: 'w-6 h-6', text: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 'w-14 h-14', svg: 'w-9 h-9', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', svg: 'w-14 h-14', text: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Colorful Gradient Container with Vibrant Glow */}
      <div className={`relative ${dimensions.box} rounded-2xl p-[2px] shadow-xl group transition-transform duration-300 hover:scale-105`}>
        {/* Animated Spectrum Background Gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 via-amber-400 via-emerald-400 via-cyan-400 to-indigo-600 blur-[2px] opacity-90 group-hover:opacity-100 transition-opacity animate-pulse" />
        
        {/* Ambient Outer Halo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 opacity-40 blur-md -z-10 group-hover:opacity-75 transition-opacity" />

        {/* Inner Card */}
        <div className="w-full h-full bg-slate-950/95 rounded-[14px] flex items-center justify-center relative overflow-hidden backdrop-blur-md">
          {/* Subtle multi-color background lighting */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-400/30 rounded-full blur-sm" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-pink-500/30 rounded-full blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Artistic ZI Colorful Monogram SVG */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${dimensions.svg} relative z-10 drop-shadow-[0_2px_10px_rgba(247,37,133,0.5)]`}
          >
            <defs>
              {/* Vibrant Diagonal Gradients */}
              <linearGradient id="zGrad1" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="50%" stopColor="#4facfe" />
                <stop offset="100%" stopColor="#7000ff" />
              </linearGradient>

              <linearGradient id="zGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f72585" />
                <stop offset="50%" stopColor="#ff007f" />
                <stop offset="100%" stopColor="#ffb703" />
              </linearGradient>

              <linearGradient id="iGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffb703" />
                <stop offset="40%" stopColor="#fb8500" />
                <stop offset="80%" stopColor="#06d6a0" />
                <stop offset="100%" stopColor="#00f2fe" />
              </linearGradient>

              <radialGradient id="dotGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#f72585" />
              </radialGradient>

              <filter id="ziGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Letter 'Z' - Sharp, Dynamic & Multi-layered */}
            {/* Top horizontal arm */}
            <path
              d="M18 26 C18 22.5 20.8 20 24.5 20 L58 20 C62 20 64 23 62 26.5 L36 68 L60 68 C64 68 66 70.5 66 74 C66 77.5 63.5 80 59.5 80 L20 80 C16 80 14 77 16 73.5 L42 32 L24 32 C20 32 18 29.5 18 26 Z"
              fill="url(#zGrad1)"
              filter="url(#ziGlow)"
            />

            {/* Glowing inner accent on Z diagonal */}
            <path
              d="M33 46 L58 24 L52 24 L27 66 L33 66 Z"
              fill="url(#zGrad2)"
              opacity="0.9"
            />

            {/* Letter 'I' - Vivid Pillar with Crown Dot */}
            {/* Stem */}
            <rect
              x="72"
              y="38"
              width="13"
              height="42"
              rx="6.5"
              fill="url(#iGrad)"
              filter="url(#ziGlow)"
            />

            {/* Dot of the 'I' */}
            <circle
              cx="78.5"
              cy="23"
              r="7.5"
              fill="url(#dotGrad)"
            />

            {/* Sparkle star at the intersection */}
            <path
              d="M58 20 Q58 28 66 28 Q58 28 58 36 Q58 28 50 28 Q58 28 58 20 Z"
              fill="#ffffff"
              opacity="0.95"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-white ${dimensions.text} font-sans`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300">
                ZI
              </span>
              <span className="text-slate-100 ml-1.5 font-bold">ZenG</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              AI
            </span>
          </div>
          <span className={`text-slate-400 font-mono tracking-widest uppercase mt-1 ${dimensions.sub}`}>
            Cognitive Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

// Re-export BrandLogo alias for seamless compatibility
export const BrandLogo = ZILogo;
