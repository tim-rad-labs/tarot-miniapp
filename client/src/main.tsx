import { StrictMode, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Error boundary to catch and display errors in WebView
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#fff',
          background: '#1a1a2e',
          minHeight: '100vh',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#ff6b6b' }}>Error</h2>
          <pre style={{
            color: '#ccc',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error handler for uncaught errors
window.onerror = function(message, source, lineno, colno, error) {
  const el = document.getElementById('startup-error');
  if (el) {
    el.style.display = 'block';
    el.textContent = `Error: ${message}\nSource: ${source}:${lineno}:${colno}\n${error?.stack || ''}`;
  }
};

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (e) {
  const el = document.getElementById('startup-error');
  if (el) {
    el.style.display = 'block';
    el.textContent = `Startup error: ${e instanceof Error ? e.message + '\n' + e.stack : String(e)}`;
  }
}
