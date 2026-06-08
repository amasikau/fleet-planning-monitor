"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type {
  ServiceEvent,
  ServiceEventStatus,
  ServiceEventType,
  FleetVehicle,
} from "@/lib/types"
import {
  SERVICE_EVENT_STATUS_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
} from "@/lib/types"
import {
  ServiceEventDialog,
  DeleteServiceEventDialog,
  type ServiceEventFormValues,
} from "./service-event-dialog"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  SearchIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Car01Icon,
  Wrench01Icon,
  Calendar03Icon,
  Activity01Icon,
  Cancel01Icon,
  MoreHorizontalCircle01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  PlusSignCircleIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"

const statusBadgeStyles: Record<ServiceEventStatus, string> = {
  scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}

const typeBadgeStyles: Record<ServiceEventType, string> = {
  maintenance:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  inspection: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  repair: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  insurance:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  diagnostics:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
}

type SortKey = "vehicleLabel" | "title" | "type" | "status" | "dueAt"
type SortDir = "asc" | "desc"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

interface ServiceTableProps {
  initialEvents: ServiceEvent[]
  vehicles: FleetVehicle[]
  onDataChange?: () => void
  canCreateRequest: boolean
}

export function ServiceTable({
  initialEvents,
  vehicles,
  onDataChange,
  canCreateRequest,
}: ServiceTableProps) {
  const [events, setEvents] = useState(initialEvents)
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ServiceEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<ServiceEvent | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ServiceEventStatus | null>(
    null
  )
  const [typeFilter, setTypeFilter] = useState<ServiceEventType | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("dueAt")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = events

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          event.vehicleLabel.toLowerCase().includes(q) ||
          (event.reporter?.fullName ?? "").toLowerCase().includes(q) ||
          event.defectDescription.toLowerCase().includes(q) ||
          event.notes.toLowerCase().includes(q)
      )
    }
    if (statusFilter)
      result = result.filter((event) => event.status === statusFilter)
    if (typeFilter) result = result.filter((event) => event.type === typeFilter)

    result = [...result].sort((a, b) => {
      let cmp: number
      if (sortKey === "dueAt") {
        const aTime = a.dueAt
          ? new Date(a.dueAt).getTime()
          : Number.MAX_SAFE_INTEGER
        const bTime = b.dueAt
          ? new Date(b.dueAt).getTime()
          : Number.MAX_SAFE_INTEGER
        cmp = aTime - bTime
      } else if (sortKey === "type") {
        cmp = SERVICE_EVENT_TYPE_LABELS[a.type].localeCompare(
          SERVICE_EVENT_TYPE_LABELS[b.type],
          "ru"
        )
      } else if (sortKey === "status") {
        cmp = SERVICE_EVENT_STATUS_LABELS[a.status].localeCompare(
          SERVICE_EVENT_STATUS_LABELS[b.status],
          "ru"
        )
      } else {
        cmp = String(a[sortKey] ?? "").localeCompare(
          String(b[sortKey] ?? ""),
          "ru"
        )
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [events, search, statusFilter, typeFilter, sortKey, sortDir])

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) return null
    return (
      <HugeiconsIcon
        icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
        strokeWidth={2}
        className="ml-1 inline size-3"
      />
    )
  }

  const buildPayload = (values: ServiceEventFormValues) => ({
    vehicleId: values.vehicleId,
    type: values.type,
    title: values.title,
    dueAt: values.dueAt || undefined,
    status: values.status,
    completedAt: values.completedAt,
    mileageKm: values.mileageKm,
    defectDescription: values.defectDescription,
    notes: values.notes,
    workLogs: editingEvent ? values.workLogs : undefined,
  })

  const handleSave = async (values: ServiceEventFormValues) => {
    try {
      const payload = buildPayload(values)
      if (editingEvent) {
        await api.serviceEvents.update(editingEvent.id, payload)
        toast.success("Заявка обновлена")
      } else {
        await api.serviceEvents.create(payload)
        toast.success("Заявка создана")
      }
      setShowAddDialog(false)
      setEditingEvent(null)
      onDataChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err, "Ошибка при сохранении заявки"))
    }
  }

  const handleDelete = async () => {
    if (!deletingEvent) return
    try {
      await api.serviceEvents.delete(deletingEvent.id)
      toast.success("Заявка удалена")
      onDataChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось удалить заявку"))
    }
    setDeletingEvent(null)
  }

  return (
    <>
      <div className="grid gap-3 px-4 lg:grid-cols-3 lg:px-6">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Очередь</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {events.filter((event) => event.status === "scheduled").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">В работе</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {events.filter((event) => event.status === "in_progress").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Без дедлайна</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {
              events.filter(
                (event) => event.status !== "completed" && !event.dueAt
              ).length
            }
          </p>
        </div>
      </div>

      <Card className="mx-4 overflow-hidden lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="mr-auto flex items-center gap-2">
            <HugeiconsIcon
              icon={Wrench01Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle className="shrink-0">Заявки ТО и ремонта</CardTitle>
            {events.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {events.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon
                icon={SearchIcon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-8 w-40 pl-8 text-sm sm:w-56"
              />
            </div>
            {canCreateRequest && (
              <Button
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setShowAddDialog(true)}
              >
                <HugeiconsIcon
                  icon={PlusSignCircleIcon}
                  strokeWidth={2}
                  className="mr-1.5 size-4"
                />
                Создать
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto">
            <div className="min-w-[920px]">
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
                        Техника{renderSortIcon("vehicleLabel")}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("title")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={TextFontIcon}
                          strokeWidth={2}
                          className="size-3.5 text-muted-foreground"
                        />
                        Заявка{renderSortIcon("title")}
                      </span>
                    </TableHead>
                    <TableHead className="select-none">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                          >
                            <HugeiconsIcon
                              icon={Wrench01Icon}
                              strokeWidth={2}
                              className="size-3.5 text-muted-foreground"
                            />
                            Тип
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="start">
                          {(
                            Object.entries(SERVICE_EVENT_TYPE_LABELS) as [
                              ServiceEventType,
                              string,
                            ][]
                          ).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setTypeFilter(typeFilter === val ? null : val)
                              }
                              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${typeFilter === val ? "bg-accent font-medium" : ""}`}
                            >
                              {label}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      {typeFilter && (
                        <Badge
                          variant="secondary"
                          className={`ml-1.5 cursor-pointer gap-1 px-1.5 py-0 text-[10px] ${typeBadgeStyles[typeFilter]}`}
                          onClick={() => setTypeFilter(null)}
                        >
                          {SERVICE_EVENT_TYPE_LABELS[typeFilter]}
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-2.5"
                          />
                        </Badge>
                      )}
                    </TableHead>
                    <TableHead className="select-none">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                          >
                            <HugeiconsIcon
                              icon={Activity01Icon}
                              strokeWidth={2}
                              className="size-3.5 text-muted-foreground"
                            />
                            Статус
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1" align="start">
                          {(
                            Object.entries(SERVICE_EVENT_STATUS_LABELS) as [
                              ServiceEventStatus,
                              string,
                            ][]
                          ).map(([val, label]) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setStatusFilter(
                                  statusFilter === val ? null : val
                                )
                              }
                              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${statusFilter === val ? "bg-accent font-medium" : ""}`}
                            >
                              {label}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                      {statusFilter && (
                        <Badge
                          variant="secondary"
                          className={`ml-1.5 cursor-pointer gap-1 px-1.5 py-0 text-[10px] ${statusBadgeStyles[statusFilter]}`}
                          onClick={() => setStatusFilter(null)}
                        >
                          {SERVICE_EVENT_STATUS_LABELS[statusFilter]}
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-2.5"
                          />
                        </Badge>
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("dueAt")}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          strokeWidth={2}
                          className="size-3.5 text-muted-foreground"
                        />
                        Дедлайн{renderSortIcon("dueAt")}
                      </span>
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Ничего не найдено
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="pl-6">
                          <div className="font-medium">
                            {event.vehicleLabel}
                          </div>
                          {event.reporter && (
                            <span className="text-xs text-muted-foreground">
                              Создал: {event.reporter.fullName}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="font-medium">{event.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {event.defectDescription ||
                                event.notes ||
                                "Описание не указано"}
                            </p>
                            {event.workLogs.length > 0 && (
                              <Badge
                                variant="outline"
                                className="mt-2 border-slate-200 text-[10px] text-muted-foreground"
                              >
                                Работ: {event.workLogs.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 text-xs ${typeBadgeStyles[event.type]}`}
                          >
                            {SERVICE_EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 text-xs ${statusBadgeStyles[event.status]}`}
                          >
                            {SERVICE_EVENT_STATUS_LABELS[event.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                          {formatDate(event.dueAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <HugeiconsIcon
                                  icon={MoreHorizontalCircle01Icon}
                                  strokeWidth={2}
                                  className="size-4"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => setEditingEvent(event)}
                              >
                                <HugeiconsIcon
                                  icon={PencilEdit02Icon}
                                  strokeWidth={2}
                                />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletingEvent(event)}
                              >
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  strokeWidth={2}
                                />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {canCreateRequest && (
        <ServiceEventDialog
          key="add"
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          vehicles={vehicles}
          onSave={handleSave}
        />
      )}
      {editingEvent && (
        <ServiceEventDialog
          key={editingEvent.id}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          event={editingEvent}
          vehicles={vehicles}
          onSave={handleSave}
        />
      )}
      <DeleteServiceEventDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        event={deletingEvent}
        onConfirm={handleDelete}
      />
    </>
  )
}
