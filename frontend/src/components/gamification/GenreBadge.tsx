import React from 'react';
import { motion } from 'framer-motion';
import { GENRE_METADATA, TIER_NAMES } from '@book-app/shared';
import { GenrePaths } from './GenreGlyphs';

interface GenreBadgeProps {
  genre: string;
  tierNumber: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

export const GenreBadge: React.FC<GenreBadgeProps> = ({ 
  genre, 
  tierNumber, 
  size = 'md',
  showLabel = false,
  onClick
}) => {
  const metadata = GENRE_METADATA[genre] || { color: '#94A3B8' };
  const tierName = TIER_NAMES[genre]?.[tierNumber - 1] || TIER_NAMES[genre]?.[0] || 'Beginner';
  const color = metadata.color;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const strokeWidth = tierNumber >= 5 ? 2.2 : tierNumber >= 3 ? 1.8 : 1.5;
  const glyphColor = tierNumber >= 3 ? '#FFFFFF' : color;

  return (
    <div className="flex flex-col items-center gap-1 group">
      <motion.div 
        className={`${sizeClasses[size]} relative flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={onClick ? { scale: 1.1 } : { scale: 1 }}
        onClick={onClick}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id={`grad-${genre}-4`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`${color}88`} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <linearGradient id={`grad-${genre}-5`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="30%" stopColor={color} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Tier 5: Faceted Gem Shape */}
          {tierNumber >= 5 ? (
            <path 
              d="M8 2H16L22 8V16L16 22H8L2 16V8L8 2Z" 
              fill={`url(#grad-${genre}-5)`}
              stroke={color}
              strokeWidth="0.5"
            />
          ) : null}

          {/* Tier 3-4: Background Circle */}
          {tierNumber === 3 || tierNumber === 4 ? (
            <circle 
              cx="12" 
              cy="12" 
              r="11" 
              fill={tierNumber === 4 ? `url(#grad-${genre}-4)` : color} 
            />
          ) : null}

          {/* Tier 2: Outer Ring */}
          {tierNumber === 2 ? (
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1" opacity="0.6" />
          ) : null}

          {/* Tier 4 Radiant Halo */}
          {tierNumber === 4 && (
            <circle 
              cx="12" cy="12" r="11.5" 
              stroke={color} 
              strokeWidth="0.5" 
              strokeDasharray="2 1" 
              opacity="0.8" 
            />
          )}

          {/* Tier 5 Sparkles Animation */}
          {tierNumber >= 5 && (
            <>
              <motion.circle 
                cx="5" cy="5" r="0.5" fill="white"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.circle 
                cx="19" cy="19" r="0.5" fill="white"
                animate={{ opacity: [0.8, 0.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}

          {/* Central Glyph */}
          <g transform={tierNumber >= 2 ? "translate(1.8, 1.8) scale(0.85)" : ""}>
            {GenrePaths[genre]?.(glyphColor, strokeWidth)}
          </g>
        </svg>
      </motion.div>
      
      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-bold text-slate-900 leading-none">{tierName}</p>
          <p className="text-[10px] text-slate-500">{genre}</p>
        </div>
      )}
    </div>
  );
};

