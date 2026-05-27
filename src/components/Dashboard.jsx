import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceArea,
} from 'recharts'
import { generateBehavioralProgression } from '../utils/mockData'

function MetricCard({ label, value, unit, sublabel, color, icon }) {
  return (
    <div className={`rounded-2xl border p-5 bg-white dark:bg-gray-900 ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toFixed(4) : value}
        <span className="text-base font-normal ml-1 text-gray-400 dark:text-gray-500">{unit}</span>
      </p>
      {sublabel && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-xs shadow-lg">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {Number(p.value).toFixed(4)} {p.unit}
        </p>
      ))}
    </div>
  )
}

function formatTime(seconds) {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`
  if (seconds < 60) return `${seconds.toFixed(1)} sec`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hr`
  return `${(seconds / 86400).toFixed(1)} days`
}

function formatDistance(meters) {
  if (meters < 0.01) return `${(meters * 1000).toFixed(1)} mm`
  if (meters < 1) return `${(meters * 100).toFixed(1)} cm`
  if (meters < 1000) return `${meters.toFixed(1)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

function formatPercent(p) {
  if (p < 0.01) return `${(p * 1000).toFixed(0)} ppm`
  if (p < 1) return `${p.toFixed(2)}%`
  return `${p.toFixed(1)}%`
}

function formatCount(n) {
  if (n < 0.01) return n.toFixed(4)
  if (n < 1) return n.toFixed(2)
  if (n < 100) return n.toFixed(1)
  return Math.round(n).toLocaleString()
}

// Energy/CO₂ reference points (sources: roughly accepted public figures)
//  - 10W LED bulb → 1 Wh = 360 sec of light
//  - Tesla Model 3: ~150 Wh/km → 1 Wh = 6.67 m
//  - Smartphone battery: ~15 Wh full charge
//  - Google search: ~0.3 Wh per query
//  - Mature tree: ~21 kg CO₂/yr ≈ 0.666 mg CO₂/sec
//  - Gasoline car: ~120 g CO₂/km → 1 mg CO₂ = 8.33 mm
function buildEquivalents(energySavedWh, co2SavedMg) {
  return [
    {
      icon: '💡',
      value: formatTime(energySavedWh * 360),
      label: 'of LED bulb light',
      sub: '10W bulb',
    },
    {
      icon: '🚗',
      value: formatDistance(energySavedWh / 0.15),
      label: 'driven in a Tesla',
      sub: 'Model 3 efficiency',
    },
    {
      icon: '📱',
      value: formatPercent((energySavedWh / 15) * 100),
      label: 'of a phone charge',
      sub: '15 Wh battery',
    },
    {
      icon: '🔍',
      value: formatCount(energySavedWh / 0.3),
      label: 'Google searches',
      sub: '~0.3 Wh each',
    },
    {
      icon: '🌳',
      value: formatTime(co2SavedMg / 0.666),
      label: 'of tree breathing',
      sub: 'CO₂ a mature tree absorbs',
    },
    {
      icon: '🛣️',
      value: formatDistance(co2SavedMg / 120),
      label: 'not driven in a gas car',
      sub: '120 g CO₂/km',
    },
  ]
}

const ProgressionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-xs shadow-lg">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Week of {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: {Number(p.value).toFixed(p.dataKey === 'efficiency' ? 1 : 4)}
          {p.dataKey === 'efficiency' ? '%' : ' mWh'}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, allMessagesWithMetrics } = useApp()
  const totals = data.dashboardTotals
  const progression = useMemo(() => generateBehavioralProgression(), [])

  // Pull a few summary numbers from the progression for the header strip.
  const firstEff = progression[0]?.efficiency ?? 0
  const lastEff = progression[progression.length - 1]?.efficiency ?? 0
  const firstEnergy = progression[0]?.energyPerPromptMWh ?? 0
  const lastEnergy = progression[progression.length - 1]?.energyPerPromptMWh ?? 0
  const efficiencyDelta = lastEff - firstEff
  const energyReduction = firstEnergy > 0 ? ((firstEnergy - lastEnergy) / firstEnergy) * 100 : 0

  const toWh = mwh => mwh * 1000
  const energyUsedWh = totals.cumulativeEnergyUsedWh * 1000
  const energySavedWh = totals.cumulativeEnergySavedWh * 1000
  const energyPotentialWh = energyUsedWh + energySavedWh

  const sessionCount = data.chats.length
  const totalMessages = data.chats.reduce((s, c) => s + c.messages.filter(m => m.role === 'user').length, 0)

  // Per-session chart data
  const sessionData = data.chats
    .filter(c => c.messages.some(m => m.metrics))
    .slice(-10)
    .map(c => {
      const msgs = c.messages.filter(m => m.metrics)
      const actual = msgs.reduce((s, m) => s + (m.metrics.energyUsedMWh || 0), 0)
      const saved = msgs.reduce((s, m) => s + (m.metrics.energySavedMWh || 0), 0)
      return {
        name: c.title.slice(0, 18),
        actual: parseFloat(actual.toFixed(4)),
        potential: parseFloat((actual + saved).toFixed(4)),
      }
    })

  const equivalents = useMemo(
    () => buildEquivalents(totals.cumulativeEnergySavedWh, totals.cumulativeCo2SavedMg),
    [totals.cumulativeEnergySavedWh, totals.cumulativeCo2SavedMg]
  )

  const noData = allMessagesWithMetrics.length === 0

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Counterfactual Impact Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track the energy and carbon savings from your prompt optimizations.
          </p>
        </div>

        {noData ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No telemetry yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Send your first chat message to start collecting impact data.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <MetricCard
                label="Total Energy Used"
                value={totals.cumulativeEnergyUsedWh * 1000}
                unit="mWh"
                sublabel={`≈ ${(totals.cumulativeEnergyUsedWh * 1000).toFixed(6)} Wh`}
                color="border-gray-200 dark:border-gray-700"
                icon="⚡"
              />
              <MetricCard
                label="Energy Prevented"
                value={totals.cumulativeEnergySavedWh * 1000}
                unit="mWh"
                sublabel="Counterfactual savings from optimization"
                color="border-green-200 dark:border-green-800"
                icon="💚"
              />
              <MetricCard
                label="CO₂ Avoided"
                value={totals.cumulativeCo2SavedMg}
                unit="mg CO₂"
                sublabel={`${totals.cumulativeCo2EmissionsMg.toFixed(4)} mg actually emitted`}
                color="border-emerald-200 dark:border-emerald-800"
                icon="🌿"
              />
            </div>

            {/* Real-world equivalents */}
            <div className="mb-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/60 to-green-50/30 dark:from-emerald-950/30 dark:to-green-950/10 p-5">
              <div className="flex items-baseline justify-between mb-1 flex-wrap gap-1">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  What you've saved, in real-world terms
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Tangible equivalents of your prevented energy + CO₂
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {equivalents.map(eq => (
                  <div
                    key={eq.label}
                    className="rounded-xl bg-white/70 dark:bg-gray-900/50 border border-white dark:border-gray-800 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl leading-none">{eq.icon}</span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {eq.value}
                      </p>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {eq.label}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {eq.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Sessions', value: sessionCount },
                { label: 'Prompts Sent', value: totalMessages },
                {
                  label: 'Avg Saving/Prompt',
                  value:
                    totalMessages > 0
                      ? `${((totals.cumulativeEnergySavedWh * 1e6) / totalMessages).toFixed(1)} µWh`
                      : '—',
                },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            {sessionData.length > 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Potential vs Actual Energy Consumption
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  Per session — last {sessionData.length} sessions (mWh)
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sessionData} barGap={4} barCategoryGap="30%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-gray-700"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      unit=" mWh"
                      width={70}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      formatter={v =>
                        v === 'potential' ? 'Potential Baseline' : 'Actual Green'
                      }
                    />
                    <Bar dataKey="potential" name="potential" fill="#fca5a5" radius={[4, 4, 0, 0]} unit=" mWh" />
                    <Bar dataKey="actual" name="actual" fill="#34d399" radius={[4, 4, 0, 0]} unit=" mWh" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Behavioral Progression — year-long view */}
            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <div className="flex items-start justify-between mb-1 gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Behavioral Progression
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Weekly prompt efficiency and energy per prompt — last 52 weeks
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1">
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      +{efficiencyDelta.toFixed(1)}pp
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">efficiency</span>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2.5 py-1">
                    <span className="text-green-700 dark:text-green-300 font-semibold">
                      −{energyReduction.toFixed(0)}%
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">mWh/prompt</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progression} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="effGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[30, 100]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                    width={42}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 'auto']}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={v => `${v.toFixed(2)}`}
                  />
                  <Tooltip content={<ProgressionTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={v => (v === 'efficiency' ? 'Prompt Efficiency (%)' : 'Energy / Prompt (mWh)')}
                  />
                  {/* Annotate high-activity periods */}
                  <ReferenceArea yAxisId="left" x1={progression[5]?.label} x2={progression[9]?.label} fill="#f59e0b" fillOpacity={0.06} />
                  <ReferenceArea yAxisId="left" x1={progression[17]?.label} x2={progression[21]?.label} fill="#f59e0b" fillOpacity={0.06} />
                  <ReferenceArea yAxisId="left" x1={progression[28]?.label} x2={progression[32]?.label} fill="#f59e0b" fillOpacity={0.06} />
                  <ReferenceArea yAxisId="left" x1={progression[40]?.label} x2={progression[44]?.label} fill="#f59e0b" fillOpacity={0.06} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficiency"
                    name="efficiency"
                    stroke="url(#effGradient)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: '#10b981' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="energyPerPromptMWh"
                    name="energy"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={{ r: 3, fill: '#64748b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                Shaded regions mark high-activity periods (deadlines, finals) where prompt efficiency typically dips before recovering.
              </p>
            </div>

            {/* Aggregate energy gauge */}
            {energyPotentialWh > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Cumulative Energy Efficiency
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {energyPotentialWh > 0
                      ? `${((energySavedWh / energyPotentialWh) * 100).toFixed(1)}% saved`
                      : '—'}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (energySavedWh / energyPotentialWh) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {energyUsedWh.toFixed(4)} mWh actual
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    {energyPotentialWh.toFixed(4)} mWh baseline
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
