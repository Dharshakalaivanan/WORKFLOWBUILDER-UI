import { useWorkflowStore } from '../store/workflowStore'

export default function NodePanel() {
  const { nodes, edges, setGraph } = useWorkflowStore()

  const addNode = (type: string) => {
    const id = `${type}-${nodes.length + 1}`
    const node = { id, type: 'custom', position: { x: 200 + nodes.length * 40, y: 200 } as any, data: { label: type, type } }
    setGraph([...(nodes as any), node as any], edges as any)
  }

  return (
    <div style={{display:'flex', gap:8, flexDirection:'column'}}>
      <button className="button" onClick={() => addNode('Conversation')}>+ Conversation</button>
      <button className="button" onClick={() => addNode('API Request')}>+ API Request</button>
      <button className="button" onClick={() => addNode('Transfer Call')}>+ Transfer Call</button>
      <button className="button" onClick={() => addNode('End Call')}>+ End Call</button>
      <button className="button" onClick={() => addNode('Tool')}>+ Tool</button>
    </div>
  )
}
