import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuditWorker } from '../hooks/useAuditWorker'

// ── Audit Modal ────────────────────────────────────────────────────────────────

function AnnotatedText({ text, spans }) {
  if (!spans.length) return <span>{text}</span>

  const segments = []
  let cursor = 0
  const sorted = [...spans].sort((a, b) => a.charStart - b.charStart)

  for (const span of sorted) {
    if (cursor < span.charStart) {
      segments.push({ text: text.slice(cursor, span.charStart), highlight: false })
    }
    segments.push({ text: text.slice(span.charStart, span.charEnd), highlight: true })
    cursor = span.charEnd
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false })
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded px-0.5 border-b-2 border-red-400 dark:border-red-500 not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

function AuditModal({ text, spans, score, onClose, onBypass, onReaudit, auditPending }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const scoreColor =
    score >= 90 ? 'text-green-600 dark:text-green-400'
    : score >= 70 ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400'

  const scoreBar =
    score >= 90 ? 'bg-green-500'
    : score >= 70 ? 'bg-yellow-500'
    : 'bg-red-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Audit Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Score row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Prompt efficiency</span>
                <span className={`text-xs font-semibold ${scoreColor}`}>{score}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {spans.length} region{spans.length !== 1 ? 's' : ''} flagged
            </span>
          </div>

          {/* Annotated prompt */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your prompt</p>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              <AnnotatedText text={text} spans={spans} />
            </div>
          </div>

          {/* Flagged regions list */}
          {spans.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Flagged regions</p>
              <ul className="space-y-2">
                {spans.map((span, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <code className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 break-all">
                        "{text.slice(span.charStart, span.charEnd)}"
                      </code>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{span.advice}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition font-medium"
          >
            ← Edit &amp; Fix
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onReaudit}
              disabled={auditPending}
              className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              {auditPending ? 'Re-auditing…' : 'Re-Audit'}
            </button>
            <button
              onClick={onBypass}
              className="px-4 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition"
            >
              Send Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SmartInput ─────────────────────────────────────────────────────────────────

export default function SmartInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [auditResult, setAuditResult] = useState(null) // { spans, score }
  const [auditPending, setAuditPending] = useState(false)
  const [origText, setOrigText] = useState('')
  const [auditedText, setAuditedText] = useState('')
  const textareaRef = useRef(null)
  const { modelStatus, getHighlightSpans } = useAuditWorker()

  const doSend = useCallback(
    (finalText, originalText, meta = {}) => {
      onSend({ text: finalText, originalText: originalText || finalText, ...meta })
      setText('')
      setAuditResult(null)
      setModalOpen(false)
      setOrigText('')
    },
    [onSend],
  )

  const runAudit = useCallback(async (trimmed) => {
    setAuditPending(true)
    try {
      const result = await getHighlightSpans(trimmed)
      setAuditPending(false)
      return result
    } catch (err) {
      console.error('Audit failed:', err)
      setAuditPending(false)
      return null
    }
  }, [getHighlightSpans])

  const handleSendOrAudit = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || auditPending || modelStatus !== 'ready') return

    const result = await runAudit(trimmed)
    if (!result) {
      // Audit error — send without blocking
      doSend(trimmed, trimmed, { auditScore: null, auditBypassed: false })
      return
    }

    if (result.spans.length === 0) {
      doSend(trimmed, origText || trimmed, { auditScore: result.score, auditBypassed: false })
    } else {
      setOrigText(prev => prev || trimmed)
      setAuditedText(trimmed)
      setAuditResult(result)
      setModalOpen(true)
    }
  }, [text, disabled, auditPending, modelStatus, runAudit, origText, doSend])

  const handleModalReaudit = useCallback(async () => {
    const trimmed = text.trim()
    const result = await runAudit(trimmed)
    if (!result) return
    if (result.spans.length === 0) {
      doSend(trimmed, origText || trimmed, { auditScore: result.score, auditBypassed: false })
    } else {
      setAuditedText(trimmed)
      setAuditResult(result)
    }
  }, [text, runAudit, origText, doSend])

  const handleBypass = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    doSend(trimmed, origText || trimmed, { auditScore: auditResult?.score ?? null, auditBypassed: true })
  }, [text, disabled, origText, auditResult, doSend])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleTextChange = (e) => {
    setText(e.target.value)
    setAuditResult(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendOrAudit()
    }
  }

  const modelLabel = {
    idle: '',
    loading: 'Preparing audit…',
    ready: 'Local audit ready',
    error: 'Audit unavailable',
  }[modelStatus] ?? ''

  const buttonLabel = auditPending
    ? 'Auditing…'
    : modelStatus === 'loading'
    ? 'Preparing audit…'
    : 'Audit & Send'

  return (
    <>
      {modalOpen && auditResult && (
        <AuditModal
          text={auditedText}
          spans={auditResult.spans}
          score={auditResult.score}
          onClose={handleModalClose}
          onBypass={handleBypass}
          onReaudit={handleModalReaudit}
          auditPending={auditPending}
        />
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type your prompt… (Enter to audit & send, Shift+Enter for newline)"
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{modelLabel}</span>
          <button
            onClick={handleSendOrAudit}
            disabled={!text.trim() || disabled || auditPending || modelStatus !== 'ready'}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition disabled:opacity-40 flex items-center gap-1.5"
          >
            {auditPending && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {buttonLabel}
          </button>
        </div>
      </div>
    </>
  )
}
