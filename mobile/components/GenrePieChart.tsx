/**
 * GenrePieChart
 *
 * Donut chart showing the top-5 genres from a user's reading stats.
 * Used on both the own-profile screen and other-user profile screens.
 */
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import { BookOpen } from 'lucide-react-native'
import { Colors } from '@/constants/colors'

const PIE_COLORS = [
  Colors.accent,  // gold
  '#4CAF82',      // teal-green
  '#6B8FD6',      // soft blue
  '#D67B4C',      // warm orange
  '#B06BD6',      // purple
]

interface GenrePieChartProps {
  items: Array<{ name: string; count: number }>
}

export default function GenrePieChart({ items }: GenrePieChartProps) {
  const top     = items.slice(0, 5)
  const total   = top.reduce((s, i) => s + i.count, 0)
  const SIZE    = 140
  const R       = 54
  const INNER_R = 30
  const cx      = SIZE / 2
  const cy      = SIZE / 2

  const slices: { path: string; color: string; item: typeof top[0] }[] = []
  let startAngle = -Math.PI / 2   // start at top

  for (let i = 0; i < top.length; i++) {
    const slice    = top[i]
    const portion  = slice.count / total
    const endAngle = startAngle + portion * 2 * Math.PI

    const gap = 0.04
    const s   = startAngle + gap / 2
    const e   = endAngle   - gap / 2

    const x1  = cx + R * Math.cos(s)
    const y1  = cy + R * Math.sin(s)
    const x2  = cx + R * Math.cos(e)
    const y2  = cy + R * Math.sin(e)
    const ix1 = cx + INNER_R * Math.cos(e)
    const iy1 = cy + INNER_R * Math.sin(e)
    const ix2 = cx + INNER_R * Math.cos(s)
    const iy2 = cy + INNER_R * Math.sin(s)
    const large = portion > 0.5 ? 1 : 0

    const path =
      `M ${x1} ${y1} ` +
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2} ` +
      `L ${ix1} ${iy1} ` +
      `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ix2} ${iy2} ` +
      `Z`

    slices.push({ path, color: PIE_COLORS[i % PIE_COLORS.length], item: slice })
    startAngle = endAngle
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <BookOpen size={13} color={Colors.lit3} />
        <Text style={styles.title}>Top Genres</Text>
      </View>

      <View style={styles.pieRow}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            {slices.map(({ path, color }, i) => (
              <Path key={i} d={path} fill={color} />
            ))}
          </G>
        </Svg>

        <View style={styles.legend}>
          {slices.map(({ color, item }) => (
            <View key={item.name} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.legendCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.rim,
    padding: 18,
    gap: 14,
  },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:   { fontSize: 14, fontWeight: '700', color: Colors.lit },
  pieRow:  { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend:  { flex: 1, gap: 10 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  legendName:  { flex: 1, fontSize: 13, color: Colors.lit2 },
  legendCount: { fontSize: 12, fontWeight: '700', color: Colors.lit2, minWidth: 18, textAlign: 'right' },
})
