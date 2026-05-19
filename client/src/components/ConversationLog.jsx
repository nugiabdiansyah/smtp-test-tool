// client/src/components/ConversationLog.jsx
import { useEffect, useRef } from 'react'

// lines: array of SSE line events { type, dir, text }
// isLive: bool — true while stream is open
// success: bool|null — null = not done yet
export default function ConversationLog({ lines, isLive, success }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  if (lines.length === 0 && !isLive) return null

  return (
    <div className="conversation-log">
      <div className="log-header">
        <span>SMTP CONVERSATION</span>
        {isLive && <span className="live-indicator">● LIVE</span>}
      </div>
      <div className="log-body">
        {lines.map((line, i) => (
          <div key={i} className={`log-line ${getLineClass(line)}`}>
            {line.dir === 'send' ? '→' : line.dir === 'recv' ? '←' : ''} {line.text}
          </div>
        ))}
        {!isLive && lines.length > 0 && success !== null && (
          <div className={`log-line ${success ? 'status-success' : 'status-fail'}`}>
            {success ? '✓ Connection successful' : '✗ Connection failed'}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}

function getLineClass(line) {
  if (line.type === 'error') return 'recv-error'
  if (line.dir === 'send') return 'send'
  const code = parseInt(line.text?.slice(0, 3), 10)
  if (code >= 200 && code < 300) return 'recv-ok'
  if (code >= 300 && code < 400) return 'recv-challenge'
  if (code >= 400) return 'recv-error'
  return 'recv'
}
