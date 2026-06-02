"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  ServiceEvent,
  ServiceStats,
  FleetVehicle,
  Mechanic,
} from "@/lib/types"
import { api } from "@/lib/api"
import { ServiceStatsCards } from "@/components/service-events/service-stats"
import { ServiceTable } from "@/components/service-events/service-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function ServicePage() {
  const { role, userId, username, canEdit } = useRole()
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [stats, setStats] = useState<ServiceStats>({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  })
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [eventsData, statsData, vehiclesData, mechanicsData] =
        await Promise.all([
          api.serviceEvents.getAll(),
          api.serviceEvents.getStats(),
          api.fleet.getAll(),
          api.mechanics.getAll(),
        ])
      setEvents(eventsData)
      setStats(statsData)
      setVehicles(vehiclesData)
      setMechanics(mechanicsData)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const overdueCount = stats.overdue
  const canCreateRequest = canEdit || role === "driver"

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">ТО и ремонты</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Приём заявок, передача ремонта механикам и контроль сроков"
            : role === "mechanic"
              ? "Просмотр заявок и ведение закреплённых ремонтов"
              : "Создание заявок по закреплённому транспорту и контроль статуса ремонта"}
        </p>
      </div>

      {canEdit && overdueCount > 0 && (
        <Alert className="mx-4 border-red-200 bg-red-50 text-red-900 lg:mx-6 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200 [&>svg]:text-red-600">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Просроченные заявки</AlertTitle>
          <AlertDescription>
            {overdueCount === 1
              ? `${overdueCount} заявка просрочена. Обратите внимание на сроки обслуживания.`
              : `${overdueCount} заявок(-и) просрочено. Обратите внимание на сроки обслуживания.`}
          </AlertDescription>
        </Alert>
      )}

      <ServiceStatsCards stats={stats} />

      <ServiceTable
        initialEvents={events}
        vehicles={vehicles}
        mechanics={mechanics}
        onDataChange={fetchData}
        currentRole={role}
        currentUserId={userId}
        currentUsername={username}
        canCreateRequest={canCreateRequest}
      />
    </div>
  )
}
