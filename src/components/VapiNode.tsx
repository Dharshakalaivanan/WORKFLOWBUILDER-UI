import React from 'react'
import { Handle, Position } from 'reactflow'
import { useWorkflowStore, VapiNodeData } from '../store/workflowStore'

const typeToColor: Record<string, string> = {
  conversation: '#22c55e',
  tool: '#4f8cff',
  condition: '#f59e0b',
  api: '#a78bfa'
}

const toolTypeToColor: Record<string, string> = {
  transferCall: '#8b5cf6',
  endCall: '#ef4444',
  apiRequest: '#10b981'
}

interface VapiNodeProps {
  id: string
  data: VapiNodeData
}

export default function VapiNode({ id, data }: VapiNodeProps) {
  const { nodes, edges, setGraph, selectedNodeId, deleteNode } = useWorkflowStore()
  const isSelected = selectedNodeId === id

  // Safety check for undefined data
  if (!data) {
    return (
      <div
        style={{
          background: '#111318',
          border: '2px solid #ef4444',
          color: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          minWidth: '240px',
          textAlign: 'center'
        }}
      >
        <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>⚠️ Invalid Node Data</div>
        <div style={{ fontSize: '12px', marginTop: '4px', color: '#94a3b8' }}>Node ID: {id}</div>
      </div>
    )
  }

  const getNodeColor = () => {
    if (!data) return '#4f8cff'
    if (data.type === 'tool' && data.tool && data.tool.type) {
      return toolTypeToColor[data.tool.type] || '#4f8cff'
    }
    return typeToColor[data.type] || '#4f8cff'
  }

  const getNodeIcon = () => {
    if (!data) return '📦'
    switch (data.type) {
      case 'conversation':
        return '💬'
      case 'tool':
        if (data.tool?.type === 'transferCall') return '📞'
        if (data.tool?.type === 'endCall') return '📴'
        if (data.tool?.type === 'apiRequest') return '🔗'
        return '🔧'
      case 'condition':
        return '❓'
      case 'api':
        return '🌐'
      default:
        return '📦'
    }
  }

  const getNodeTitle = () => {
    if (!data) return 'Node'
    if (data.type === 'tool' && data.tool && data.tool.type) {
      switch (data.tool.type) {
        case 'transferCall':
          return 'Transfer Call'
        case 'endCall':
          return 'End Call'
        case 'apiRequest':
          return 'API Request'
        default:
          return 'Tool'
      }
    }
    return data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'Node'
  }

  const handleDelete = () => {
    deleteNode(id)
  }

  const handleDuplicate = () => {
    if (!data) return
    const suffix = Math.floor(Math.random() * 10000)
    const newId = `${data.id || 'node'}-copy-${suffix}`
    const currentPosition = data.metadata?.position || { x: 100, y: 100 }
    const newNodeData: VapiNodeData = {
      ...data,
      id: newId,
      name: `${data.name || 'Unnamed Node'} (Copy)`,
      metadata: {
        position: {
          x: currentPosition.x + 50,
          y: currentPosition.y + 50
        }
      }
    }
    
    const newNode = {
      id: newId,
      type: 'vapi',
      position: newNodeData.metadata?.position || { x: 100, y: 100 },
      data: newNodeData
    }
    
    setGraph([...nodes, newNode], edges)
  }

  return (
    <div
      style={{
        background: '#111318',
        border: `2px solid ${isSelected ? '#4f8cff' : getNodeColor()}`,
        color: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        minWidth: '240px',
        maxWidth: '320px',
        textAlign: 'left',
        boxShadow: isSelected 
          ? '0 0 20px rgba(79, 140, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)' 
          : '0 4px 12px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: getNodeColor() }} />
      <Handle type="target" position={Position.Left} style={{ background: getNodeColor() }} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: `${getNodeColor()}20`,
            borderRadius: '8px'
          }}>
            {getNodeIcon()}
          </div>
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: getNodeColor(),
              marginBottom: '2px'
            }}>
              {getNodeTitle()}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              {data.name || 'Unnamed Node'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            style={{ 
              padding: '6px 8px', 
              fontSize: '11px',
              background: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4b5563'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#374151'
            }}
          >
            📋
          </button>
          <button
            type="button"
            style={{ 
              padding: '6px 8px', 
              fontSize: '11px',
              background: '#dc2626',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc2626'
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Start Node Indicator */}
      {data.isStart && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            background: '#22c55e',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          ▶
        </div>
      )}

      {/* Content based on node type */}
      {data.type === 'conversation' && (
        <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
          {data.messagePlan?.firstMessage && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '11px', 
                fontWeight: '600',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                First Message
              </div>
              <div style={{ 
                background: '#0f1419', 
                padding: '8px 10px', 
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1.4',
                border: '1px solid #1e293b'
              }}>
                {data.messagePlan.firstMessage}
              </div>
            </div>
          )}
          
          {data.prompt && (
            <div>
              <div style={{ 
                color: '#94a3b8', 
                fontSize: '11px', 
                fontWeight: '600',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Prompt
              </div>
              <div style={{ 
                background: '#0f1419', 
                padding: '8px 10px', 
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1.4',
                maxHeight: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: '1px solid #1e293b'
              }}>
                {data.prompt}
              </div>
            </div>
          )}

          {data.variableExtractionPlan?.output && data.variableExtractionPlan.output.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '10px' }}>Extracts:</div>
              <div style={{ fontSize: '10px' }}>
                {data.variableExtractionPlan.output.map((output, idx) => (
                  <div key={idx} style={{ color: '#4f8cff' }}>
                    • {output.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trigger Information */}
          {data.trigger && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '10px', marginBottom: '4px' }}>Triggers:</div>
              {data.trigger.positive && data.trigger.positive.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: '#22c55e',
                    fontSize: '9px'
                  }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      background: '#22c55e', 
                      borderRadius: '50%' 
                    }}></div>
                    Positive: {data.trigger.positive.slice(0, 2).join(', ')}
                    {data.trigger.positive.length > 2 && '...'}
                  </div>
                </div>
              )}
              {data.trigger.negative && data.trigger.negative.length > 0 && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: '#ef4444',
                    fontSize: '9px'
                  }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      background: '#ef4444', 
                      borderRadius: '50%' 
                    }}></div>
                    Negative: {data.trigger.negative.slice(0, 2).join(', ')}
                    {data.trigger.negative.length > 2 && '...'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Response Indicators */}
          <div style={{ 
            marginTop: '8px', 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'space-between',
            fontSize: '10px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: '#22c55e'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#22c55e', 
                borderRadius: '50%' 
              }}></div>
              Yes
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: '#ef4444'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#ef4444', 
                borderRadius: '50%' 
              }}></div>
              No
            </div>
          </div>
        </div>
      )}

      {data.type === 'tool' && data.tool && (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ color: 'var(--muted)', fontSize: '10px' }}>Tool Type:</div>
          <div style={{ color: getNodeColor(), fontWeight: '600' }}>
            {data.tool.type}
          </div>
          
          {data.tool.messages && data.tool.messages.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '10px' }}>Messages:</div>
              {data.tool.messages.map((msg, idx) => (
                <div key={idx} style={{ 
                  background: '#1a1d23', 
                  padding: '4px 6px', 
                  borderRadius: '4px',
                  marginTop: '2px',
                  fontSize: '10px'
                }}>
                  {msg.content}
                </div>
              ))}
            </div>
          )}

          {data.tool.destinations && data.tool.destinations.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '10px' }}>Destinations:</div>
              <div style={{ fontSize: '10px' }}>
                {data.tool.destinations.map((dest, idx) => (
                  <div key={idx} style={{ color: '#4f8cff' }}>
                    • {dest}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.type === 'condition' && (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ color: 'var(--muted)', fontSize: '10px' }}>Condition:</div>
          <div style={{ 
            background: '#1a1d23', 
            padding: '4px 6px', 
            borderRadius: '4px',
            fontStyle: 'italic'
          }}>
            {data.prompt || 'No condition set'}
          </div>
        </div>
      )}

      {data.type === 'api' && (
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ color: 'var(--muted)', fontSize: '10px' }}>API Endpoint:</div>
          <div style={{ 
            background: '#1a1d23', 
            padding: '4px 6px', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '10px'
          }}>
            {data.prompt || 'No endpoint configured'}
          </div>
        </div>
      )}

      {/* Global Node Indicator */}
      {data.globalNodePlan?.enabled && (
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '-8px',
            background: '#f59e0b',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          🌐
        </div>
      )}

      {/* Output Handles - Conditional for conversation nodes */}
      {data.type === 'conversation' ? (
        <>
          {/* Positive response handle */}
          <Handle
            id="positive"
            type="source"
            position={Position.Right}
            style={{ 
              background: '#22c55e',
              width: '12px',
              height: '12px',
              border: '2px solid #0c0f14'
            }}
          />
          {/* Negative response handle */}
          <Handle
            id="negative"
            type="source"
            position={Position.Bottom}
            style={{ 
              background: '#ef4444',
              width: '12px',
              height: '12px',
              border: '2px solid #0c0f14'
            }}
          />
        </>
      ) : (
        <>
          {/* Default handles for other node types */}
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: getNodeColor() }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: getNodeColor() }}
          />
        </>
      )}
    </div>
  )
}
