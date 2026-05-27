import { useApp } from '../context/AppContext'

function ChatItem({ chat, active, onSelect, onDelete }) {
  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${
        active
          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
      onClick={() => onSelect(chat.id)}
    >
      <svg className="shrink-0 w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span className="flex-1 truncate text-sm">{chat.title}</span>
      <button
        onClick={e => { e.stopPropagation(); onDelete(chat.id) }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition"
        title="Delete chat"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function Sidebar() {
  const { data, activeChatId, setActiveChatId, createChat, deleteChat, view, setView, darkMode, setDarkMode, loadDemoData, resetData } = useApp()

  const handleLoadDemo = () => {
    if (data.chats.length === 0 || window.confirm('Replace your current chats with demo data?')) {
      loadDemoData()
    }
  }

  const handleReset = () => {
    if (window.confirm('Clear all chats and reset totals? This cannot be undone.')) {
      resetData()
    }
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">EcoPrompt</span>
      </div>

      {/* Nav actions */}
      <div className="px-3 py-3 space-y-1">
        <button
          onClick={createChat}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <button
          onClick={() => setView(view === 'dashboard' ? 'chat' : 'dashboard')}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
            view === 'dashboard'
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Impact Dashboard
        </button>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-3 py-1 scrollbar-thin space-y-0.5">
        <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">
          History
        </p>
        {data.chats.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-600 italic">No chats yet</p>
        ) : (
          data.chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId && view === 'chat'}
              onSelect={(id) => { setActiveChatId(id); setView('chat') }}
              onDelete={deleteChat}
            />
          ))
        )}
      </div>

      {/* Demo controls */}
      <div className="px-3 pt-2 pb-1 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button
          onClick={handleLoadDemo}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Load demo conversations"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Load Demo Data
        </button>
        {data.chats.length > 0 && (
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition"
            title="Reset all data"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
            Clear All Data
          </button>
        )}
      </div>

      {/* Footer: dark mode + settings */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        <ApiKeyButton />
      </div>
    </aside>
  )
}

function ApiKeyButton() {
  const handleClick = () => {
    const current = localStorage.getItem('ecoprompt_api_key') || ''
    const key = window.prompt('Enter your GreenPT API key:', current)
    if (key !== null) localStorage.setItem('ecoprompt_api_key', key.trim())
  }
  return (
    <button
      onClick={handleClick}
      className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
      title="Set GreenPT API key"
    >
      API Key
    </button>
  )
}
