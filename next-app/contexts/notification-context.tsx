"use client"

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react"
import { api } from "@/lib/api"
import type { NotificationItem, NotificationCategory } from "@/lib/types"

export type { NotificationCategory }
export type { NotificationItem as Notification }

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  refetch: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.notifications.getAll()
      setNotifications(data)
    } catch {
      // API not available — stay with empty list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      await api.notifications.markAsRead(id)
    } catch {
      // revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      )
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const prev = notifications
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
    try {
      await api.notifications.markAllAsRead()
    } catch {
      setNotifications(prev)
    }
  }, [notifications])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error("useNotifications должен использоваться внутри NotificationProvider")
  }
  return ctx
}
