import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unknown render error',
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: 'hsl(222, 25%, 6%)', color: 'hsl(210, 40%, 98%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '720px', width: '100%', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(17, 24, 39, 0.6)', borderRadius: '16px', padding: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>Ghost failed to render safely</h1>
            <p style={{ color: 'hsl(215, 20%, 68%)', marginBottom: '1rem' }}>
              The app hit a frontend error before completing initialization. Check the contract address and runtime configuration, then refresh.
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'hsl(0, 84%, 60%)' }}>{this.state.message}</pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
