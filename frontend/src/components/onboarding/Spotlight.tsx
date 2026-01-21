'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SpotlightProps {
  children: React.ReactNode
  message: string
  isVisible: boolean
  onDismiss: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const PulseRing = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-indigo-500"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{
          scale: [1, 1.5, 2],
          opacity: [0.8, 0.4, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-indigo-400"
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{
          scale: [1, 1.3, 1.7],
          opacity: [0.6, 0.3, 0],
        }}
        transition={{
          duration: 2,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    </div>
  )
}

export const Spotlight: React.FC<SpotlightProps> = ({ 
  children, 
  message, 
  isVisible, 
  onDismiss,
  position = 'bottom'
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-4 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-4 left-1/2 -translate-x-1/2',
    left: 'right-full mr-4 top-1/2 -translate-y-1/2',
    right: 'left-full ml-4 top-1/2 -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-indigo-600 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-indigo-600 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-indigo-600 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-indigo-600 border-y-transparent border-l-transparent',
  }

  return (
    <div className="relative inline-block">
      <div 
        className="relative z-10 cursor-pointer"
        onClick={() => setShowTooltip(true)}
      >
        {children}
        {isVisible && !showTooltip && <PulseRing />}
      </div>

      <AnimatePresence>
        {isVisible && showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 w-64 p-4 bg-indigo-600 text-white rounded-xl shadow-2xl ${positionClasses[position]}`}
          >
            {/* Arrow */}
            <div className={`absolute border-8 ${arrowClasses[position]}`} />
            
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-medium leading-relaxed">
                {message}
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss()
                  setShowTooltip(false)
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
                setShowTooltip(false)
              }}
              className="mt-3 w-full py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
            >
              Got it!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

