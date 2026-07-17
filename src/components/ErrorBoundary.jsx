// ErrorBoundary.jsx
// React error boundary that catches render-time crashes anywhere in the game
// tree. Without this, a JS error during mount silently leaves a black screen.
// On error it shows a visible, styled message so the failure is diagnosable
// on-device instead of appearing as a blank canvas.
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    // Log to console for adb logcat visibility.
    console.error('[Aetheria] Render crash:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    // Hard reload to re-init the WebView state.
    if (typeof location !== 'undefined') location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <h1 className="error-title">The realm faltered</h1>
            <p className="error-msg">{this.state.message}</p>
            <button className="primary-btn" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
