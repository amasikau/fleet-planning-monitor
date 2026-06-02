"use client"

import { useState, useEffect, useCallback } from "react"
import type { Mechanic, MechanicAuditEntry, User, MechanicSpecialization } from "@/lib/types"
import { api } from "@/lib/api"
import { MechanicsStats } from "@/components/mechanics/mechanics-stats"
import { UnassignedMechanicsTable } from "@/components/mechanics/unassigned-table"
import { ActiveMechanicsTable } from "@/components/mechanics/active-table"
import { MechanicAuditLog } from "@/components/mechanics/mechanic-audit-log"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { useRole } from "@/contexts/role-context"
import { notifyDashboardCountsChanged } from "@/lib/dashboard-events"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function MechanicsPage() {
  const { canEdit, canViewAudit } = useRole()
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [unassigned, setUnassigned] = useState<User[]>([])
  const [auditLog, setAuditLog] = useState<MechanicAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [Promise<Mechanic[]>, Promise<User[]>, Promise<MechanicAuditEntry[]>?] = [
        api.mechanics.getAll(),
        api.mechanics.getUnassigned(),
      ]
      if (canViewAudit) promises.push(api.mechanics.getAuditLog())

      const results = await Promise.all(promises)
      setMechanics(results[0] as Mechanic[])
      setUnassigned(results[1] as User[])
      if (canViewAudit && results[2]) setAuditLog(results[2] as MechanicAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAssign = async (data: { userId: string; specializations: MechanicSpecialization[]; documents: { type: string; fileName: string; filePath: string }[] }) => {
    try {
      await api.mechanics.assign(data)
      toast.success("Механик назначен")
      notifyDashboardCountsChanged()
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось назначить механика"))
    }
  }

  const handleUnassign = async (userId: string) => {
    try {
      await api.mechanics.unassign(userId)
      toast.success("Назначение механика снято")
      notifyDashboardCountsChanged()
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось снять назначение механика"))
    }
  }

  const handleEditMechanic = async (userId: string, data: { specializations?: MechanicSpecialization[]; documents?: { type: string; fileName: string; filePath: string }[] }) => {
    try {
      await api.mechanics.update(userId, data)
      toast.success("Данные механика обновлены")
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось обновить данные механика"))
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
        <h1 className="text-2xl font-bold">Механики</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Назначение, управление документами и специализациями механиков"
            : "Просмотр назначенных механиков и их документов"}
        </p>
      </div>

      {canEdit && unassigned.length > 0 && (
        <Alert variant="destructive" className="mx-4 lg:mx-6 border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 [&>svg]:text-amber-600">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Есть неназначенные механики</AlertTitle>
          <AlertDescription>
            {unassigned.length === 1
              ? `${unassigned.length} пользователь с ролью «механик» ожидает назначения. Назначьте специализации и загрузите документы.`
              : `${unassigned.length} пользователя(-ей) с ролью «механик» ожидают назначения. Назначьте специализации и загрузите документы.`}
          </AlertDescription>
        </Alert>
      )}

      <MechanicsStats activeMechanics={mechanics} unassignedUsers={unassigned} />

      {unassigned.length > 0 && (
        <UnassignedMechanicsTable users={unassigned} onAssign={handleAssign} readonly={!canEdit} />
      )}

      <ActiveMechanicsTable
        mechanics={mechanics}
        onUnassign={handleUnassign}
        onEdit={handleEditMechanic}
        readonly={!canEdit}
      />
      {canViewAudit && <MechanicAuditLog entries={auditLog} />}
    </div>
  )
}
