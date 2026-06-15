export function TreasuryPage({ vaultBalance, heirStatus, toGen, willSealed }) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Treasury Dashboard</h1>
          <span className={`badge ${willSealed ? 'badge-success' : 'badge-warning'}`}>
            {willSealed ? 'Active vault' : 'Setup vault'}
          </span>
        </div>
        <div className="metric-strip">
          <div><span>Total vault</span><strong>{toGen(vaultBalance)} GEN</strong></div>
          <div><span>Released to connected heir</span><strong>{toGen(BigInt(heirStatus?.released || '0'))} GEN</strong></div>
          <div><span>Connected heir remaining</span><strong>{toGen(BigInt(heirStatus?.remaining || '0'))} GEN</strong></div>
          <div><span>Withdrawable</span><strong>{toGen(BigInt(heirStatus?.withdrawable || '0'))} GEN</strong></div>
        </div>
      </section>

      <section className="glass-panel">
        <h2>Connected heir breakdown</h2>
        {heirStatus ? (
          <div className="metric-list">
            <div><span>Name</span><strong>{heirStatus.name}</strong></div>
            <div><span>Allocation</span><strong>{toGen(BigInt(heirStatus.allocation))} GEN</strong></div>
            <div><span>Released</span><strong>{toGen(BigInt(heirStatus.released))} GEN</strong></div>
            <div><span>Remaining</span><strong>{toGen(BigInt(heirStatus.remaining))} GEN</strong></div>
            <div><span>Last release</span><strong>{heirStatus.last_release}</strong></div>
          </div>
        ) : (
          <p>Connect a registered heir wallet to see a per-heir treasury slice.</p>
        )}
      </section>
    </div>
  )
}
