"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type {
  ConstructionSite,
  EquipmentPlan,
  EquipmentPlanShift,
  EquipmentPlanStatus,
  FleetVehicle,
} from "@/lib/types"
import {
  EQUIPMENT_PLAN_SHIFT_LABELS,
  EQUIPMENT_PLAN_STATUS_LABELS,
} from "@/lib/types"
import { getErrorMessage } from "@/lib/feedback"
import { useRole } from "@/contexts/role-context"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Calendar03Icon,
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

const ALL_STATUSES = "__all__"

const statusStyles: Record<EquipmentPlanStatus, string> = {
  planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

interface PlanFormValues {
  siteId: string
  vehicleId: string
  workDate: string
  shift: EquipmentPlanShift
  plannedHours: string
  actualHours: string
  status: EquipmentPlanStatus
  notes: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function createInitialForm(plan?: EquipmentPlan | null): PlanFormValues {
  return {
    siteId: plan?.siteId ?? "",
    vehicleId: plan?.vehicleId ?? "",
    workDate: plan?.workDate ? toDateInput(plan.workDate) : toDateInput(new Date().toISOString()),
    shift: plan?.shift ?? "day",
    plannedHours: String(plan?.plannedHours ?? 8),
    actualHours: plan?.actualHours != null ? String(plan.actualHours) : "",
    status: plan?.status ?? "planned",
    notes: plan?.notes ?? "",
  }
}

function PlanDialog({
  open,
  onOpenChange,
  plan,
  sites,
  vehicles,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: EquipmentPlan | null
  sites: ConstructionSite[]
  vehicles: FleetVehicle[]
  onSave: (values: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<PlanFormValues>(() => createInitialForm(plan))

  useEffect(() => {
    if (open) setForm(createInitialForm(plan))
  }, [open, plan])

  const handleSave = () => {
    if (!form.siteId) {
      toast.error("Выберите дорожный объект")
      return
    }
    if (!form.vehicleId) {
      toast.error("Выберите единицу техники")
      return
    }
    if (!form.workDate) {
      toast.error("Укажите дату работ")
      return
    }

    const plannedHours = Number.parseInt(form.plannedHours, 10)
    const actualHours = form.actualHours
      ? Number.parseInt(form.actualHours, 10)
      : null

    if (Number.isNaN(plannedHours) || plannedHours < 1 || plannedHours > 24) {
      toast.error("Плановые часы должны быть от 1 до 24")
      return
    }
    if (actualHours != null && (Number.isNaN(actualHours) || actualHours < 0 || actualHours > 24)) {
      toast.error("Фактические часы должны быть от 0 до 24")
      return
    }

    onSave({
      siteId: form.siteId,
      vehicleId: form.vehicleId,
      workDate: form.workDate,
      shift: form.shift,
      plannedHours,
      actualHours,
      status: form.status,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Редактирование смены" : "Новая смена техники"}
          </DialogTitle>
          <DialogDescription>
            Запланируйте использование техники на дорожном объекте.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Дорожный объект
            </label>
            <Select
              value={form.siteId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, siteId: value }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Выберите объект" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Единица техники
            </label>
            <Select
              value={form.vehicleId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, vehicleId: value }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Выберите технику" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.plateNumber})
                    {!vehicle.assignedDriver ? " · без водителя" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Дата работ
            </label>
            <Input
              type="date"
              value={form.workDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, workDate: event.target.value }))
              }
              className="h-9"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Смена
            </label>
            <Select
              value={form.shift}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  shift: value as EquipmentPlanShift,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_PLAN_SHIFT_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Плановые часы
            </label>
            <Input
              type="number"
              min={1}
              max={24}
              value={form.plannedHours}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, plannedHours: event.target.value }))
              }
              className="h-9"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Фактические часы
            </label>
            <Input
              type="number"
              min={0}
              max={24}
              value={form.actualHours}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, actualHours: event.target.value }))
              }
              placeholder="После выполнения"
              className="h-9"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Статус
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as EquipmentPlanStatus,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_PLAN_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Примечание
            </label>
            <Input
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Например, доставка смеси"
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PlanningPage() {
  const { canEdit } = useRole()
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<EquipmentPlan | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [plansData, sitesData, vehiclesData] = await Promise.all([
        api.equipmentPlans.getAll(),
        api.sites.getAll(),
        api.fleet.getAll(),
      ])
      setPlans(plansData)
      setSites(sitesData)
      setVehicles(vehiclesData)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить план-график"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const filteredPlans = useMemo(() => {
    if (statusFilter === ALL_STATUSES) return plans
    return plans.filter((plan) => plan.status === statusFilter)
  }, [plans, statusFilter])

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      if (editingPlan) {
        await api.equipmentPlans.update(editingPlan.id, values)
        toast.success("Смена обновлена")
      } else {
        await api.equipmentPlans.create(values)
        toast.success("Смена добавлена в план-график")
      }
      setShowAddDialog(false)
      setEditingPlan(null)
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить смену"))
    }
  }

  const handleDelete = async (plan: EquipmentPlan) => {
    try {
      await api.equipmentPlans.delete(plan.id)
      toast.success("Смена удалена")
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось удалить смену"))
    }
  }

  const availableVehicles = vehicles.filter((vehicle) => vehicle.status !== "repair")

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">План-график техники</h1>
          <p className="text-sm text-muted-foreground">
            Сменное планирование использования дорожной техники на объектах
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <HugeiconsIcon
              icon={PlusSignCircleIcon}
              strokeWidth={2}
              className="mr-1.5 size-4"
            />
            Добавить смену
          </Button>
        )}
      </div>

      <Card className="mx-4 overflow-hidden lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="mr-auto flex items-center gap-2">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle>Сменные назначения</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {filteredPlans.length}
            </Badge>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Все статусы</SelectItem>
              {Object.entries(EQUIPMENT_PLAN_STATUS_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Дата</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>Техника</TableHead>
                <TableHead>Смена</TableHead>
                <TableHead>Часы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Риски</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 8 : 7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    План-график пока не заполнен
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="pl-6 text-sm">
                      {formatDate(plan.workDate)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plan.siteName}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.siteWorkType || "Вид работ не указан"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{plan.vehicleLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.driver?.fullName ?? "Водитель не закреплён"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {EQUIPMENT_PLAN_SHIFT_LABELS[plan.shift]}
                    </TableCell>
                    <TableCell className="text-sm">
                      {plan.plannedHours}
                      <span className="text-muted-foreground"> план</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      {plan.actualHours ?? "—"}
                      <span className="text-muted-foreground"> факт</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 ${statusStyles[plan.status]}`}
                      >
                        {EQUIPMENT_PLAN_STATUS_LABELS[plan.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.warnings.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {plan.warnings.map((warning) => (
                            <Badge
                              key={warning}
                              variant="secondary"
                              className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            >
                              <HugeiconsIcon
                                icon={AlertCircleIcon}
                                strokeWidth={2}
                                className="size-3"
                              />
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingPlan(plan)}
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
                            onClick={() => handleDelete(plan)}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canEdit && (
        <>
          <PlanDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            sites={sites}
            vehicles={availableVehicles}
            onSave={handleSave}
          />
          <PlanDialog
            open={!!editingPlan}
            onOpenChange={(open) => !open && setEditingPlan(null)}
            plan={editingPlan}
            sites={sites}
            vehicles={availableVehicles}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  )
}
