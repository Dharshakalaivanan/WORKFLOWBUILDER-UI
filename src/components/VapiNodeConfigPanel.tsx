import React, { useState, useEffect } from 'react'
import { useWorkflowStore, VapiNodeData, VapiEdgeData } from '../store/workflowStore'
import { Node, Edge } from 'reactflow'

export default function VapiNodeConfigPanel() {
  const { 
    nodes, 
    edges, 
    setGraph, 
    selectedNodeId, 
    selectedEdgeId, 
    setSelectedEdgeId,
    updateNode,
    updateEdge,
    deleteEdge,
    globalPrompt,
    setGlobalPrompt
  } = useWorkflowStore()
  
  const [selectedId, setSelectedId] = useState<string | null>(selectedNodeId || nodes[0]?.id || null)
  const [newVariable, setNewVariable] = useState({ title: '', type: 'string', description: '', enum: '' })

  const node = nodes.find(n => n.id === selectedId) as Node & { data: VapiNodeData } | undefined
  const edge = edges.find(e => e.id === selectedEdgeId) as Edge & { data: VapiEdgeData } | undefined

  useEffect(() => {
    if (selectedNodeId) {
      setSelectedId(selectedNodeId)
    }
  }, [selectedNodeId])

  const updateNodeData = (key: string, value: any) => {
    if (!node) return
    updateNode(node.id, { [key]: value })
  }

  const updateNodeNestedData = (path: string[], value: any) => {
    if (!node) return
    const newData = { ...node.data }
    let current = newData
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {}
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    updateNode(node.id, newData)
  }

  const addVariable = () => {
    if (!node || !newVariable.title.trim()) return
    
    const enumValues = newVariable.enum 
      ? newVariable.enum.split(',').map(e => e.trim()).filter(e => e)
      : undefined

    const variable = {
      title: newVariable.title,
      type: newVariable.type,
      description: newVariable.description,
      ...(enumValues && { enum: enumValues })
    }

    const currentOutput = node.data.variableExtractionPlan?.output || []
    updateNodeNestedData(['variableExtractionPlan', 'output'], [...currentOutput, variable])
    
    setNewVariable({ title: '', type: 'string', description: '', enum: '' })
  }

  const removeVariable = (index: number) => {
    if (!node) return;
    const currentOutput = node.data.variableExtractionPlan?.output || [];
    const newOutput = currentOutput.filter((_item: any, i: number) => i !== index);
    updateNodeNestedData(['variableExtractionPlan', 'output'], newOutput);
  }

  const addToolMessage = () => {
    if (!node || !node.data.tool) return
    
    const currentMessages = node.data.tool.messages || []
    const newMessage = {
      type: 'request-start',
      content: 'New message',
      blocking: true
    }
    
    updateNodeNestedData(['tool', 'messages'], [...currentMessages, newMessage])
  }

  const updateToolMessage = (index: number, field: string, value: any) => {
    if (!node || !node.data.tool?.messages) return
    
    const newMessages = [...node.data.tool.messages]
    newMessages[index] = { ...newMessages[index], [field]: value }
    updateNodeNestedData(['tool', 'messages'], newMessages)
  }

  const removeToolMessage = (index: number) => {
    if (!node || !node.data.tool?.messages) return;

    const newMessages = node.data.tool.messages.filter((_: any, i: number) => i !== index);
    updateNodeNestedData(['tool', 'messages'], newMessages);
  }

  const addToolDestination = () => {
    if (!node || !node.data.tool) return
    
    const currentDestinations = node.data.tool.destinations || []
    updateNodeNestedData(['tool', 'destinations'], [...currentDestinations, ''])
  }

  const updateToolDestination = (index: number, value: string) => {
    if (!node || !node.data.tool?.destinations) return
    
    const newDestinations = [...node.data.tool.destinations]
    newDestinations[index] = value
    updateNodeNestedData(['tool', 'destinations'], newDestinations)
  }

  const removeToolDestination = (index: number) => {
    if (!node || !node.data.tool?.destinations) return
    
    const newDestinations = node.data.tool.destinations.filter((_:any, i:number) => i !== index)
    updateNodeNestedData(['tool', 'destinations'], newDestinations)
  }

  return (
    <div style={{display:'flex', gap:12, flexDirection:'column'}}>
      {/* Global Prompt */}
      <div>
        <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
          Global Prompt
        </label>
        <textarea
          className="input"
          value={globalPrompt}
          onChange={(e) => setGlobalPrompt(e.target.value)}
          rows={3}
          placeholder="Global instructions for the entire workflow..."
        />
      </div>

      {/* Node Selection */}
      <div>
        <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
          Selected Node
        </label>
        <select
          className="input"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {nodes.map((n,index:number) => (
            <option key={n.id ||index} value={n.id}>
               {n.data?.name || `Node ${index + 1}`} ({n.data?.type || 'Unknown'})
            </option>
          ))}
        </select>
      </div>

      {node && (
        <>
          {/* Node Name */}
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              Node Name
            </label>
            <input
              className="input"
              value={node.data?.name ?? ''}
              onChange={(e) => updateNodeData('name', e.target.value)}
            />
          </div>

          {/* Start Node Toggle */}
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              <input
                type="checkbox"
                checked={node.data?.isStart || false}
                onChange={(e) => updateNodeData('isStart', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Start Node
            </label>
          </div>

          {/* Global Node Toggle */}
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              <input
                type="checkbox"
                checked={node.data?.globalNodePlan?.enabled || false}
                onChange={(e) => updateNodeNestedData(['globalNodePlan', 'enabled'], e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Global Node
            </label>
            {node.data?.globalNodePlan?.enabled && (
              <input
                className="input"
                value={node.data.globalNodePlan.enterCondition || ''}
                onChange={(e) => updateNodeNestedData(['globalNodePlan', 'enterCondition'], e.target.value)}
                placeholder="Enter condition for global node..."
                style={{ marginTop: '4px' }}
              />
            )}
          </div>

          {/* Conversation Node Configuration */}
          {node.data?.type === 'conversation' && (
            <>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                  First Message
                </label>
                <input
                  className="input"
                  value={node.data?.messagePlan?.firstMessage ?? ''}
                  onChange={(e) => updateNodeNestedData(['messagePlan', 'firstMessage'], e.target.value)}
                  placeholder="What the AI says when this node is reached..."
                />
              </div>
              
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                  Behavior Prompt
                </label>
                <textarea
                  className="input"
                  value={node.data?.prompt ?? ''}
                  onChange={(e) => updateNodeData('prompt', e.target.value)}
                  rows={4}
                  placeholder="How the AI should behave in this conversation..."
                />
              </div>

              {/* Variable Extraction */}
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                  Variable Extraction
                </label>
                
                {node.data?.variableExtractionPlan?.output?.map((variable: any, index: number) => (
                  <div key={index} style={{
                    background: '#1a1d23',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '12px' }}>{variable.title}</strong>
                      <button
                        className="button"
                        onClick={() => removeVariable(index)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      Type: {variable.type} | Description: {variable.description}
                    </div>
                    {variable.enum && (
                      <div style={{ fontSize: '11px', color: '#4f8cff' }}>
                        Options: {variable.enum.join(', ')}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <input
                    className="input"
                    placeholder="Variable name"
                    value={newVariable.title}
                    onChange={(e) => setNewVariable({ ...newVariable, title: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="input"
                    value={newVariable.type}
                    onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value })}
                    style={{ width: '80px' }}
                  >
                    <option key="string" value="string">String</option>
                    <option key="number" value="number">Number</option>
                    <option key="boolean" value="boolean">Boolean</option>
                  </select>
                </div>
                
                <input
                  className="input"
                  placeholder="Description"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  style={{ marginBottom: '4px' }}
                />
                
                <input
                  className="input"
                  placeholder="Enum values (comma-separated)"
                  value={newVariable.enum}
                  onChange={(e) => setNewVariable({ ...newVariable, enum: e.target.value })}
                  style={{ marginBottom: '4px' }}
                />
                
                <button
                  className="button"
                  onClick={addVariable}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  Add Variable
                </button>
              </div>
            </>
          )}

          {/* Tool Node Configuration */}
          {node.data?.type === 'tool' && node.data.tool && (
            <>
              <div>
                <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                  Tool Type
                </label>
                <select
                  className="input"
                  value={node.data.tool.type}
                  onChange={(e) => updateNodeNestedData(['tool', 'type'], e.target.value)}
                >
                  <option key="transferCall" value="transferCall">Transfer Call</option>
                  <option key="endCall" value="endCall">End Call</option>
                  <option key="apiRequest" value="apiRequest">API Request</option>
                </select>
              </div>

              {/* Tool Messages */}
              {node.data.tool.messages && (
                <div>
                  <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                    Messages
                  </label>
                  
                  {node.data.tool.messages.map((message:any, index:number) => (
                    <div key={index} style={{
                      background: '#1a1d23',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <select
                          className="input"
                          value={message.type}
                          onChange={(e) => updateToolMessage(index, 'type', e.target.value)}
                          style={{ width: '120px' }}
                        >
                          <option key="request-start" value="request-start">Request Start</option>
                          <option key="request-end" value="request-end">Request End</option>
                        </select>
                        <button
                          className="button"
                          onClick={() => removeToolMessage(index)}
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <textarea
                        className="input"
                        value={message.content}
                        onChange={(e) => updateToolMessage(index, 'content', e.target.value)}
                        rows={2}
                        style={{ marginBottom: '4px' }}
                      />
                      
                      <label style={{fontSize:11, color:'var(--muted)'}}>
                        <input
                          type="checkbox"
                          checked={message.blocking}
                          onChange={(e) => updateToolMessage(index, 'blocking', e.target.checked)}
                          style={{ marginRight: '4px' }}
                        />
                        Blocking
                      </label>
                    </div>
                  ))}
                  
                  <button
                    className="button"
                    onClick={addToolMessage}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    Add Message
                  </button>
                </div>
              )}

              {/* Tool Destinations */}
              {node.data.tool.type === 'transferCall' && node.data.tool.destinations && (
                <div>
                  <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                    Destinations
                  </label>
                  
                  {node.data.tool.destinations.map((destination:any, index:number) => (
                    <div key={index} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      <input
                        className="input"
                        value={destination}
                        onChange={(e) => updateToolDestination(index, e.target.value)}
                        placeholder="Phone number or extension"
                      />
                      <button
                        className="button"
                        onClick={() => removeToolDestination(index)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  <button
                    className="button"
                    onClick={addToolDestination}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    Add Destination
                  </button>
                </div>
              )}
            </>
          )}

          {/* Condition Node Configuration */}
          {node.data?.type === 'condition' && (
            <div>
              <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                Condition Logic
              </label>
              <textarea
                className="input"
                value={node.data?.prompt ?? ''}
                onChange={(e) => updateNodeData('prompt', e.target.value)}
                rows={3}
                placeholder="Describe the condition logic..."
              />
            </div>
          )}

          {/* API Node Configuration */}
          {node.data?.type === 'api' && (
            <div>
              <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
                API Endpoint
              </label>
              <input
                className="input"
                value={node.data?.prompt ?? ''}
                onChange={(e) => updateNodeData('prompt', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
          )}
        </>
      )}

      {/* Edge Configuration */}
      {edge && (
        <>
          <div style={{borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8}} />
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              Selected Edge
            </label>
            <div style={{fontSize:12, color:'var(--muted)'}}>{edge.id}</div>
          </div>
          
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              Condition Type
            </label>
            <select
              className="input"
              value={edge.data?.condition?.type || 'ai'}
              onChange={(e) => updateEdge(edge.id, { condition: { ...edge.data?.condition, type: e.target.value } })}
            >
              <option key="ai" value="ai">AI Decision</option>
              <option key="condition" value="condition">Conditional</option>
            </select>
          </div>
          
          <div>
            <label style={{fontSize:12, color:'var(--muted)', marginBottom:4, display:'block'}}>
              Condition Prompt
            </label>
            <textarea
              className="input"
              value={edge.data?.condition?.prompt ?? ''}
              onChange={(e) => updateEdge(edge.id, { condition: { ...edge.data?.condition, prompt: e.target.value } })}
              rows={2}
              placeholder="Describe when this edge should be taken..."
            />
          </div>
          
          <div style={{display:'flex', gap:8}}>
            <button className="button" onClick={() => setSelectedEdgeId(null)}>
              Done Editing Edge
            </button>
            <button className="button" onClick={() => deleteEdge(edge.id)}>
              Delete Edge
            </button>
          </div>
        </>
      )}
    </div>
  )
}
