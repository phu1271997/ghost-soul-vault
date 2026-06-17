import { useState } from 'react'

const defaultHeirSocials = '["https://github.com/octocat","https://www.linkedin.com/"]'

export function OwnerSetupPage({ actions, txLoading }) {
  const [personaInput, setPersonaInput] = useState('')
  const [executorInput, setExecutorInput] = useState('')
  const [limits, setLimits] = useState({
    maxPerRequest: '',
    cooldown: '',
    inactivity: '',
  })
  const [heirForm, setHeirForm] = useState({
    address: '',
    name: '',
    socials: defaultHeirSocials,
    allocation: '',
  })
  const [depositAmount, setDepositAmount] = useState('')

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Owner Setup Wizard</h1>
          <span className="badge badge-gold">5-step flow</span>
        </div>
        <p>
          Write the deceased persona, lock the financial envelope, register heirs, and
          then seal the will permanently.
        </p>
      </section>

      <section className="card-grid two-up">
        <div className="glass-panel">
          <h2>1. Soul persona</h2>
          <textarea
            className="form-control"
            value={personaInput}
            onChange={(event) => setPersonaInput(event.target.value)}
            placeholder="Write the values, principles, and emotional tone of the deceased..."
          />
          <button className="btn btn-primary" disabled={txLoading} onClick={() => actions.addPersona(personaInput)}>
            Save Persona Fragment
          </button>
        </div>

        <div className="glass-panel">
          <h2>2. Executor</h2>
          <input
            className="form-control"
            value={executorInput}
            onChange={(event) => setExecutorInput(event.target.value)}
            placeholder="0x..."
          />
          <button className="btn btn-secondary" disabled={txLoading} onClick={() => actions.setExecutorAddress(executorInput)}>
            Set Executor
          </button>
        </div>
      </section>

      <section className="card-grid two-up">
        <div className="glass-panel">
          <h2>3. Deterministic limits</h2>
          <div className="form-group">
            <label className="form-label">Max per request (GEN)</label>
            <input
              className="form-control"
              value={limits.maxPerRequest}
              onChange={(event) => setLimits((prev) => ({ ...prev, maxPerRequest: event.target.value }))}
              placeholder="1.25"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cooldown (seconds)</label>
            <input
              className="form-control"
              value={limits.cooldown}
              onChange={(event) => setLimits((prev) => ({ ...prev, cooldown: event.target.value }))}
              placeholder="86400"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Inactivity trigger (seconds)</label>
            <input
              className="form-control"
              value={limits.inactivity}
              onChange={(event) => setLimits((prev) => ({ ...prev, inactivity: event.target.value }))}
              placeholder="2592000"
            />
          </div>
          <button className="btn btn-primary" disabled={txLoading} onClick={() => actions.setLimits(limits)}>
            Save Guardrails
          </button>
        </div>

        <div className="glass-panel">
          <h2>4. Register heir</h2>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              className="form-control"
              value={heirForm.address}
              onChange={(event) => setHeirForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="0x..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={heirForm.name}
              onChange={(event) => setHeirForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Heir name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Evidence URLs as JSON</label>
            <textarea
              className="form-control"
              value={heirForm.socials}
              onChange={(event) => setHeirForm((prev) => ({ ...prev, socials: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lifetime allocation (GEN)</label>
            <input
              className="form-control"
              value={heirForm.allocation}
              onChange={(event) => setHeirForm((prev) => ({ ...prev, allocation: event.target.value }))}
              placeholder="10"
            />
          </div>
          <button className="btn btn-secondary" disabled={txLoading} onClick={() => actions.registerHeir(heirForm)}>
            Register Heir
          </button>
        </div>
      </section>

      <section className="card-grid two-up">
        <div className="glass-panel">
          <h2>5. Deposit and seal</h2>
          <input
            className="form-control"
            value={depositAmount}
            onChange={(event) => setDepositAmount(event.target.value)}
            placeholder="5"
          />
          <div className="inline-actions">
            <button className="btn btn-teal" disabled={txLoading} onClick={() => actions.deposit(depositAmount)}>
              Deposit GEN
            </button>
            <button className="btn btn-secondary" disabled={txLoading} onClick={() => actions.heartbeat()}>
              Heartbeat
            </button>
          </div>
          <button className="btn btn-danger" disabled={txLoading} onClick={() => actions.sealWill()}>
            Seal Will Forever
          </button>
        </div>

        <div className="glass-panel">
          <h2>Failsafe controls</h2>
          <p>
            The dead-man switch remains available if the owner goes silent beyond the
            configured inactivity period.
          </p>
          <button className="btn btn-secondary" disabled={txLoading} onClick={() => actions.forceSeal()}>
            Force Seal If Inactive
          </button>
        </div>
      </section>
    </div>
  )
}
