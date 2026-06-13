"use client"

import type { User } from "@/lib/types"
import { USER_ROLE_LABELS, type UserRole } from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, UserBlock01Icon } from "@hugeicons/core-free-icons"

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500",
  user: "bg-slate-500",
}

interface UsersStatsProps {
  users: User[]
}

export function UsersStats({ users }: UsersStatsProps) {
  const total = users.length
  const blocked = users.filter((u) => u.status === "blocked").length

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1
      return acc
    },
    {} as Record<UserRole, number>
  )

  return (
    <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-3 lg:px-6">
      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl leading-none font-bold tabular-nums">{total}</p>
          <p className="mt-1 text-xs font-medium">Всего</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="size-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl leading-none font-bold tabular-nums">{blocked}</p>
          <p className="mt-1 text-xs font-medium">Заблокировано</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
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
                  <div
                    className={`h-full rounded-full ${roleColors[role]} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
