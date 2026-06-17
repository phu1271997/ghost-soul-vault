import { Loader2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function WalletWidget({ address, loading, onConnect, onDisconnect }) {
  const { t } = useTranslation()

  if (address) {
    return (
      <div className="wallet-widget">
        <span className="badge badge-teal">
          <User size={12} />
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button className="btn btn-secondary" onClick={onDisconnect}>
          {t('disconnect')}
        </button>
      </div>
    )
  }

  return (
    <button className="btn btn-primary" onClick={onConnect} disabled={loading}>
      {loading ? <Loader2 size={16} className="spinner" /> : null}
      {t('connectWallet')}
    </button>
  )
}
