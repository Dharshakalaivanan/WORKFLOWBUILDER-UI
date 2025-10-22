import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

interface CallMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
}

interface CallInterfaceProps {
  workflowId?: number
  onClose: () => void
}

export default function CallInterface({ workflowId, onClose }: CallInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [transcript, setTranscript] = useState<CallMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [userInput, setUserInput] = useState('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<number | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll transcript to bottom
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isCallActive])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const speakText = (text: string) => {
    if (!isMuted && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        text: message
      }))
      
      // Add user message to transcript
      setTranscript(prev => [...prev, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }])
    }
  }

  const startCall = async () => {
    try {
      setConnectionStatus('connecting')
      setTranscript([])
      setCallDuration(0)

      // Connect to WebSocket
      const ws = new WebSocket(`ws://localhost:8000/ws/assistant?workflow_id=${workflowId || ''}`)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsCallActive(true)
        setConnectionStatus('connected')
        toast.success('Call connected')
        
        // Send initial message to start conversation
        ws.send(JSON.stringify({ 
          type: 'start_conversation',
          text: 'Hello'
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'assistant_message') {
            const message = data.content || data.reply
            setTranscript(prev => [...prev, {
              role: 'assistant',
              content: message,
              timestamp: new Date().toLocaleTimeString()
            }])
            
            // Speak the assistant's response
            speakText(message)
            
          } else if (data.type === 'user_message') {
            setTranscript(prev => [...prev, {
              role: 'user',
              content: data.content || data.text,
              timestamp: new Date().toLocaleTimeString()
            }])
          } else if (data.type === 'call_ended') {
            endCall()
          } else if (data.type === 'workflow_loaded') {
            console.log('Workflow loaded:', data.message)
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
        toast.error('Call connection error')
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsCallActive(false)
        setConnectionStatus('disconnected')
        toast('Call ended')
      }

    } catch (error) {
      console.error('Error starting call:', error)
      toast.error('Failed to start call')
      setConnectionStatus('disconnected')
    }
  }

  const endCall = () => {
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    setIsCallActive(false)
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setCallDuration(0)
    toast.success('Call ended')
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    
    // Stop speech if muting
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    
    toast(isMuted ? 'Unmuted' : 'Muted')
  }
  
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (userInput.trim() && isCallActive) {
      sendMessage(userInput)
      setUserInput('')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#111318',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff'
            }}>
              Call Transcript
            </h2>
            <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              marginTop: '4px'
            }}>
              {connectionStatus === 'connecting' && '⏳ Connecting...'}
              {connectionStatus === 'connected' && `📞 Active • ${formatDuration(callDuration)}`}
              {connectionStatus === 'disconnected' && '📴 Not connected'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Transcript */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          background: '#0a0b0d'
        }}>
          {transcript.length === 0 && !isCallActive && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                No active call
              </div>
              <div style={{ fontSize: '14px' }}>
                Start a call to see the transcript
              </div>
            </div>
          )}

          {transcript.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                {message.role === 'assistant' ? 'Assistant' : 'User'} • {message.timestamp}
              </div>
              <div style={{
                background: message.role === 'assistant' ? '#1e293b' : '#10b981',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {message.content}
              </div>
            </div>
          ))}

          {isCallActive && transcript.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#94a3b8'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                🎤
              </div>
              <div style={{ fontSize: '14px' }}>
                Listening...
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Text Input (for testing) */}
        {isCallActive && (
          <form onSubmit={handleSendMessage} style={{
            padding: '16px 24px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              style={{
                padding: '12px 24px',
                background: userInput.trim() ? '#10b981' : '#374151',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: userInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Send
            </button>
          </form>
        )}

        {/* Controls */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px'
        }}>
          {!isCallActive ? (
            <button
              onClick={startCall}
              disabled={connectionStatus === 'connecting'}
              style={{
                background: '#10b981',
                border: 'none',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                color: '#ffffff',
                fontSize: '24px',
                cursor: connectionStatus === 'connecting' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
                opacity: connectionStatus === 'connecting' ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (connectionStatus !== 'connecting') {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              📞
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                style={{
                  background: isMuted ? '#ef4444' : '#374151',
                  border: 'none',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              <button
                onClick={endCall}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '50%',
                  width: '64px',
                  height: '64px',
                  color: '#ffffff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                📴
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

