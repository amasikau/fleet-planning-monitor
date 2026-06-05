"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type {
  ConstructionSite,
  EquipmentCoverageItem,
  EquipmentDemand,
  EquipmentDemandPriority,
  EquipmentPlan,
  EquipmentPlanShift,
  EquipmentPlanStatus,
  FleetVehicle,
  FleetVehicleType,
  RoadWorkStage,
  RoadWorkStageStatus,
  RoadWorkStageType,
  ServiceEvent,
} from "@/lib/types"
import {
  EQUIPMENT_DEMAND_PRIORITY_LABELS,
  EQUIPMENT_PLAN_SHIFT_LABELS,
  EQUIPMENT_PLAN_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  ROAD_WORK_STAGE_STATUS_LABELS,
  ROAD_WORK_STAGE_TYPE_LABELS,
} from "@/lib/types"
import { getErrorMessage } from "@/lib/feedback"
import { useRole } from "@/contexts/role-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Calendar03Icon,
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { ObjectPlanningWorkspace } from "@/components/planning/object-planning-workspace"
import { WorkTypeManagement } from "@/components/planning/work-type-management"

const ALL_STATUSES = "__all__"
const NONE_VALUE = "__none__"
const WEEK_CAPACITY_HOURS = 48

const planStatusStyles: Record<EquipmentPlanStatus, string> = {
  planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const stageStatusStyles: Record<RoadWorkStageStatus, string> = {
  planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  delayed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const priorityStyles: Record<EquipmentDemandPriority, string> = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const riskStyles: Record<EquipmentCoverageItem["riskLevel"], string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "bg-red-500/10 text-red-700 dark:text-red-300",
}

interface PlanFormValues {
  siteId: string
  stageId: string
  demandId: string
  vehicleId: string
  workDate: string
  shift: EquipmentPlanShift
  plannedHours: string
  actualHours: string
  status: EquipmentPlanStatus
  notes: string
}

interface StageFormValues {
  siteId: string
  type: RoadWorkStageType
  name: string
  startDate: string
  endDate: string
  status: RoadWorkStageStatus
  notes: string
}

interface DemandFormValues {
  siteId: string
  stageId: string
  vehicleType: FleetVehicleType
  requiredCount: string
  plannedHours: string
  priority: EquipmentDemandPriority
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

function formatRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

function getVehicleTypeLabel(type?: FleetVehicleType | null) {
  return type ? FLEET_VEHICLE_TYPE_LABELS[type] : "Тип не указан"
}

function createInitialPlanForm(plan?: EquipmentPlan | null): PlanFormValues {
  return {
    siteId: plan?.siteId ?? "",
    stageId: plan?.stageId ?? "",
    demandId: plan?.demandId ?? "",
    vehicleId: plan?.vehicleId ?? "",
    workDate: plan?.workDate
      ? toDateInput(plan.workDate)
      : toDateInput(new Date().toISOString()),
    shift: plan?.shift ?? "day",
    plannedHours: String(plan?.plannedHours ?? 8),
    actualHours: plan?.actualHours != null ? String(plan.actualHours) : "",
    status: plan?.status ?? "planned",
    notes: plan?.notes ?? "",
  }
}

function createInitialStageForm(stage?: RoadWorkStage | null): StageFormValues {
  return {
    siteId: stage?.siteId ?? "",
    type: stage?.type ?? "preparation",
    name: stage?.name ?? "",
    startDate: stage?.startDate
      ? toDateInput(stage.startDate)
      : toDateInput(new Date().toISOString()),
    endDate: stage?.endDate
      ? toDateInput(stage.endDate)
      : toDateInput(new Date().toISOString()),
    status: stage?.status ?? "planned",
    notes: stage?.notes ?? "",
  }
}

function createInitialDemandForm(
  demand?: EquipmentDemand | null
): DemandFormValues {
  return {
    siteId: demand?.siteId ?? "",
    stageId: demand?.stageId ?? "",
    vehicleType: demand?.vehicleType ?? "dump_truck",
    requiredCount: String(demand?.requiredCount ?? 1),
    plannedHours: String(demand?.plannedHours ?? 8),
    priority: demand?.priority ?? "normal",
    notes: demand?.notes ?? "",
  }
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string
  value: number | string
  note: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function IconButton({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string
  onClick: () => void
  icon: typeof PencilEdit02Icon
  danger?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={danger ? "h-8 w-8 text-muted-foreground hover:text-destructive" : "h-8 w-8"}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
    </Button>
  )
}

function PlanDialog({
  open,
  onOpenChange,
  plan,
  sites,
  stages,
  demands,
  vehicles,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: EquipmentPlan | null
  sites: ConstructionSite[]
  stages: RoadWorkStage[]
  demands: EquipmentDemand[]
  vehicles: FleetVehicle[]
  onSave: (values: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<PlanFormValues>(() =>
    createInitialPlanForm(plan)
  )

  const siteStages = stages.filter((stage) => stage.siteId === form.siteId)
  const siteDemands = demands.filter((demand) => {
    if (demand.siteId !== form.siteId) return false
    if (!form.stageId) return true
    return !demand.stageId || demand.stageId === form.stageId
  })

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
    if (
      actualHours != null &&
      (Number.isNaN(actualHours) || actualHours < 0 || actualHours > 24)
    ) {
      toast.error("Фактические часы должны быть от 0 до 24")
      return
    }

    onSave({
      siteId: form.siteId,
      stageId: form.stageId || null,
      demandId: form.demandId || null,
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Редактирование смены" : "Новая смена техники"}
          </DialogTitle>
          <DialogDescription>
            Свяжите назначение с объектом, этапом дорожных работ и потребностью.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Дорожный объект</FieldLabel>
            <Select
              value={form.siteId}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  siteId: value,
                  stageId: "",
                  demandId: "",
                }))
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
          </Field>

          <Field>
            <FieldLabel>Единица техники</FieldLabel>
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
                    {vehicle.brand} {vehicle.model} ({vehicle.plateNumber}) ·{" "}
                    {getVehicleTypeLabel(vehicle.type)}
                    {!vehicle.assignedDriver ? " · без водителя" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Этап дорожных работ</FieldLabel>
            <Select
              value={form.stageId || NONE_VALUE}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  stageId: value === NONE_VALUE ? "" : value,
                  demandId: "",
                }))
              }
              disabled={!form.siteId}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Без этапа</SelectItem>
                {siteStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Потребность</FieldLabel>
            <Select
              value={form.demandId || NONE_VALUE}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  demandId: value === NONE_VALUE ? "" : value,
                }))
              }
              disabled={!form.siteId}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Без заявки</SelectItem>
                {siteDemands.map((demand) => (
                  <SelectItem key={demand.id} value={demand.id}>
                    {getVehicleTypeLabel(demand.vehicleType)} · нужно{" "}
                    {demand.requiredCount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Дата работ</FieldLabel>
            <Input
              type="date"
              value={form.workDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, workDate: event.target.value }))
              }
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Смена</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel>Плановые часы</FieldLabel>
            <Input
              type="number"
              min={1}
              max={24}
              value={form.plannedHours}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  plannedHours: event.target.value,
                }))
              }
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Фактические часы</FieldLabel>
            <Input
              type="number"
              min={0}
              max={24}
              value={form.actualHours}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  actualHours: event.target.value,
                }))
              }
              placeholder="После выполнения"
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Статус</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel>Примечание</FieldLabel>
            <Input
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Например, подвоз асфальтобетонной смеси"
              className="h-9"
            />
          </Field>
        </FieldGroup>

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

