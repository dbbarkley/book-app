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
    <section className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            Daily Quests
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-slate-900">{completedCount}/{quests.length}</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-3">
        {quests.map((quest, idx) => (
          <Link key={quest.id} href={quest.href}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                quest.isCompleted 
                  ? 'bg-emerald-50/30 border-emerald-50 opacity-75' 
                  : 'bg-slate-50 border-transparent hover:border-brand-indigo hover:bg-white hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                quest.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 group-hover:text-brand-indigo shadow-sm'
              }`}>
                {React.cloneElement(quest.icon as React.ReactElement, { size: 18 })}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-sm truncate ${quest.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {quest.title}
                </h3>
              </div>

              <div className="flex-shrink-0">
                {quest.isCompleted ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <div className="text-slate-300 group-hover:text-brand-indigo transition-colors">
                    <ArrowRight size={16} />
                  </div>
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
          className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center"
        >
          <p className="text-amber-800 font-bold text-sm">✨ All caught up! Come back tomorrow for more.</p>
        </motion.div>
      )}
    </section>
  )
}

