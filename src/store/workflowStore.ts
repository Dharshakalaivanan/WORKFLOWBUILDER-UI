import { create } from 'zustand'
import { Node, Edge } from 'reactflow'

export type VapiNodeData = {
  id: string
  name: string
  type: 'conversation' | 'tool' | 'condition' | 'api'
  isStart?: boolean
  metadata?: {
    position: { x: number; y: number }
  }
  prompt?: string
  messagePlan?: {
    firstMessage?: string
  }
  variableExtractionPlan?: {
    output: Array<{
      enum?: string[]
      type: string
      title: string
      description: string
    }>
  }
  tool?: {
    type: 'transferCall' | 'endCall' | 'apiRequest'
    function: {
      name: string
      parameters: any
    }
    destinations?: string[]
    messages?: Array<{
      type: string
      content: string
      blocking: boolean
    }>
  }
  globalNodePlan?: {
    enabled: boolean
    enterCondition: string
  }
  trigger?: {
    positive?: string[]
    negative?: string[]
    conditions?: Array<{
      type: 'ai' | 'keyword' | 'sentiment'
      value: string
      response: 'positive' | 'negative' | 'neutral'
    }>
  }
}

export type VapiEdgeData = {
  id: string
  from: string
  to: string
  condition: {
    type: 'ai' | 'condition'
    prompt: string
  }
}

export type NodeData = { 
  id: string; 
  type: string; 
  data?: VapiNodeData; 
  position?: {x:number,y:number} 
}

export type EdgeData = { 
  id: string; 
  source: string; 
  target: string;
  animated?: boolean;
  style?: any;
  data?: VapiEdgeData;
}

interface WorkflowState {
  name: string
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  voiceProvider: string
  globalPrompt: string
  setName: (v: string) => void
  setGraph: (nodes: Node[], edges: Edge[]) => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setVoiceProvider: (provider: string) => void
  setGlobalPrompt: (prompt: string) => void
  addNode: (nodeData: VapiNodeData) => void
  updateNode: (id: string, nodeData: Partial<VapiNodeData>) => void
  deleteNode: (id: string) => void
  addEdge: (edgeData: VapiEdgeData) => void
  updateEdge: (id: string, edgeData: Partial<VapiEdgeData>) => void
  deleteEdge: (id: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  name: 'untitled',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  voiceProvider: 'elevenlabs',
  globalPrompt: '',
  setName: (v) => set({ name: v }),
  setGraph: (nodes, edges) => {
    console.log('Store setGraph called with:', nodes.length, 'nodes,', edges.length, 'edges')
    console.log('Nodes:', nodes)
    console.log('Edges:', edges)
    set({ nodes, edges })
  },
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setVoiceProvider: (provider) => set({ voiceProvider: provider }),
  setGlobalPrompt: (prompt) => set({ globalPrompt: prompt }),
  
  addNode: (nodeData: VapiNodeData) => {
    const { nodes, edges } = get()
    const newNode: Node = {
      id: nodeData.id,
      type: 'vapi',
      position: nodeData.metadata?.position || { x: 100, y: 100 },
      data: {
        ...nodeData,
        metadata: {
          position: nodeData.metadata?.position || { x: 100, y: 100 }
        }
      }
    }
    set({ nodes: [...nodes, newNode] })
  },
  
  updateNode: (id: string, nodeData: Partial<VapiNodeData>) => {
    const { nodes } = get()
    const updatedNodes = nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, ...nodeData } }
        : node
    )
    set({ nodes: updatedNodes })
  },
  
  deleteNode: (id: string) => {
    const { nodes, edges } = get()
    const remainingNodes = nodes.filter(node => node.id !== id)
    const remainingEdges = edges.filter(edge => 
      edge.source !== id && edge.target !== id
    )
    set({ nodes: remainingNodes, edges: remainingEdges })
  },
  
  addEdge: (edgeData: VapiEdgeData) => {
    const { edges } = get()
    const newEdge: Edge = {
      id: `${edgeData.from}-${edgeData.to}`,
      source: edgeData.from,
      target: edgeData.to,
      animated: true,
      data: edgeData
    }
    set({ edges: [...edges, newEdge] })
  },
  
  updateEdge: (id: string, edgeData: Partial<VapiEdgeData>) => {
    const { edges } = get()
    const updatedEdges = edges.map(edge =>
      edge.id === id
        ? { ...edge, data: { ...edge.data, ...edgeData } }
        : edge
    )
    set({ edges: updatedEdges })
  },
  
  deleteEdge: (id: string) => {
    const { edges } = get()
    const remainingEdges = edges.filter(edge => edge.id !== id)
    set({ edges: remainingEdges })
  }
}))
