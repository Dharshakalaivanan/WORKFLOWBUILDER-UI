import { create } from 'zustand'
import { Node, Edge } from 'reactflow'

export type NodeData = { 
  id: string; 
  type: string; 
  data?: any; 
  position?: {x:number,y:number} 
}

export type EdgeData = { 
  id: string; 
  source: string; 
  target: string;
  animated?: boolean;
  style?: any;
}

interface WorkflowState {
  name: string
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  voiceProvider: string
  setName: (v: string) => void
  setGraph: (nodes: Node[], edges: Edge[]) => void
  setSelectedNodeId: (id: string | null) => void
  setSelectedEdgeId: (id: string | null) => void
  setVoiceProvider: (provider: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  name: 'untitled',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  voiceProvider: 'elevenlabs',
  setName: (v) => set({ name: v }),
  setGraph: (nodes, edges) => set({ nodes, edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setVoiceProvider: (provider) => set({ voiceProvider: provider })
}))
