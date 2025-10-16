import { create } from 'zustand'

export type NodeData = { id: string; type: string; data?: any; position?: {x:number,y:number} }
export type EdgeData = { id: string; source: string; target: string }

interface WorkflowState {
  name: string
  nodes: NodeData[]
  edges: EdgeData[]
  setName: (v: string) => void
  setGraph: (nodes: NodeData[], edges: EdgeData[]) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  name: 'untitled',
  nodes: [],
  edges: [],
  setName: (v) => set({ name: v }),
  setGraph: (nodes, edges) => set({ nodes, edges })
}))
