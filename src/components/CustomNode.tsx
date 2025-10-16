import { Handle, Position } from 'reactflow'
import { useWorkflowStore } from '../store/workflowStore'

const typeToColor: Record<string, string> = {
	Conversation: '#22c55e',
	'API Request': '#4f8cff',
	'Transfer Call': '#f59e0b',
	'Tool': '#a78bfa',
	'End Call': '#ef4444'
}

export default function CustomNode({ id, data }: { id: string; data: any }) {
	const { nodes, edges, setGraph } = useWorkflowStore()

	const updatePrompt = (v: string) => {
		const next = (nodes as any).map((n: any) => n.id === id ? { ...n, data: { ...n.data, prompt: v } } : n)
		setGraph(next, edges as any)
	}

	const removeNode = () => {
		const remainingNodes = (nodes as any).filter((n: any) => n.id !== id)
		const remainingEdges = (edges as any).filter((e: any) => e.source !== id && e.target !== id)
		setGraph(remainingNodes, remainingEdges)
	}

	const duplicateNode = () => {
		const suffix = Math.floor(Math.random()*10000)
		const base: any = (nodes as any).find((n: any) => n.id === id)
		if (!base) return
		const newId = `${id}-copy-${suffix}`
		const newNode = { ...base, id: newId, position: { x: base.position.x + 40, y: base.position.y + 40 } }
		setGraph([...(nodes as any), newNode], edges as any)
	}
	return (
		<div style={{
			background:'#0c0f14',
			border:`1px solid ${typeToColor[data?.type] ?? 'var(--border)'}`,
			color:'var(--text)',
			padding:10,
			borderRadius:8,
			minWidth:140,
			textAlign:'center'
		}}>
			<Handle type="target" position={Position.Top} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
			<Handle type="target" position={Position.Left} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
			<div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
				<div style={{fontSize:12, color:'var(--muted)'}}>{data?.type ?? 'Node'}</div>
				<div style={{display:'flex', gap:6}}>
					<button type="button" className="button" style={{padding:'2px 6px'}} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); duplicateNode() }}>Copy</button>
					<button type="button" className="button" style={{padding:'2px 6px'}} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); removeNode() }}>Delete</button>
				</div>
			</div>
			<div style={{fontWeight:600, marginBottom:6}}>{data?.label ?? 'Untitled'}</div>
			{data?.type === 'Conversation' && (
				<textarea
					placeholder="Type the assistant prompt..."
					value={data?.prompt ?? ''}
					onChange={(e)=>updatePrompt(e.target.value)}
					onMouseDown={(e)=>e.stopPropagation()}
					onPointerDown={(e)=>e.stopPropagation()}
					onDoubleClick={(e)=>e.stopPropagation()}
					onClick={(e)=>e.stopPropagation()}
					className="nodrag nowheel"
					style={{
						width:180, maxWidth:220, height:70,
						background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
						borderRadius:6, padding:6, resize:'none'
					}}
				/>
			)}
			<Handle type="source" position={Position.Right} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
			<Handle type="source" position={Position.Bottom} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
		</div>
	)
}

