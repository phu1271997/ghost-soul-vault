import { demoScenarios } from '../lib/demoScenarios'

export function DemoFamilyPage({ onPickScenario }) {
  return (
    <div className="page-stack">
      <section className="glass-panel">
        <div className="section-heading">
          <h1>Demo Family Gallery</h1>
          <span className="badge badge-teal">Staff shortcut</span>
        </div>
        <p>
          These scenarios are tuned to explain the product in under two minutes: one
          traditional family and one integrity-driven founder family.
        </p>
      </section>

      <section className="scenario-grid">
        {demoScenarios.map((scenario) => (
          <article key={scenario.id} className="glass-panel scenario-detail">
            <h2>{scenario.title}</h2>
            <p>{scenario.summary}</p>
            <div className="persona-block">{scenario.persona}</div>
            <div className="heir-list">
              {scenario.heirs.map((heir) => (
                <div key={heir.id} className="heir-card">
                  <h4>{heir.name}</h4>
                  <span className="badge badge-gold">{heir.archetype}</span>
                  <p>{heir.notes}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => onPickScenario(scenario)}>
              Activate Demo Story
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}
