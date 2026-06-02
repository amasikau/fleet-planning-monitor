"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { ConstructionSite, SiteAuditEntry } from "@/lib/types"
import { SitesAuditLog } from "@/components/sites/sites-audit-log"
import { SitesMapCard } from "@/components/sites/sites-map"
import { SitesStats } from "@/components/sites/sites-stats"
import { SitesTable } from "@/components/sites/sites-table"
import { useRole } from "@/contexts/role-context"
import { getErrorMessage } from "@/lib/feedback"
import { toast } from "sonner"

export default function SitesPage() {
  const { canEdit, canViewAudit } = useRole()
  const [activeSites, setActiveSites] = useState<ConstructionSite[]>([])
  const [archivedSites, setArchivedSites] = useState<ConstructionSite[]>([])
  const [auditLog, setAuditLog] = useState<SiteAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [
        Promise<ConstructionSite[]>,
        Promise<ConstructionSite[]>,
        Promise<SiteAuditEntry[]>?,
      ] = [api.sites.getAll(), api.sites.getArchived()]
      if (canViewAudit) promises.push(api.sites.getAuditLog())

      const results = await Promise.all(promises)
      setActiveSites(results[0] as ConstructionSite[])
      setArchivedSites(results[1] as ConstructionSite[])
      if (canViewAudit && results[2])
        setAuditLog(results[2] as SiteAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить дорожные объекты"))
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
        <h1 className="text-2xl font-bold">Дорожные объекты</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Управление участками работ, техникой и сроками выполнения"
            : "Просмотр дорожных объектов и сроков работ"}
        </p>
      </div>

      <SitesStats activeSites={activeSites} archivedSites={archivedSites} />

      <SitesMapCard sites={activeSites} />

      <SitesTable
        initialSites={activeSites}
        onDataChange={fetchData}
        readonly={!canEdit}
        title="Активные объекты"
      />

      {archivedSites.length > 0 && (
        <SitesTable
          initialSites={archivedSites}
          onDataChange={fetchData}
          readonly={!canEdit}
          title="Архив"
          isArchive
        />
      )}

      {canViewAudit && <SitesAuditLog entries={auditLog} />}
    </div>
  )
}
