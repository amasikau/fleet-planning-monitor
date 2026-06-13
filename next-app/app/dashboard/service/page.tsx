"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  ServiceEvent,
  ServiceStats,
  FleetVehicle,
  RepairTemplate,
} from "@/lib/types"
import {
  FLEET_VEHICLE_TYPE_LABELS,
  SERVICE_EVENT_STATUS_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
} from "@/lib/types"
import { api } from "@/lib/api"
import { ServiceStatsCards } from "@/components/service-events/service-stats"
import { ServiceTable } from "@/components/service-events/service-table"
import { ExportActions } from "@/components/export-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  formatRuDate,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"
import { toast } from "sonner"

function buildServiceExportConfig(
  events: ServiceEvent[],
  vehicles: FleetVehicle[]
): ExportDocumentConfig {
  const today = todayInputDate()
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))

  return {
    fileName: `service_events_${today}`,
    title: "Ведомость заявок ТО и ремонтов",
    subtitle: "Сервисные работы и периоды недоступности техники",
    documentDate: today,
    sections: [
      {
        title: "Заявки ТО и ремонтов",
        table: {
          emptyText: "Заявки отсутствуют",
          columns: [
            { header: "Техника", value: "vehicle", width: 30 },
            { header: "Тип техники", value: "vehicleType", width: 26 },
            { header: "Название заявки", value: "title", width: 34 },
            { header: "Тип заявки", value: "type", width: 18 },
            { header: "Период", value: "period", width: 24 },
            { header: "Дней", value: "days", width: 10 },
            { header: "Статус", value: "status", width: 18 },
            { header: "Основание", value: "source", width: 30 },
          ],
          rows: events.map((event) => {
            const vehicle = vehicleById.get(event.vehicleId)

            return {
              vehicle: event.vehicleLabel,
              vehicleType: vehicle ? FLEET_VEHICLE_TYPE_LABELS[vehicle.type] : "—",
              title: event.title,
              type: SERVICE_EVENT_TYPE_LABELS[event.type],
              period: `${formatRuDate(event.startDate)} - ${formatRuDate(event.endDate ?? event.dueAt)}`,
              days: event.durationDays,
              status: SERVICE_EVENT_STATUS_LABELS[event.status],
              source: event.repairTemplate?.name ?? "введено вручную",
            }
          }),
        },
      },
    ],
  }
}

export default function ServicePage() {
  const { canEdit } = useRole()
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const [stats, setStats] = useState<ServiceStats>({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  })
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [repairTemplates, setRepairTemplates] = useState<RepairTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [eventsData, statsData, vehiclesData, repairTemplatesData] =
        await Promise.all([
          api.serviceEvents.getAll(),
          api.serviceEvents.getStats(),
          api.fleet.getAll(),
          api.serviceEvents.getRepairTemplates(),
        ])
      setEvents(eventsData)
      setStats(statsData)
      setVehicles(vehiclesData)
      setRepairTemplates(repairTemplatesData)
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
  const canCreateRequest = canEdit
  const serviceExportConfig = () => buildServiceExportConfig(events, vehicles)

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
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">ТО и ремонты</h1>
          <p className="text-sm text-muted-foreground">
            Контроль сервисных заявок, сроков обслуживания и влияния ремонтов на
            план-график
          </p>
        </div>
        <ExportActions
          onExportExcel={() => exportDataAsXlsx(serviceExportConfig())}
          onExportDocx={() => exportDataAsDocx(serviceExportConfig())}
        />
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
        repairTemplates={repairTemplates}
        onDataChange={fetchData}
        canCreateRequest={canCreateRequest}
      />
    </div>
  )
}
