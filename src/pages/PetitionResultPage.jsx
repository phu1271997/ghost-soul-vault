export function PetitionResultPage({ result, actions, toGen }) {
  if (!result) {
    return (
      <div className="glass-panel empty-hero">
        <h1>No petition result yet</h1>
        <p>Submit a petition first, then Ghost will show the latest consensus verdict here.</p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Petition Verdict</h1>
          <span className={`badge ${result.approved ? 'badge-success' : 'badge-warning'}`}>
            {result.approved ? 'Approved' : 'Denied'}
          </span>
        </div>
        <p className="typewriter-block">{result.soul_message}</p>
      </section>

      <section className="card-grid two-up">
        <div className="glass-panel">
          <h2>Verdict card</h2>
          <div className="metric-list">
            <div><span>Requested</span><strong>{result.requested_amount} GEN</strong></div>
            <div><span>AI amount approved</span><strong>{toGen(BigInt(result.amount_approved || '0'))} GEN</strong></div>
            <div><span>Final amount after guardrails</span><strong>{toGen(BigInt(result.amount_final || '0'))} GEN</strong></div>
            <div><span>Living with integrity</span><strong>{String(result.living_with_integrity)}</strong></div>
          </div>
        </div>

        <div className="glass-panel">
          <h2>Reasoning</h2>
          <p>{result.reasoning || 'No reasoning returned.'}</p>
          <p><strong>Alignment:</strong> {result.alignment_with_values || 'No alignment notes returned.'}</p>
          <button className="btn btn-secondary" onClick={() => actions.withdraw()}>
            Withdraw approved GEN
          </button>
        </div>
      </section>
    </div>
  )
}
