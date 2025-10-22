import { VapiNodeData, VapiEdgeData } from '../store/workflowStore'
import { Node, Edge } from 'reactflow'

export const getVapiSampleWorkflow = () => {

  // Sample Vapi workflow data
  const vapiWorkflow = {
    name: "Appointment Scheduler",
    globalPrompt: "",
    nodes: [
      {
        id: "start",
        name: "start",
        type: "conversation",
        isStart: true,
        metadata: {
          position: { x: -705.8237557575243, y: -740.9114717829991 }
        },
        prompt: "You are Riley, appointment scheduling assistant for Wellness Partners health clinic. Start with: 'Thank you for calling Wellness Partners. This is Riley, your scheduling assistant. How may I help you today?' Listen for scheduling, rescheduling, canceling, or general questions.",
        messagePlan: {
          firstMessage: "Thank you for calling Wellness Partners. This is Riley, your scheduling assistant. How may I help you today?"
        }
      },
      {
        id: "customer_type",
        name: "customer_type",
        type: "conversation",
        metadata: {
          position: { x: -1483.580975329013, y: -23.511909592178966 }
        },
        prompt: "Ask: 'Are you a new patient to Wellness Partners, or have you visited us before?' This helps me provide the right assistance for your appointment.",
        variableExtractionPlan: {
          output: [
            {
              enum: ["new", "existing"],
              type: "string",
              title: "customer_type",
              description: "Whether the patient is new or existing"
            }
          ]
        }
      },
      {
        id: "new_appointment",
        name: "new_appointment",
        type: "conversation",
        metadata: {
          position: { x: -1471.8258644292039, y: 316.2993071890038 }
        },
        prompt: "Ask: 'What type of appointment do you need today?' and 'Do you have a provider preference or want the first available?' Assess urgency level based on their needs.",
        variableExtractionPlan: {
          output: [
            {
              enum: ["Primary Care", "Specialist", "Diagnostic", "Wellness", "Urgent Care"],
              type: "string",
              title: "appointment_type",
              description: "Type of appointment needed"
            },
            {
              enum: ["urgent", "routine"],
              type: "string",
              title: "urgency",
              description: "Urgency level"
            }
          ]
        }
      },
      {
        id: "hangup_1748495964695",
        name: "hangup_1748495964695",
        type: "tool",
        metadata: {
          position: { x: -354.92881830948005, y: 2822.1302851891933 }
        },
        tool: {
          type: "endCall",
          function: {
            name: "untitled_tool",
            parameters: {}
          },
          messages: [
            {
              type: "request-start",
              content: "Thank you for calling Wellness Partners. Have a wonderful day!",
              blocking: true
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: "start-customer_type",
        from: "start",
        to: "customer_type",
        condition: {
          type: "ai",
          prompt: "User wanted to schedule a new appointment"
        }
      },
      {
        id: "customer_type-new_appointment",
        from: "customer_type",
        to: "new_appointment",
        condition: {
          type: "ai",
          prompt: "User type determined, ready to proceed with appointment scheduling"
        }
      },
      {
        id: "new_appointment-hangup",
        from: "new_appointment",
        to: "hangup_1748495964695",
        condition: {
          type: "ai",
          prompt: "Appointment scheduled successfully"
        }
      }
    ]
  }

  // Convert Vapi format to ReactFlow format
  const reactFlowNodes: Node[] = vapiWorkflow.nodes.map(node => ({
    id: node.id,
    type: 'vapi',
    position: node.metadata?.position || { x: 100, y: 100 },
    data: node as VapiNodeData
  }))

  const reactFlowEdges: Edge[] = vapiWorkflow.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    animated: true,
    data: edge as VapiEdgeData
  }))

  return {
    name: vapiWorkflow.name,
    nodes: reactFlowNodes,
    edges: reactFlowEdges,
    globalPrompt: vapiWorkflow.globalPrompt
  }
}

export const exportVapiWorkflow = (nodes: Node[], edges: Edge[], name: string, globalPrompt: string) => {
  
  // Convert ReactFlow format back to Vapi format
  const vapiNodes = nodes.map(node => {
    const nodeData = node.data as VapiNodeData
    return {
      id: nodeData.id,
      name: nodeData.name,
      type: nodeData.type,
      isStart: nodeData.isStart,
      metadata: {
        position: node.position || { x: 0, y: 0 }
      },
      prompt: nodeData.prompt,
      messagePlan: nodeData.messagePlan,
      variableExtractionPlan: nodeData.variableExtractionPlan,
      tool: nodeData.tool,
      globalNodePlan: nodeData.globalNodePlan
    }
  })

  const vapiEdges = edges.map(edge => {
    const edgeData = edge.data as VapiEdgeData
    return {
      id: edge.id,
      from: edgeData.from,
      to: edgeData.to,
      condition: edgeData.condition
    }
  })

  return {
    name,
    globalPrompt,
    nodes: vapiNodes,
    edges: vapiEdges
  }
}
