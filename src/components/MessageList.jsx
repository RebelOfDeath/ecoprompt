import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useApp } from '../context/AppContext'

// Markdown component maps shared across both bubble variants.
// `invert` = white text (user bubble), default = gray text (assistant bubble).
function mdComponents(invert = false) {
  const prose = invert
    ? 'text-white'
    : 'text-gray-800 dark:text-gray-200'
  const muted = invert
    ? 'text-green-100'
    : 'text-gray-500 dark:text-gray-400'
  const codeBg = invert
    ? 'bg-green-700/60 text-green-50'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  const blockBorder = invert
    ? 'border-green-300/60 text-green-100'
    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
  const hrColor = invert
    ? 'border-green-400/40'
    : 'border-gray-200 dark:border-gray-700'
  const linkColor = invert
    ? 'text-green-100 underline'
    : 'text-green-600 dark:text-green-400 underline'
  const tableHead = invert
    ? 'bg-green-700/40'
    : 'bg-gray-50 dark:bg-gray-700/50'
  const tableBorder = invert
    ? 'border-green-400/40'
    : 'border-gray-200 dark:border-gray-700'

  return {
    // Headings
    h1: ({ children }) => <h1 className={`text-base font-bold mb-2 mt-3 first:mt-0 ${prose}`}>{children}</h1>,
    h2: ({ children }) => <h2 className={`text-sm font-bold mb-1.5 mt-3 first:mt-0 ${prose}`}>{children}</h2>,
    h3: ({ children }) => <h3 className={`text-sm font-semibold mb-1 mt-2 first:mt-0 ${prose}`}>{children}</h3>,

    // Paragraph — suppress default margin on the very last child
    p: ({ children }) => <p className={`mb-2 last:mb-0 leading-relaxed text-sm ${prose}`}>{children}</p>,

    // Inline code
    code: ({ inline, className, children }) => {
      if (inline) {
        return <code className={`px-1 py-0.5 rounded text-xs font-mono ${codeBg}`}>{children}</code>
      }
      return (
        <code className={`block text-xs font-mono leading-relaxed ${codeBg} rounded-lg p-3 overflow-x-auto whitespace-pre`}>
          {children}
        </code>
      )
    },

    // Fenced code block wrapper
    pre: ({ children }) => <pre className="mb-2 last:mb-0 rounded-lg overflow-hidden">{children}</pre>,

    // Lists
    ul: ({ children }) => <ul className={`list-disc list-outside ml-4 mb-2 last:mb-0 space-y-0.5 text-sm ${prose}`}>{children}</ul>,
    ol: ({ children }) => <ol className={`list-decimal list-outside ml-4 mb-2 last:mb-0 space-y-0.5 text-sm ${prose}`}>{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className={`border-l-4 pl-3 my-2 italic text-sm ${blockBorder}`}>{children}</blockquote>
    ),

    // Bold / italic
    strong: ({ children }) => <strong className={`font-semibold ${prose}`}>{children}</strong>,
    em: ({ children }) => <em className={`italic ${muted}`}>{children}</em>,

    // Horizontal rule
    hr: () => <hr className={`my-3 ${hrColor}`} />,

    // Links — open in new tab
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkColor}>{children}</a>
    ),

    // Tables (GFM)
    table: ({ children }) => (
      <div className="overflow-x-auto mb-2 last:mb-0">
        <table className={`text-xs w-full border-collapse border ${tableBorder}`}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className={tableHead}>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className={`border-b ${tableBorder}`}>{children}</tr>,
    th: ({ children }) => <th className={`px-2 py-1.5 text-left font-semibold border-r last:border-r-0 ${tableBorder} ${prose}`}>{children}</th>,
    td: ({ children }) => <td className={`px-2 py-1.5 border-r last:border-r-0 ${tableBorder} ${prose}`}>{children}</td>,
  }
}

function Markdown({ children, invert }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(invert)}>
      {children}
    </ReactMarkdown>
  )
}

function MetricsBadge({ metrics }) {
  if (!metrics) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
        ⚡ {metrics.energyUsedMWh?.toFixed(3)} mWh used
      </span>
      {metrics.energySavedMWh > 0 && (
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full px-2 py-0.5">
          💚 {metrics.energySavedMWh?.toFixed(3)} mWh saved
        </span>
      )}
      {metrics.co2EmissionsMg > 0 && (
        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5">
          🌿 {metrics.co2EmissionsMg?.toFixed(4)} mg CO₂
        </span>
      )}
    </div>
  )
}

function AuditBadge({ score, bypassed }) {
  if (score === null && !bypassed) return null

  if (bypassed) {
    return (
      <div className="mt-1 flex justify-end">
        <span className="inline-flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          bypassed audit
          {score !== null && <span className="opacity-60">· {score}% clean</span>}
        </span>
      </div>
    )
  }

  const color =
    score >= 90 ? 'text-green-500 dark:text-green-400'
    : score >= 70 ? 'text-emerald-500 dark:text-emerald-400'
    : 'text-yellow-500 dark:text-yellow-400'

  const label =
    score >= 90 ? 'audit passed'
    : score >= 70 ? 'mostly clean'
    : 'low bloat detected'

  return (
    <div className="mt-1 flex justify-end">
      <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {label} · <span className="font-medium">{score}%</span>
      </span>
    </div>
  )
}

function UserMessage({ message, msgIndex, chatId }) {
  const { editUserMessage } = useApp()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.optimizedText || message.originalText || '')

  const displayText = message.optimizedText || message.originalText || ''
  const wasEdited =
    message.originalText &&
    message.optimizedText &&
    message.originalText !== message.optimizedText

  const saveEdit = () => {
    editUserMessage(chatId, msgIndex, draft)
    setEditing(false)
  }

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[75%]">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex gap-2 mt-1 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="text-xs text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="rounded-2xl rounded-tr-sm bg-green-600 text-white px-4 py-2.5 text-sm">
              <Markdown invert>{displayText}</Markdown>
            </div>
            {wasEdited && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 italic text-right">
                edited for efficiency
              </p>
            )}
            <AuditBadge score={message.auditScore} bypassed={message.auditBypassed} />
            <button
              onClick={() => setEditing(true)}
              className="absolute top-1 -left-7 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
              title="Edit message"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AssistantMessage({ message }) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5">
              <Markdown>{message.text}</Markdown>
            </div>
            <MetricsBadge metrics={message.metrics} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessageList({ messages, chatId, isLoading }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
        <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">EcoPrompt is ready</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Your prompts are locally audited for energy efficiency before dispatch. High-bloat regions are highlighted for you to refine.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <UserMessage key={i} message={msg} msgIndex={i} chatId={chatId} />
        ) : (
          <AssistantMessage key={i} message={msg} />
        ),
      )}
      {isLoading && <TypingIndicator />}
    </div>
  )
}
