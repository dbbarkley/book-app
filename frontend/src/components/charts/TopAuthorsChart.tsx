'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { User } from 'lucide-react'

interface AuthorData extends Record<string, any> {
  name: string
  count: number
  percentage?: number
}

interface TopAuthorsChartProps {
  data: AuthorData[]
}

// Amber gradient — most-read gets full accent, others fade
const BAR_COLORS = [
  '#C9A84C',
  '#B8963E',
  '#A07830',
  '#8B6828',
  '#755820',
]

// Truncate long names in the axis label; full name is always visible in the tooltip
const CustomTick = ({ x, y, payload }: any) => {
  if (!payload?.value) return null
  const MAX = 20
  const label = payload.value.length > MAX
    ? payload.value.slice(0, MAX).trimEnd() + '…'
    : payload.value
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={12}
      fontWeight={600}
      fill="rgba(237, 224, 196, 0.65)"
    >
      {label}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, count, percentage } = payload[0].payload
    return (
      <div
        className="px-3 py-2 rounded-xl text-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-rim-accent)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          color: 'var(--color-lit)',
        }}
      >
        <p className="font-bold mb-1">{name}</p>
        <p style={{ color: 'var(--color-accent)' }}>
          {count} book{count !== 1 ? 's' : ''}
          {percentage ? ` · ${percentage}% of library` : ''}
        </p>
      </div>
    )
  }
  return null
}

export default function TopAuthorsChart({ data }: TopAuthorsChartProps) {
  if (!data || data.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <User size={18} style={{ color: 'var(--color-accent)' }} />
        <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-lit)' }}>
          Top Authors
        </h3>
      </div>

      <div style={{ height: Math.max(240, data.length * 36) }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgba(237, 224, 196, 0.06)"
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={130}
              interval={0}
              tick={<CustomTick />}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201, 168, 76, 0.06)' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
