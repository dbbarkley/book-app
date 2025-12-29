import React from 'react';

/**
 * Avatar Component - Standardized user and author images
 * 
 * Features:
 * - Multiple size presets
 * - Fallback to UI Avatars (initials) when no image is provided
 * - Handles broken image URLs gracefully
 * - Consistent border and shadow styling
 */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  borderColor?: string;
  showStatus?: boolean;
}

const sizeMap: Record<AvatarSize, string> = {
  'xs': 'w-6 h-6 text-[10px]',
  'sm': 'w-8 h-8 text-xs',
  'md': 'w-10 h-10 text-sm',
  'lg': 'w-16 h-16 text-base',
  'xl': 'w-24 h-24 text-xl',
  '2xl': 'w-32 h-32 text-2xl',
};

const statusSizeMap: Record<AvatarSize, string> = {
  'xs': 'w-1.5 h-1.5',
  'sm': 'w-2 h-2',
  'md': 'w-2.5 h-2.5',
  'lg': 'w-4 h-4',
  'xl': 'w-5 h-5',
  '2xl': 'w-6 h-6',
};

export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  borderColor = 'ring-slate-100',
  showStatus = false
}: AvatarProps) {
  // Use UI Avatars as a consistent fallback if no avatar_url is provided
  // This looks much better than a generic placeholder icon
  const fallbackUrl = name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`
    : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`
        ${sizeMap[size]} 
        rounded-full 
        overflow-hidden 
        bg-slate-200 
        flex 
        items-center 
        justify-center 
        ring-2 
        ${borderColor}
        shadow-sm
      `}>
        <img
          src={src || fallbackUrl}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = fallbackUrl;
          }}
        />
      </div>
      
      {showStatus && (
        <div className={`
          absolute 
          bottom-0 
          right-0 
          ${statusSizeMap[size]} 
          bg-emerald-500 
          rounded-full 
          border-2 
          border-white
          shadow-sm
        `} />
      )}
    </div>
  );
}
