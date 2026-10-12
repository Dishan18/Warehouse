import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuth } from '../context/AuthContext'
import type { AppNotification, StockAlert } from '../types'

const RECONNECT_DELAY_MS = 5000

function wsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws`
}

export function useNotificationSocket(
  onNotification: (notification: AppNotification) => void,
  onStockAlert?: (alert: StockAlert) => void
) {
  const { token, isAuthenticated } = useAuth()
  const notificationCallbackRef = useRef(onNotification)
  notificationCallbackRef.current = onNotification
  const stockAlertCallbackRef = useRef(onStockAlert)
  stockAlertCallbackRef.current = onStockAlert

  useEffect(() => {
    if (!isAuthenticated || !token) return

    const client = new Client({
      brokerURL: wsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (frame) => {
          try {
            notificationCallbackRef.current(JSON.parse(frame.body) as AppNotification)
          } catch {
            // ignore malformed frames
          }
        })

        client.subscribe('/topic/stock-alerts', (frame) => {
          try {
            stockAlertCallbackRef.current?.(JSON.parse(frame.body) as StockAlert)
          } catch {
            // ignore malformed frames
          }
        })
      },
    })

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [token, isAuthenticated])
}
