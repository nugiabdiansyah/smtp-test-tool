import { useState, useEffect } from 'react'
import SmtpForm from './components/SmtpForm.jsx'
import ConversationLog from './components/ConversationLog.jsx'

export default function App() {
  const [presets, setPresets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [logLines, setLogLines] = useState([])
  const [isLive, setIsLive] = useState(false)
  const [testSuccess, setTestSuccess] = useState(null)

  useEffect(() => {
    fetch('/api/presets')
      .then(r => r.json())
      .then(setPresets)
      .catch(() => {})
  }, [])

  const handleTest = async (formData) => {
    setLogLines([])
    setTestSuccess(null)
    setIsLoading(true)
    setIsLive(true)

    let res
    try {
      res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    } catch {
      setLogLines([{ type: 'error', text: 'Could not reach server' }])
      setIsLive(false)
      setIsLoading(false)
      setTestSuccess(false)
      return {}
    }

    if (!res.ok) {
      const body = await res.json()
      setIsLive(false)
      setIsLoading(false)
      setTestSuccess(false)
      return { errors: body.errors }
    }

    const { id } = await res.json()
    const es = new EventSource(`/api/test/stream/${id}`)

    es.onmessage = (e) => {
      const event = JSON.parse(e.data)

      if (event.type === 'line') {
        setLogLines(prev => [...prev, event])
      } else if (event.type === 'done') {
        setTestSuccess(event.success)
        setIsLive(false)
        setIsLoading(false)
        es.close()
      } else if (event.type === 'error') {
        setLogLines(prev => [...prev, { type: 'error', dir: 'recv', text: event.message }])
        setTestSuccess(false)
        setIsLive(false)
        setIsLoading(false)
        es.close()
      }
    }

    es.onerror = () => {
      setIsLive(false)
      setIsLoading(false)
      setTestSuccess(false)
      es.close()
    }

    return {}
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SMTP Test Tool</h1>
        <p>Test your connection to Sendgrid, Mailgun, Amazon SES, or any SMTP server.</p>
      </header>
      <SmtpForm presets={presets} onTest={handleTest} isLoading={isLoading} />
      <ConversationLog lines={logLines} isLive={isLive} success={testSuccess} />
    </div>
  )
}
