import React, { useCallback } from 'react'
import ReactFlow, { Background, MiniMap, Controls, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Connection, Edge, Node, NodeChange, EdgeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore } from '../store/workflowStore'
import CustomNode from './CustomNode'

const defaultNode = { id: 'start', position: { x: 100, y: 100 }, data: { label: 'Start', type: 'Conversation' }, type: 'custom' }

export default function WorkflowCanvas() {
  const { nodes, edges, setGraph } = useWorkflowStore()

  const onConnect = useCallback((params: Edge | Connection) => {
    const styled = { ...params, animated: true, style: { stroke: '#4f8cff' } } as any
    setGraph(nodes, addEdge(styled, edges as any) as any)
  }, [nodes, edges, setGraph])
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, (nodes as any)) as any
    setGraph(nextNodes, edges as any)
  }, [nodes, edges, setGraph])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, (edges as any)) as any
    setGraph(nodes as any, nextEdges)
  }, [nodes, edges, setGraph])

  const rfNodes = nodes.length ? (nodes as any) : [defaultNode]

  const nodeTypes = { custom: CustomNode }

  return (
    <div style={{height:'100%'}}>
      <ReactFlow
        nodeTypes={nodeTypes as any}
        nodes={rfNodes as any}
        edges={edges as any}
        onConnect={onConnect}
        onNodesChange={onNodesChange as any}
        onEdgesChange={onEdgesChange as any}
        fitView
        connectionRadius={30}
        snapToGrid
        snapGrid={[10,10]}
        connectOnClick={false}
        elementsSelectable
        nodesConnectable
        nodesDraggable
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}
