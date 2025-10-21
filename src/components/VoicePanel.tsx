import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; text: string }

export default function VoicePanel({ workflowId }: { workflowId?: number }) {
	const [messages, setMessages] = useState<Msg[]>([])
	const [recording, setRecording] = useState(false)
	const [partial, setPartial] = useState('')
	const [auto, setAuto] = useState(true)
	const [conversationId, setConversationId] = useState<number | undefined>(undefined)
	const wsRef = useRef<WebSocket | null>(null)
	const srRef = useRef<any>(null)
	const mediaRef = useRef<MediaStream | null>(null)
	const audioCtxRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const vadTimerRef = useRef<number | null>(null)
	const isSpeakingTTSRef = useRef(false)

	// Create a conversation and preload transcript
	useEffect(() => {
		(async () => {
			try {
				const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
				const res = await fetch(`${base}/conversations`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ workflow_id: workflowId ?? null })
				})
				const conv = await res.json()
				setConversationId(conv.id)
				// preload existing messages
				const res2 = await fetch(`${base}/conversations/${conv.id}`)
				const convFull = await res2.json()
				setMessages((convFull.messages || []).map((m: any) => ({ role: m.role, text: m.text })))
			} catch {
				// ignore
			}
		})()
	}, [workflowId])

	// Open WebSocket once conversationId is ready
	useEffect(() => {
		if (conversationId === undefined) return
		const q = new URLSearchParams()
		if (workflowId) q.set('workflow_id', String(workflowId))
		if (conversationId) q.set('conversation_id', String(conversationId))
		const wsUrl = `ws://localhost:8000/ws/assistant?${q.toString()}`
		const ws = new WebSocket(wsUrl)
		wsRef.current = ws
		ws.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data)
				const reply = String(data.reply ?? '')
				push({ role: 'assistant', text: reply })
				speak(reply)
			} catch {}
		}
		return () => { ws.close() }
	}, [workflowId, conversationId])

	function push(m: Msg) {
		setMessages(prev => prev.concat(m))
	}

	function send(text: string) {
		if (!text.trim()) return
		push({ role: 'user', text })
		wsRef.current?.send(JSON.stringify({ text }))
	}

	function speak(text: string) {
		if (!('speechSynthesis' in window)) return
		const u = new SpeechSynthesisUtterance(text)
		isSpeakingTTSRef.current = true
		u.onend = () => { isSpeakingTTSRef.current = false }
		window.speechSynthesis.cancel()
		window.speechSynthesis.speak(u)
	}

	async function initVAD() {
		if (mediaRef.current) return
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		mediaRef.current = stream
		const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
		audioCtxRef.current = audioCtx
		const source = audioCtx.createMediaStreamSource(stream)
		const analyser = audioCtx.createAnalyser()
		analyser.fftSize = 1024
		source.connect(analyser)
		analyserRef.current = analyser
		loopVAD()
	}

	function loopVAD() {
		if (!analyserRef.current) return
		const analyser = analyserRef.current
		const data = new Uint8Array(analyser.frequencyBinCount)
		analyser.getByteTimeDomainData(data)
		// RMS-based simple VAD
		let sum = 0
		for (let i = 0; i < data.length; i++) {
			const v = (data[i] - 128) / 128
			sum += v * v
		}
		const rms = Math.sqrt(sum / data.length)
		const speaking = rms > 0.03 // threshold
		if (speaking) {
			if (isSpeakingTTSRef.current) {
				// barge-in: stop TTS on user speech
				window.speechSynthesis.cancel()
				isSpeakingTTSRef.current = false
			}
			ensureRecognitionRunning()
			if (vadTimerRef.current) window.clearTimeout(vadTimerRef.current)
			vadTimerRef.current = window.setTimeout(() => stopRecognition(), 600) as any
		}
		requestAnimationFrame(loopVAD)
	}

	function ensureRecognitionRunning() {
		const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
		if (!SR) return
		if (!srRef.current) {
			const sr = new SR()
			sr.continuous = true
			sr.interimResults = true
			sr.lang = 'en-US'
			sr.onresult = (e: any) => {
				let finalText = ''
				let interim = ''
				for (let i = e.resultIndex; i < e.results.length; i++) {
					const res = e.results[i]
					if (res.isFinal) finalText += res[0].transcript
					else interim += res[0].transcript
				}
				setPartial(interim)
				if (finalText.trim()) {
					setPartial('')
					send(finalText.trim())
				}
			}
			sr.onerror = () => {}
			sr.onend = () => {
				if (recording && auto) {
					// continue listening in continuous mode
					sr.start()
				}
			}
			srRef.current = sr
		}
		if (recording) {
			try { srRef.current.start() } catch {}
		}
	}

	async function startRec() {
		await initVAD()
		setRecording(true)
		ensureRecognitionRunning()
	}

	function stopRecognition() {
		try { srRef.current?.stop?.() } catch {}
	}

	function stopRec() {
		setRecording(false)
		stopRecognition()
	}

	const [input, setInput] = useState('')

	return (
		<div className="card" style={{display:'grid', gridTemplateRows:'1fr auto', height: '100%'}}>
			<div className="scroll" style={{overflowY:'auto', display:'grid', gap:8}}>
				{messages.map((m,i)=> (
					<div key={i} className={m.role==='user' ? 'bubble user' : 'bubble ai'}>{m.text}</div>
				))}
				{partial && (
					<div className="bubble user" style={{opacity:0.6}}>{partial}</div>
				)}
			</div>
			<div className="row" style={{gap:8, alignItems:'center'}}>
				<label style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
					<input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)} /> Auto (VAD)
				</label>
				<button className={`button ${recording ? 'danger' : ''}`} onClick={recording ? stopRec : startRec}>
					{recording ? 'Stop' : 'Speak'}
				</button>
				<input className="input" placeholder="Type a message..." value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter'){ send(input); setInput('') } }} />
				<button className="button primary" onClick={()=>{ send(input); setInput('') }}>Send</button>
			</div>
		</div>
	)
}


