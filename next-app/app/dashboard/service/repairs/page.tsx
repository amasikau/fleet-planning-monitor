"use client"

import { useCallback, useEffect, useState } from "react"
import { RepairTemplateDirectory } from "@/components/service-events/repair-template-directory"
import { useRole } from "@/contexts/role-context"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type { RepairTemplate } from "@/lib/types"
import { toast } from "sonner"

export default function ServiceRepairDirectoryPage() {
  const { canEdit } = useRole()
  const [templates, setTemplates] = useState<RepairTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const data = await api.serviceEvents.getRepairTemplates()
      setTemplates(data)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить справочник"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
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
        <h1 className="text-2xl font-bold">Справочник ремонтов</h1>
        <p className="text-sm text-muted-foreground">
          База типовых ремонтов и сроков выполнения по типам строительной
          техники
        </p>
      </div>

      <RepairTemplateDirectory
        templates={templates}
        canEdit={canEdit}
        onDataChange={fetchData}
      />
    </div>
  )
}
