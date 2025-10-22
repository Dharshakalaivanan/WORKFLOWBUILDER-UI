import { useEffect, useState } from 'react';
import Header from '../components/Header';
import NodePanel from '../components/NodePanel';
import VapiNodeConfigPanel from '../components/VapiNodeConfigPanel';
import GlobalConfig from '../components/GlobalConfig';
import WorkflowCanvas from '../components/WorkflowCanvas';
import Assistant from '../components/Assistant';
import VoicePanel from '../components/VoicePanel';
import { getVapiSampleWorkflow } from '../utils/vapiWorkflowLoader';
import { convertImportedWorkflow } from '../utils/workflowImporter';
import { useWorkflowStore } from '../store/workflowStore';
import { updateWorkflow } from '../api/workflowApi'



export default function WorkflowBuilder() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const id = Number(params.get('id')) || undefined;
  const { name, nodes, edges, setGraph, setName, setGlobalPrompt, voiceProvider, globalPrompt } = useWorkflowStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'nodes' | 'voice' | 'variables'>('nodes');

  // 1️⃣ Load saved workflow on mount
  useEffect(() => {
    if (!id) return;

    const fetchWorkflow = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/workflows/get_workflow/${id}`
        );
        const data = await res.json();
        if (data.nodes && data.edges) {
          console.log('Loading workflow data:', data);
          
          // Check if nodes already have ReactFlow format (with data property)
          const hasReactFlowFormat = data.nodes.some((n: any) => n.data !== undefined);
          
          let formattedNodes;
          if (hasReactFlowFormat) {
            // Already in ReactFlow format, just ensure type is set
            formattedNodes = data.nodes.map((node: any) => ({
              ...node,
              type: 'vapi'
            }));
          } else {
            // Old format, convert to ReactFlow format
            formattedNodes = data.nodes.map((node: any, index: number) => ({
              id: node.id || node.name || `node-${index}`,
              type: 'vapi',
              position: node.metadata?.position || node.position || { x: 100 + (index * 200), y: 100 + (index * 100) },
              data: {
                id: node.id || node.name || `node-${index}`,
                name: node.name || `Node ${index + 1}`,
                type: node.type || 'conversation',
                isStart: node.isStart || false,
                prompt: node.prompt,
                messagePlan: node.messagePlan,
                variableExtractionPlan: node.variableExtractionPlan,
                tool: node.tool,
                globalNodePlan: node.globalNodePlan,
                metadata: {
                  position: node.metadata?.position || node.position || { x: 100 + (index * 200), y: 100 + (index * 100) }
                }
              }
            }));
          }
          
          // Format edges
          const formattedEdges = data.edges.map((edge: any, index: number) => {
            // Check if edge uses from/to or source/target
            const source = edge.source || edge.from;
            const target = edge.target || edge.to;
            
            return {
              id: edge.id || `${source}-${target}-${index}`,
              source: source,
              target: target,
              animated: edge.animated !== undefined ? edge.animated : false,
              type: edge.type || 'smoothstep',
              label: edge.label || edge.condition?.prompt,
              labelStyle: edge.labelStyle || { fill: '#fbbf24', fontWeight: 500, fontSize: '12px' },
              labelBgPadding: edge.labelBgPadding || [8, 4],
              labelBgBorderRadius: edge.labelBgBorderRadius || 6,
              labelBgStyle: edge.labelBgStyle || { fill: '#78350f', fillOpacity: 0.9 },
              style: edge.style || { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5, 5' },
              data: edge.data || {
                id: edge.id || `${source}-${target}`,
                from: source,
                to: target,
                condition: edge.condition
              }
            };
          });
          
          console.log('Formatted nodes:', formattedNodes);
          console.log('Formatted edges:', formattedEdges);
          console.log('Setting graph with', formattedNodes.length, 'nodes and', formattedEdges.length, 'edges');
          
          // Use setTimeout to ensure the graph is set after component mounts
          setTimeout(() => {
            setGraph(formattedNodes, formattedEdges);
            console.log('Graph set successfully');
          }, 100);
        }
      } catch (err) {
        console.error('Failed to load workflow', err);
      }
    };

    fetchWorkflow();
  }, [id, setGraph]);

  // 2️⃣ Persist workflow on unload
  useEffect(() => {
    const onBeforeUnload = () => {
      if (id) updateWorkflow(id, { name, nodes, edges } as any);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [id, name, nodes, edges]);

  const handleExecuteWorkflow = async () => {
    setIsExecuting(true);
    setExecutionLogs(['Starting workflow execution...']);
    
    // Simulate workflow execution
    setTimeout(() => {
      setExecutionLogs(prev => [...prev, 'Workflow executed successfully!']);
      setIsExecuting(false);
    }, 2000);
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#0a0b0d',
      color: '#ffffff'
    }}>
      {/* Header */}
      <Header workflowId={id} />
      
      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        background: '#0a0b0d'
      }}>
        {/* Left Sidebar */}
        <div style={{
          width: '280px',
          background: '#111318',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #1e293b',
            background: '#0f1419'
          }}>
            {[
              { id: 'nodes', label: 'Nodes', icon: '🔧' },
              { id: 'voice', label: 'Voice', icon: '🎤' },
              { id: 'variables', label: 'Variables', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: activeTab === tab.id ? '#1e293b' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {activeTab === 'nodes' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    margin: '0 0 12px 0'
                  }}>
                    Add Nodes
                  </h3>
                  <NodePanel />
                </div>
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#ffffff',
                    margin: '0 0 12px 0'
                  }}>
                    Global Settings
                  </h3>
                  <GlobalConfig />
                </div>
              </div>
            )}
            
            {activeTab === 'voice' && (
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#ffffff',
                  margin: '0 0 16px 0'
                }}>
                  Voice Configuration
                </h3>
                <VoicePanel />
              </div>
            )}
            
            {activeTab === 'variables' && (
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#ffffff',
                  margin: '0 0 16px 0'
                }}>
                  Global Variables
                </h3>
                <div style={{
                  background: '#1e293b',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#94a3b8'
                }}>
                  Define global variables that can be used across all nodes in your workflow.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: '#0a0b0d'
        }}>
          {/* Canvas Toolbar */}
          <div style={{
            height: '48px',
            background: '#111318',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '12px'
          }}>
            <button
              className="button"
              onClick={handleExecuteWorkflow}
              disabled={isExecuting}
              style={{
                background: isExecuting ? '#374151' : '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isExecuting ? '⏳' : '▶️'} {isExecuting ? 'Executing...' : 'Execute'}
            </button>
            
            <button
              className="button"
              onClick={() => {
                const sampleWorkflow = getVapiSampleWorkflow();
                setName(sampleWorkflow.name);
                setGlobalPrompt(sampleWorkflow.globalPrompt);
                setGraph(sampleWorkflow.nodes, sampleWorkflow.edges);
                alert('Sample workflow loaded!');
              }}
              style={{
                background: '#374151',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📥 Load Sample
            </button>

            <div style={{ flex: 1 }} />
            
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>Nodes: {nodes.length}</span>
              <span>•</span>
              <span>Edges: {edges.length}</span>
            </div>
          </div>

          {/* Canvas Area */}
          <div style={{ flex: 1, position: 'relative' }}>
            <WorkflowCanvas />
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{
          width: '320px',
          background: '#111318',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #1e293b',
            background: '#0f1419'
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#ffffff',
              margin: '0 0 8px 0'
            }}>
              Node Configuration
            </h3>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              Select a node to configure its properties
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <VapiNodeConfigPanel />
          </div>

          {/* Execution Logs */}
          {executionLogs.length > 0 && (
            <div style={{
              borderTop: '1px solid #1e293b',
              padding: '16px',
              background: '#0f1419'
            }}>
              <h4 style={{ 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                Execution Logs
              </h4>
              <div style={{
                background: '#1e293b',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#94a3b8',
                maxHeight: '120px',
                overflow: 'auto'
              }}>
                {executionLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
