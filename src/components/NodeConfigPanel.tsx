import { useWorkflowStore } from '../store/workflowStore'
import { useState } from 'react'

export default function NodeConfigPanel() {
  const { nodes, edges, setGraph } = useWorkflowStore()
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null)
  const node = nodes.find(n => n.id === selectedId) || nodes[0]

  const updateLabel = (v: string) => {
    if (!node) return
    const updated = nodes.map(n => n.id === node.id ? ({ ...n, data: { ...(n as any).data, label: v } }) as any : n as any)
    setGraph(updated as any, edges as any)
  }

  return (
    <div style={{display:'flex', gap:8, flexDirection:'column'}}>
      <select className="input" value={selectedId ?? ''} onChange={(e)=>setSelectedId(e.target.value)}>
        {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
      </select>
      <label style={{fontSize:12, color:'var(--muted)'}}>Label</label>
      <input className="input" value={(node as any)?.data?.label ?? ''} onChange={(e)=>updateLabel(e.target.value)} />
    </div>
  )
}
