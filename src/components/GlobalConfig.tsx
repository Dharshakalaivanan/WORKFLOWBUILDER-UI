import { useWorkflowStore } from '../store/workflowStore'

export default function GlobalConfig() {
  const { voiceProvider, setVoiceProvider } = useWorkflowStore()

  return (
    <div style={{display:'flex', gap:12, flexDirection:'column'}}>
      <div>
        <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Global Voice Provider</label>
        <select 
          className="input" 
          value={voiceProvider} 
          onChange={(e)=>setVoiceProvider(e.target.value)}
        >
          <option value="elevenlabs">ElevenLabs</option>
          <option value="openai">OpenAI TTS</option>
          <option value="azure">Azure Speech</option>
          <option value="aws">AWS Polly</option>
          <option value="google">Google Cloud TTS</option>
        </select>
      </div>
    </div>
  )
}


