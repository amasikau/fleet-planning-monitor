"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type {
  FleetRepairCategory,
  FleetVehicleType,
  RepairTemplate,
} from "@/lib/types"
import {
  FLEET_REPAIR_CATEGORY_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  FLEET_VEHICLE_TYPES,
} from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
  SearchIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

type TemplateForm = {
  vehicleType: FleetVehicleType
  category: FleetRepairCategory
  name: string
  durationDays: number
  notes: string
  isActive: boolean
}

const categories = Object.keys(
  FLEET_REPAIR_CATEGORY_LABELS
) as FleetRepairCategory[]

function initialForm(template?: RepairTemplate | null): TemplateForm {
  return {
    vehicleType: template?.vehicleType ?? "dump_truck",
    category: template?.category ?? "scheduled_service",
    name: template?.name ?? "",
    durationDays: template?.durationDays ?? 1,
    notes: template?.notes ?? "",
    isActive: template?.isActive ?? true,
  }
}

export function RepairTemplateDirectory({
  templates,
  canEdit,
  onDataChange,
}: {
  templates: RepairTemplate[]
  canEdit: boolean
  onDataChange: () => void
}) {
  const [search, setSearch] = useState("")
  const [vehicleTypeFilter, setVehicleTypeFilter] =
    useState<FleetVehicleType | null>(null)
  const [categoryFilter, setCategoryFilter] =
    useState<FleetRepairCategory | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<RepairTemplate | null>(
    null
  )
  const [showDialog, setShowDialog] = useState(false)
  const [form, setForm] = useState<TemplateForm>(() => initialForm())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates
      .filter((template) => {
        if (vehicleTypeFilter && template.vehicleType !== vehicleTypeFilter) {
          return false
        }
        if (categoryFilter && template.category !== categoryFilter) return false
        if (!q) return true
        return (
          template.name.toLowerCase().includes(q) ||
          template.notes.toLowerCase().includes(q) ||
          FLEET_VEHICLE_TYPE_LABELS[template.vehicleType]
            .toLowerCase()
            .includes(q) ||
          FLEET_REPAIR_CATEGORY_LABELS[template.category]
            .toLowerCase()
            .includes(q)
        )
      })
      .sort(
        (a, b) =>
          a.vehicleType.localeCompare(b.vehicleType) ||
          a.category.localeCompare(b.category) ||
          a.name.localeCompare(b.name, "ru")
      )
  }, [templates, search, vehicleTypeFilter, categoryFilter])

  const openCreate = () => {
    setEditingTemplate(null)
    setForm(initialForm())
    setShowDialog(true)
  }

  const openEdit = (template: RepairTemplate) => {
    setEditingTemplate(template)
    setForm(initialForm(template))
    setShowDialog(true)
  }

  const saveTemplate = async () => {
    if (!form.name.trim()) {
      toast.error("Укажите название ремонта")
      return
    }
    if (form.durationDays < 1) {
      toast.error("Длительность должна быть не меньше 1 дня")
      return
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      notes: form.notes.trim(),
    }

    try {
      if (editingTemplate) {
        await api.serviceEvents.updateRepairTemplate(
          editingTemplate.id,
          payload
        )
        toast.success("Позиция справочника обновлена")
      } else {
        await api.serviceEvents.createRepairTemplate(payload)
        toast.success("Позиция справочника создана")
      }
      setShowDialog(false)
      setEditingTemplate(null)
      onDataChange()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить ремонт"))
    }
  }

  const disableTemplate = async (template: RepairTemplate) => {
    try {
      await api.serviceEvents.deleteRepairTemplate(template.id)
      toast.success("Позиция справочника отключена")
      onDataChange()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось отключить ремонт"))
    }
  }

  return (
    <>
      <Card className="mx-4 overflow-hidden lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="mr-auto flex items-center gap-2">
            <HugeiconsIcon
              icon={Wrench01Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle>Справочник ремонтов</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {templates.length}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <HugeiconsIcon
                icon={SearchIcon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск..."
                className="h-8 w-40 pl-8 text-sm sm:w-52"
              />
            </div>
            <Select
              value={vehicleTypeFilter ?? "all"}
              onValueChange={(value) =>
                setVehicleTypeFilter(
                  value === "all" ? null : (value as FleetVehicleType)
                )
              }
            >
              <SelectTrigger className="h-8 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы техники</SelectItem>
                {FLEET_VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FLEET_VEHICLE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter ?? "all"}
              onValueChange={(value) =>
                setCategoryFilter(
                  value === "all" ? null : (value as FleetRepairCategory)
                )
              }
            >
              <SelectTrigger className="h-8 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все разделы</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {FLEET_REPAIR_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEdit && (
              <Button size="sm" onClick={openCreate}>
                <HugeiconsIcon
                  icon={PlusSignCircleIcon}
                  strokeWidth={2}
                  className="mr-1.5 size-4"
                />
                Добавить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <div className="min-w-[880px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Тип техники</TableHead>
                    <TableHead>Раздел</TableHead>
                    <TableHead>Ремонт</TableHead>
                    <TableHead>Дней</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-20 text-center text-muted-foreground"
                      >
                        Позиции справочника не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="pl-6 text-sm">
                          {FLEET_VEHICLE_TYPE_LABELS[template.vehicleType]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {FLEET_REPAIR_CATEGORY_LABELS[template.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[360px]">
                            <p className="font-medium">{template.name}</p>
                            {template.notes && (
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {template.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {template.durationDays}
                        </TableCell>
                        <TableCell>
                          {canEdit && (
                            <div className="flex justify-end gap-1 pr-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(template)}
                              >
                                <HugeiconsIcon
                                  icon={PencilEdit02Icon}
                                  strokeWidth={2}
                                  className="size-4"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => disableTemplate(template)}
                              >
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  strokeWidth={2}
                                  className="size-4"
                                />
                              </Button>
                            </div>
                          )}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Редактирование ремонта" : "Новый ремонт"}
            </DialogTitle>
            <DialogDescription>
              Позиция справочника определяет доступные ремонты для выбранного
              типа техники.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип техники
              </label>
              <Select
                value={form.vehicleType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    vehicleType: value as FleetVehicleType,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLEET_VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FLEET_VEHICLE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Раздел ремонта
              </label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    category: value as FleetRepairCategory,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {FLEET_REPAIR_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Название ремонта
              </label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Длительность, дней
              </label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.durationDays}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    durationDays: Math.max(
                      parseInt(event.target.value) || 1,
                      1
                    ),
                  }))
                }
                className="h-9"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Примечание
              </label>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={saveTemplate}>
              {editingTemplate ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
