import { useEffect, useState } from 'react'
import { getWorkflowBySlug, Workflow } from '../api/workflowApi'
import WorkflowCanvas from '../components/WorkflowCanvas'
import { useWorkflowStore } from '../store/workflowStore'

export default function PublicWorkflow() {
	const slug = (window.location.hash.split('/')[2] || '').trim()
	const { setName, setGraph } = useWorkflowStore()
	const [notFound, setNotFound] = useState(false)

	useEffect(() => {
		(async () => {
			try {
				const wf = await getWorkflowBySlug(slug)
				setName(wf.name)
				setGraph(wf.nodes as any, wf.edges as any)
			} catch {
				setNotFound(true)
			}
		})()
	}, [slug])

	if (notFound) return <div className="container"><h3>Workflow not found</h3></div>

	return (
		<div className="container">
			<div className="topbar"><strong>Public Workflow</strong><span className="spacer" /> <span className="badge">{slug}</span></div>
			<div style={{height:'80vh', border:'1px solid var(--border)', borderRadius:8}}>
				<WorkflowCanvas />
			</div>
		</div>
	)
}


