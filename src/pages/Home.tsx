import { useEffect, useMemo, useState } from 'react'
import { createWorkflow, listWorkflows, Workflow, deleteWorkflow } from '../api/workflowApi'
import toast from 'react-hot-toast'

export default function Home() {
  const [items, setItems] = useState<Workflow[]>([])
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')

  const load = async () => {
    const data = await listWorkflows()
    // stable left-to-right order by ID ascending
    setItems([...data].sort((a,b)=> a.id - b.id))
  }
  useEffect(() => { load() }, [])

  const onCreate = async () => {
    setShowModal(true)
    setNewName('')
  }

  const confirmCreate = async () => {
    const name = newName.trim() || 'New Workflow'
    const wf = await createWorkflow(name)
    toast.success(`Created ${wf.name}`)
    setShowModal(false)
    window.location.hash = `#/builder?id=${wf.id}`
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? items.filter(i => i.name.toLowerCase().includes(s)) : items
  }, [items, q])

  return (
    <>
    <div className="container">
      <div className="toolbar">
        <h3 style={{margin:0}}>Workflows</h3>
        <div style={{display:'flex', gap:8}}>
          <input className="search" placeholder="Search workflows..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="button primary" onClick={onCreate}>+ New Workflow</button>
        </div>
      </div>
      <div className="grid">
        {filtered.map(w => (
          <div key={w.id} className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
              <strong style={{cursor:'pointer'}} onClick={()=> window.location.hash = `#/builder?id=${w.id}`}>{w.name}</strong>
              <div className="row">
                <span className="badge">ID {w.id}</span>
                <button className="button" onClick={()=> window.location.hash = `#/builder?id=${w.id}`}>Open</button>
                <button className="button" onClick={async (e)=>{ e.stopPropagation(); await deleteWorkflow(w.id); toast.success('Deleted'); load() }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {showModal && (
      <div className="overlay" onClick={()=>setShowModal(false)}>
        <div className="modal" onClick={(e)=>e.stopPropagation()}>
          <div className="modal-header">Create Workflow</div>
          <div className="modal-body">
            <label style={{fontSize:12, color:'var(--muted)'}}>Name</label>
            <input className="input" autoFocus placeholder="My workflow" value={newName} onChange={(e)=>setNewName(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') confirmCreate() }} />
          </div>
          <div className="modal-actions">
            <button className="button" onClick={()=>setShowModal(false)}>Cancel</button>
            <button className="button primary" onClick={confirmCreate}>Create</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
