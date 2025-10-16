import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import WorkflowBuilder from './pages/WorkflowBuilder'

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (hash: string) => {
    window.location.hash = hash
  }

  return (
    <div className="app">
      <div className="topbar">
        <strong className="badge" style={{fontSize:14}}>Workflow Builder</strong>
        <span className="spacer" />
        <button className="button" onClick={() => navigate('#/')}>Home</button>
      </div>
      <div className="content">
        {route.startsWith('#/builder') ? <WorkflowBuilder /> : <Home />}
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
