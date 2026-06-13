"use client"

import type { FleetVehicle } from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Car01Icon,
  CheckmarkBadge01Icon,
  HourglassIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

export function FleetStats({ vehicles }: { vehicles: FleetVehicle[] }) {
  const stats = [
    {
      label: "Всего единиц",
      value: vehicles.length,
      icon: Car01Icon,
      iconClass: "text-primary",
      bgClass: "bg-primary/12",
    },
    {
      label: "Готова",
      value: vehicles.filter((vehicle) => vehicle.status === "active").length,
      icon: CheckmarkBadge01Icon,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-500/12",
    },
    {
      label: "Не используется",
      value: vehicles.filter((vehicle) => vehicle.status === "reserve").length,
      icon: HourglassIcon,
      iconClass: "text-sky-600",
      bgClass: "bg-sky-500/12",
    },
    {
      label: "В ремонте",
      value: vehicles.filter((vehicle) => vehicle.status === "repair").length,
      icon: Wrench01Icon,
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
