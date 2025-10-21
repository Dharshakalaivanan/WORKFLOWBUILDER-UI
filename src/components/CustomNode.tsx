import { Handle, Position } from '@reactflow/core'
import { useWorkflowStore } from '../store/workflowStore'

const typeToColor: Record<string, string> = {
	Conversation: '#22c55e',
	'API Request': '#4f8cff',
	'Transfer Call': '#f59e0b',
	'Tool': '#a78bfa',
	'End Call': '#ef4444',
	'Call': '#8b5cf6',
	'Condition': '#10b981'
}

export default function CustomNode({ id, data }: { id: string; data: any }) {
	const { nodes, edges, setGraph, selectedNodeId } = useWorkflowStore()
	const isSelected = selectedNodeId === id

	const updatePrompt = (v: string) => {
		const next = nodes.map((n: any) => 
			n.id === id ? { ...n, data: { ...n.data, prompt: v } } : n
		)
		setGraph(next, edges)
	}

	const updateData = (key: string, value: any) => {
		const next = nodes.map((n: any) => 
			n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n
		)
		setGraph(next, edges)
	}

	const removeNode = () => {
		const remainingNodes = nodes.filter((n: any) => n.id !== id)
		const remainingEdges = edges.filter((e: any) => e.source !== id && e.target !== id)
		setGraph(remainingNodes, remainingEdges)
	}

	const duplicateNode = () => {
		const suffix = Math.floor(Math.random()*10000)
		const base = nodes.find((n: any) => n.id === id)
		if (!base) return
		const newId = `${id}-copy-${suffix}`
		const newNode = { 
			...base, 
			id: newId, 
			position: { 
				x: (base.position?.x || 0) + 40, 
				y: (base.position?.y || 0) + 40 
			} 
		}
		setGraph([...nodes, newNode], edges)
	}

	return (
		<div style={{
			background:'#0c0f14',
			border:`2px solid ${isSelected ? '#4f8cff' : (typeToColor[data?.type] ?? 'var(--border)')}`,
			color:'var(--text)',
			padding:12,
			borderRadius:8,
			minWidth:160,
			textAlign:'center',
			boxShadow: isSelected ? '0 0 10px rgba(79, 140, 255, 0.3)' : 'none'
		}}>
			<Handle type="target" position={Position.Top} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
			<Handle type="target" position={Position.Left} style={{ background:typeToColor[data?.type] ?? '#4f8cff' }} />
			
			<div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8}}>
				<div style={{fontSize:12, color:'var(--muted)'}}>{data?.type ?? 'Node'}</div>
				<div style={{display:'flex', gap:6}}>
					<button type="button" className="button" style={{padding:'2px 6px'}} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); duplicateNode() }}>Copy</button>
					<button type="button" className="button" style={{padding:'2px 6px'}} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{ e.stopPropagation(); removeNode() }}>Delete</button>
				</div>
			</div>
			
			<div style={{fontWeight:600, marginBottom:8}}>{data?.label ?? 'Untitled'}</div>
			
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
						width:'100%', maxWidth:200, height:80,
						background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
						borderRadius:6, padding:8, resize:'none', fontSize:12
					}}
				/>
			)}


			{data?.type === 'Transfer Call' && (
				<div style={{display:'flex', flexDirection:'column', gap:6}}>
					<input
						placeholder="Transfer to number..."
						value={data?.transferNumber ?? ''}
						onChange={(e)=>updateData('transferNumber', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:32,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					/>
					<textarea
						placeholder="Transfer message..."
						value={data?.transferMessage ?? ''}
						onChange={(e)=>updateData('transferMessage', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:50,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:6, resize:'none', fontSize:12
						}}
					/>
				</div>
			)}

			{data?.type === 'API Request' && (
				<div style={{display:'flex', flexDirection:'column', gap:6}}>
					<select
						value={data?.method ?? 'GET'}
						onChange={(e)=>updateData('method', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:32,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					>
						<option value="GET">GET</option>
						<option value="POST">POST</option>
						<option value="PUT">PUT</option>
						<option value="DELETE">DELETE</option>
					</select>
					<input
						placeholder="API URL..."
						value={data?.url ?? ''}
						onChange={(e)=>updateData('url', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:32,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					/>
				</div>
			)}

			{/* Condition node: route based on text/flag with positive/negative/fallback */}
			{data?.type === 'Condition' && (
				<div style={{display:'flex', flexDirection:'column', gap:8}}>
					<input
						placeholder="Condition key (e.g. intent, status)"
						value={data?.conditionKey ?? ''}
						onChange={(e)=>updateData('conditionKey', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:28,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					/>
					<div style={{display:'flex', gap:6}}>
						<input
							placeholder="Positive match (comma-separated)"
							value={data?.positiveKeywords ?? ''}
							onChange={(e)=>updateData('positiveKeywords', e.target.value)}
							onMouseDown={(e)=>e.stopPropagation()}
							onClick={(e)=>e.stopPropagation()}
							className="nodrag nowheel"
							style={{
								flex:1, height:28,
								background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
								borderRadius:4, padding:'0 8px', fontSize:12
							}}
						/>
						<input
							placeholder="Negative match (comma-separated)"
							value={data?.negativeKeywords ?? ''}
							onChange={(e)=>updateData('negativeKeywords', e.target.value)}
							onMouseDown={(e)=>e.stopPropagation()}
							onClick={(e)=>e.stopPropagation()}
							className="nodrag nowheel"
							style={{
								flex:1, height:28,
								background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
								borderRadius:4, padding:'0 8px', fontSize:12
							}}
						/>
					</div>
					<input
						placeholder="Fallback message (when no match)"
						value={data?.fallbackMessage ?? ''}
						onChange={(e)=>updateData('fallbackMessage', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:28,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					/>
				</div>
			)}

			{data?.type === 'Call' && (
				<div style={{display:'flex', flexDirection:'column', gap:6}}>
					<input
						placeholder="Phone number..."
						value={data?.phoneNumber ?? ''}
						onChange={(e)=>updateData('phoneNumber', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:32,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:'0 8px', fontSize:12
						}}
					/>
					<textarea
						placeholder="Call script..."
						value={data?.callScript ?? ''}
						onChange={(e)=>updateData('callScript', e.target.value)}
						onMouseDown={(e)=>e.stopPropagation()}
						onClick={(e)=>e.stopPropagation()}
						className="nodrag nowheel"
						style={{
							width:'100%', height:60,
							background:'#0b0e13', color:'var(--text)', border:'1px solid var(--border)',
							borderRadius:4, padding:6, resize:'none', fontSize:12
						}}
					/>
				</div>
			)}

			{/* Branch handles with ids for routing */}
			<Handle id="positive" type="source" position={Position.Right} style={{ background:typeToColor[data?.type] ?? '#22c55e' }} />
			<Handle id="negative" type="source" position={Position.Bottom} style={{ background:typeToColor[data?.type] ?? '#ef4444' }} />
		</div>
	)
}

