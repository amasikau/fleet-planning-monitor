"use client"

import type { User } from "@/lib/types"
import { USER_ROLE_LABELS, type UserRole } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Wifi01Icon, UserBlock01Icon } from "@hugeicons/core-free-icons"

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500",
  user: "bg-slate-500",
}

interface UsersStatsProps {
  users: User[]
}

export function UsersStats({ users }: UsersStatsProps) {
  const total = users.length
  const online = users.filter((u) => u.isOnline).length
  const blocked = users.filter((u) => u.status === "blocked").length

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1
      return acc
    },
    {} as Record<UserRole, number>
  )

  return (
    <div className="grid grid-cols-2 gap-3 px-4 lg:grid-cols-4 lg:px-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Всего</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <HugeiconsIcon icon={Wifi01Icon} strokeWidth={2} className="size-5 text-emerald-600" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{online}</p>
            <p className="mt-1 text-xs text-muted-foreground">Онлайн</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="size-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{blocked}</p>
            <p className="mt-1 text-xs text-muted-foreground">Заблокировано</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((role) => {
              const count = roleCounts[role] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={role} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${roleColors[role]}`} />
                  <span className="flex-1 truncate text-muted-foreground">{USER_ROLE_LABELS[role]}</span>
                  <span className="tabular-nums font-medium">{count}</span>
                  <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted lg:block">
                    <div className={`h-full rounded-full ${roleColors[role]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
