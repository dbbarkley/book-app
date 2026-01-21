import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import { GenreBadgeData, GENRE_METADATA, TIER_NAMES, TIER_QUOTES, apiClient } from '@book-app/shared';
import { GenreBadge } from './GenreBadge';
import { useParams } from 'next/navigation';

interface BadgeDetailModalProps {
  badge: GenreBadgeData | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ContributingBook {
  id: number;
  title: string;
  author_name: string;
  cover_image_url?: string;
  pages_read: number;
  total_pages?: number;
  status: string;
  finished_at?: string;
  xp_contributed: number;
}

const TIER_THRESHOLDS = [
  { min_xp: 250 },
  { min_xp: 1250 },
  { min_xp: 4000 },
  { min_xp: 10000 },
  { min_xp: 25000 }
];

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ badge, isOpen, onClose }) => {
  const params = useParams();
  const userId = parseInt(params.id as string, 10);
  const [contributingBooks, setContributingBooks] = useState<ContributingBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    if (isOpen && badge && userId) {
      setLoadingBooks(true);
      console.log('Fetching contributing books for genre:', badge.genre, 'user:', userId);
      apiClient.getGenreContributingBooks(userId, badge.genre)
        .then((data) => {
          console.log('Received contributing books data:', data);
          setContributingBooks(data.books || []);
        })
        .catch((err) => {
          console.error('Failed to fetch contributing books:', err);
          setContributingBooks([]);
        })
        .finally(() => {
          setLoadingBooks(false);
        });
    } else {
      // Reset when modal closes
      setContributingBooks([]);
      setLoadingBooks(false);
    }
  }, [isOpen, badge, userId]);

  if (!badge) return null;

  const metadata = GENRE_METADATA[badge.genre] || { color: '#94A3B8', glyph: 'Unknown', description: '' };
  const allTierNames = TIER_NAMES[badge.genre] || [];
  const allTierQuotes = TIER_QUOTES[badge.genre] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <GenreBadge 
                    genre={badge.genre} 
                    tierNumber={badge.tier.tier_number} 
                    size="lg"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{badge.genre}</h2>
                    <p className="text-sm text-slate-500">{metadata.glyph}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Your Level
                      </p>
                      <h3 className="text-3xl font-bold text-slate-900">
                        {badge.tier.current_tier}
                      </h3>
                      {allTierQuotes[badge.tier.tier_number - 1] && (
                        <p className="text-sm text-slate-600 italic mt-2">
                          {allTierQuotes[badge.tier.tier_number - 1]}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Total XP
                      </p>
                      <p className="text-3xl font-bold" style={{ color: metadata.color }}>
                        {badge.xp.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {badge.tier.next_tier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-600">
                          Progress to <span className="font-bold text-slate-900">{badge.tier.next_tier.name}</span>
                        </span>
                        <span className="text-slate-900">{badge.tier.progress_to_next}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${badge.tier.progress_to_next}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ backgroundColor: metadata.color }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-right">
                        {badge.tier.next_tier.min_xp - badge.xp} more XP needed
                      </p>
                    </div>
                  )}
                </div>

                {/* All Tiers */}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Tier Progression</h4>
                  <div className="space-y-3">
                    {TIER_THRESHOLDS.map((threshold, index) => {
                      const tierNumber = index + 1;
                      const isUnlocked = badge.xp >= threshold.min_xp;
                      const isCurrent = badge.tier.tier_number === tierNumber;
                      const tierName = allTierNames[index] || `Tier ${tierNumber}`;
                      const tierQuote = allTierQuotes[index] || '';
                      const prevThreshold = index > 0 ? TIER_THRESHOLDS[index - 1].min_xp : 0;

                      return (
                        <motion.div
                          key={tierNumber}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50'
                              : isUnlocked
                              ? 'border-slate-200 bg-slate-50'
                              : 'border-slate-100 bg-white opacity-60'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex-shrink-0">
                            <GenreBadge 
                              genre={badge.genre} 
                              tierNumber={tierNumber} 
                              size="sm"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{tierName}</span>
                              {isCurrent && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  CURRENT
                                </span>
                              )}
                              {isUnlocked && !isCurrent && (
                                <span className="text-xs text-slate-500">✓ Unlocked</span>
                              )}
                            </div>
                            {tierQuote && (
                              <p className="text-xs text-slate-600 italic mb-2">
                                {tierQuote}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              {prevThreshold > 0 
                                ? `${prevThreshold.toLocaleString()} - ${threshold.min_xp.toLocaleString()} XP`
                                : `${threshold.min_xp.toLocaleString()}+ XP required`
                              }
                            </p>
                          </div>
                          {isUnlocked && (
                            <div className="text-right">
                              <p className="text-xs font-medium text-slate-600">Unlocked</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* How it Works */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">How XP Works</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• <strong>1 page read = 1 XP</strong> in each associated genre</li>
                    <li>• Books with multiple genres award XP to all of them</li>
                    <li>• XP is awarded incrementally as you update your reading progress</li>
                    <li>• Completed books award the full page count automatically</li>
                  </ul>
                </div>

                {/* Contributing Books */}
                {!loadingBooks && (
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Books Contributing to This Genre
                    </h4>
                    {contributingBooks.length > 0 ? (
                      <>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {contributingBooks.map((book) => (
                            <motion.div
                              key={book.id}
                              className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {book.cover_image_url && (
                                <img
                                  src={book.cover_image_url}
                                  alt={book.title}
                                  className="w-12 h-18 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-slate-900 text-sm truncate">{book.title}</h5>
                                <p className="text-xs text-slate-600">{book.author_name}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {book.pages_read} pages read
                                  {book.total_pages && ` of ${book.total_pages}`}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold" style={{ color: metadata.color }}>
                                  +{book.xp_contributed} XP
                                </p>
                                <p className="text-xs text-slate-500 capitalize">{book.status}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Total XP from {contributingBooks.length} book{contributingBooks.length !== 1 ? 's' : ''}</span>
                            <span className="text-lg font-bold" style={{ color: metadata.color }}>
                              {contributingBooks.reduce((sum, b) => sum + b.xp_contributed, 0)} XP
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-600">No books found for this genre yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Start reading books in this genre to see them here!</p>
                      </div>
                    )}
                  </div>
                )}

                {loadingBooks && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                    <p className="text-sm text-slate-500 mt-2">Loading contributing books...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

