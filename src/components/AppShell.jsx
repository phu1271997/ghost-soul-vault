import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WalletWidget } from './WalletWidget'

export function AppShell({
  children,
  connectedAddress,
  loading,
  onConnect,
  onDisconnect,
  contractHealthy,
  contractError,
  language,
  onLanguageChange,
}) {
  const { t } = useTranslation()

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <span>GHOST</span>
          <small>Soul Vault</small>
        </Link>

        <div className="nav-links">
          <NavLink to="/setup">{t('ownerWizard')}</NavLink>
          <NavLink to="/heir">{t('heirPortal')}</NavLink>
          <NavLink to="/treasury">{t('treasury')}</NavLink>
          <NavLink to="/executor">{t('executorPanel')}</NavLink>
          <NavLink to="/demo">{t('demoFamilies')}</NavLink>
        </div>

        <div className="nav-actions">
          <select
            className="language-toggle"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            <option value="en">EN</option>
            <option value="vi">VI</option>
          </select>
          <WalletWidget
            address={connectedAddress}
            loading={loading}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      </nav>

      {!contractHealthy ? (
        <div className="contract-banner">
          <strong>{t('contractHealth')}:</strong> {t('degraded')} · {contractError}
        </div>
      ) : null}

      <main className="container">{children}</main>
    </div>
  )
}
