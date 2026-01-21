import React from 'react';
import { motion } from 'framer-motion';
import { GenreBadgeData, TIER_NAMES } from '@book-app/shared';
import { GenreBadge } from './GenreBadge';

interface GamificationDashboardProps {
  badges: GenreBadgeData[];
  onBadgeClick?: (badge: GenreBadgeData) => void;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ badges, onBadgeClick }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 italic">No genre medals earned yet. Keep reading to level up!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => (
        <motion.div 
          key={badge.genre}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <GenreBadge 
              genre={badge.genre} 
              tierNumber={badge.tier.tier_number} 
              size="md"
              onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 leading-none mb-1">
                {badge.tier.current_tier}
              </h4>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                {badge.genre}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">{badge.xp.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Total XP</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-slate-500">Progress to {badge.tier.next_tier?.name || TIER_NAMES[badge.genre]?.[4] || 'Next Tier'}</span>
              <span className="text-slate-900">{badge.tier.progress_to_next}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500" 
                initial={{ width: 0 }}
                animate={{ width: `${badge.tier.progress_to_next}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ 
                  backgroundColor: badge.tier.tier_number >= 5 ? '#7C3AED' : '#3B82F6'
                }}
              />
            </div>
            {badge.tier.next_tier && (
              <p className="text-[9px] text-slate-400 text-right italic">
                {badge.tier.next_tier.min_xp - badge.xp} more XP needed
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

