'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, ChevronUp, ChevronDown } from 'lucide-react'

interface GoalSettingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (goal: number) => Promise<void>
  isLoading?: boolean
}

export default function GoalSettingModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: GoalSettingModalProps) {
  const [goal, setGoal] = useState(12)
  const [isSuccess, setIsSuccess] = useState(false)
  const year = new Date().getFullYear()

  const handleSave = async () => {
    await onSave(goal)
    setIsSuccess(true)
    setTimeout(() => onClose(), 2000)
  }

  const increment = () => setGoal(prev => prev + 1)
  const decrement = () => setGoal(prev => Math.max(1, prev - 1))

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-sm rounded-[28px] overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            {isSuccess ? (
              /* ── Success state ── */
              <div className="p-10 text-center space-y-5 relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
                >
                  <Sparkles size={36} style={{ color: 'var(--color-accent)' }} />
                </motion.div>
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
                    Goal Set!
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                    Let's make {year} your best reading year yet.
                  </p>
                </div>
                {/* Confetti particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(18)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ top: '50%', left: '50%', opacity: 1, scale: 0 }}
                      animate={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: 0,
                        scale: Math.random() * 1.2 + 0.3,
                      }}
                      transition={{ duration: 1.4, ease: 'easeOut', delay: i * 0.03 }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: ['var(--color-accent)', '#c97c5d', '#7c9e87', '#8fa8c8'][i % 4],
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* ── Goal picker ── */
              <div className="p-8 space-y-8">
                {/* Header */}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)' }}>
                    <Target size={26} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-lit)' }}>
                    {year} Reading Goal
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-lit-3)' }}>
                    How many books do you want to read this year?
                  </p>
                </div>

                {/* Number picker */}
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={decrement}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                  >
                    <ChevronDown size={22} />
                  </button>

                  <div className="text-center min-w-[80px]">
                    <span className="text-7xl font-black tabular-nums" style={{ color: 'var(--color-lit)' }}>
                      {goal}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--color-lit-3)' }}>
                      Books
                    </p>
                  </div>

                  <button
                    onClick={increment}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95"
                    style={{ backgroundColor: 'var(--color-grove)', border: '1px solid var(--color-rim)', color: 'var(--color-lit-2)' }}
                  >
                    <ChevronUp size={22} />
                  </button>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-on)' }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'var(--color-accent-on)', borderTopColor: 'transparent' }} />
                    ) : (
                      'Set My Goal'
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm font-medium transition-all hover:opacity-70"
                    style={{ color: 'var(--color-lit-3)' }}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
