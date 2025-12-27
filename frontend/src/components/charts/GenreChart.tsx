'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Info } from 'lucide-react'

interface GenreData extends Record<string, any> {
  name: string
  count: number
  percentage?: number
}

interface GenreChartProps {
  data: GenreData[]
}

const COLORS = [
  '#4f46e5', // Primary indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#94a3b8', // Other (Slate)
]

export default function GenreChart({ data }: GenreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p>No reading data available for genres yet.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Info className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Reading Genres</h3>
          <p className="text-xs text-slate-500">
            Based on the public books in your library.
          </p>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 40, right: 40, left: 40, bottom: 40 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={80}
              paddingAngle={1}
              label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
              dataKey="count"
              minAngle={15}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs font-medium text-slate-600">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

