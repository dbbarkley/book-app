'use client'

import React from 'react'
import { BookOpen, CheckCircle, Clock, XCircle, Lock } from 'lucide-react'

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
    { label: 'Reading', value: stats.reading, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'To Read', value: stats.toRead, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Read', value: stats.read, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'DNF', value: stats.dnf, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Private', value: stats.private, icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
      {statItems.map((item) => (
        <div 
          key={item.label}
          className={`${item.bg} rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 duration-200 border border-transparent hover:border-white shadow-sm`}
        >
          <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
          <span className="text-2xl font-bold text-slate-900 leading-tight">
            {item.value}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

