"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { MechanicAuditEntry } from "@/lib/types"
import { MECHANIC_AUDIT_LABELS } from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  Calendar03Icon,
  UserCircleIcon,
  UserStar01Icon,
  FlashIcon,
  TextAlignLeft01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

interface MechanicAuditLogProps {
  entries: MechanicAuditEntry[]
}

const actionColors: Record<string, string> = {
  assign: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  doc_upload: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  doc_remove: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  specialization_change: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  vehicle_type_change: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  unassign: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

type AuditSortKey = "targetUser" | "performedBy" | "action" | "details" | "timestamp"
type SortDir = "asc" | "desc"

export function MechanicAuditLog({ entries }: MechanicAuditLogProps) {
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortKey, setSortKey] = useState<AuditSortKey>("timestamp")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (key: AuditSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "timestamp" ? "desc" : "asc")
    }
  }

  const filtered = useMemo(() => {
    let result = entries

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.targetUser.toLowerCase().includes(q) ||
          e.performedBy.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          MECHANIC_AUDIT_LABELS[e.action].toLowerCase().includes(q)
      )
    }

    if (dateRange?.from) {
      const from = new Date(dateRange.from)
      from.setHours(0, 0, 0, 0)
      result = result.filter((e) => new Date(e.timestamp) >= from)
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to)
      to.setHours(23, 59, 59, 999)
      result = result.filter((e) => new Date(e.timestamp) <= to)
    }

    result = [...result].sort((a, b) => {
      let cmp: number
      if (sortKey === "timestamp") {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortKey === "action") {
        cmp = MECHANIC_AUDIT_LABELS[a.action].localeCompare(MECHANIC_AUDIT_LABELS[b.action], "ru")
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]), "ru")
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [entries, search, dateRange, sortKey, sortDir])

  const renderSortIcon = (col: AuditSortKey) => {
    if (sortKey !== col) return null
    return (
      <HugeiconsIcon
        icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
        strokeWidth={2}
        className="ml-1 inline size-3"
      />
    )
  }

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd.MM.yy")} — ${format(dateRange.to, "dd.MM.yy")}`
      : format(dateRange.from, "dd.MM.yyyy")
    : null

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader className="flex-row flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <HugeiconsIcon icon={FlashIcon} strokeWidth={2} className="size-5 text-amber-500" />
          <CardTitle>Журнал действий</CardTitle>
        </div>

        <div className="relative w-40 sm:w-56">
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-auto">
          <div className="min-w-[700px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 cursor-pointer select-none" onClick={() => toggleSort("targetUser")}>
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                      Механик
                      {renderSortIcon("targetUser")}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("performedBy")}>
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon icon={UserStar01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                      Инициатор
                      {renderSortIcon("performedBy")}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("action")}>
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon icon={FlashIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                      Действие
                      {renderSortIcon("action")}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("details")}>
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon icon={TextAlignLeft01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                      Подробности
                      {renderSortIcon("details")}
                    </span>
                  </TableHead>
                  <TableHead className="text-right pr-6 select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                            Время
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            locale={ru}
                            numberOfMonths={1}
                          />
                          {dateRange?.from && (
                            <div className="border-t p-2">
                              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setDateRange(undefined)}>
                                Сбросить
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      <button
                        type="button"
                        onClick={() => toggleSort("timestamp")}
                        className="hover:text-foreground transition-colors"
                      >
                        {renderSortIcon("timestamp") ?? (
                          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3 text-muted-foreground/50" />
                        )}
                      </button>
                      {dateLabel && (
                        <Badge
                          variant="secondary"
                          className="ml-1 cursor-pointer gap-1 text-[10px] px-1.5 py-0"
                          onClick={() => setDateRange(undefined)}
                        >
                          {dateLabel}
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Ничего не найдено
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-6 font-medium">{entry.targetUser}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.performedBy}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs font-normal ${actionColors[entry.action] ?? ""}`}>
                          {MECHANIC_AUDIT_LABELS[entry.action]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-muted-foreground">{entry.details}</TableCell>
                      <TableCell className="text-right pr-6 tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
