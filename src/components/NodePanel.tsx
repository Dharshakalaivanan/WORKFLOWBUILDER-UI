import { useWorkflowStore, VapiNodeData } from '../store/workflowStore'
import { Node } from 'reactflow'

export default function NodePanel() {
  const { nodes, edges, setGraph, addNode } = useWorkflowStore()

  const createConversationNode = () => {
    const id = `conversation-${Date.now()}`
    const nodeData: VapiNodeData = {
      id,
      name: 'New Conversation',
      type: 'conversation',
      metadata: {
        position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 }
      },
      prompt: 'How can I help you today?',
      messagePlan: {
        firstMessage: 'Hello! How can I assist you?'
      },
      variableExtractionPlan: {
        output: []
      }
    }
    addNode(nodeData)
  }

  const createToolNode = (toolType: 'transferCall' | 'endCall' | 'apiRequest') => {
    const id = `${toolType}-${Date.now()}`
    const nodeData: VapiNodeData = {
      id,
      name: toolType === 'transferCall' ? 'Transfer Call' : 
            toolType === 'endCall' ? 'End Call' : 'API Request',
      type: 'tool',
      metadata: {
        position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 }
      },
      tool: {
        type: toolType,
        function: {
          name: `${toolType}_function`,
          parameters: {}
        },
        destinations: toolType === 'transferCall' ? [] : undefined,
        messages: toolType === 'endCall' ? [{
          type: 'request-start',
          content: 'Thank you for calling. Have a great day!',
          blocking: true
        }] : undefined
      }
    }
    addNode(nodeData)
  }

  const createConditionNode = () => {
    const id = `condition-${Date.now()}`
    const nodeData: VapiNodeData = {
      id,
      name: 'Condition',
      type: 'condition',
      metadata: {
        position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 }
      },
      prompt: 'Check if user response matches condition'
    }
    addNode(nodeData)
  }

  const createApiNode = () => {
    const id = `api-${Date.now()}`
    const nodeData: VapiNodeData = {
      id,
      name: 'API Request',
      type: 'api',
      metadata: {
        position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 }
      },
      prompt: 'https://api.example.com/endpoint'
    }
    addNode(nodeData)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button 
          onClick={createConversationNode}
          style={{ 
            padding: '12px 16px', 
            fontSize: '13px', 
            textAlign: 'left',
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '16px' }}>💬</div>
          <div>
            <div style={{ fontWeight: '600' }}>Conversation</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>AI conversation node</div>
          </div>
        </button>
        
        <button 
          onClick={() => createToolNode('transferCall')}
          style={{ 
            padding: '12px 16px', 
            fontSize: '13px', 
            textAlign: 'left',
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '16px' }}>📞</div>
          <div>
            <div style={{ fontWeight: '600' }}>Transfer Call</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Transfer to human agent</div>
          </div>
        </button>
        
        <button 
          onClick={() => createToolNode('endCall')}
          style={{ 
            padding: '12px 16px', 
            fontSize: '13px', 
            textAlign: 'left',
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '16px' }}>📴</div>
          <div>
            <div style={{ fontWeight: '600' }}>End Call</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>End the conversation</div>
          </div>
        </button>
        
        <button 
          onClick={createConditionNode}
          style={{ 
            padding: '12px 16px', 
            fontSize: '13px', 
            textAlign: 'left',
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '16px' }}>❓</div>
          <div>
            <div style={{ fontWeight: '600' }}>Condition</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Conditional logic</div>
          </div>
        </button>
        
        <button 
          onClick={createApiNode}
          style={{ 
            padding: '12px 16px', 
            fontSize: '13px', 
            textAlign: 'left',
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          <div style={{ fontSize: '16px' }}>🌐</div>
          <div>
            <div style={{ fontWeight: '600' }}>API Request</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>External API call</div>
          </div>
        </button>
      </div>
    </div>
  )
}
