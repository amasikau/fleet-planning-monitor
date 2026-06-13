"use client"

import { useCallback, useEffect, useState } from "react"
import { RepairTemplateDirectory } from "@/components/service-events/repair-template-directory"
import { ExportActions } from "@/components/export-actions"
import { useRole } from "@/contexts/role-context"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type { RepairTemplate } from "@/lib/types"
import {
  FLEET_REPAIR_CATEGORY_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
} from "@/lib/types"
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"
import { toast } from "sonner"

function getTemplateType(template: RepairTemplate) {
  if (template.serviceEventType) return template.serviceEventType
  if (template.category === "diagnostics") return "diagnostics"
  if (template.category === "scheduled_service") return "maintenance"
  return "repair"
}

function buildRepairDirectoryExportConfig(
  templates: RepairTemplate[]
): ExportDocumentConfig {
  const today = todayInputDate()

  return {
    fileName: `service_repair_directory_${today}`,
    title: "Справочник ТО и ремонтов",
    subtitle: "Типовые сервисные работы по видам строительной техники",
    documentDate: today,
    sections: [
      {
        title: "Позиции справочника",
        table: {
          emptyText: "Позиции справочника отсутствуют",
          columns: [
            { header: "Тип техники", value: "vehicleType", width: 28 },
            { header: "Тип заявки", value: "serviceType", width: 20 },
            { header: "Раздел", value: "category", width: 22 },
            { header: "Название", value: "name", width: 34 },
            { header: "Дней", value: "days", width: 10 },
            { header: "Активна", value: "active", width: 12 },
            { header: "Примечание", value: "notes", width: 32 },
          ],
          rows: templates.map((template) => ({
            vehicleType: FLEET_VEHICLE_TYPE_LABELS[template.vehicleType],
            serviceType: SERVICE_EVENT_TYPE_LABELS[getTemplateType(template)],
            category: FLEET_REPAIR_CATEGORY_LABELS[template.category],
            name: template.name,
            days: template.durationDays,
            active: template.isActive ? "да" : "нет",
            notes: template.notes || "—",
          })),
        },
      },
    ],
  }
}

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
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Справочник ТО и ремонтов</h1>
          <p className="text-sm text-muted-foreground">
            База типовых ТО, диагностик и ремонтов по типам строительной техники
          </p>
        </div>
        <ExportActions
          onExportExcel={() =>
            exportDataAsXlsx(buildRepairDirectoryExportConfig(templates))
          }
          onExportDocx={() =>
            exportDataAsDocx(buildRepairDirectoryExportConfig(templates))
          }
        />
      </div>

      <RepairTemplateDirectory
        templates={templates}
        canEdit={canEdit}
        onDataChange={fetchData}
      />
    </div>
  )
}
