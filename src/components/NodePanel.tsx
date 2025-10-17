import { useWorkflowStore } from '../store/workflowStore'
import { Node } from 'reactflow'

export default function NodePanel() {
  const { nodes, edges, setGraph } = useWorkflowStore()

  const addNode = (type: string) => {
    const id = `${type.toLowerCase().replace(' ', '-')}-${Date.now()}`
    const node: Node = { 
      id, 
      type: 'custom', 
      position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 }, 
      data: { 
        label: type, 
        type,
        prompt: '',
        transferNumber: '',
        transferMessage: '',
        method: 'GET',
        url: '',
        phoneNumber: '',
        callScript: ''
      } 
    }
    setGraph([...nodes, node], edges)
  }

  return (
    <div style={{display:'flex', gap:8, flexDirection:'column'}}>
      <button className="button" onClick={() => addNode('Conversation')}>+ Conversation</button>
      <button className="button" onClick={() => addNode('Call')}>+ Call</button>
      <button className="button" onClick={() => addNode('Transfer Call')}>+ Transfer Call</button>
      <button className="button" onClick={() => addNode('API Request')}>+ API Request</button>
      <button className="button" onClick={() => addNode('Tool')}>+ Tool</button>
      <button className="button" onClick={() => addNode('End Call')}>+ End Call</button>
    </div>
  )
}
