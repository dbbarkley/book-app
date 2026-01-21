import React from 'react';
import { GenreBadgeData } from '@book-app/shared';
import { GenreBadge } from './GenreBadge';

interface GenreBadgesRowProps {
  badges: GenreBadgeData[];
  size?: 'sm' | 'md';
  onBadgeClick?: (badge: GenreBadgeData) => void;
}

export const GenreBadgesRow: React.FC<GenreBadgesRowProps> = ({ badges, size = 'sm', onBadgeClick }) => {
  if (!badges || badges.length === 0) return null;

  // Only show top 4 badges by XP, others can be seen in detail view
  const topBadges = badges.slice(0, 4);

  return (
    <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
      {topBadges.map((badge) => (
        <div key={badge.genre} className="flex-shrink-0" title={`${badge.tier.current_tier} in ${badge.genre}`}>
          <GenreBadge 
            genre={badge.genre} 
            tierNumber={badge.tier.tier_number} 
            size={size}
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
          />
        </div>
      ))}
      {badges.length > 4 && (
        <div className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100 flex-shrink-0">
          +{badges.length - 4} more
        </div>
      )}
    </div>
  );
};

