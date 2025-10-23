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
  const [isListening, setIsListening] = useState(false)
  const [currentInterim, setCurrentInterim] = useState('')
  
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<number | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Auto-scroll transcript to bottom
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Initialize speech recognition once
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser')
      toast.error('Speech recognition not supported. Please use Chrome or Edge.')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true // Enable interim results to see partial transcripts
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    let finalTranscript = ''
    let interimTranscript = ''

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started')
      setIsListening(true)
      finalTranscript = ''
      interimTranscript = ''
    }

    recognition.onresult = (event: any) => {
      interimTranscript = ''
      
      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
          console.log('✅ Final transcript:', transcript)
        } else {
          interimTranscript += transcript
          console.log('⏳ Interim transcript:', transcript)
        }
      }
      
      // Show interim results to user
      setCurrentInterim(interimTranscript)
      
      // Send final transcript when we have it
      if (finalTranscript.trim()) {
        const textToSend = finalTranscript.trim()
        console.log('📤 Sending to backend:', textToSend)
        
        // Clear interim display
        setCurrentInterim('')
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Add to transcript
          setTranscript(prev => [...prev, {
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString()
          }])
          
          // Send to backend
          wsRef.current.send(JSON.stringify({ text: textToSend }))
          
          // Clear final transcript after sending
          finalTranscript = ''
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error)
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.')
        setIsListening(false)
      } else if (event.error === 'no-speech') {
        console.log('⚠️ No speech detected, will auto-restart...')
        // Don't show error to user, just continue
      } else if (event.error === 'aborted') {
        console.log('🛑 Recognition aborted')
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone not available. Please check your device.')
        setIsListening(false)
      } else {
        console.error(`Microphone error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended')
      setIsListening(false)
      
      // Auto-restart if call is still active and not muted
      if (isCallActive && !isMuted) {
        console.log('🔄 Auto-restarting speech recognition in 300ms...')
        setTimeout(() => {
          try {
            if (recognitionRef.current && isCallActive && !isMuted) {
              recognition.start()
              console.log('✅ Speech recognition restarted')
            }
          } catch (e: any) {
            if (!e.message?.includes('already started')) {
              console.log('⚠️ Could not restart:', e.message)
            }
          }
        }, 300) // Slightly longer delay to prevent conflicts
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Cleanup: recognition already stopped')
        }
      }
    }
  }, [isCallActive, isMuted])

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
      // Stop listening while speaking
      stopListening()
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Resume listening after speaking
      utterance.onend = () => {
        if (isCallActive && !isMuted) {
          setTimeout(() => startListening(), 500)
        }
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (!recognitionRef.current) {
      console.log('❌ Recognition not initialized')
      return
    }

    try {
      console.log('▶️ Starting speech recognition...')
      recognitionRef.current.start()
    } catch (e: any) {
      if (e.message && e.message.includes('already started')) {
        console.log('✅ Recognition already running')
      } else {
        console.error('❌ Error starting recognition:', e)
        toast.error('Could not start microphone. Please check permissions.')
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    try {
      console.log('⏸️ Stopping speech recognition...')
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (e) {
      console.log('Recognition already stopped')
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
        toast.success('Call connected - Microphone starting...')
        
        // Send initial message to start conversation
        ws.send(JSON.stringify({ 
          type: 'start_conversation',
          text: 'Hello'
        }))
        
        // Start listening after a brief delay
        setTimeout(() => {
          startListening()
        }, 500)
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
    // Stop listening
    stopListening()
    
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
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    if (newMutedState) {
      // Muting: stop listening and speaking
      stopListening()
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      toast('Muted - Microphone off')
    } else {
      // Unmuting: start listening
      if (isCallActive) {
        startListening()
      }
      toast('Unmuted - Microphone on')
    }
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

        {/* Listening Indicator */}
        {isCallActive && isListening && !isMuted && (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            background: currentInterim ? '#3b82f6' : '#16a34a',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '50px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ffffff',
                animation: currentInterim ? 'blink 0.5s infinite' : 'blink 1s infinite'
              }} />
              {currentInterim ? '🗣️ Speaking...' : '🎤 Listening...'}
            </div>
            {currentInterim && (
              <div style={{
                fontSize: '12px',
                fontStyle: 'italic',
                opacity: 0.9,
                marginTop: '4px'
              }}>
                "{currentInterim}"
              </div>
            )}
          </div>
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

