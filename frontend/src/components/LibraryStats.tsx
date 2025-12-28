'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Clock, XCircle, Lock } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 }
}

interface LibraryStatsProps {
  stats: {
    reading: number
    toRead: number
    read: number
    dnf: number
    private: number
  }
}

export default function LibraryStats({ stats }: LibraryStatsProps) {
  const statItems = [
    { id: 'reading', label: 'Reading', value: stats.reading, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'to-read', label: 'To Read', value: stats.toRead, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'read', label: 'Read', value: stats.read, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'dnf', label: 'DNF', value: stats.dnf, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'private', label: 'Private', value: stats.private, icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50' },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-10"
    >
      {statItems.map((stat) => (
        <motion.button 
          key={stat.label}
          variants={item}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => scrollToSection(stat.id)}
          className={`${stat.bg} rounded-xl p-3 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-md border border-transparent hover:border-white shadow-sm cursor-pointer`}
        >
          <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
          <span className="text-xl font-bold text-slate-900 leading-tight">
            {stat.value}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 line-clamp-1">
            {stat.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  )
}

