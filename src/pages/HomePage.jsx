import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Sparkles, Vault } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { demoScenarios } from '../lib/demoScenarios'

export function HomePage({ contractAddress, persona, willSealed, vaultBalance, toGen }) {
  const { t } = useTranslation()

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hero-copy"
        >
          <span className="eyebrow">{t('demoLabel')}</span>
          <h1>{t('heroTagline')}</h1>
          <p>{t('heroBody')}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/setup">
              {t('setupLegacy')}
              <ArrowRight size={16} />
            </Link>
            <Link className="btn btn-secondary" to="/demo">
              {t('tryDemo')}
            </Link>
          </div>
        </motion.div>

        <div className="hero-spotlight">
          <div className="hero-stat">
            <span>Contract</span>
            <strong>{contractAddress}</strong>
          </div>
          <div className="hero-stat">
            <span>Will status</span>
            <strong>{willSealed ? 'Sealed' : 'Setup'}</strong>
          </div>
          <div className="hero-stat">
            <span>Vault balance</span>
            <strong>{toGen(vaultBalance)} GEN</strong>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <article className="feature-card">
          <Sparkles size={18} />
          <h3>Why it dies without GenLayer</h3>
          <p>
            Ghost needs live web evidence, AI persona judgment, and deterministic
            on-chain payout guardrails in the same transaction envelope.
          </p>
        </article>
        <article className="feature-card">
          <ShieldCheck size={18} />
          <h3>Guardrails first</h3>
          <p>
            Even when the AI approves, the contract still clips the amount to
            remaining allocation, vault liquidity, and per-request caps.
          </p>
        </article>
        <article className="feature-card">
          <Vault size={18} />
          <h3>Luxury dark UX</h3>
          <p>
            The interface is positioned like a premium family office portal rather
            than a raw blockchain dashboard.
          </p>
        </article>
      </section>

      <section className="glass-panel">
        <div className="section-heading">
          <h2>Persona excerpt</h2>
          <span className="badge badge-gold">{willSealed ? 'Immutable' : 'Draft'}</span>
        </div>
        <p className="persona-block">
          {persona || 'No persona recorded yet. The owner setup wizard will write the soul voice here.'}
        </p>
      </section>

      <section className="glass-panel">
        <div className="section-heading">
          <h2>Demo families for staff review</h2>
        </div>
        <div className="scenario-grid">
          {demoScenarios.map((scenario) => (
            <div key={scenario.id} className="scenario-card">
              <h3>{scenario.title}</h3>
              <p>{scenario.summary}</p>
              <Link className="btn btn-secondary" to="/demo">
                Open Demo Scenario
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
