import { AppProvider, useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import Dashboard from './components/Dashboard'

function AppInner() {
  const { view } = useApp()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {view === 'dashboard' ? <Dashboard /> : <ChatView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
