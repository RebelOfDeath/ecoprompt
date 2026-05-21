import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import MessageList from './MessageList'
import SmartInput from './SmartInput'
import { sendChatCompletion } from '../utils/greenptClient'
import { computeCounterfactual, estimateMetrics } from '../utils/metricsCalc'

export default function ChatView() {
  const { activeChatId, activeChat, data, createChat, addMessage, updateTotals } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages?.length, isLoading])

  // Only auto-create a chat when the history is completely empty
  useEffect(() => {
    if (!activeChatId && data.chats.length === 0) createChat()
  }, [activeChatId, data.chats.length, createChat])

  const handleSend = async ({ text, originalText, auditScore, auditBypassed }) => {
    let chatId = activeChatId
    if (!chatId) chatId = createChat()

    const optimizedText = text.trim()
    const origText = originalText?.trim() || optimizedText

    // Count rough token approximation (1 token ≈ 4 chars)
    const pOrig = Math.ceil(origText.length / 4)
    const pOpt = Math.ceil(optimizedText.length / 4)

    const userMsg = {
      role: 'user',
      originalText: origText,
      optimizedText,
      auditScore: auditScore ?? null,
      auditBypassed: auditBypassed ?? false,
      timestamp: new Date().toISOString(),
    }
    addMessage(chatId, userMsg)
    setIsLoading(true)
    setError(null)

    try {
      // Build conversation history for API
      const history = (activeChat?.messages || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role,
          content: m.role === 'user' ? (m.optimizedText || m.originalText) : m.text,
        }))
      history.push({ role: 'user', content: optimizedText })

      const { text: reply, energy } = await sendChatCompletion(history)

      const tOut = energy.outputTokens || Math.ceil(reply.length / 4)
      const eAct = energy.energyMWh
      const cAct = energy.co2Mg

      const metrics = computeCounterfactual(pOrig, pOpt, tOut, eAct, cAct)

      const assistantMsg = {
        role: 'assistant',
        text: reply,
        timestamp: new Date().toISOString(),
        metrics: {
          tokensInput: pOpt,
          tokensOutput: tOut,
          energyUsedMWh: metrics.energyUsedMWh,
          co2EmissionsMg: metrics.co2EmissionsMg,
          energySavedMWh: metrics.energySavedMWh,
          co2SavedMg: metrics.co2SavedMg,
        },
      }

      addMessage(chatId, assistantMsg)
      updateTotals(assistantMsg.metrics)
    } catch (err) {
      setError(err.message)

      // Store fallback response with estimated metrics
      const estimated = estimateMetrics(pOpt, 0)
      const fallbackMsg = {
        role: 'assistant',
        text: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
        metrics: {
          tokensInput: pOpt,
          tokensOutput: 0,
          energyUsedMWh: estimated.energyUsedMWh,
          co2EmissionsMg: estimated.co2EmissionsMg,
          energySavedMWh: 0,
          co2SavedMg: 0,
        },
      }
      addMessage(chatId, fallbackMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
        <p className="text-sm">Select or create a chat to begin.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="shrink-0 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center gap-3">
        <h2 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate flex-1">
          {activeChat.title}
        </h2>
        <span className="text-xs text-gray-400 dark:text-gray-600">
          {activeChat.messages.length} messages
        </span>
      </div>

      {error && (
        <div className="mx-6 mt-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <MessageList messages={activeChat.messages} chatId={activeChat.id} isLoading={isLoading} />
      <div ref={bottomRef} />

      <SmartInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
