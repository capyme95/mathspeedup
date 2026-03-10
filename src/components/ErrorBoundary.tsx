'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A simple error boundary that catches rendering errors in its children
 * and displays a fallback UI. Useful for isolating failures in dashboard sections.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, you would send to Sentry/LogRocket)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Send to monitoring logs
    logError(error, errorInfo.componentStack || undefined);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default fallback
      return (
        <div className="border border-red-500/30 bg-red-950/20 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h3>
          <p className="text-red-300/80 text-sm mb-4">
            This part of the dashboard encountered an error. The issue has been logged.
          </p>
          <details className="text-xs text-red-300/60">
            <summary className="cursor-pointer mb-2">Technical details</summary>
            <pre className="mt-2 p-3 bg-black/50 rounded overflow-auto">
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
          </details>
          <button
            className="mt-4 px-4 py-2 bg-red-800/40 hover:bg-red-800/60 text-red-300 rounded border border-red-700/50 text-sm font-medium transition"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}