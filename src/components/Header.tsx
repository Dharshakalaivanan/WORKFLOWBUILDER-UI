import toast from 'react-hot-toast'
import { updateWorkflow } from '../api/workflowApi'
import { useWorkflowStore } from '../store/workflowStore'

export default function Header({ workflowId }: { workflowId?: number }) {
  const { name, nodes, edges } = useWorkflowStore()

  const onSave = async () => {
    if (!workflowId) return toast.error('No workflowId in URL')
    const res = await updateWorkflow(workflowId, { name, nodes, edges } as any)
    toast.success(`Saved ${res.name}`)
  }

  const onTest = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/assistant?workflow_id=${workflowId ?? ''}`)
    ws.onopen = () => ws.send(JSON.stringify({ text: 'Hello from UI' }))
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      toast.success(data.reply)
      ws.close()
    }
  }

  return (
    <div className="topbar">
      <strong className="badge" style={{fontSize:14}}>{name}</strong>
      <span className="spacer" />
      <input className="search" placeholder="Search in workflow..." />
      <button className="button" onClick={onSave}>Save</button>
      <button className="button primary" onClick={onTest}>Test</button>
    </div>
  )
}
