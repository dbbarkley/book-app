'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { BookOpen } from 'lucide-react'

interface GenreData extends Record<string, any> {
  name: string
  count: number
  percentage?: number
}

interface GenreChartProps {
  data: GenreData[]
}

const COLORS = [
  '#C9A84C',
  '#A07830',
  '#5A9E7A',
  '#7C9E6A',
  '#8B7355',
  '#6B8E7A',
  '#9E8A5A',
]

const RADIAN = Math.PI / 180

const renderLabel = ({
  cx, cy, midAngle, outerRadius, name, percent, index,
}: any) => {
  if (percent < 0.05) return null

  const labelRadius = outerRadius + 32
  const lx = cx + labelRadius * Math.cos(-midAngle * RADIAN)
  const ly = cy + labelRadius * Math.sin(-midAngle * RADIAN)
  const anchor = lx > cx ? 'start' : 'end'

  const x1 = cx + (outerRadius + 6) * Math.cos(-midAngle * RADIAN)
  const y1 = cy + (outerRadius + 6) * Math.sin(-midAngle * RADIAN)
  const x2 = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN)
  const y2 = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN)

  return (
    <g key={`label-${index}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={COLORS[index % COLORS.length]}
        strokeWidth={1.5}
        opacity={0.7}
      />
      <text x={lx} y={ly - 7}
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
        fill="var(--color-lit)"
      >
        {name}
      </text>
      <text x={lx} y={ly + 7}
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
        fill="var(--color-accent)"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0]
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
        <p className="font-bold">{name}</p>
        <p style={{ color: 'var(--color-accent)' }}>
          {value} {value === 1 ? 'book' : 'books'}
        </p>
      </div>
    )
  }
  return null
}

export default function GenreChart({ data }: GenreChartProps) {
  if (!data || data.length === 0) return null

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={18} style={{ color: 'var(--color-accent)' }} />
        <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--color-lit)' }}>
          Reading Genres
        </h3>
      </div>

      {/*
        px-16 reserves physical space for labels on left/right.
        [&_svg]:overflow-visible lets SVG text render outside its own bounds
        without being clipped by the SVG viewport.
      */}
      <div className="h-[320px] w-full px-16 [&_svg]:overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="count"
              minAngle={5}
              label={renderLabel}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
