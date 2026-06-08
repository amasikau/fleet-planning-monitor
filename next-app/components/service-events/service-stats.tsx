"use client"

import type { ServiceStats } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Loading03Icon,
  AlertCircleIcon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"

export function ServiceStatsCards({ stats }: { stats: ServiceStats }) {
  const items = [
    {
      label: "Запланировано",
      value: stats.scheduled,
      icon: Calendar03Icon,
      iconClass: "text-sky-600",
      bgClass: "bg-sky-500/12",
    },
    {
      label: "В ремонте",
      value: stats.inProgress,
      icon: Loading03Icon,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-500/12",
    },
    {
      label: "Просрочено",
      value: stats.overdue,
      icon: AlertCircleIcon,
      iconClass: "text-red-600",
      bgClass: "bg-red-500/12",
    },
    {
      label: "Завершено",
      value: stats.completed,
      icon: CheckmarkBadge01Icon,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-500/12",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
      {items.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bgClass}`}
            >
              <HugeiconsIcon
                icon={s.icon}
                strokeWidth={2}
                className={`size-5 ${s.iconClass}`}
              />
            </div>
            <div>
              <p className="text-2xl leading-none font-bold tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
