'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Trophy, ArrowRight, BookPlus, UserPlus, MapPin, Target } from 'lucide-react'
import Link from 'next/link'

interface Quest {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  isCompleted: boolean
}

interface DashboardQuestsProps {
  quests: Quest[]
}

export default function DashboardQuests({ quests }: DashboardQuestsProps) {
  const completedCount = quests.filter(q => q.isCompleted).length
  const progressPercentage = (completedCount / quests.length) * 100

  return (
    <section className="rounded-[32px] p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-rim)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
          <Trophy className="text-accent" size={20} />
          Daily Quests
        </h2>
        <span className="text-xl font-bold text-ink">{completedCount}/{quests.length}</span>
      </div>

      <div className="w-full h-1.5 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: 'var(--color-rim)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2.5">
        {quests.map((quest, idx) => (
          <Link key={quest.id} href={quest.href}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                quest.isCompleted
                  ? 'bg-success-light/25 border-success-light/50 opacity-60'
                  : 'bg-canvas/5 border-transparent hover:border-rim-accent hover:bg-surface hover:shadow-md'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border ${
                quest.isCompleted
                  ? 'bg-success-light text-success border-success-light'
                  : 'bg-surface text-ink-3 group-hover:text-accent border-rim'
              }`}>
                {React.cloneElement(quest.icon as React.ReactElement, { size: 16 })}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm truncate ${
                  quest.isCompleted ? 'text-ink-3 line-through' : 'text-ink'
                }`}>
                  {quest.title}
                </h3>
              </div>

              <div className="flex-shrink-0">
                {quest.isCompleted ? (
                  <CheckCircle2 className="text-success" size={18} />
                ) : (
                  <ArrowRight className="text-rim group-hover:text-accent transition-colors" size={15} />
                )}
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {completedCount === quests.length && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-accent-subtle rounded-2xl border border-rim-accent text-center"
        >
          <p className="font-semibold text-sm text-ink">✨ All caught up! Come back tomorrow for more.</p>
        </motion.div>
      )}
    </section>
  )
}

