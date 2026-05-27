import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { generateMockChats, computeMockTotals } from '../utils/mockData'

const STORAGE_KEY = 'ecoprompt_data'

const defaultData = {
  chats: [],
  dashboardTotals: {
    cumulativeEnergyUsedWh: 0,
    cumulativeEnergySavedWh: 0,
    cumulativeCo2EmissionsMg: 0,
    cumulativeCo2SavedMg: 0,
  },
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Drop chats that were created but never had a message sent
      parsed.chats = (parsed.chats || []).filter(c => c.messages?.length > 0)
      return parsed
    }
  } catch (_) {}
  return defaultData
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) {}
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [data, setData] = useState(() => loadFromStorage())
  const [activeChatId, setActiveChatId] = useState(() => {
    const d = loadFromStorage()
    return d.chats[0]?.id ?? null
  })
  const [view, setView] = useState('chat') // 'chat' | 'dashboard'
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('ecoprompt_dark')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    saveToStorage(data)
  }, [data])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('ecoprompt_dark', String(darkMode))
  }, [darkMode])

  const activeChat = data.chats.find(c => c.id === activeChatId) || null

  const createChat = useCallback(() => {
    const id = uuidv4()
    const chat = {
      id,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    setData(d => ({ ...d, chats: [chat, ...d.chats] }))
    setActiveChatId(id)
    setView('chat')
    return id
  }, [])

  const deleteChat = useCallback((id) => {
    setData(d => ({ ...d, chats: d.chats.filter(c => c.id !== id) }))
    setActiveChatId(prev => (prev === id ? null : prev))
  }, [])

  const addMessage = useCallback((chatId, message) => {
    setData(d => ({
      ...d,
      chats: d.chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              title:
                c.messages.length === 0 && message.role === 'user'
                  ? message.optimizedText?.slice(0, 50) || message.originalText?.slice(0, 50) || 'New Chat'
                  : c.title,
              messages: [...c.messages, message],
            }
          : c,
      ),
    }))
  }, [])

  const updateTotals = useCallback((metrics) => {
    setData(d => ({
      ...d,
      dashboardTotals: {
        cumulativeEnergyUsedWh:
          d.dashboardTotals.cumulativeEnergyUsedWh + metrics.energyUsedMWh / 1000,
        cumulativeEnergySavedWh:
          d.dashboardTotals.cumulativeEnergySavedWh + metrics.energySavedMWh / 1000,
        cumulativeCo2EmissionsMg:
          d.dashboardTotals.cumulativeCo2EmissionsMg + metrics.co2EmissionsMg,
        cumulativeCo2SavedMg:
          d.dashboardTotals.cumulativeCo2SavedMg + metrics.co2SavedMg,
      },
    }))
  }, [])

  const loadDemoData = useCallback(() => {
    const chats = generateMockChats()
    const dashboardTotals = computeMockTotals(chats)
    setData({ chats, dashboardTotals })
    setActiveChatId(chats[0]?.id ?? null)
    setView('dashboard')
  }, [])

  const resetData = useCallback(() => {
    setData(defaultData)
    setActiveChatId(null)
    setView('chat')
  }, [])

  const editUserMessage = useCallback((chatId, msgIndex, newText) => {
    setData(d => ({
      ...d,
      chats: d.chats.map(c =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m, i) =>
                i === msgIndex ? { ...m, optimizedText: newText } : m,
              ),
            }
          : c,
      ),
    }))
  }, [])

  const allMessagesWithMetrics = data.chats.flatMap(c =>
    c.messages.filter(m => m.metrics),
  )

  return (
    <AppContext.Provider
      value={{
        data,
        activeChatId,
        setActiveChatId,
        activeChat,
        view,
        setView,
        darkMode,
        setDarkMode,
        createChat,
        deleteChat,
        addMessage,
        updateTotals,
        editUserMessage,
        loadDemoData,
        resetData,
        allMessagesWithMetrics,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
