export function GuardrailDisplay({ requested, remaining, withdrawable, vault, toGen }) {
  return (
    <div className="guardrail-panel">
      <h4>Deterministic guardrail preview</h4>
      <p>
        The AI can recommend a story-driven amount, but the contract can still release
        only what survives the minimum of all hard constraints.
      </p>
      <div className="guardrail-grid">
        <div>
          <span>Requested</span>
          <strong>{toGen(requested)} GEN</strong>
        </div>
        <div>
          <span>Heir remaining</span>
          <strong>{toGen(remaining)} GEN</strong>
        </div>
        <div>
          <span>Vault available</span>
          <strong>{toGen(vault)} GEN</strong>
        </div>
        <div>
          <span>Currently withdrawable</span>
          <strong>{toGen(withdrawable)} GEN</strong>
        </div>
      </div>
    </div>
  )
}