function StageDialog({
  open,
  onOpenChange,
  stage,
  sites,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage?: RoadWorkStage | null
  sites: ConstructionSite[]
  onSave: (values: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<StageFormValues>(() =>
    createInitialStageForm(stage)
  )

  const handleSave = () => {
    if (!form.siteId) {
      toast.error("Выберите дорожный объект")
      return
    }
    if (!form.name.trim()) {
      toast.error("Укажите название этапа")
      return
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("Дата окончания этапа не может быть раньше начала")
      return
    }

    onSave({
      siteId: form.siteId,
      type: form.type,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {stage ? "Редактирование этапа" : "Новый этап дорожных работ"}
          </DialogTitle>
          <DialogDescription>
            Опишите технологический этап объекта для последующего планирования техники.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Дорожный объект</FieldLabel>
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
          </Field>

          <Field>
            <FieldLabel>Тип этапа</FieldLabel>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  type: value as RoadWorkStageType,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROAD_WORK_STAGE_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Название этапа</FieldLabel>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Например, укладка верхнего слоя"
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Статус</FieldLabel>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as RoadWorkStageStatus,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROAD_WORK_STAGE_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Начало</FieldLabel>
            <Input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Окончание</FieldLabel>
            <Input
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, endDate: event.target.value }))
              }
              className="h-9"
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>Примечание</FieldLabel>
            <Input
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Технологические ограничения, окна движения, поставки"
              className="h-9"
            />
          </Field>
        </FieldGroup>

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

function DemandDialog({
  open,
  onOpenChange,
  demand,
  sites,
  stages,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  demand?: EquipmentDemand | null
  sites: ConstructionSite[]
  stages: RoadWorkStage[]
  onSave: (values: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<DemandFormValues>(() =>
    createInitialDemandForm(demand)
  )

  const siteStages = stages.filter((stage) => stage.siteId === form.siteId)

  const handleSave = () => {
    if (!form.siteId) {
      toast.error("Выберите дорожный объект")
      return
    }

    const requiredCount = Number.parseInt(form.requiredCount, 10)
    const plannedHours = Number.parseInt(form.plannedHours, 10)

    if (
      Number.isNaN(requiredCount) ||
      requiredCount < 1 ||
      requiredCount > 200
    ) {
      toast.error("Количество техники должно быть от 1 до 200")
      return
    }
    if (Number.isNaN(plannedHours) || plannedHours < 1 || plannedHours > 24) {
      toast.error("Плановые часы должны быть от 1 до 24")
      return
    }

    onSave({
      siteId: form.siteId,
      stageId: form.stageId || null,
      vehicleType: form.vehicleType,
      requiredCount,
      plannedHours,
      priority: form.priority,
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {demand ? "Редактирование потребности" : "Новая потребность в технике"}
          </DialogTitle>
          <DialogDescription>
            Зафиксируйте, какая техника нужна объекту или конкретному этапу.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Дорожный объект</FieldLabel>
            <Select
              value={form.siteId}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  siteId: value,
                  stageId: "",
                }))
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
          </Field>

          <Field>
            <FieldLabel>Этап</FieldLabel>
            <Select
              value={form.stageId || NONE_VALUE}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  stageId: value === NONE_VALUE ? "" : value,
                }))
              }
              disabled={!form.siteId}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Без этапа</SelectItem>
                {siteStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Тип техники</FieldLabel>
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
                {Object.entries(FLEET_VEHICLE_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Приоритет</FieldLabel>
            <Select
              value={form.priority}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  priority: value as EquipmentDemandPriority,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EQUIPMENT_DEMAND_PRIORITY_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Нужно единиц</FieldLabel>
            <Input
              type="number"
              min={1}
              max={200}
              value={form.requiredCount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  requiredCount: event.target.value,
                }))
              }
              className="h-9"
            />
          </Field>

          <Field>
            <FieldLabel>Часов на смену</FieldLabel>
            <Input
              type="number"
              min={1}
              max={24}
              value={form.plannedHours}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  plannedHours: event.target.value,
                }))
              }
              className="h-9"
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel>Примечание</FieldLabel>
            <Input
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Например, непрерывный подвоз смеси к асфальтоукладчику"
              className="h-9"
            />
          </Field>
        </FieldGroup>

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
  const [stages, setStages] = useState<RoadWorkStage[]>([])
  const [demands, setDemands] = useState<EquipmentDemand[]>([])
  const [coverage, setCoverage] = useState<EquipmentCoverageItem[]>([])
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [showDemandDialog, setShowDemandDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState<EquipmentPlan | null>(null)
  const [editingStage, setEditingStage] = useState<RoadWorkStage | null>(null)
  const [editingDemand, setEditingDemand] = useState<EquipmentDemand | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [
        plansData,
        stagesData,
        demandsData,
        coverageData,
        sitesData,
        vehiclesData,
        serviceEventsData,
      ] = await Promise.all([
        api.equipmentPlans.getAll(),
        api.equipmentPlans.getStages(),
        api.equipmentPlans.getDemands(),
        api.equipmentPlans.getCoverage(),
        api.sites.getAll(),
        api.fleet.getAll(),
        api.serviceEvents.getAll(),
      ])
      setPlans(plansData)
      setStages(stagesData)
      setDemands(demandsData)
      setCoverage(coverageData)
      setSites(sitesData)
      setVehicles(vehiclesData)
      setServiceEvents(serviceEventsData)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить планирование"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const selectedStages = useMemo(
    () => stages.filter((stage) => stage.siteId === selectedSiteId),
    [selectedSiteId, stages]
  )
  const selectedDemands = useMemo(
    () => demands.filter((demand) => demand.siteId === selectedSiteId),
    [demands, selectedSiteId]
  )
  const selectedCoverage = useMemo(
    () => coverage.filter((item) => item.siteId === selectedSiteId),
    [coverage, selectedSiteId]
  )
  const selectedPlans = useMemo(
    () => plans.filter((plan) => plan.siteId === selectedSiteId),
    [plans, selectedSiteId]
  )

  const filteredPlans = useMemo(() => {
    if (statusFilter === ALL_STATUSES) return selectedPlans
    return selectedPlans.filter((plan) => plan.status === statusFilter)
  }, [selectedPlans, statusFilter])

  const availableVehicles = vehicles.filter((vehicle) => vehicle.status !== "repair")

  const activeDeficits = selectedCoverage.filter((item) => item.deficit > 0)
  const criticalDeficits = activeDeficits.filter(
    (item) => item.priority === "critical"
  )
  const averageCoverage =
    selectedCoverage.length > 0
      ? Math.round(
          selectedCoverage.reduce((sum, item) => sum + item.coveragePercent, 0) /
            selectedCoverage.length
        )
      : 100

  const stageStats = {
    inProgress: selectedStages.filter((stage) => stage.status === "in_progress").length,
    delayed: selectedStages.filter((stage) => stage.status === "delayed").length,
  }

  const vehicleUtilization = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)

    return vehicles
      .map((vehicle) => {
        const hours = selectedPlans
          .filter((plan) => {
            const workDate = new Date(plan.workDate)
            return (
              plan.vehicleId === vehicle.id &&
              plan.status !== "failed" &&
              workDate >= today &&
              workDate <= weekEnd
            )
          })
          .reduce((sum, plan) => sum + plan.plannedHours, 0)
        const utilization = Math.round((hours / WEEK_CAPACITY_HOURS) * 100)
        const state =
          utilization > 85 ? "Перегруз" : utilization < 30 ? "Недогруз" : "Норма"

        return {
          vehicle,
          hours,
          utilization,
          state,
        }
      })
      .sort((a, b) => b.utilization - a.utilization)
  }, [selectedPlans, vehicles])

  const overloadedVehicles = vehicleUtilization.filter(
    (item) => item.utilization > 85
  )
  const idleVehicles = vehicleUtilization.filter(
    (item) => item.hours === 0 && item.vehicle.status === "reserve"
  )
  const asphaltChainRisks = selectedCoverage.filter(
    (item) =>
      item.deficit > 0 &&
      (item.stageType === "asphalt_paving" ||
        item.stageType === "material_delivery" ||
        item.stageType === "compaction")
  )

  const handleSavePlan = async (values: Record<string, unknown>) => {
    try {
      if (editingPlan) {
        await api.equipmentPlans.update(editingPlan.id, values)
        toast.success("Смена обновлена")
      } else {
        await api.equipmentPlans.create(values)
        toast.success("Смена добавлена в план-график")
      }
      setShowPlanDialog(false)
      setEditingPlan(null)
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить смену"))
    }
  }

  const handleSaveStage = async (values: Record<string, unknown>) => {
    try {
      if (editingStage) {
        await api.equipmentPlans.updateStage(editingStage.id, values)
        toast.success("Этап обновлён")
      } else {
        await api.equipmentPlans.createStage(values)
        toast.success("Этап добавлен")
      }
      setShowStageDialog(false)
      setEditingStage(null)
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить этап"))
    }
  }

  const handleSaveDemand = async (values: Record<string, unknown>) => {
    try {
      if (editingDemand) {
        await api.equipmentPlans.updateDemand(editingDemand.id, values)
        toast.success("Потребность обновлена")
      } else {
        await api.equipmentPlans.createDemand(values)
        toast.success("Потребность добавлена")
      }
      setShowDemandDialog(false)
      setEditingDemand(null)
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить потребность"))
    }
  }

  const handleDeletePlan = async (plan: EquipmentPlan) => {
    try {
      await api.equipmentPlans.delete(plan.id)
      toast.success("Смена удалена")
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось удалить смену"))
    }
  }

  const handleDeleteStage = async (stage: RoadWorkStage) => {
    try {
      await api.equipmentPlans.deleteStage(stage.id)
      toast.success("Этап удалён")
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось удалить этап"))
    }
  }

  const handleDeleteDemand = async (demand: EquipmentDemand) => {
    try {
      await api.equipmentPlans.deleteDemand(demand.id)
      toast.success("Потребность удалена")
      await fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось удалить потребность"))
    }
  }

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
          <h1 className="text-2xl font-bold">Планирование использования техники</h1>
          <p className="text-sm text-muted-foreground">
            Этапы дорожных работ, потребности, сменные назначения и балансировка загрузки
          </p>
        </div>
        {canEdit && selectedSiteId && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowStageDialog(true)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                strokeWidth={2}
                className="mr-1.5 size-4"
              />
              Этап
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowDemandDialog(true)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                strokeWidth={2}
                className="mr-1.5 size-4"
              />
              Потребность
            </Button>
            <Button size="sm" onClick={() => setShowPlanDialog(true)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                strokeWidth={2}
                className="mr-1.5 size-4"
              />
              Смена
            </Button>
          </div>
        )}
      </div>

      {selectedSiteId && (
        <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-5 lg:px-6">
          <StatCard
            label="Этапов работ"
            value={selectedStages.length}
            note={`${stageStats.inProgress} в работе, ${stageStats.delayed} отстают`}
          />
          <StatCard
            label="Заявок потребности"
            value={selectedDemands.length}
            note={`${criticalDeficits.length} критических дефицитов`}
          />
          <StatCard
            label="Обеспеченность"
            value={`${averageCoverage}%`}
            note={`${activeDeficits.length} потребностей не закрыто`}
          />
          <StatCard
            label="Плановые смены"
            value={selectedPlans.length}
            note={`${filteredPlans.length} в текущем фильтре`}
          />
          <StatCard
            label="Балансировка"
            value={overloadedVehicles.length}
            note={`${idleVehicles.length} резервных единиц без смен`}
          />
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <ObjectPlanningWorkspace
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSelectedSiteChange={setSelectedSiteId}
          stages={selectedStages}
          demands={selectedDemands}
          plans={selectedPlans}
          coverage={selectedCoverage}
          vehicles={vehicles}
          serviceEvents={serviceEvents}
          canEdit={canEdit}
          onApplied={fetchData}
        />
      </div>

      {selectedSiteId && (
      <Tabs defaultValue="calendar" className="px-4 lg:px-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="calendar">Календарь смен</TabsTrigger>
          <TabsTrigger value="templates">Виды работ</TabsTrigger>
          <TabsTrigger value="stages">Этапы работ</TabsTrigger>
          <TabsTrigger value="demands">Потребность</TabsTrigger>
          <TabsTrigger value="coverage">Обеспеченность</TabsTrigger>
          <TabsTrigger value="balance">Рекомендации</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="flex flex-col gap-4">
          <Card className="overflow-hidden">
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
                    <TableHead>Этап и потребность</TableHead>
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
                        colSpan={canEdit ? 9 : 8}
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
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">{plan.siteName}</p>
                            <p className="text-xs text-muted-foreground">
                              {plan.siteWorkType || "Вид работ не указан"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm">
                              {plan.stageName ?? "Этап не указан"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {plan.demandVehicleType
                                ? `Потребность: ${getVehicleTypeLabel(
                                    plan.demandVehicleType
                                  )}`
                                : "Без заявки потребности"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">{plan.vehicleLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {getVehicleTypeLabel(plan.vehicleType)} ·{" "}
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
                          {plan.actualHours ?? "-"}
                          <span className="text-muted-foreground"> факт</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 ${planStatusStyles[plan.status]}`}
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
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <IconButton
                                label="Редактировать смену"
                                icon={PencilEdit02Icon}
                                onClick={() => setEditingPlan(plan)}
                              />
                              <IconButton
                                label="Удалить смену"
                                icon={Delete02Icon}
                                danger
                                onClick={() => void handleDeletePlan(plan)}
                              />
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
        </TabsContent>

        <TabsContent value="templates" className="flex flex-col gap-4">
          <WorkTypeManagement />
        </TabsContent>

        <TabsContent value="stages" className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Этапы дорожного строительства и ремонта</CardTitle>
              <CardDescription>
                Этапы задают технологическую последовательность работ и привязку смен техники.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Этап</TableHead>
                    <TableHead>Объект</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Примечание</TableHead>
                    {canEdit && <TableHead className="w-24" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStages.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 7 : 6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Этапы дорожных работ пока не заданы
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedStages.map((stage) => (
                      <TableRow key={stage.id}>
                        <TableCell className="pl-6 font-medium">
                          {stage.name}
                        </TableCell>
                        <TableCell>{stage.siteName}</TableCell>
                        <TableCell>{ROAD_WORK_STAGE_TYPE_LABELS[stage.type]}</TableCell>
                        <TableCell className="text-sm">
                          {formatRange(stage.startDate, stage.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 ${stageStatusStyles[stage.status]}`}
                          >
                            {ROAD_WORK_STAGE_STATUS_LABELS[stage.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          <span className="line-clamp-2">
                            {stage.notes || "-"}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <IconButton
                                label="Редактировать этап"
                                icon={PencilEdit02Icon}
                                onClick={() => setEditingStage(stage)}
                              />
                              <IconButton
                                label="Удалить этап"
                                icon={Delete02Icon}
                                danger
                                onClick={() => void handleDeleteStage(stage)}
                              />
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
        </TabsContent>

        <TabsContent value="demands" className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Потребность объектов в технике</CardTitle>
              <CardDescription>
                Заявки показывают, сколько единиц конкретного типа нужно для этапа или объекта.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Объект</TableHead>
                    <TableHead>Этап</TableHead>
                    <TableHead>Тип техники</TableHead>
                    <TableHead>Нужно</TableHead>
                    <TableHead>Часы</TableHead>
                    <TableHead>Приоритет</TableHead>
                    <TableHead>Примечание</TableHead>
                    {canEdit && <TableHead className="w-24" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDemands.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canEdit ? 8 : 7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Потребности в технике пока не заданы
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedDemands.map((demand) => (
                      <TableRow key={demand.id}>
                        <TableCell className="pl-6">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">{demand.siteName}</p>
                            <p className="text-xs text-muted-foreground">
                              {demand.siteWorkType || "Вид работ не указан"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {demand.stageName ?? "Без этапа"}
                        </TableCell>
                        <TableCell>
                          {getVehicleTypeLabel(demand.vehicleType)}
                        </TableCell>
                        <TableCell>{demand.requiredCount} ед.</TableCell>
                        <TableCell>{demand.plannedHours} ч/смена</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 ${priorityStyles[demand.priority]}`}
                          >
                            {EQUIPMENT_DEMAND_PRIORITY_LABELS[demand.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          <span className="line-clamp-2">
                            {demand.notes || "-"}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <IconButton
                                label="Редактировать потребность"
                                icon={PencilEdit02Icon}
                                onClick={() => setEditingDemand(demand)}
                              />
                              <IconButton
                                label="Удалить потребность"
                                icon={Delete02Icon}
                                danger
                                onClick={() => void handleDeleteDemand(demand)}
                              />
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
        </TabsContent>

        <TabsContent value="coverage" className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Обеспеченность потребностей</CardTitle>
              <CardDescription>
                Сравнение потребности объекта с уже назначенными сменами техники.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Объект и этап</TableHead>
                    <TableHead>Тип техники</TableHead>
                    <TableHead>Нужно</TableHead>
                    <TableHead>Назначено</TableHead>
                    <TableHead>Дефицит</TableHead>
                    <TableHead>Покрытие</TableHead>
                    <TableHead>Рекомендация</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCoverage.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Нет заявок потребности для расчёта обеспеченности
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedCoverage.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="pl-6">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium">{item.siteName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.stageName ?? "Без этапа"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getVehicleTypeLabel(item.vehicleType)}</TableCell>
                        <TableCell>{item.requiredCount} ед.</TableCell>
                        <TableCell>
                          {item.assignedCount} ед. / {item.assignedPlannedHours} ч
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 ${riskStyles[item.riskLevel]}`}
                          >
                            {item.deficit}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <div className="flex flex-col gap-1">
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${item.coveragePercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.coveragePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md text-sm">
                          {item.recommendation}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Балансировка загрузки на 7 дней</CardTitle>
              <CardDescription>
                Система выделяет перегруженную технику и резерв без назначений.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {vehicleUtilization.length === 0 ? (
                <p className="text-sm text-muted-foreground">Техника не заведена</p>
              ) : (
                vehicleUtilization.slice(0, 8).map((item) => (
                  <div
                    key={item.vehicle.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.vehicle.brand} {item.vehicle.model} ·{" "}
                        {item.vehicle.plateNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getVehicleTypeLabel(item.vehicle.type)} · {item.hours} ч
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.utilization}%</Badge>
                      <Badge
                        variant="secondary"
                        className={
                          item.state === "Перегруз"
                            ? "border-0 bg-red-500/10 text-red-700 dark:text-red-300"
                            : item.state === "Недогруз"
                              ? "border-0 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                              : "border-0 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        }
                      >
                        {item.state}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Рекомендации диспетчеру</CardTitle>
              <CardDescription>
                Практические подсказки по закрытию дефицита и непрерывности работ.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {criticalDeficits.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="border-0 bg-red-500/10 text-red-700 dark:text-red-300"
                    >
                      Критично
                    </Badge>
                    <p className="text-sm font-medium">{item.siteName}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.recommendation}
                  </p>
                </div>
              ))}
              {overloadedVehicles.map((item) => (
                <div key={item.vehicle.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    Перегружена техника: {item.vehicle.brand} {item.vehicle.model}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.utilization}% загрузки за неделю. Проверьте возможность переноса смены на резерв.
                  </p>
                </div>
              ))}
              {asphaltChainRisks.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    Риск непрерывности асфальтирования
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.siteName}: не закрыта связка “подвоз смеси - укладка - уплотнение”.
                  </p>
                </div>
              ))}
              {criticalDeficits.length === 0 &&
                overloadedVehicles.length === 0 &&
                asphaltChainRisks.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Критических рекомендаций нет. Основные потребности закрыты, перегрузки не выявлены.
                  </p>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      {canEdit && (
        <>
          <PlanDialog
            key={`new-plan-${showPlanDialog ? "open" : "closed"}`}
            open={showPlanDialog}
            onOpenChange={setShowPlanDialog}
            sites={sites}
            stages={stages}
            demands={demands}
            vehicles={availableVehicles}
            onSave={handleSavePlan}
          />
          <PlanDialog
            key={`edit-plan-${editingPlan?.id ?? "closed"}`}
            open={!!editingPlan}
            onOpenChange={(open) => !open && setEditingPlan(null)}
            plan={editingPlan}
            sites={sites}
            stages={stages}
            demands={demands}
            vehicles={availableVehicles}
            onSave={handleSavePlan}
          />
          <StageDialog
            key={`new-stage-${showStageDialog ? "open" : "closed"}`}
            open={showStageDialog}
            onOpenChange={setShowStageDialog}
            sites={sites}
            onSave={handleSaveStage}
          />
          <StageDialog
            key={`edit-stage-${editingStage?.id ?? "closed"}`}
            open={!!editingStage}
            onOpenChange={(open) => !open && setEditingStage(null)}
            stage={editingStage}
            sites={sites}
            onSave={handleSaveStage}
          />
          <DemandDialog
            key={`new-demand-${showDemandDialog ? "open" : "closed"}`}
            open={showDemandDialog}
            onOpenChange={setShowDemandDialog}
            sites={sites}
            stages={stages}
            onSave={handleSaveDemand}
          />
          <DemandDialog
            key={`edit-demand-${editingDemand?.id ?? "closed"}`}
            open={!!editingDemand}
            onOpenChange={(open) => !open && setEditingDemand(null)}
            demand={editingDemand}
            sites={sites}
            stages={stages}
            onSave={handleSaveDemand}
          />
        </>
      )}
    </div>
  )
}
