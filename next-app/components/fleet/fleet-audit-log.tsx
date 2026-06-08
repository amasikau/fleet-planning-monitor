"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import type { FleetAuditEntry } from "@/lib/types"
import { FLEET_AUDIT_ACTION_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Car01Icon,
  FlashIcon,
  SearchIcon,
  TextAlignLeft01Icon,
  UserStar01Icon,
} from "@hugeicons/core-free-icons"

const actionColors: Record<string, string> = {
  create:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  edit: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  status_change:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

type AuditSortKey =
  | "vehicleLabel"
  | "performedBy"
  | "action"
  | "details"
  | "timestamp"
type SortDir = "asc" | "desc"

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function FleetAuditLog({ entries }: { entries: FleetAuditEntry[] }) {
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [sortKey, setSortKey] = useState<AuditSortKey>("timestamp")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (key: AuditSortKey) => {
    if (sortKey === key) {
      setSortDir((value) => (value === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(key)
    setSortDir(key === "timestamp" ? "desc" : "asc")
  }

  const filtered = useMemo(() => {
    let result = entries

    if (search) {
      const query = search.toLowerCase()
      result = result.filter(
        (entry) =>
          entry.vehicleLabel.toLowerCase().includes(query) ||
          entry.performedBy.toLowerCase().includes(query) ||
          entry.details.toLowerCase().includes(query) ||
          FLEET_AUDIT_ACTION_LABELS[entry.action].toLowerCase().includes(query)
      )
    }

    if (dateRange?.from) {
      const from = new Date(dateRange.from)
      from.setHours(0, 0, 0, 0)
      result = result.filter((entry) => new Date(entry.timestamp) >= from)
    }

    if (dateRange?.to) {
      const to = new Date(dateRange.to)
      to.setHours(23, 59, 59, 999)
      result = result.filter((entry) => new Date(entry.timestamp) <= to)
    }

    return [...result].sort((left, right) => {
      let compareValue = 0

      if (sortKey === "timestamp") {
        compareValue =
          new Date(left.timestamp).getTime() -
          new Date(right.timestamp).getTime()
      } else if (sortKey === "action") {
        compareValue = FLEET_AUDIT_ACTION_LABELS[left.action].localeCompare(
          FLEET_AUDIT_ACTION_LABELS[right.action],
          "ru"
        )
      } else {
        compareValue = left[sortKey].localeCompare(right[sortKey], "ru")
      }

      return sortDir === "asc" ? compareValue : -compareValue
    })
  }, [dateRange, entries, search, sortDir, sortKey])

  const renderSortIcon = (column: AuditSortKey) => {
    if (sortKey !== column) return null
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
        <div className="mr-auto flex items-center gap-2">
          <HugeiconsIcon
            icon={FlashIcon}
            strokeWidth={2}
            className="size-5 text-amber-500"
          />
          <CardTitle>Журнал действий</CardTitle>
        </div>

        <div className="relative w-56">
          <HugeiconsIcon
            icon={SearchIcon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-auto">
          <div className="min-w-[760px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer pl-6 select-none"
                    onClick={() => toggleSort("vehicleLabel")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={Car01Icon}
                        strokeWidth={2}
                        className="size-3.5 text-muted-foreground"
                      />
                      Техника
                      {renderSortIcon("vehicleLabel")}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("performedBy")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={UserStar01Icon}
                        strokeWidth={2}
                        className="size-3.5 text-muted-foreground"
                      />
                      Инициатор
                      {renderSortIcon("performedBy")}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("action")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={FlashIcon}
                        strokeWidth={2}
                        className="size-3.5 text-muted-foreground"
                      />
                      Действие
                      {renderSortIcon("action")}
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("details")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={TextAlignLeft01Icon}
                        strokeWidth={2}
                        className="size-3.5 text-muted-foreground"
                      />
                      Подробности
                      {renderSortIcon("details")}
                    </span>
                  </TableHead>
                  <TableHead className="pr-6 text-right select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                          >
                            <HugeiconsIcon
                              icon={Calendar03Icon}
                              strokeWidth={2}
                              className="size-3.5 text-muted-foreground"
                            />
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setDateRange(undefined)}
                              >
                                Сбросить
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      <button
                        type="button"
                        onClick={() => toggleSort("timestamp")}
                        className="transition-colors hover:text-foreground"
                      >
                        {renderSortIcon("timestamp") ?? (
                          <HugeiconsIcon
                            icon={ArrowDown01Icon}
                            strokeWidth={2}
                            className="size-3 text-muted-foreground/50"
                          />
                        )}
                      </button>
                      {dateLabel && (
                        <Badge
                          variant="secondary"
                          className="ml-1 cursor-pointer gap-1 px-1.5 py-0 text-[10px]"
                          onClick={() => setDateRange(undefined)}
                        >
                          {dateLabel}
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-2.5"
                          />
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Ничего не найдено
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-6 font-medium">
                        {entry.vehicleLabel}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.performedBy}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs font-normal ${actionColors[entry.action] ?? ""}`}
                        >
                          {FLEET_AUDIT_ACTION_LABELS[entry.action]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-muted-foreground">
                        {entry.details}
                      </TableCell>
                      <TableCell className="pr-6 text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">
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
