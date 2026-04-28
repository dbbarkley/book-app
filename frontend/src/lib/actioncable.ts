/**
 * Minimal ActionCable WebSocket client (no npm package required).
 * Implements just enough of the protocol to subscribe to a channel
 * and receive / send messages.
 */

type MessageHandler = (data: Record<string, unknown>) => void
type StatusHandler = () => void

interface SubscriptionParams {
  channelName: string
  params?: Record<string, unknown>
  onMessage: MessageHandler
  onConnected?: StatusHandler
  onDisconnected?: StatusHandler
}

export class ActionCableSubscription {
  private ws: WebSocket | null = null
  private identifier: string
  private onMessage: MessageHandler
  private onConnected?: StatusHandler
  private onDisconnected?: StatusHandler
  private url: string
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(url: string, opts: SubscriptionParams) {
    this.url = url
    this.identifier = JSON.stringify({
      channel: opts.channelName,
      ...opts.params,
    })
    this.onMessage = opts.onMessage
    this.onConnected = opts.onConnected
    this.onDisconnected = opts.onDisconnected
    this.connect()
  }

  private connect() {
    if (this.closed) return
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      // Subscribe after connection opens
      this.ws?.send(JSON.stringify({
        command:    'subscribe',
        identifier: this.identifier,
      }))
    }

    this.ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data)
        // ActionCable sends welcome + confirm_subscription before actual messages
        if (frame.type === 'welcome') return
        if (frame.type === 'ping') return
        if (frame.type === 'confirm_subscription') {
          this.onConnected?.()
          // Keep-alive ping every 30s
          this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping', value: Date.now() }))
            }
          }, 30_000)
          return
        }
        if (frame.type === 'reject_subscription') {
          console.warn('[ActionCable] Subscription rejected')
          return
        }
        if (frame.message) {
          this.onMessage(frame.message as Record<string, unknown>)
        }
      } catch {
        // ignore parse errors
      }
    }

    this.ws.onclose = () => {
      this.clearTimers()
      this.onDisconnected?.()
      if (!this.closed) {
        // Reconnect after 3s
        this.reconnectTimeout = setTimeout(() => this.connect(), 3_000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  /** Send a message to the channel (perform action) */
  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        command:    'message',
        identifier: this.identifier,
        data:       JSON.stringify(data),
      }))
    }
  }

  unsubscribe() {
    this.closed = true
    this.clearTimers()
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  private clearTimers() {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null }
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null }
  }
}

/** Build the cable URL from the current API base + token */
export function buildCableUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
  // Extract just the origin (host + port) — cable is mounted at /cable on the root, not under /api/v1
  const url = new URL(base)
  const wsOrigin = url.origin.replace(/^http/, 'ws')
  return `${wsOrigin}/cable?token=${encodeURIComponent(token)}`
}
