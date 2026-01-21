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
  isLoading 
}: GoalSettingModalProps) {
  const [goal, setGoal] = useState(12)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSave = async () => {
    await onSave(goal)
    setIsSuccess(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const increment = () => setGoal(prev => prev + 1)
  const decrement = () => setGoal(prev => Math.max(1, prev - 1))

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
                >
                  <Sparkles size={40} />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Goal Set!</h2>
                  <p className="text-slate-500">
                    Let's make 2026 your best reading year yet.
                  </p>
                </div>
                {/* Confetti effect placeholder */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        top: '50%', 
                        left: '50%',
                        opacity: 1,
                        scale: 0
                      }}
                      animate={{ 
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        opacity: 0,
                        scale: Math.random() * 1.5
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: ['#6366f1', '#f43f5e', '#eab308', '#22c55e'][Math.floor(Math.random() * 4)] 
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2026 Reading Goal</h2>
                  <p className="text-slate-500">
                    How many books do you want to read this year?
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={decrement}
                    className="p-4 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-indigo-600"
                  >
                    <ChevronDown size={32} />
                  </button>
                  
                  <div className="text-center">
                    <span className="text-7xl font-black text-slate-900 tabular-nums">
                      {goal}
                    </span>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Books
                    </p>
                  </div>

                  <button 
                    onClick={increment}
                    className="p-4 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-indigo-600"
                  >
                    <ChevronUp size={32} />
                  </button>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Set My Goal'
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors"
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

