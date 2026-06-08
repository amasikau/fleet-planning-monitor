"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { FleetAuditEntry, FleetVehicle } from "@/lib/types"
import { FleetStats } from "@/components/fleet/fleet-stats"
import { FleetTable } from "@/components/fleet/fleet-table"
import { FleetAuditLog } from "@/components/fleet/fleet-audit-log"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function FleetPage() {
  const { canEdit, canViewAudit } = useRole()
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [auditLog, setAuditLog] = useState<FleetAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [Promise<FleetVehicle[]>, Promise<FleetAuditEntry[]>?] = [
        api.fleet.getAll(),
      ]
      if (canViewAudit) promises.push(api.fleet.getAuditLog())

      const results = await Promise.all(promises)
      setVehicles(results[0] as FleetVehicle[])
      if (canViewAudit && results[1]) setAuditLog(results[1] as FleetAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные автопарка"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

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
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Строительная техника</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Управление единицами техники, типами, статусами и готовностью к работам"
            : "Просмотр состава техники и статусов готовности"}
        </p>
      </div>

      <FleetStats vehicles={vehicles} />
      <FleetTable initialVehicles={vehicles} onDataChange={fetchData} readonly={!canEdit} />
      {canViewAudit && <FleetAuditLog entries={auditLog} />}
    </div>
  )
}
