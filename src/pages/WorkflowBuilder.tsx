import { useEffect } from 'react';
import Header from '../components/Header';
import NodePanel from '../components/NodePanel';
import VapiNodeConfigPanel from '../components/VapiNodeConfigPanel';
import GlobalConfig from '../components/GlobalConfig';
import WorkflowCanvas from '../components/WorkflowCanvas';
import Assistant from '../components/Assistant';
import { useWorkflowStore } from '../store/workflowStore';
import { updateWorkflow } from '../api/workflowApi';
import { Workflow as WF } from '../api/workflowApi';

export default function WorkflowBuilder() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const id = Number(params.get('id')) || undefined;
  const { name, nodes, edges, setGraph } = useWorkflowStore();

  // 1️⃣ Load saved workflow on mount
  useEffect(() => {
    if (!id) return;

    const fetchWorkflow = async () => {
      try {
        const apiBase =
          (window as any).VITE_API_BASE ||
          (import.meta as any).env?.VITE_API_BASE ||
          'http://localhost:8000/api';
        const res = await fetch(
          `${apiBase}/workflows/get_workflow/${id}`
        );
        const data = (await res.json()) as WF;
        if (data.nodes && data.edges) {
          setGraph(data.nodes, data.edges); // restore nodes and edges
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header workflowId={id} />
      <div className="layout">
        <div className="sidebar-left">
          <div className="sidebar">
            <h4>Nodes</h4>
            <NodePanel />
            <div style={{ height: 12 }} />
            <h4>Global</h4>
            <GlobalConfig />
          </div>
        </div>
        <div className="canvas">
          <WorkflowCanvas />
        </div>
        <div className="sidebar-right">
          <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <h4>Config</h4>
              <VapiNodeConfigPanel />
            </div>
            <div style={{ height: 12, borderTop: '1px solid var(--border)' }} />
            
          </div>
        </div>
      </div>
      
    </div>
  );
}
