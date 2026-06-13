"use client"

import type { ConstructionSite } from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building06Icon,
  CheckmarkBadge01Icon,
  Car01Icon,
  HardDriveIcon,
} from "@hugeicons/core-free-icons"

export function SitesStats({
  activeSites,
  archivedSites,
}: {
  activeSites: ConstructionSite[]
  archivedSites: ConstructionSite[]
}) {
  const totalPlanAssignments = [...activeSites, ...archivedSites].reduce(
    (sum, s) => sum + s.vehicleCount,
    0
  )

  const stats = [
    {
      label: "Всего объектов",
      value: activeSites.length + archivedSites.length,
      icon: Building06Icon,
      iconClass: "text-primary",
      bgClass: "bg-primary/12",
    },
    {
      label: "В работе",
      value: activeSites.length,
      icon: HardDriveIcon,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-500/12",
    },
    {
      label: "Завершено",
      value: archivedSites.length,
      icon: CheckmarkBadge01Icon,
      iconClass: "text-sky-600",
      bgClass: "bg-sky-500/12",
    },
    {
      label: "Смен техники",
      value: totalPlanAssignments,
      icon: Car01Icon,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-500/12",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bgClass}`}
          >
            <HugeiconsIcon
              icon={stat.icon}
              strokeWidth={2}
              className={`size-5 ${stat.iconClass}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-2xl leading-none font-bold tabular-nums">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
