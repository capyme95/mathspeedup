/**
 * Client‑side monitoring utilities for logging errors, performance metrics, and analytics events
 * to the Supabase `monitoring_logs` table.
 */

interface LogEventParams {
  event_type: 'error' | 'performance' | 'analytics' | 'feedback';
  event_name: string;
  payload?: Record<string, any>;
  user_id?: string;
}

/**
 * Send a log event to the monitoring_logs table.
 * Fails silently – never throws errors to avoid infinite loops.
 */
export async function logEvent({ event_type, event_name, payload = {}, user_id }: LogEventParams) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('Monitoring: Supabase environment variables missing. Log not sent.');
    return;
  }

  try {
    await fetch(`${url}/rest/v1/monitoring_logs`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        event_type,
        event_name,
        payload,
        user_id,
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Silently ignore network errors – we don't want monitoring to break the app
    console.debug('Monitoring: Failed to send log', err);
  }
}

/**
 * Log a front‑end error (React error boundary, uncaught exception, etc.)
 */
export function logError(error: Error, componentStack?: string, user_id?: string) {
  return logEvent({
    event_type: 'error',
    event_name: error.name || 'UncaughtError',
    payload: {
      message: error.message,
      stack: error.stack,
      componentStack,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    },
    user_id,
  });
}

/**
 * Log a performance metric (LCP, FID, custom timing)
 */
export function logPerformance(metricName: string, value: number, metadata?: Record<string, any>, user_id?: string) {
  return logEvent({
    event_type: 'performance',
    event_name: metricName,
    payload: {
      value,
      unit: 'ms',
      ...metadata,
    },
    user_id,
  });
}

/**
 * Log an analytics event (button click, page view, etc.)
 */
export function logAnalytics(eventName: string, properties?: Record<string, any>, user_id?: string) {
  return logEvent({
    event_type: 'analytics',
    event_name: eventName,
    payload: properties,
    user_id,
  });
}