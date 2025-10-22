import { useState } from 'react'
import toast from 'react-hot-toast'
import { updateWorkflow } from '../api/workflowApi'
import { useWorkflowStore } from '../store/workflowStore'
import CallInterface from './CallInterface'

export default function Header({ workflowId }: { workflowId?: number }) {
  const { name, nodes, edges, setName } = useWorkflowStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showCallInterface, setShowCallInterface] = useState(false)

  const onSave = async () => {
    if (!workflowId) return toast.error('No workflow ID found')
    setIsSaving(true)
    try {
      const res = await updateWorkflow(workflowId, { name, nodes, edges } as any)
      toast.success(`Workflow "${res.name}" saved successfully`)
    } catch (error) {
      toast.error('Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

  const onTest = async () => {
    if (!workflowId) return toast.error('No workflow ID found')
    // Open the call interface instead
    setShowCallInterface(true)
  }

  const onShare = async () => {
    if (!workflowId) return toast.error('No workflow ID found')
    try {
      const res = await fetch(`http://localhost:8000/api/workflows/get_workflow/${workflowId}`)
      const data = await res.json()
      const url = `${window.location.origin}/#/public/${data.slug}`
      await navigator.clipboard.writeText(url)
      toast.success('Public URL copied to clipboard')
    } catch (error) {
      toast.error('Failed to generate share URL')
    }
  }

  return (
    <>
    <div style={{
      height: '64px',
      background: '#111318',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px'
    }}>
      {/* Logo/Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          W
        </div>
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            Workflow Builder
          </div>
          <div style={{
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            ID: {workflowId || 'New'}
          </div>
        </div>
      </div>

      {/* Workflow Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        maxWidth: '400px'
      }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled Workflow"
          style={{
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%',
            outline: 'none'
          }}
        />
        <div style={{
          fontSize: '12px',
          color: '#94a3b8',
          whiteSpace: 'nowrap'
        }}>
          • Unsaved changes
        </div>
      </div>

      {/* Search */}
      <div style={{
        position: 'relative',
        maxWidth: '300px',
        flex: 1
      }}>
        <input
          type="text"
          placeholder="Search in workflow..."
          style={{
            background: '#1e293b',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px 12px 8px 36px',
            color: '#ffffff',
            fontSize: '14px',
            width: '100%',
            outline: 'none'
          }}
        />
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          🔍
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={onSave}
          disabled={isSaving}
          style={{
            background: '#374151',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? '⏳' : '💾'} {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onTest}
          style={{
            background: '#10b981',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📞 Call
        </button>

        <button
          onClick={onShare}
          style={{
            background: '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔗 Share
        </button>

        <div style={{
          width: '1px',
          height: '24px',
          background: '#374151',
          margin: '0 8px'
        }} />

        <button
          style={{
            background: 'transparent',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px'
          }}
        >
          ⋯
        </button>
      </div>
    </div>

      {/* Call Interface Modal */}
      {showCallInterface && (
        <CallInterface 
          workflowId={workflowId}
          onClose={() => setShowCallInterface(false)}
        />
      )}
    </>
  )
}
