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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  FleetVehicle,
  FleetVehicleStatus,
} from "@/lib/types"
import {
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
} from "@/lib/types"
import {
  FleetVehicleDialog,
  DeleteFleetVehicleDialog,
  type FleetVehicleFormValues,
} from "@/components/fleet/fleet-dialogs"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  MoreHorizontalCircle01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  PlusSignCircleIcon,
  SearchIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Car01Icon,
  TextFontIcon,
  Activity01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"

const statusBadgeVariants: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  reserve: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  repair: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

const statusStyles: Record<FleetVehicle["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  reserve: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  repair: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

type SortKey =
  | "brand"
  | "model"
  | "type"
  | "plateNumber"
  | "updatedAt"
type SortDir = "asc" | "desc"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

interface FleetTableProps {
  initialVehicles: FleetVehicle[]
  onDataChange?: () => void
  readonly?: boolean
}

export function FleetTable({ initialVehicles, onDataChange, readonly }: FleetTableProps) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(initialVehicles)

  useEffect(() => { setVehicles(initialVehicles) }, [initialVehicles])

  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState<FleetVehicle | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FleetVehicleStatus | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("brand")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = vehicles

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          FLEET_VEHICLE_TYPE_LABELS[v.type].toLowerCase().includes(q) ||
          v.plateNumber.toLowerCase().includes(q) ||
          v.notes.toLowerCase().includes(q)
      )
    }

    if (statusFilter) {
      result = result.filter((v) => v.status === statusFilter)
    }

    result = [...result].sort((a, b) => {
      let av: string, bv: string
      if (sortKey === "type") {
        av = FLEET_VEHICLE_TYPE_LABELS[a.type]
        bv = FLEET_VEHICLE_TYPE_LABELS[b.type]
      } else {
        av = String(a[sortKey] ?? "")
        bv = String(b[sortKey] ?? "")
      }
      const cmp = av.localeCompare(bv, "ru")
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [vehicles, search, statusFilter, sortKey, sortDir])

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

  const handleSave = async (values: FleetVehicleFormValues) => {
    try {
      if (editingVehicle) {
        await api.fleet.update(editingVehicle.id, values)
        toast.success("Единица техники сохранена")
      } else {
        await api.fleet.create(values)
        toast.success("Единица техники добавлена")
      }
      setShowAddDialog(false)
      setEditingVehicle(null)
      onDataChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить технику"))
    }
  }

  const handleDelete = async () => {
    if (deletingVehicle) {
      try {
        await api.fleet.delete(deletingVehicle.id)
        toast.success("Единица техники удалена")
        onDataChange?.()
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось удалить технику"))
      }
      setDeletingVehicle(null)
    }
  }

  return (
    <>
      <Card className="mx-4 lg:mx-6 overflow-hidden">
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="size-5 text-primary" />
            <CardTitle className="shrink-0">Единицы техники</CardTitle>
            {vehicles.length > 0 && (
              <Badge variant="secondary" className="text-xs">{vehicles.length}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-8 w-40 pl-8 text-sm sm:w-56"
              />
            </div>

            {!readonly && (
              <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => setShowAddDialog(true)}>
                <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="mr-1.5 size-4" />
                Добавить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 cursor-pointer select-none" onClick={() => toggleSort("brand")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Марка
                    {renderSortIcon("brand")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("model")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Модель
                    {renderSortIcon("model")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("type")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Тип ТС
                    {renderSortIcon("type")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("plateNumber")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Госномер
                    {renderSortIcon("plateNumber")}
                  </span>
                </TableHead>
                <TableHead className="select-none">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                        Статус
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1" align="start">
                      {(Object.entries(FLEET_VEHICLE_STATUS_LABELS) as [FleetVehicleStatus, string][]).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setStatusFilter(statusFilter === value ? null : value)}
                          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${statusFilter === value ? "bg-accent font-medium" : ""}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${statusBadgeVariants[value]?.split(" ")[0] ?? ""}`} />
                          {label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  {statusFilter && (
                    <Badge
                      variant="secondary"
                      className={`ml-1.5 cursor-pointer gap-1 text-[10px] px-1.5 py-0 ${statusBadgeVariants[statusFilter] ?? ""}`}
                      onClick={() => setStatusFilter(null)}
                    >
                      {FLEET_VEHICLE_STATUS_LABELS[statusFilter]}
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
                    </Badge>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("updatedAt")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Обновлено
                    {renderSortIcon("updatedAt")}
                  </span>
                </TableHead>
                {!readonly && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={readonly ? 6 : 7} className="h-24 text-center text-muted-foreground">
                    Ничего не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="pl-6 font-medium">
                      {vehicle.brand}
                    </TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="max-w-48 truncate rounded-full px-2 py-0 text-[10px]">
                        {FLEET_VEHICLE_TYPE_LABELS[vehicle.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                        {vehicle.plateNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-0 ${statusStyles[vehicle.status]}`}>
                        {FLEET_VEHICLE_STATUS_LABELS[vehicle.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(vehicle.updatedAt)}
                    </TableCell>
                    {!readonly && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setEditingVehicle(vehicle)}>
                              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingVehicle(vehicle)}>
                              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!readonly && (
        <>
          <FleetVehicleDialog
            key="add"
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSave={handleSave}
          />
          <FleetVehicleDialog
            key={editingVehicle?.id ?? "edit"}
            open={!!editingVehicle}
            onOpenChange={(o) => !o && setEditingVehicle(null)}
            vehicle={editingVehicle}
            onSave={handleSave}
          />
          <DeleteFleetVehicleDialog
            open={!!deletingVehicle}
            onOpenChange={(o) => !o && setDeletingVehicle(null)}
            vehicle={deletingVehicle}
            onConfirm={handleDelete}
          />
        </>
      )}
    </>
  )
}
