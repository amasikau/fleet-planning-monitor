"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Driver, FleetAuditEntry, FleetVehicle } from "@/lib/types"
import { FleetStats } from "@/components/fleet/fleet-stats"
import { FleetTable } from "@/components/fleet/fleet-table"
import { FleetAuditLog } from "@/components/fleet/fleet-audit-log"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function FleetPage() {
  const { canEdit, canViewAudit } = useRole()
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [auditLog, setAuditLog] = useState<FleetAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [Promise<FleetVehicle[]>, Promise<Driver[]>, Promise<FleetAuditEntry[]>?] = [
        api.fleet.getAll(),
        api.drivers.getAll(),
      ]
      if (canViewAudit) promises.push(api.fleet.getAuditLog())

      const results = await Promise.all(promises)
      setVehicles(results[0] as FleetVehicle[])
      setDrivers(results[1] as Driver[])
      if (canViewAudit && results[2]) setAuditLog(results[2] as FleetAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные автопарка"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const activeWithoutDriver = vehicles.filter(
    (vehicle) => vehicle.status === "active" && !vehicle.assignedDriver
  ).length

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
        <h1 className="text-2xl font-bold">Строительная техника</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Управление единицами техники, закреплением водителей и готовностью к работам"
            : "Просмотр состава техники и закреплённых водителей"}
        </p>
      </div>

      {canEdit && activeWithoutDriver > 0 && (
        <Alert className="mx-4 border-amber-200 bg-amber-50 text-amber-900 lg:mx-6 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100 [&>svg]:text-amber-600">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Есть активная техника без водителя</AlertTitle>
          <AlertDescription>
            В работе находится {activeWithoutDriver} ед. техники без
            закреплённого водителя. Проверьте таблицу и назначьте ответственного.
          </AlertDescription>
        </Alert>
      )}

      <FleetStats vehicles={vehicles} />
      <FleetTable initialVehicles={vehicles} drivers={drivers} onDataChange={fetchData} readonly={!canEdit} />
      {canViewAudit && <FleetAuditLog entries={auditLog} />}
    </div>
  )
}
