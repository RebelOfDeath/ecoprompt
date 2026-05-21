import { useApp } from '../context/AppContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts'

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

export default function Dashboard() {
  const { data, allMessagesWithMetrics } = useApp()
  const totals = data.dashboardTotals

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
