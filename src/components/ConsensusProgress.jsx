import { Loader2, ShieldCheck, Sparkles } from 'lucide-react'

export function ConsensusProgress({ active }) {
  if (!active) return null

  return (
    <div className="consensus-overlay">
      <div className="consensus-card">
        <div className="consensus-icon-wrap">
          <Sparkles size={24} />
        </div>
        <h3>Consensus in progress</h3>
        <p>
          Validators are rendering evidence, comparing moral judgment, and locking a
          deterministic payout envelope.
        </p>
        <div className="consensus-steps">
          <div><Loader2 size={14} className="spinner" /> Render evidence</div>
          <div><Loader2 size={14} className="spinner" /> Compare soul verdict</div>
          <div><ShieldCheck size={14} /> Enforce financial guardrails</div>
        </div>
      </div>
    </div>
  )
}
