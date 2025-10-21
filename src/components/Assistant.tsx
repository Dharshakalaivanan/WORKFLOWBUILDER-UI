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
  const [voiceEnabled, setVoiceEnabled] = useState(true)
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
    
    // Speak AI responses using TTS (if voice is enabled)
    if (!isUser && text && voiceEnabled && 'speechSynthesis' in window) {
      speakText(text)
    }
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported')
      return
    }
    
    console.log('Speaking text:', text)
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1
    utterance.volume = 1.0
    
    // Wait for voices to load
    const speak = () => {
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Samantha') ||
        voice.lang.startsWith('en')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
        console.log('Using voice:', preferredVoice.name)
      }
      
      utterance.onstart = () => console.log('Speech started')
      utterance.onend = () => console.log('Speech ended')
      utterance.onerror = (e) => console.error('Speech error:', e)
      
      window.speechSynthesis.speak(utterance)
    }
    
    // Load voices if not already loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak
    } else {
      speak()
    }
  }

  const sendMessage = () => {
    if (!inputText.trim() || !isConnected || isLoading) return;
  
    const message = inputText.trim();
    addMessage(message, true); // add user message
    setIsLoading(true);
  
    const wfId = getWorkflowId(); // get current workflow ID
  
    // --- Send via WebSocket for quick reply ---
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: message, workflow_id: wfId }));
    }
  
    // --- Send via streaming HTTP fetch for cursor typing effect ---
    const controller = new AbortController();
    fetch(`http://localhost:8000/api/workflows/cursor_prompt/${wfId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal
    }).then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      let streamed = '';
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        streamed += chunk;
  
        // Update last assistant message live
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
  
          if (!last || last.isUser) {
            next.push({
              id: Date.now().toString(),
              text: chunk,
              isUser: false,
              timestamp: new Date()
            });
          } else {
            last.text += chunk;
          }
  
          return next;
        });
      }
    }).finally(() => setIsLoading(false));
  
    setInputText('');
  };

  const sendTranscribedMessage = (transcript: string) => {
    if (!transcript.trim() || !isConnected || isLoading) return;

    setIsLoading(true);
    const wfId = getWorkflowId();

    // Send via WebSocket for quick reply
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: transcript, workflow_id: wfId }));
    }

    // Send via streaming HTTP fetch for cursor typing effect
    const controller = new AbortController();
    fetch(`http://localhost:8000/api/workflows/cursor_prompt/${wfId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: transcript }),
      signal: controller.signal
    }).then(async (res) => {
      if (!res.body) return;
      const reader = res.body.getReader();
      let streamed = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        streamed += chunk;

        // Update last assistant message live
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];

          if (!last || last.isUser) {
            next.push({
              id: Date.now().toString(),
              text: chunk,
              isUser: false,
              timestamp: new Date()
            });
          } else {
            last.text += chunk;
          }

          return next;
        });
      }
    }).finally(() => setIsLoading(false));
  };

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
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        addMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.', false)
        return
      }

      // Stop any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      // First, speak the first message from the workflow
      speakFirstMessage()

      // Wait a moment for the first message to finish speaking before starting recognition
      setTimeout(() => {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsRecording(true)
          addMessage('🎤 Listening for your response...', false)
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          // Show interim results
          if (interimTranscript) {
            setInputText(interimTranscript)
          }
          
          // Process final results
          if (finalTranscript.trim()) {
            console.log('Speech recognition final result:', finalTranscript)
            setInputText(finalTranscript)
            addMessage(`🎤 You said: "${finalTranscript}"`, false)
            
            // Auto-send the transcribed message
            setTimeout(() => {
              addMessage(finalTranscript, true)
              sendTranscribedMessage(finalTranscript)
            }, 500)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          let errorMessage = 'Microphone error: '
          
          switch (event.error) {
            case 'not-allowed':
              errorMessage += 'Microphone permission denied. Please allow microphone access.'
              break
            case 'no-speech':
              errorMessage += 'No speech detected. Please try again.'
              break
            case 'audio-capture':
              errorMessage += 'No microphone found. Please check your microphone.'
              break
            case 'network':
              errorMessage += 'Network error. Please check your connection.'
              break
            default:
              errorMessage += event.error
          }
          
          addMessage(errorMessage, false)
          setIsRecording(false)
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsRecording(false)
        }

        recognition.start()
        recognitionRef.current = recognition
      }, 2000) // Wait 2 seconds for the first message to finish speaking
      
    } catch (e) {
      console.error('Error starting speech recognition:', e)
      addMessage('Unable to start microphone. Please check browser permissions.', false)
      setIsRecording(false)
    }
  }

  const speakFirstMessage = () => {
    // Find the first Conversation node in the workflow
    const conversationNode = nodes.find(node => node.data?.type === 'Conversation')
    
    if (conversationNode?.data?.firstMessage) {
      let firstMessage = conversationNode.data.firstMessage
      
      // Extract just the actual first message if it contains instructions
      if (firstMessage.includes("Start with:")) {
        const startWithIndex = firstMessage.indexOf("Start with:")
        if (startWithIndex !== -1) {
          const afterStartWith = firstMessage.substring(startWithIndex + 11).trim()
          const quoteStart = afterStartWith.indexOf("'")
          const quoteEnd = afterStartWith.lastIndexOf("'")
          if (quoteStart !== -1 && quoteEnd !== -1 && quoteEnd > quoteStart) {
            firstMessage = afterStartWith.substring(quoteStart + 1, quoteEnd)
          }
        }
      }
      
      addMessage(`📞 Starting call: "${firstMessage}"`, false)
      
      if (voiceEnabled && 'speechSynthesis' in window) {
        speakText(firstMessage)
      }
    } else {
      addMessage('📞 Call started - no first message configured', false)
      if (voiceEnabled && 'speechSynthesis' in window) {
        speakText('Hello, how can I help you today?')
      }
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
        <button
          className={`button ${voiceEnabled ? 'primary' : ''}`}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          style={{ padding: '4px 8px', fontSize: '12px' }}
          title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
        <button
          className="button"
          onClick={() => speakText('Hello, this is a test of the voice system.')}
          style={{ padding: '4px 8px', fontSize: '12px' }}
          title="Test voice output"
        >
          Test Voice
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
          Voice Provider: <strong>{voiceProvider}</strong> | 
          Voice Output: <strong>{voiceEnabled ? 'ON' : 'OFF'}</strong>
        </div>
        <button
          onClick={clearMessages}
          className="button"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Clear Messages
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
