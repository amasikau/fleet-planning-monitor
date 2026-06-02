"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wrench01Icon,
  UserCheck01Icon,
  HourglassIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import type { Mechanic, User } from "@/lib/types"

interface MechanicsStatsProps {
  activeMechanics: Mechanic[]
  unassignedUsers: User[]
}

export function MechanicsStats({ activeMechanics, unassignedUsers }: MechanicsStatsProps) {
  const totalSpecializations = useMemo(() => {
    const specs = new Set<string>()
    activeMechanics.forEach((m) => m.specializations.forEach((s) => specs.add(s)))
    return specs.size
  }, [activeMechanics])

  const docsComplete = useMemo(
    () => activeMechanics.filter((m) => m.documents.length >= 2).length,
    [activeMechanics]
  )

  const stats = [
    {
      label: "Активные механики",
      value: activeMechanics.length,
      icon: Wrench01Icon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Неназначенные",
      value: unassignedUsers.length,
      icon: HourglassIcon,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Документы в порядке",
      value: docsComplete,
      icon: UserCheck01Icon,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Специализаций используется",
      value: totalSpecializations,
      icon: Settings02Icon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bgColor}`}>
              <HugeiconsIcon icon={s.icon} strokeWidth={2} className={`size-5 ${s.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
