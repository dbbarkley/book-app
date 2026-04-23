'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Clock, XCircle, Lock, Target } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1 }
}

interface LibraryStatsProps {
  stats: {
    reading: number
    toRead: number
    read: number
    readThisYear?: number
    dnf: number
    private: number
  }
  goal?: number | null
  onGoalClick?: () => void
}

export default function LibraryStats({ stats, goal, onGoalClick }: LibraryStatsProps) {
  const statItems = [
    { id: 'reading',  label: 'Reading',    value: stats.reading, icon: BookOpen   },
    { id: 'to-read',  label: 'To Read',    value: stats.toRead,  icon: Clock      },
    { id: 'read',     label: 'Total Read', value: stats.read,    icon: CheckCircle },
    { id: 'dnf',      label: 'DNF',        value: stats.dnf,     icon: XCircle    },
    { id: 'private',  label: 'Private',    value: stats.private, icon: Lock       },
  ]

  if (goal) {
    const readValue = stats.readThisYear ?? stats.read
    const progress = Math.min(100, Math.round((readValue / goal) * 100))
    statItems.unshift({
      id: 'reading-hero',
      label: `${progress}% Goal`,
      value: `${readValue}/${goal}`,
      icon: Target,
      isGoal: true,
    })
  } else {
    statItems.unshift({
      id: 'reading-hero',
      label: 'Set Goal',
      value: '—',
      icon: Target,
      isGoal: true,
    })
  }

  const handleStatClick = (stat: any) => {
    if (stat.isGoal && onGoalClick) {
      onGoalClick()
    } else {
      scrollToSection(stat.id)
    }
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const offsetPosition = elementRect - bodyRect - offset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mb-10 w-full min-w-0"
    >
      {/* Mobile: horizontal scroll strip — Desktop: grid */}
      <div
        className={`
          flex gap-2 overflow-x-auto pb-1 scrollbar-hide min-w-0 w-full
          sm:grid sm:overflow-visible sm:pb-0
          ${goal ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}
        `}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {statItems.map((stat) => (
          <motion.button
            key={stat.label}
            variants={item}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleStatClick(stat)}
            className="flex-none w-24 sm:w-auto rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-rim)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-rim-accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-rim)')}
          >
            <stat.icon className="w-4 h-4 mb-1.5" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xl font-bold leading-tight" style={{ color: 'var(--color-lit)' }}>
              {stat.value}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold mt-0.5 line-clamp-1" style={{ color: 'var(--color-lit-3)' }}>
              {stat.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
