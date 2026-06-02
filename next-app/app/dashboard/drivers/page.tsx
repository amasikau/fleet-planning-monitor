"use client"

import { useState, useEffect, useCallback } from "react"
import type { Driver, DriverAuditEntry, User, DrivingCategory } from "@/lib/types"
import { api } from "@/lib/api"
import { DriversStats } from "@/components/drivers/drivers-stats"
import { UnassignedDriversTable } from "@/components/drivers/unassigned-table"
import { ActiveDriversTable } from "@/components/drivers/active-table"
import { DriverAuditLog } from "@/components/drivers/driver-audit-log"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { useRole } from "@/contexts/role-context"
import { notifyDashboardCountsChanged } from "@/lib/dashboard-events"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function DriversPage() {
  const { canEdit, canViewAudit } = useRole()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [unassigned, setUnassigned] = useState<User[]>([])
  const [auditLog, setAuditLog] = useState<DriverAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [Promise<Driver[]>, Promise<User[]>, Promise<DriverAuditEntry[]>?] = [
        api.drivers.getAll(),
        api.drivers.getUnassigned(),
      ]
      if (canViewAudit) promises.push(api.drivers.getAuditLog())

      const results = await Promise.all(promises)
      setDrivers(results[0] as Driver[])
      setUnassigned(results[1] as User[])
      if (canViewAudit && results[2]) setAuditLog(results[2] as DriverAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAssign = async (data: { userId: string; categories: DrivingCategory[]; documents: { type: string; fileName: string; filePath: string }[] }) => {
    try {
      await api.drivers.assign(data)
      toast.success("Водитель назначен")
      notifyDashboardCountsChanged()
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось назначить водителя"))
    }
  }

  const handleUnassign = async (userId: string) => {
    try {
      await api.drivers.unassign(userId)
      toast.success("Назначение водителя снято")
      notifyDashboardCountsChanged()
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось снять назначение водителя"))
    }
  }

  const handleEditDriver = async (userId: string, data: { categories?: DrivingCategory[]; documents?: { type: string; fileName: string; filePath: string }[] }) => {
    try {
      await api.drivers.update(userId, data)
      toast.success("Данные водителя обновлены")
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось обновить данные водителя"))
    }
  }

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
        <h1 className="text-2xl font-bold">Водители</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Назначение, управление документами и категориями водителей"
            : "Просмотр назначенных водителей и их документов"}
        </p>
      </div>

      {canEdit && unassigned.length > 0 && (
        <Alert variant="destructive" className="mx-4 lg:mx-6 border-amber-200bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 [&>svg]:text-amber-600">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Есть неназначенные водители</AlertTitle>
          <AlertDescription>
            {unassigned.length === 1
              ? `${unassigned.length} пользователь с ролью «водитель» ожидает назначения. Назначьте категории и загрузите документы.`
              : `${unassigned.length} пользователя(-ей) с ролью «водитель» ожидают назначения. Назначьте категории и загрузите документы.`}
          </AlertDescription>
        </Alert>
      )}

      <DriversStats activeDrivers={drivers} unassignedUsers={unassigned} />

      {unassigned.length > 0 && (
        <UnassignedDriversTable users={unassigned} onAssign={handleAssign} readonly={!canEdit} />
      )}

      <ActiveDriversTable
        drivers={drivers}
        onUnassign={handleUnassign}
        onEdit={handleEditDriver}
        readonly={!canEdit}
      />
      {canViewAudit && <DriverAuditLog entries={auditLog} />}
    </div>
  )
}
