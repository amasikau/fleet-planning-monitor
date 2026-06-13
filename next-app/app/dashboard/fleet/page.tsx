"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { EquipmentPlan, FleetAuditEntry, FleetVehicle } from "@/lib/types"
import {
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
} from "@/lib/types"
import { FleetStats } from "@/components/fleet/fleet-stats"
import { FleetTable } from "@/components/fleet/fleet-table"
import { FleetAuditLog } from "@/components/fleet/fleet-audit-log"
import { ExportActions } from "@/components/export-actions"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"
import { toast } from "sonner"

function buildFleetExportConfig(
  vehicles: FleetVehicle[],
  plans: EquipmentPlan[]
): ExportDocumentConfig {
  const today = todayInputDate()
  const todayPlans = plans.filter((plan) => plan.workDate.slice(0, 10) === today)

  return {
    fileName: `fleet_${today}`,
    title: "Ведомость строительной техники",
    subtitle: "Состояние и использование единиц техники",
    documentDate: today,
    sections: [
      {
        title: "Строительная техника",
        table: {
          emptyText: "Единицы техники отсутствуют",
          columns: [
            { header: "Марка", value: "brand", width: 18 },
            { header: "Модель", value: "model", width: 20 },
            { header: "Тип ТС", value: "type", width: 30 },
            { header: "Госномер", value: "plate", width: 18 },
            { header: "Состояние", value: "status", width: 18 },
            { header: "Использование на дату", value: "usage", width: 42 },
            { header: "Примечание", value: "notes", width: 32 },
          ],
          rows: vehicles.map((vehicle) => {
            const assignments = todayPlans
              .filter((plan) => plan.vehicleId === vehicle.id)
              .map((plan) => `${plan.siteName}${plan.stageName ? ` (${plan.stageName})` : ""}`)

            return {
              brand: vehicle.brand,
              model: vehicle.model,
              type: FLEET_VEHICLE_TYPE_LABELS[vehicle.type],
              plate: vehicle.plateNumber,
              status: FLEET_VEHICLE_STATUS_LABELS[vehicle.status],
              usage:
                assignments.length > 0
                  ? Array.from(new Set(assignments)).join("; ")
                  : "не назначена",
              notes: vehicle.notes || "—",
            }
          }),
        },
      },
    ],
  }
}

export default function FleetPage() {
  const { canEdit, canViewAudit } = useRole()
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [auditLog, setAuditLog] = useState<FleetAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [
        Promise<FleetVehicle[]>,
        Promise<EquipmentPlan[]>,
        Promise<FleetAuditEntry[]>?,
      ] = [
        api.fleet.getAll(),
        api.equipmentPlans.getAll(),
      ]
      if (canViewAudit) promises.push(api.fleet.getAuditLog())

      const results = await Promise.all(promises)
      setVehicles(results[0] as FleetVehicle[])
      setPlans(results[1] as EquipmentPlan[])
      if (canViewAudit && results[2]) setAuditLog(results[2] as FleetAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные автопарка"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

  const fleetExportConfig = () => buildFleetExportConfig(vehicles, plans)

  useEffect(() => {
    void fetchData()
  }, [fetchData])

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
          <h1 className="text-2xl font-bold">Строительная техника</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Управление единицами техники, типами, статусами и готовностью к работам"
              : "Просмотр состава техники и статусов готовности"}
          </p>
        </div>
        <ExportActions
          onExportExcel={() => exportDataAsXlsx(fleetExportConfig())}
          onExportDocx={() => exportDataAsDocx(fleetExportConfig())}
        />
      </div>

      <FleetStats vehicles={vehicles} />
      <FleetTable initialVehicles={vehicles} onDataChange={fetchData} readonly={!canEdit} />
      {canViewAudit && <FleetAuditLog entries={auditLog} />}
    </div>
  )
}
