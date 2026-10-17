import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Route failed to load:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    const offline = typeof navigator !== 'undefined' && !navigator.onLine

    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <p className="max-w-xs text-white/80">
          {offline
            ? 'No internet connection. Reconnect and try again.'
            : 'This page failed to load. Check your connection and retry.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-futa-400 px-6 py-2 font-semibold text-white"
        >
          Retry
        </button>
      </div>
    )
  }
}