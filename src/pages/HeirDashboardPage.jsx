import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConversationView } from '../components/ConversationView'
import { GuardrailDisplay } from '../components/GuardrailDisplay'

export function HeirDashboardPage({ heirStatus, convoMessages, actions, toGen, vaultBalance, canWithdraw }) {
  const [chatMessage, setChatMessage] = useState('')
  const [petitionMessage, setPetitionMessage] = useState('')
  const [petitionAmount, setPetitionAmount] = useState('')

  if (!heirStatus) {
    return (
      <div className="glass-panel empty-hero">
        <h1>Heir Portal Locked</h1>
        <p>
          Connect a registered heir wallet after the will is sealed to unlock
          conversation and petition actions.
        </p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Heir Dashboard</h1>
          <span className="badge badge-success">Will Active</span>
        </div>
        <div className="metric-strip">
          <div><span>Allocated</span><strong>{toGen(BigInt(heirStatus.allocation))} GEN</strong></div>
          <div><span>Released</span><strong>{toGen(BigInt(heirStatus.released))} GEN</strong></div>
          <div><span>Remaining</span><strong>{toGen(BigInt(heirStatus.remaining))} GEN</strong></div>
          <div><span>Withdrawable</span><strong>{toGen(BigInt(heirStatus.withdrawable || '0'))} GEN</strong></div>
        </div>
      </section>

      <section className="card-grid two-up">
        <div className="glass-panel">
          <h2>Conversation</h2>
          <ConversationView messages={convoMessages} />
          <div className="chat-input-bar">
            <input
              className="form-control"
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              placeholder="Tell the soul how your life is going..."
            />
            <button className="btn btn-teal" onClick={() => actions.converse(chatMessage)}>
              Send
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <h2>Petition</h2>
          <GuardrailDisplay
            requested={BigInt(petitionAmount ? Math.floor(Number(petitionAmount) * 10 ** 18) : 0)}
            remaining={BigInt(heirStatus.remaining)}
            withdrawable={BigInt(heirStatus.withdrawable || '0')}
            vault={vaultBalance}
            toGen={toGen}
          />
          <div className="form-group">
            <label className="form-label">Requested GEN</label>
            <input
              className="form-control"
              value={petitionAmount}
              onChange={(event) => setPetitionAmount(event.target.value)}
              placeholder="0.8"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message to the soul</label>
            <textarea
              className="form-control"
              value={petitionMessage}
              onChange={(event) => setPetitionMessage(event.target.value)}
              placeholder="Explain what the funds will support and why it aligns with family values."
            />
          </div>
          <div className="inline-actions">
            <button className="btn btn-primary" onClick={() => actions.petition(petitionMessage, petitionAmount)}>
              Submit Petition
            </button>
            <button className="btn btn-secondary" disabled={!canWithdraw} onClick={() => actions.withdraw()}>
              Withdraw
            </button>
          </div>
          <Link className="btn btn-secondary" to="/petition/latest">
            View latest petition result
          </Link>
        </div>
      </section>
    </div>
  )
}
