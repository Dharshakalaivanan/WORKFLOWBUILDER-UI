import React, { useCallback, useEffect } from 'react'
import ReactFlow, { Background, MiniMap, Controls, addEdge, applyNodeChanges, applyEdgeChanges, Connection, Edge, Node, NodeChange, EdgeChange, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore, VapiNodeData } from '../store/workflowStore'
import VapiNode from './VapiNode'

const defaultNode: Node = {
  id: 'start',
  position: { x: 100, y: 100 },
  data: {
    id: 'start',
    name: 'Start',
    type: 'conversation',
    isStart: true,
    prompt: 'You are a helpful assistant. Respond naturally to the user and determine if they are interested in your services. If they show interest, guide them positively. If they decline or seem uninterested, politely end the conversation.',
    messagePlan: {
      firstMessage: 'Hi! Are you free to talk about how we can help your business grow?'
    },
    variableExtractionPlan: {
      output: [
        {
          type: 'string',
          title: 'user_interest',
          description: 'Whether the user shows interest in the conversation',
          enum: ['positive', 'negative', 'neutral']
        }
      ]
    },
    trigger: {
      positive: ['yes', 'sure', 'interested', 'tell me more', 'sounds good', 'definitely'],
      negative: ['no', 'not interested', 'busy', 'not now', 'not today', 'decline'],
      conditions: [
        {
          type: 'ai',
          value: 'Determine if the user shows interest in the conversation based on their response',
          response: 'positive'
        },
        {
          type: 'ai',
          value: 'Determine if the user is declining or showing disinterest',
          response: 'negative'
        }
      ]
    }
  } as VapiNodeData,
  type: 'vapi'
}

const nodeTypes = { 
  vapi: VapiNode,
  // Fallback for any legacy nodes with different types
  tool: VapiNode,
  condition: VapiNode,
  api: VapiNode,
  conversation: VapiNode
}

export default function WorkflowCanvas() {
  const { nodes, edges, setGraph, setSelectedNodeId, setSelectedEdgeId } = useWorkflowStore()

  useEffect(() => {
    console.log('WorkflowCanvas: Current nodes:', nodes.length, nodes)
    console.log('WorkflowCanvas: Current edges:', edges.length, edges)
  }, [nodes, edges])

  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeId = `${params.source}-${params.target}-${(params as any).sourceHandle || 'default'}`
    let label: string | undefined
    let style = { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5, 5' }

    // Auto-label and color by source handle
    if ((params as any).sourceHandle === 'positive') {
      label = 'user said yes'
      style = { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '5, 5' }
    } else if ((params as any).sourceHandle === 'negative') {
      label = 'user said no'
      style = { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5, 5' }
    }

    const styled = { 
      ...params, 
      id: edgeId,
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
      type: 'smoothstep' // Use smoothstep for better edge routing
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

  // Ensure all nodes have valid position data and correct type
  const rfNodes = nodes.length ? nodes.map((node, index) => {
    const nodeId = node.id || `node-${index}`
    return {
      ...node,
      id: nodeId, // Ensure unique ID
      type: 'vapi', // Ensure all nodes use the vapi type
      position: node.position || { x: 100, y: 100 },
      key: nodeId // Add explicit key for React
    }
  }) : [defaultNode]


  return (
    <div style={{ height: '100%', background: '#0a0b0d' }}>
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
        snapGrid={[20, 20]}
        connectOnClick={false}
        elementsSelectable
        nodesConnectable
        nodesDraggable
        defaultEdgeOptions={{
          animated: false,
          type: 'smoothstep',
          style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5, 5' }
        }}
        style={{
          background: '#0a0b0d'
        }}
      >
        <Background 
          color="#1e293b" 
          gap={20} 
          size={1}
          style={{
            background: '#0a0b0d'
          }}
        />
        <MiniMap 
          style={{
            background: '#111318',
            border: '1px solid #1e293b'
          }}
          nodeColor={(node) => {
            if (node.data?.type === 'conversation') return '#22c55e'
            if (node.data?.type === 'tool') return '#4f8cff'
            if (node.data?.type === 'condition') return '#f59e0b'
            if (node.data?.type === 'api') return '#a78bfa'
            return '#6b7280'
          }}
          maskColor="rgba(10, 11, 13, 0.8)"
        />
        <Controls 
          style={{
            background: '#111318',
            border: '1px solid #1e293b',
            borderRadius: '8px'
          }}
        />
      </ReactFlow>
    </div>
  )
}
