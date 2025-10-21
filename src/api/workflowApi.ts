import axios from 'axios'

const API_BASE =  'http://localhost:8000/api'

export type Workflow = { id: number; slug: string; name: string; nodes: any[]; edges: any[] }

export async function listWorkflows() {
  const res = await axios.get(`${API_BASE}/workflows/`)
  return res.data as Workflow[]
}

export async function createWorkflow(name: string) {
  const res = await axios.post(`${API_BASE}/workflows/`, { name, nodes: [], edges: [] })
  return res.data as Workflow
}

export async function updateWorkflow(id: number, data: Partial<Workflow>) {
  const res = await axios.put(`${API_BASE}/workflows/${id}`, data)
  return res.data as Workflow
}

export async function deleteWorkflow(id: number) {
  await axios.delete(`${API_BASE}/workflows/${id}`)
}

export async function getWorkflowBySlug(slug: string) {
  const res = await axios.get(`${API_BASE}/workflows/slug/${slug}`)
  return res.data as Workflow
}
