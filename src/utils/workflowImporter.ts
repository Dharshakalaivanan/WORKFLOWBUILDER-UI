import { Node, Edge } from 'reactflow'
import { VapiNodeData } from '../store/workflowStore'

export interface ImportedWorkflow {
  name: string
  nodes: any[]
  edges: any[]
  globalPrompt?: string
}

export const convertImportedWorkflow = (imported: ImportedWorkflow) => {
  // Convert nodes to ReactFlow format
  const reactFlowNodes: Node[] = imported.nodes.map((node, index) => {
    // Create node data with proper structure
    const nodeData: VapiNodeData = {
      id: node.name || `node-${index}`,
      name: node.name || `Node ${index + 1}`,
      type: node.type || 'conversation',
      isStart: node.isStart || false,
      metadata: node.metadata || {
        position: { x: 100 + (index * 200), y: 100 + (index * 100) }
      },
      prompt: node.prompt,
      messagePlan: node.messagePlan,
      variableExtractionPlan: node.variableExtractionPlan,
      tool: node.tool,
      globalNodePlan: node.globalNodePlan
    }

    return {
      id: node.name || `node-${index}`,
      type: 'vapi',
      position: node.metadata?.position || { x: 100 + (index * 200), y: 100 + (index * 100) },
      data: nodeData
    }
  })

  // Convert edges to ReactFlow format
  const reactFlowEdges: Edge[] = imported.edges.map((edge, index) => {
    const edgeId = `${edge.from}-${edge.to}-${index}`
    
    // Determine edge style and label based on condition
    let label = edge.condition?.prompt || undefined
    let style = { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5, 5' }
    
    // Check if it's a yes/no type condition
    if (label) {
      const lowerLabel = label.toLowerCase()
      if (lowerLabel.includes('yes') || lowerLabel.includes('agree') || lowerLabel.includes('positive')) {
        style = { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '5, 5' }
      } else if (lowerLabel.includes('no') || lowerLabel.includes('decline') || lowerLabel.includes('negative')) {
        style = { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5, 5' }
      }
    }

    return {
      id: edgeId,
      source: edge.from,
      target: edge.to,
      animated: false,
      label,
      labelStyle: { 
        fill: '#fbbf24',
        fontWeight: 500,
        fontSize: '12px'
      },
      labelBgPadding: label ? [8, 4] : undefined,
      labelBgBorderRadius: label ? 6 : undefined,
      labelBgStyle: label ? { 
        fill: '#78350f', 
        fillOpacity: 0.9
      } : undefined,
      style,
      type: 'smoothstep',
      data: {
        id: edgeId,
        from: edge.from,
        to: edge.to,
        condition: edge.condition
      }
    }
  })

  return {
    name: imported.name || 'Untitled Workflow',
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    globalPrompt: imported.globalPrompt || ''
  }
}

