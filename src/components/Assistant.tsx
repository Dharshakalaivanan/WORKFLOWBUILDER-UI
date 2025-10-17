import { useState, useEffect, useRef } from 'react'
import { useWorkflowStore } from '../store/workflowStore'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function Assistant() {
  const { nodes, edges, voiceProvider } = useWorkflowStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connectToAssistant = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`ws://localhost:8000/ws/assistant?workflow_id=${getWorkflowId()}`)
    
    ws.onopen = () => {
      setIsConnected(true)
      addMessage('Connected to assistant', false)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.reply) {
          addMessage(data.reply, false)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      addMessage('Disconnected from assistant', false)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
      addMessage('Connection error', false)
    }

    wsRef.current = ws
  }

  const disconnectFromAssistant = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const getWorkflowId = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    return params.get('id') || null
  }

  const addMessage = (text: string, isUser: boolean) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected || isLoading) return

    const message = inputText.trim()
    addMessage(message, true)
    setIsLoading(true)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        text: message,
        workflow: {
          nodes,
          edges,
          voiceProvider
        }
      }))
    }

    setInputText('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  // Speech-to-Text using Web Speech API
  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        addMessage('Speech recognition is not supported in this browser.', false)
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText(prev => (prev ? prev + ' ' : '') + transcript)
      }
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event)
        addMessage('Microphone error. Please check permissions.', false)
        setIsRecording(false)
      }
      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (e) {
      console.error(e)
      addMessage('Unable to start microphone. Check site permissions.', false)
    }
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop()
    } finally {
      setIsRecording(false)
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0c0f14',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text)' }}>AI Assistant</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#22c55e' : '#ef4444'
          }} />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            className="button"
            onClick={isConnected ? disconnectFromAssistant : connectToAssistant}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        <button
          className="button"
          onClick={isRecording ? stopRecording : startRecording}
          style={{ padding: '4px 8px', fontSize: '12px' }}
          title={isRecording ? 'Stop microphone' : 'Start microphone'}
        >
          {isRecording ? 'Stop Mic' : 'Start Mic'}
        </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: '14px',
            marginTop: '40px'
          }}>
            {isConnected 
              ? 'Start a conversation with the AI assistant...' 
              : 'Connect to start chatting with the assistant'
            }
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.isUser ? 'flex-end' : 'flex-start',
              marginBottom: '8px'
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: message.isUser ? '#4f8cff' : '#1a1d23',
                color: message.isUser ? 'white' : 'var(--text)',
                fontSize: '14px',
                lineHeight: '1.4',
                wordWrap: 'break-word'
              }}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#1a1d23',
                color: 'var(--muted)',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--muted)',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Assistant is typing...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px'
      }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message..." : "Connect first to start chatting"}
          disabled={!isConnected || isLoading}
          style={{
            flex: 1,
            minHeight: '40px',
            maxHeight: '120px',
            padding: '8px 12px',
            background: '#0b0e13',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            resize: 'none',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || !isConnected || isLoading}
          className="button"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            opacity: (!inputText.trim() || !isConnected || isLoading) ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>

      {/* Controls */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--muted)'
      }}>
        <div>
          Voice Provider: <strong>{voiceProvider}</strong>
        </div>
        <button
          onClick={clearMessages}
          className="button"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Clear Messages
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
