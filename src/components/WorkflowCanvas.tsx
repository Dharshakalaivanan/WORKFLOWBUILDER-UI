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

export default function WorkflowCanvas() {
  const { nodes, edges, setGraph, setSelectedNodeId } = useWorkflowStore()

  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeId = `${params.source}-${params.target}`
    const styled = { 
      ...params, 
      id: edgeId,
      animated: true, 
      style: { stroke: '#4f8cff', strokeWidth: 2 } 
    } as Edge
    setGraph(nodes, addEdge(styled, edges))
  }, [nodes, edges, setGraph])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, nodes)
    setGraph(nextNodes, edges)
  }, [nodes, edges, setGraph])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, edges)
    setGraph(nodes, nextEdges)
  }, [nodes, edges, setGraph])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [setSelectedNodeId])

  const rfNodes = nodes.length ? nodes : [defaultNode]

  const nodeTypes = { custom: CustomNode }

  return (
    <div style={{height:'100%'}}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={rfNodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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
