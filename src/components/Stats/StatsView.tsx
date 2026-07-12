import { useEffect, useState, useCallback } from 'react'
import { Layout } from '../Layout'
import { getAllSamples, getTotalSampleCount } from '../../db/database'
import { BANGLA_CHARACTERS, VOWELS, CONSONANTS, NUMERALS } from '../../data/banglaChars'
import type { Sample } from '../../types'

interface Stats {
  total: number
  byCategory: { vowel: number; consonant: number; numeral: number }
  byDevice: { mouse: number; touch: number; pen: number }
  last7Days: { date: string; count: number }[]
  topCharacters: { char: string; transliteration: string; count: number }[]
  bottomCharacters: { char: string; transliteration: string; count: number }[]
}

function emptyStats(): Stats {
  return {
    total: 0,
    byCategory: { vowel: 0, consonant: 0, numeral: 0 },
    byDevice: { mouse: 0, touch: 0, pen: 0 },
    last7Days: [],
    topCharacters: [],
    bottomCharacters: [],
  }
}

function computeStats(samples: Sample[]): Stats {
  const stats = emptyStats()
  stats.total = samples.length

  const charCounts = new Map<number, number>()
  const dayCounts = new Map<string, number>()

  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayCounts.set(key, 0)
  }

  for (const s of samples) {
    if (s.category === 'vowel') stats.byCategory.vowel++
    else if (s.category === 'consonant') stats.byCategory.consonant++
    else if (s.category === 'numeral') stats.byCategory.numeral++

    if (s.deviceType === 'mouse') stats.byDevice.mouse++
    else if (s.deviceType === 'touch') stats.byDevice.touch++
    else if (s.deviceType === 'pen') stats.byDevice.pen++

    charCounts.set(s.characterId, (charCounts.get(s.characterId) ?? 0) + 1)

    const dayKey = new Date(s.createdAt).toISOString().slice(0, 10)
    if (dayCounts.has(dayKey)) {
      dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1)
    }
  }

  stats.last7Days = Array.from(dayCounts.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  const charData = BANGLA_CHARACTERS.map((c) => ({
    char: c.unicode,
    transliteration: c.transliteration,
    count: charCounts.get(c.id) ?? 0,
  }))

  stats.topCharacters = [...charData].sort((a, b) => b.count - a.count).slice(0, 5)
  stats.bottomCharacters = [...charData]
    .filter((c) => c.count > 0)
    .sort((a, b) => a.count - b.count)
    .slice(0, 5)

  if (stats.bottomCharacters.length === 0) {
    stats.bottomCharacters = charData.slice(0, 5).map((c) => ({ ...c, count: 0 }))
  }

  return stats
}

const CATEGORY_INFO = [
  { key: 'vowel' as const, label: 'Vowels', total: VOWELS.length, color: 'bg-blue-500' },
  { key: 'consonant' as const, label: 'Consonants', total: CONSONANTS.length, color: 'bg-green-500' },
  { key: 'numeral' as const, label: 'Numerals', total: NUMERALS.length, color: 'bg-purple-500' },
]

const DEVICE_LABELS: Record<string, string> = { mouse: 'Mouse', touch: 'Touch', pen: 'Pen' }

export default function StatsView() {
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const total = await getTotalSampleCount()
    if (total === 0) {
      setStats(emptyStats())
      setLoading(false)
      return
    }
    const samples = await getAllSamples()
    setStats(computeStats(samples))
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-gray-500">
          Loading stats...
        </div>
      </Layout>
    )
  }

  if (stats.total === 0) {
    return (
      <Layout>
        <div className="flex h-full flex-col items-center justify-center text-gray-500">
          <span className="text-4xl mb-2">📊</span>
          <p>No samples yet. Start drawing!</p>
        </div>
      </Layout>
    )
  }

  const maxDayCount = Math.max(1, ...stats.last7Days.map((d) => d.count))

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Total */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Samples</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              By Category
            </h2>
            <div className="space-y-2">
              {CATEGORY_INFO.map((cat) => {
                const count = stats.byCategory[cat.key]
                const pct = cat.total > 0 ? (count / (cat.total * 10)) * 100 : 0
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{cat.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded-full ${cat.color}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Device breakdown */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              By Device
            </h2>
            <div className="flex gap-4">
              {Object.entries(stats.byDevice).map(([device, count]) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={device} className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {DEVICE_LABELS[device] ?? device}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                    <div className="text-xs text-gray-400">{pct.toFixed(0)}%</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Last 7 days */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Last 7 Days
            </h2>
            <div className="flex items-end justify-between gap-2" style={{ height: '100px' }}>
              {stats.last7Days.map((day) => {
                const heightPct = (day.count / maxDayCount) * 100
                const label = new Date(day.date).toLocaleDateString('en', { weekday: 'short' })
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {day.count > 0 ? day.count : ''}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-blue-500 transition-all"
                        style={{ height: `${Math.max(2, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top / Bottom characters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">
                Most Collected
              </h2>
              <div className="space-y-1">
                {stats.topCharacters.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white">
                      {c.char} <span className="text-gray-400">({c.transliteration})</span>
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                Needs More
              </h2>
              <div className="space-y-1">
                {stats.bottomCharacters.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white">
                      {c.char} <span className="text-gray-400">({c.transliteration})</span>
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
