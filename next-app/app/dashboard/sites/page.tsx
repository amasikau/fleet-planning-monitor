"use client"

import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import type {
  ConstructionSite,
  EquipmentPlan,
  RoadWorkStage,
  SiteAuditEntry,
} from "@/lib/types"
import { SitesAuditLog } from "@/components/sites/sites-audit-log"
import { SitesMapCard } from "@/components/sites/sites-map"
import { SitesStats } from "@/components/sites/sites-stats"
import { SitesTable } from "@/components/sites/sites-table"
import { ExportActions } from "@/components/export-actions"
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

function getPlanningWorkType(
  site: ConstructionSite,
  plans: EquipmentPlan[],
  stages: RoadWorkStage[]
) {
  const fromPlan = plans.find((plan) => plan.siteId === site.id)?.siteWorkType
  const fromStage = stages.find((stage) => stage.siteId === site.id)?.siteWorkType
  const value = (fromPlan ?? fromStage ?? site.workType ?? "").trim()
  if (!value || value === "Планирование") return "вид работ не выбран"
  return value
}

function getSitePlanPeriod(siteId: string, stages: RoadWorkStage[]) {
  const siteStages = stages.filter((stage) => stage.siteId === siteId)
  if (siteStages.length === 0) return "не запланировано"

  const starts = siteStages.map((stage) => new Date(stage.startDate).getTime())
  const ends = siteStages.map((stage) => new Date(stage.endDate).getTime())

  return `${formatRuDate(new Date(Math.min(...starts)))} - ${formatRuDate(new Date(Math.max(...ends)))}`
}

function buildSitesExportConfig({
  activeSites,
  archivedSites,
  plans,
  stages,
}: {
  activeSites: ConstructionSite[]
  archivedSites: ConstructionSite[]
  plans: EquipmentPlan[]
  stages: RoadWorkStage[]
}): ExportDocumentConfig {
  const today = todayInputDate()
  const sites = [
    ...activeSites.map((site) => ({ ...site, archiveStatus: "активный" })),
    ...archivedSites.map((site) => ({ ...site, archiveStatus: "архив" })),
  ]

  return {
    fileName: `road_sites_${today}`,
    title: "Ведомость дорожных объектов",
    subtitle: "Объекты, плановые виды работ и назначенная техника",
    documentDate: today,
    sections: [
      {
        title: "Дорожные объекты",
        table: {
          emptyText: "Дорожные объекты отсутствуют",
          columns: [
            { header: "Объект", value: "name", width: 30 },
            { header: "Город", value: "city", width: 18 },
            { header: "Адрес", value: "address", width: 34 },
            { header: "Вид работ", value: "workType", width: 30 },
            { header: "Плановый период", value: "period", width: 24 },
            { header: "Назначенная техника", value: "equipment", width: 42 },
            { header: "Состояние", value: "status", width: 14 },
          ],
          rows: sites.map((site) => {
            const sitePlans = plans.filter((plan) => plan.siteId === site.id)
            const equipment = Array.from(
              new Set(
                sitePlans.map((plan) =>
                  `${plan.vehicleLabel}${plan.stageName ? ` (${plan.stageName})` : ""}`
                )
              )
            )

            return {
              name: site.name,
              city: site.city || "—",
              address: site.address || "—",
              workType: getPlanningWorkType(site, plans, stages),
              period: getSitePlanPeriod(site.id, stages),
              equipment: equipment.length > 0 ? equipment.join("; ") : "не назначена",
              status: site.archiveStatus,
            }
          }),
        },
      },
    ],
  }
}

export default function SitesPage() {
  const { canEdit, canViewAudit } = useRole()
  const [activeSites, setActiveSites] = useState<ConstructionSite[]>([])
  const [archivedSites, setArchivedSites] = useState<ConstructionSite[]>([])
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [stages, setStages] = useState<RoadWorkStage[]>([])
  const [auditLog, setAuditLog] = useState<SiteAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const promises: [
        Promise<ConstructionSite[]>,
        Promise<ConstructionSite[]>,
        Promise<EquipmentPlan[]>,
        Promise<RoadWorkStage[]>,
        Promise<SiteAuditEntry[]>?,
      ] = [
        api.sites.getAll(),
        api.sites.getArchived(),
        api.equipmentPlans.getAll(),
        api.equipmentPlans.getStages(),
      ]
      if (canViewAudit) promises.push(api.sites.getAuditLog())

      const results = await Promise.all(promises)
      setActiveSites(results[0] as ConstructionSite[])
      setArchivedSites(results[1] as ConstructionSite[])
      setPlans(results[2] as EquipmentPlan[])
      setStages(results[3] as RoadWorkStage[])
      if (canViewAudit && results[4])
        setAuditLog(results[4] as SiteAuditEntry[])
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить дорожные объекты"))
    } finally {
      setLoading(false)
    }
  }, [canViewAudit])

  const sitesExportConfig = () =>
    buildSitesExportConfig({ activeSites, archivedSites, plans, stages })

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
          <h1 className="text-2xl font-bold">Дорожные объекты</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Учет точек дорожных объектов для дальнейшего планирования техники"
              : "Просмотр дорожных объектов и плановых точек работ"}
          </p>
        </div>
        <ExportActions
          onExportExcel={() => exportDataAsXlsx(sitesExportConfig())}
          onExportDocx={() => exportDataAsDocx(sitesExportConfig())}
        />
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
