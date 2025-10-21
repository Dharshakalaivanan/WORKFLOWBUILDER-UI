import { Handle, Position } from '@reactflow/core';
import { useWorkflowStore } from '../store/workflowStore';

const typeToColor: Record<string, string> = {
  Conversation: '#22c55e',
  'API Request': '#4f8cff',
  'Transfer Call': '#f59e0b',
  Tool: '#a78bfa',
  'End Call': '#ef4444',
  Call: '#8b5cf6',
};

export default function CustomNode({ id, data }: { id: string; data: any }) {
  const { nodes, edges, setGraph, selectedNodeId } = useWorkflowStore();
  const isSelected = selectedNodeId === id;

  // Update any field, including trigger array
  const updateNodeData = (key: string, value: any, isTriggerArray = false) => {
    const next = nodes.map((n: any) =>
      n.id === id
        ? {
            ...n,
            data: {
              ...n.data,
              [key]: isTriggerArray
                ? value.split(',').map((t: string) => t.trim())
                : value,
            },
          }
        : n
    );
    setGraph(next, edges);
  };

  const removeNode = () => {
    const remainingNodes = nodes.filter((n: any) => n.id !== id);
    const remainingEdges = edges.filter((e: any) => e.source !== id && e.target !== id);
    setGraph(remainingNodes, remainingEdges);
  };

  const duplicateNode = () => {
    const suffix = Math.floor(Math.random() * 10000);
    const base = nodes.find((n: any) => n.id === id);
    if (!base) return;

    const newId = `${id}-copy-${suffix}`;
    const newNode = {
      ...base,
      id: newId,
      position: {
        x: (base.position?.x || 0) + 40,
        y: (base.position?.y || 0) + 40,
      },
    };
    setGraph([...nodes, newNode], edges);
  };

  return (
    <div
      style={{
        background: '#0c0f14',
        border: `2px solid ${
          isSelected ? '#4f8cff' : typeToColor[data?.type] ?? 'var(--border)'
        }`,
        color: 'var(--text)',
        padding: 12,
        borderRadius: 8,
        minWidth: 160,
        textAlign: 'center',
        boxShadow: isSelected ? '0 0 10px rgba(79, 140, 255, 0.3)' : 'none',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ background: typeToColor[data?.type] ?? '#4f8cff' }} />
      <Handle type="target" position={Position.Left} style={{ background: typeToColor[data?.type] ?? '#4f8cff' }} />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{data?.type ?? 'Node'}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="button" style={{ padding: '2px 6px' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); duplicateNode(); }}>
            Copy
          </button>
          <button type="button" className="button" style={{ padding: '2px 6px' }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeNode(); }}>
            Delete
          </button>
        </div>
      </div>

      {/* Label */}
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{data?.label ?? 'Untitled'}</div>

      {/* Conversation Node */}
      {data?.type === 'Conversation' && (
        <>
          <input
            type="text"
            placeholder="First message"
            value={data?.firstMessage ?? ''}
            onChange={(e) => updateNodeData('firstMessage', e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag nowheel"
            style={{
              width: '100%',
              height: 28,
              background: '#0b0e13',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '0 8px',
              fontSize: 12,
              marginBottom: 6,
            }}
          />
          <textarea
            placeholder="Assistant behavior & instructions..."
            value={data?.prompt ?? ''}
            onChange={(e) => updateNodeData('prompt', e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag nowheel"
            style={{
              width: '100%',
              maxWidth: 200,
              height: 80,
              background: '#0b0e13',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 8,
              resize: 'none',
              fontSize: 12,
            }}
          />
        </>
      )}

      {/* Add other node types (Call, Transfer Call, API) here if needed */}

      {/* Branch Handles */}
      <Handle
        id="positive"
        type="source"
        position={Position.Right}
        style={{ background: typeToColor[data?.type] ?? '#22c55e' }}
      />
      <Handle
        id="negative"
        type="source"
        position={Position.Bottom}
        style={{ background: typeToColor[data?.type] ?? '#ef4444' }}
      />
    </div>
  );
}
