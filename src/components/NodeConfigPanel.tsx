import { useWorkflowStore } from '../store/workflowStore'
import { useState, useEffect } from 'react'
import { Node } from 'reactflow'

export default function NodeConfigPanel() {
  const { nodes, edges, setGraph, selectedNodeId, selectedEdgeId, setSelectedEdgeId } = useWorkflowStore()
  const [selectedId, setSelectedId] = useState<string | null>(selectedNodeId || nodes[0]?.id || null)
  
  const node = nodes.find(n => n.id === selectedId) || nodes[0]
  const edge = edges.find(e => e.id === selectedEdgeId)

  useEffect(() => {
    if (selectedNodeId) {
      setSelectedId(selectedNodeId)
    }
  }, [selectedNodeId])

  const updateEdge = (key: string, value: any) => {
    if (!edge) return
    const updated = edges.map(e => e.id === edge.id ? { ...e, [key]: value } as any : e)
    setGraph(nodes, updated)
  }

  const updateEdgeData = (key: string, value: any) => {
    if (!edge) return
    const updated = edges.map(e => e.id === edge.id ? { ...e, data: { ...(e.data || {}), [key]: value } } as any : e)
    setGraph(nodes, updated)
  }

  const removeEdge = (edgeId: string) => {
    const next = edges.filter(e => e.id !== edgeId)
    setGraph(nodes, next)
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null)
  }

  const updateLabel = (v: string) => {
    if (!node) return
    const updated = nodes.map(n => 
      n.id === node.id ? { ...n, data: { ...n.data, label: v } } : n
    )
    setGraph(updated, edges)
  }

  const updateData = (key: string, value: any) => {
    if (!node) return
    const updated = nodes.map(n => 
      n.id === node.id ? { ...n, data: { ...n.data, [key]: value } } : n
    )
    setGraph(updated, edges)
  }

  return (
    <div style={{display:'flex', gap:12, flexDirection:'column'}}>

      {/* Node Selection */}
      <div>
        <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Selected Node</label>
        <select 
          className="input" 
          value={selectedId ?? ''} 
          onChange={(e)=>setSelectedId(e.target.value)}
        >
          {nodes.map(n => (
            <option key={n.id} value={n.id}>
              {n.data?.label || n.id} ({n.data?.type || 'Unknown'})
            </option>
          ))}
        </select>
      </div>

      {node && (
        <>
          {/* Node Label */}
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Label</label>
            <input 
              className="input" 
              value={node.data?.label ?? ''} 
              onChange={(e)=>updateLabel(e.target.value)} 
            />
          </div>

          {/* Node-specific configurations */}
          {node.data?.type === 'Conversation' && (
            <div>
              <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Assistant Prompt</label>
              <textarea 
                className="input" 
                value={node.data?.prompt ?? ''} 
                onChange={(e)=>updateData('prompt', e.target.value)}
                rows={4}
                placeholder="Enter the assistant's behavior and instructions..."
              />
            </div>
          )}

          {node.data?.type === 'Transfer Call' && (
            <>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Transfer Number</label>
                <input 
                  className="input" 
                  value={node.data?.transferNumber ?? ''} 
                  onChange={(e)=>updateData('transferNumber', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Transfer Message</label>
                <textarea 
                  className="input" 
                  value={node.data?.transferMessage ?? ''} 
                  onChange={(e)=>updateData('transferMessage', e.target.value)}
                  rows={3}
                  placeholder="Message to play before transferring..."
                />
              </div>
            </>
          )}

          {node.data?.type === 'Call' && (
            <>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Phone Number</label>
                <input 
                  className="input" 
                  value={node.data?.phoneNumber ?? ''} 
                  onChange={(e)=>updateData('phoneNumber', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Call Script</label>
                <textarea 
                  className="input" 
                  value={node.data?.callScript ?? ''} 
                  onChange={(e)=>updateData('callScript', e.target.value)}
                  rows={4}
                  placeholder="Script for the call..."
                />
              </div>
            </>
          )}

          {node.data?.type === 'API Request' && (
            <>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>HTTP Method</label>
                <select 
                  className="input" 
                  value={node.data?.method ?? 'GET'} 
                  onChange={(e)=>updateData('method', e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>API URL</label>
                <input 
                  className="input" 
                  value={node.data?.url ?? ''} 
                  onChange={(e)=>updateData('url', e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </>
          )}

          {/* Outgoing edge conditions from this node */}
          <div style={{borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8}} />
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:6, display:'block'}}>Outgoing Conditions</label>
            {(edges.filter(e => e.source === node.id)).map(e => (
              <div key={e.id} style={{display:'flex', gap:8, alignItems:'center', marginBottom:6}}>
                <input 
                  className="input" 
                  style={{flex:1}} 
                  value={(e.label as string) ?? e.data?.condition ?? ''}
                  onChange={(evt)=>{
                    const value = evt.target.value
                    const updated = edges.map(x => x.id === e.id ? ({ ...x, label: value, data: { ...(x.data||{}), condition: value } } as any) : x)
                    setGraph(nodes, updated)
                  }}
                  placeholder="Condition label (e.g. user said yes)"
                />
                <input 
                  className="input" 
                  type="color"
                  value={((e.style as any)?.stroke) || '#4f8cff'}
                  onChange={(evt)=>{
                    const color = evt.target.value
                    const updated = edges.map(x => x.id === e.id ? ({ ...x, style: { ...(x.style as any), stroke: color } } as any) : x)
                    setGraph(nodes, updated)
                  }}
                />
                <button className="button" onClick={()=> removeEdge(e.id)}>Delete</button>
              </div>
            ))}
            {edges.filter(e => e.source === node.id).length === 0 && (
              <div style={{fontSize:12, color:'var(--muted)'}}>No outgoing edges. Connect this node to add conditions.</div>
            )}
          </div>
        </>
      )}

      {/* Edge configuration when an edge is selected */}
      {edge && (
        <>
          <div style={{borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8}} />
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Selected Edge</label>
            <div style={{fontSize:12, color:'var(--muted)'}}>{edge.id}</div>
          </div>
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Condition / Label</label>
            <input 
              className="input" 
              value={(edge.label as string) ?? edge.data?.condition ?? ''}
              onChange={(e)=>{ updateEdge('label', e.target.value); updateEdgeData('condition', e.target.value) }}
              placeholder="e.g. user said yes"
            />
          </div>
          <div style={{display:'flex', gap:8}}>
            <div style={{flex:1}}>
              <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Color</label>
              <input 
                className="input" 
                type="color" 
                value={(edge.style as any)?.stroke || '#4f8cff'}
                onChange={(e)=> updateEdge('style', { ...(edge.style as any), stroke: e.target.value }) }
              />
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>Width</label>
              <input 
                className="input" 
                type="number" 
                min={1}
                max={6}
                value={(edge.style as any)?.strokeWidth || 2}
                onChange={(e)=> updateEdge('style', { ...(edge.style as any), strokeWidth: Number(e.target.value) }) }
              />
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="button" onClick={()=> setSelectedEdgeId(null)}>Done Editing Edge</button>
            <button className="button" onClick={()=> removeEdge(edge.id)}>Delete Edge</button>
          </div>
        </>
      )}
    </div>
  )
}
