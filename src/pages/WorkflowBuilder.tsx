import { useEffect } from 'react'
import Header from '../components/Header'
import NodePanel from '../components/NodePanel'
import NodeConfigPanel from '../components/NodeConfigPanel'
import GlobalConfig from '../components/GlobalConfig'
import WorkflowCanvas from '../components/WorkflowCanvas'
import Assistant from '../components/Assistant'
import { useWorkflowStore } from '../store/workflowStore'
import { updateWorkflow } from '../api/workflowApi'

export default function WorkflowBuilder() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const id = Number(params.get('id')) || undefined
  const { name, nodes, edges } = useWorkflowStore()

  useEffect(() => {
    // persist on unload
    const onBeforeUnload = () => {
      if (id) updateWorkflow(id, { name, nodes, edges } as any)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [id, name, nodes, edges])

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <Header workflowId={id} />
      <div className="layout">
        <div className="sidebar-left">
          <div className="sidebar">
            <h4>Nodes</h4>
            <NodePanel />
            <div style={{height:12}} />
            <h4>Global</h4>
            <GlobalConfig />
          </div>
        </div>
        <div className="canvas">
          <WorkflowCanvas />
        </div>
        <div className="sidebar-right">
          <div className="sidebar" style={{display:'flex', flexDirection:'column', gap:12}}>
            <div>
              <h4>Config</h4>
              <NodeConfigPanel />
            </div>
            <div style={{height:12, borderTop:'1px solid var(--border)'}} />
            <div style={{minHeight:280}}>
              <h4>Assistant</h4>
              <Assistant />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
