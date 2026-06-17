export function ExecutorPanelPage({ lastPetitionResult, executor }) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Executor Panel</h1>
          <span className="badge badge-gold">Manual oversight</span>
        </div>
        <p>
          This page previews the seven-day override concept requested for resubmission. The
          current contract hotfix does not yet expose an override write method, so the UI
          presents the operating model and the latest case context.
        </p>
        <p><strong>Executor:</strong> {executor || 'Not configured'}</p>
      </section>

      <section className="glass-panel">
        <h2>Latest petition in review window</h2>
        {lastPetitionResult ? (
          <div className="metric-list">
            <div><span>Created</span><strong>{lastPetitionResult.createdAt}</strong></div>
            <div><span>Requested</span><strong>{lastPetitionResult.requested_amount} GEN</strong></div>
            <div><span>Approved</span><strong>{String(lastPetitionResult.approved)}</strong></div>
            <div><span>Final amount</span><strong>{lastPetitionResult.amount_final}</strong></div>
          </div>
        ) : (
          <p>No petitions recorded in this local review session yet.</p>
        )}
      </section>
    </div>
  )
}
