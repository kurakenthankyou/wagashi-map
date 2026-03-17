import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24,
          fontFamily: 'monospace',
          background: '#FFF0F0',
          minHeight: '100vh',
        }}>
          <h2 style={{ color: '#C00', marginTop: 0 }}>⚠️ レンダリングエラー</h2>
          <p style={{ color: '#900', fontWeight: 'bold' }}>{this.state.error.message}</p>
          <pre style={{
            background: '#FFE0E0',
            padding: 12,
            borderRadius: 8,
            fontSize: 11,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#E8392A',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            再試行
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const isAdmin = window.location.pathname === '/admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {isAdmin ? <Admin /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)
