import React, { useCallback } from 'react'
import ReactFlow, { Background, MiniMap, Controls, addEdge, applyNodeChanges, applyEdgeChanges, Connection, Edge, Node, NodeChange, EdgeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore } from '../store/workflowStore'
import CustomNode from './CustomNode'

const defaultNode: Node = { 
  id: 'start', 
  position: { x: 100, y: 100 }, 
  data: { label: 'Start', type: 'Conversation', prompt: '' }, 
  type: 'custom' 
}

const nodeTypes = { custom: CustomNode }

export default function WorkflowCanvas() {
  const { nodes, edges, setGraph, setSelectedNodeId, setSelectedEdgeId } = useWorkflowStore()

  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeId = `${params.source}-${params.target}`
    let label: string | undefined
    let style = { stroke: '#4f8cff', strokeWidth: 2 }

    // Auto-label and color by source handle
    if ((params as any).sourceHandle === 'positive') {
      label = 'user said yes'
      style = { stroke: '#22c55e', strokeWidth: 2 }
    } else if ((params as any).sourceHandle === 'negative') {
      label = 'user said no'
      style = { stroke: '#ef4444', strokeWidth: 2 }
    }

    const styled = { 
      ...params, 
      id: edgeId,
      animated: true, 
      label,
      labelBgPadding: label ? [6,2] : undefined,
      labelBgBorderRadius: label ? 4 : undefined,
      labelBgStyle: label ? { fill: '#2a2f3a', color: '#fff' } : undefined,
      style
    } as Edge
    setGraph(nodes, addEdge(styled, edges))
  }, [nodes, edges, setGraph])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, nodes)
    setGraph(nextNodes, edges)
  }, [nodes, edges, setGraph])

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const deletedIds = new Set(deleted.map(n => n.id))
    const remainingNodes = nodes.filter(n => !deletedIds.has(n.id))
    const remainingEdges = edges.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target))
    setGraph(remainingNodes, remainingEdges)
  }, [nodes, edges, setGraph])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, edges)
    setGraph(nodes, nextEdges)
  }, [nodes, edges, setGraph])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation()
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [setSelectedEdgeId, setSelectedNodeId])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [setSelectedNodeId, setSelectedEdgeId])

  const rfNodes = nodes.length ? nodes : [defaultNode]


  return (
    <div style={{height:'100%'}}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={rfNodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedEdgeId(null)}
        fitView
        connectionRadius={30}
        snapToGrid
        snapGrid={[10,10]}
        connectOnClick={false}
        elementsSelectable
        nodesConnectable
        nodesDraggable
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#4f8cff', strokeWidth: 2 }
        }}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  )
}
