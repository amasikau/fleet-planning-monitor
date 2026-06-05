"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DragDropIcon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { useRole } from "@/contexts/role-context"
import type {
  ConstructionSite,
  EquipmentCalculationKind,
  EquipmentDemandPriority,
  EquipmentPlan,
  EquipmentPlanDraft,
  FleetVehicle,
  FleetVehicleType,
  RoadWorkStage,
  RoadWorkStageType,
  RoadWorkTypeTemplate,
  ServiceEvent,
} from "@/lib/types"
import {
  EQUIPMENT_CALCULATION_KIND_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  ROAD_WORK_STAGE_TYPE_LABELS,
  SERVICE_EVENT_STATUS_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const stageTypeOptions: RoadWorkStageType[] = [
  "survey",
  "traffic_control",
  "preparation",
  "earthworks",
  "milling",
  "tack_coat",
  "base_layer",
  "material_delivery",
  "asphalt_paving",
  "compaction",
  "marking",
  "quality_control",
  "maintenance",
]

const calculationOptions: EquipmentCalculationKind[] = [
  "fixed",
  "per_km",
  "asphalt_delivery",
]

type DraftRule = {
  vehicleType: FleetVehicleType
  calculationKind: EquipmentCalculationKind
  baseCount: number
  countPerKm: number
  minCount: number
  maxCount: number | null
  plannedHours: number
  priority: EquipmentDemandPriority
  notes: string
}

type DraftStage = {
  id: string
  templateStageId?: string
  type: RoadWorkStageType
  name: string
  sequence: number
  startOffsetDays: number
  durationDays: number
  canOverlap: boolean
  notes: string
  equipmentRules: DraftRule[]
}

type StageEditorForm = {
  name: string
  type: RoadWorkStageType
  startOffsetDays: string
  durationDays: string
  vehicleType: FleetVehicleType
  calculationKind: EquipmentCalculationKind
  baseCount: string
  countPerKm: string
  priority: EquipmentDemandPriority
}

type SelectedVehicles = Record<string, string[]>

type GanttTask = {
  id: string
  name: string
  startDate: string
  endDate: string
  subtitle?: string
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value))
}

function dateKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function diffDays(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(Math.round((end.getTime() - start.getTime()) / dayMs), 0)
}

function datesBetween(startDate: string, endDate: string) {
  const result: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    result.push(dateKey(current))
    current.setDate(current.getDate() + 1)
  }

  return result
}

function vehicleLabel(vehicle: FleetVehicle) {
  return `${vehicle.brand} ${vehicle.model} · ${vehicle.plateNumber}`
}

function demandKey(stageSequence: number, vehicleType: FleetVehicleType) {
  return `${stageSequence}:${vehicleType}`
}

function planExists(stages: RoadWorkStage[], plans: EquipmentPlan[]) {
  return stages.length > 0 || plans.length > 0
}

function scaleTemplateStages(
  template: RoadWorkTypeTemplate,
  lengthKm: number
): DraftStage[] {
  const scale = Math.max(0.6, lengthKm / Math.max(template.defaultLengthKm, 0.1))

  return template.stageTemplates.map((stage, index) => ({
    id: stage.id,
    templateStageId: stage.id,
    type: stage.type,
    name: stage.name,
    sequence: index + 1,
    startOffsetDays: Math.max(0, Math.round(stage.startOffsetDays * scale)),
    durationDays: Math.max(1, Math.ceil(stage.durationDays * scale)),
    canOverlap: stage.canOverlap,
    notes: stage.notes,
    equipmentRules: stage.equipmentRules.map((rule) => ({
      vehicleType: rule.vehicleType,
      calculationKind: rule.calculationKind,
      baseCount: rule.baseCount,
      countPerKm: rule.countPerKm,
      minCount: rule.minCount,
      maxCount: rule.maxCount,
      plannedHours: rule.plannedHours,
      priority: rule.priority,
      notes: rule.notes,
    })),
  }))
}

function getStageEditorForm(stage: DraftStage | null): StageEditorForm {
  const firstRule = stage?.equipmentRules[0]

  return {
    name: stage?.name ?? "",
    type: stage?.type ?? "preparation",
    startOffsetDays: String(stage?.startOffsetDays ?? 0),
    durationDays: String(stage?.durationDays ?? 1),
    vehicleType: firstRule?.vehicleType ?? "dump_truck",
    calculationKind: firstRule?.calculationKind ?? "fixed",
    baseCount: String(firstRule?.baseCount ?? 1),
    countPerKm: String(firstRule?.countPerKm ?? 0),
    priority: firstRule?.priority ?? "normal",
  }
}

function resequenceStages(stages: DraftStage[]) {
  let offset = 0

  return stages.map((stage, index) => {
    const next = {
      ...stage,
      sequence: index + 1,
      startOffsetDays: offset,
    }
    offset += Math.max(stage.durationDays, 1)
    return next
  })
}

function getStageTasksFromDraft(startDate: string, stages: DraftStage[]) {
  return stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    startDate: addDays(startDate, stage.startOffsetDays),
    endDate: addDays(startDate, stage.startOffsetDays + stage.durationDays - 1),
    subtitle: `${ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} · ${stage.durationDays} дн.`,
  }))
}

function getStageTasksFromSaved(stages: RoadWorkStage[]) {
  return stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    startDate: stage.startDate,
    endDate: stage.endDate,
    subtitle: ROAD_WORK_STAGE_TYPE_LABELS[stage.type],
  }))
}

function getDateRange(tasks: GanttTask[]) {
  if (tasks.length === 0) return null

  const starts = tasks.map((task) => new Date(task.startDate).getTime())
  const ends = tasks.map((task) => new Date(task.endDate).getTime())
  const min = new Date(Math.min(...starts))
  const max = new Date(Math.max(...ends))
  min.setHours(0, 0, 0, 0)
  max.setHours(0, 0, 0, 0)

  return { min, max, totalDays: Math.max(diffDays(min, max) + 1, 1) }
}

function hasVehicleConflict(
  vehicleId: string,
  workDates: string[],
  plans: EquipmentPlan[],
  ignoredSiteId?: string
) {
  return plans.some(
    (plan) =>
      plan.vehicleId === vehicleId &&
      plan.status !== "failed" &&
      plan.siteId !== ignoredSiteId &&
      workDates.includes(dateKey(plan.workDate))
  )
}

function buildDefaultSelections(
  draft: EquipmentPlanDraft,
  vehicles: FleetVehicle[],
  plans: EquipmentPlan[],
  ignoredSiteId?: string
) {
  const result: SelectedVehicles = {}

  draft.stages.forEach((stage) => {
    const workDates = datesBetween(stage.startDate, stage.endDate)

    stage.demands.forEach((demand) => {
      const candidates = vehicles
        .filter(
          (vehicle) =>
            vehicle.type === demand.vehicleType &&
            vehicle.status !== "repair" &&
            !hasVehicleConflict(vehicle.id, workDates, plans, ignoredSiteId)
        )
        .sort((a, b) => {
          if (a.assignedDriver && !b.assignedDriver) return -1
          if (!a.assignedDriver && b.assignedDriver) return 1
          return vehicleLabel(a).localeCompare(vehicleLabel(b), "ru")
        })

      result[demandKey(stage.sequence, demand.vehicleType)] = candidates
        .slice(0, demand.requiredCount)
        .map((vehicle) => vehicle.id)
    })
  })

  return result
}

function GanttChart({ tasks, emptyText }: { tasks: GanttTask[]; emptyText: string }) {
  const range = useMemo(() => getDateRange(tasks), [tasks])
  const ticks = useMemo(() => {
    if (!range) return []

    return Array.from({ length: range.totalDays }, (_, index) => {
      const date = new Date(range.min)
      date.setDate(date.getDate() + index)
      return date
    })
  }, [range])

  if (!range) {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <div className="min-w-[860px] p-4">
        <div
          className="grid pl-64 text-[11px] text-muted-foreground"
          style={{
            gridTemplateColumns: `repeat(${ticks.length}, minmax(32px, 1fr))`,
          }}
        >
          {ticks.map((tick) => (
            <span key={tick.toISOString()} className="text-center">
              {formatShortDate(tick.toISOString())}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {tasks.map((task) => {
            const start = new Date(task.startDate)
            const end = new Date(task.endDate)
            const left = (diffDays(range.min, start) / range.totalDays) * 100
            const width = ((diffDays(start, end) + 1) / range.totalDays) * 100

            return (
              <div
                key={task.id}
                className="grid grid-cols-[15rem_minmax(560px,1fr)] items-center gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.subtitle}
                  </p>
                </div>
                <div className="relative h-9 rounded-md bg-muted">
                  <div
                    className="absolute top-1 h-7 rounded-md bg-primary/80"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 3)}%`,
                    }}
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

function StageEditorDialog({
  open,
  stage,
  onOpenChange,
  onSave,
}: {
  open: boolean
  stage: DraftStage | null
  onOpenChange: (open: boolean) => void
  onSave: (stage: DraftStage) => void
}) {
  const [form, setForm] = useState<StageEditorForm>(() =>
    getStageEditorForm(stage)
  )

  const handleSave = () => {
    const durationDays = Number.parseInt(form.durationDays, 10)
    const startOffsetDays = Number.parseInt(form.startOffsetDays, 10)
    const baseCount = Number.parseInt(form.baseCount, 10)
    const countPerKm = Number.parseFloat(form.countPerKm)

    if (!form.name.trim()) {
      toast.error("Укажите название этапа")
      return
    }
    if (Number.isNaN(durationDays) || durationDays < 1) {
      toast.error("Длительность этапа должна быть не меньше 1 дня")
      return
    }
    if (Number.isNaN(startOffsetDays) || startOffsetDays < 0) {
      toast.error("Смещение старта не может быть отрицательным")
      return
    }
    if (Number.isNaN(baseCount) || baseCount < 1) {
      toast.error("Количество техники должно быть не меньше 1")
      return
    }

    onSave({
      id: stage?.id ?? `custom-${crypto.randomUUID()}`,
      templateStageId: stage?.templateStageId,
      type: form.type,
      name: form.name.trim(),
      sequence: stage?.sequence ?? 1,
      startOffsetDays,
      durationDays,
      canOverlap: stage?.canOverlap ?? false,
      notes: stage?.notes ?? "Добавлено в конструкторе расчёта.",
      equipmentRules: [
        {
          vehicleType: form.vehicleType,
          calculationKind: form.calculationKind,
          baseCount,
          countPerKm: Number.isNaN(countPerKm) ? 0 : countPerKm,
          minCount: 1,
          maxCount: null,
          plannedHours: 8,
          priority: form.priority,
          notes: "",
        },
      ],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{stage ? "Изменение этапа" : "Новый этап"}</DialogTitle>
          <DialogDescription>
            Правка действует только для текущего расчёта. База шаблонов не меняется.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field className="sm:col-span-2 lg:col-span-3">
            <FieldLabel>Название этапа</FieldLabel>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Тип этапа</FieldLabel>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value as RoadWorkStageType }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ROAD_WORK_STAGE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Старт от начала, дней</FieldLabel>
            <Input
              type="number"
              min={0}
              value={form.startOffsetDays}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  startOffsetDays: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Длительность, дней</FieldLabel>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, durationDays: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Техника этапа</FieldLabel>
            <Select
              value={form.vehicleType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  vehicleType: value as FleetVehicleType,
                }))
              }
            >
              <SelectTrigger className="w-full">
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
            <FieldLabel>Метод расчёта</FieldLabel>
            <Select
              value={form.calculationKind}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  calculationKind: value as EquipmentCalculationKind,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calculationOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {EQUIPMENT_CALCULATION_KIND_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Базовое количество</FieldLabel>
            <Input
              type="number"
              min={1}
              value={form.baseCount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, baseCount: event.target.value }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Ед./км</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={form.countPerKm}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, countPerKm: event.target.value }))
              }
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Сохранить этап
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SortableStageCard({
  stage,
  index,
  onEdit,
  onDelete,
}: {
  stage: DraftStage
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-lg border bg-background p-3",
        isDragging && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <button
            type="button"
            className="mt-0.5 rounded-md border p-1 text-muted-foreground"
            {...attributes}
            {...listeners}
            aria-label="Перетащить этап"
          >
            <HugeiconsIcon icon={DragDropIcon} strokeWidth={2} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{index + 1}</Badge>
              <p className="truncate text-sm font-medium">{stage.name}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} · старт +
              {stage.startOffsetDays} дн. · {stage.durationDays} дн.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stage.equipmentRules.map((rule, ruleIndex) => (
                <Badge key={`${rule.vehicleType}-${ruleIndex}`} variant="outline">
                  {FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType]} ·{" "}
                  {EQUIPMENT_CALCULATION_KIND_LABELS[rule.calculationKind]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Изменить
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Удалить
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlanWizardDialog({
  open,
  site,
  hasExistingPlan,
  workTypes,
  vehicles,
  allPlans,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  site: ConstructionSite | null
  hasExistingPlan: boolean
  workTypes: RoadWorkTypeTemplate[]
  vehicles: FleetVehicle[]
  allPlans: EquipmentPlan[]
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  const [step, setStep] = useState(0)
  const [workTypeId, setWorkTypeId] = useState("")
  const [startDate, setStartDate] = useState(todayInput())
  const [lengthKm, setLengthKm] = useState("1")
  const [stages, setStages] = useState<DraftStage[]>([])
  const [draft, setDraft] = useState<EquipmentPlanDraft | null>(null)
  const [selectedVehicles, setSelectedVehicles] = useState<SelectedVehicles>({})
  const [stageEditorOpen, setStageEditorOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<DraftStage | null>(null)
  const [stageEditorKey, setStageEditorKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  const workType = workTypes.find((item) => item.id === workTypeId) ?? null

  useEffect(() => {
    if (!open) return
    const first = workTypes[0] ?? null
    setStep(0)
    setWorkTypeId(first?.id ?? "")
    setStartDate(todayInput())
    setLengthKm(String(first?.defaultLengthKm ?? 1))
    setStages(first ? scaleTemplateStages(first, first.defaultLengthKm) : [])
    setDraft(null)
    setSelectedVehicles({})
  }, [open, workTypes])

  const handleWorkTypeChange = (id: string) => {
    const next = workTypes.find((item) => item.id === id) ?? null
    setWorkTypeId(id)
    setLengthKm(String(next?.defaultLengthKm ?? 1))
    setStages(next ? scaleTemplateStages(next, next.defaultLengthKm) : [])
    setDraft(null)
    setSelectedVehicles({})
  }

  const handleLengthChange = (value: string) => {
    setLengthKm(value)
    if (workType) {
      setStages(scaleTemplateStages(workType, Number(value) || workType.defaultLengthKm))
    }
    setDraft(null)
    setSelectedVehicles({})
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setStages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return resequenceStages(arrayMove(items, oldIndex, newIndex))
    })
    setDraft(null)
  }

  const saveStage = (stage: DraftStage) => {
    setStages((items) => {
      const exists = items.some((item) => item.id === stage.id)
      const next = exists
        ? items.map((item) => (item.id === stage.id ? stage : item))
        : [...items, { ...stage, sequence: items.length + 1 }]
      return next.map((item, index) => ({ ...item, sequence: index + 1 }))
    })
    setDraft(null)
  }

  const openStageEditor = (stage: DraftStage | null) => {
    setEditingStage(stage)
    setStageEditorKey((value) => value + 1)
    setStageEditorOpen(true)
  }

  const buildPayload = () => ({
    siteId: site?.id ?? "",
    workTypeId,
    startDate,
    lengthKm: Number(lengthKm),
    widthM: workType?.defaultWidthM ?? 7,
    shiftHours: workType?.defaultShiftHours ?? 8,
    haulDistanceKm: workType?.defaultHaulDistanceKm ?? 12,
    stages: stages.map((stage, index) => ({
      templateStageId: stage.templateStageId,
      type: stage.type,
      name: stage.name,
      sequence: index + 1,
      startOffsetDays: stage.startOffsetDays,
      durationDays: stage.durationDays,
      canOverlap: stage.canOverlap,
      notes: stage.notes,
      equipmentRules: stage.equipmentRules,
    })),
  })

  const handleCalculate = async () => {
    if (!site || !workTypeId || stages.length === 0) {
      toast.error("Заполните исходные данные и этапы")
      return
    }

    try {
      setLoading(true)
      const result = await api.equipmentPlans.generateDraft(buildPayload())
      setDraft(result)
      setSelectedVehicles(
        buildDefaultSelections(result, vehicles, allPlans, hasExistingPlan ? site.id : undefined)
      )
      setStep(2)
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось рассчитать план"))
    } finally {
      setLoading(false)
    }
  }

  const handleFinalSave = async () => {
    if (!draft) return

    try {
      setLoading(true)
      await api.equipmentPlans.applyDraft({
        ...buildPayload(),
        createAssignments: true,
        replaceExisting: hasExistingPlan,
        selectedAssignments: Object.entries(selectedVehicles).map(
          ([key, vehicleIds]) => {
            const [stageSequence, vehicleType] = key.split(":")
            return {
              stageSequence: Number(stageSequence),
              vehicleType,
              vehicleIds,
            }
          }
        ),
      })
      toast.success("Итоговый план сохранён")
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить итоговый план"))
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = ["Исходные данные", "Этапы", "Свободная техника", "Итог"]
  const stageTasks = draft
    ? draft.stages.map((stage) => ({
        id: `${stage.sequence}`,
        name: stage.name,
        startDate: stage.startDate,
        endDate: stage.endDate,
        subtitle: `${ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} · ${stage.durationDays} дн.`,
      }))
    : getStageTasksFromDraft(startDate, stages)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Мастер планирования объекта</DialogTitle>
          <DialogDescription>
            {site?.name ?? "Выберите объект"} · пошаговый расчёт по виду работ
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 md:grid-cols-4">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className="flex items-center gap-2 rounded-md border bg-background p-3 text-left"
            >
              <Badge variant={step === index ? "default" : "secondary"}>
                {index + 1}
              </Badge>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>Вид работ</FieldLabel>
                <Select value={workTypeId} onValueChange={handleWorkTypeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите вид работ" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Дата начала</FieldLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value)
                    setDraft(null)
                  }}
                />
              </Field>
              <Field>
                <FieldLabel>Протяжённость, км</FieldLabel>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={lengthKm}
                  onChange={(event) => handleLengthChange(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">{site?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {site?.workType}
              </p>
              <Separator className="my-3" />
              <p className="text-sm font-medium">{workType?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {workType?.description}
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 xl:grid-cols-[minmax(420px,0.45fr)_minmax(0,0.55fr)]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Конструктор этапов</p>
                  <p className="text-sm text-muted-foreground">
                    Перетаскивайте этапы, меняйте длительность и требуемую технику.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openStageEditor(null)}
                >
                  Добавить этап
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map((stage) => stage.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {stages.map((stage, index) => (
                      <SortableStageCard
                        key={stage.id}
                        stage={stage}
                        index={index}
                        onEdit={() => openStageEditor(stage)}
                        onDelete={() => {
                          setStages((items) =>
                            items
                              .filter((item) => item.id !== stage.id)
                              .map((item, itemIndex) => ({
                                ...item,
                                sequence: itemIndex + 1,
                              }))
                          )
                          setDraft(null)
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Черновая диаграмма Ганта</CardTitle>
                <CardDescription>
                  Длительность этапов рассчитывается из протяжённости и шаблона вида работ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart
                  tasks={stageTasks}
                  emptyText="Добавьте этапы, чтобы увидеть график."
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {!draft ? (
              <div className="rounded-lg border p-6">
                <p className="text-sm font-medium">Расчёт ещё не выполнен</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Нажмите `Рассчитать`, чтобы получить этапы, потребность и свободную технику.
                </p>
              </div>
            ) : (
              draft.stages.map((stage) => (
                <div key={stage.sequence} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {stage.demands.map((demand) => {
                      const key = demandKey(stage.sequence, demand.vehicleType)
                      const workDates = datesBetween(stage.startDate, stage.endDate)
                      const candidates = vehicles
                        .filter(
                          (vehicle) =>
                            vehicle.type === demand.vehicleType &&
                            vehicle.status !== "repair" &&
                            !hasVehicleConflict(
                              vehicle.id,
                              workDates,
                              allPlans,
                              hasExistingPlan ? site?.id : undefined
                            )
                        )
                        .sort((a, b) => {
                          if (a.assignedDriver && !b.assignedDriver) return -1
                          if (!a.assignedDriver && b.assignedDriver) return 1
                          return vehicleLabel(a).localeCompare(vehicleLabel(b), "ru")
                        })
                      const selected = selectedVehicles[key] ?? []

                      return (
                        <div key={key} className="rounded-md bg-muted p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {FLEET_VEHICLE_TYPE_LABELS[demand.vehicleType]}
                            </p>
                            <Badge variant="secondary">
                              {selected.length}/{demand.requiredCount}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {demand.calculationNote}
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
                            {candidates.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Свободной техники этого типа нет.
                              </p>
                            ) : (
                              candidates.map((vehicle) => (
                                <label
                                  key={vehicle.id}
                                  className="flex items-start gap-3 rounded-md border bg-background p-2"
                                >
                                  <Checkbox
                                    checked={selected.includes(vehicle.id)}
                                    onCheckedChange={() => {
                                      const current = selectedVehicles[key] ?? []
                                      const exists = current.includes(vehicle.id)
                                      const next = exists
                                        ? current.filter((id) => id !== vehicle.id)
                                        : current.length < demand.requiredCount
                                          ? [...current, vehicle.id]
                                          : current

                                      if (!exists && current.length >= demand.requiredCount) {
                                        toast.warning(
                                          `Для этапа нужно ${demand.requiredCount} ед. техники`
                                        )
                                      }

                                      setSelectedVehicles((prev) => ({
                                        ...prev,
                                        [key]: next,
                                      }))
                                    }}
                                  />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium">
                                      {vehicleLabel(vehicle)}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {vehicle.assignedDriver
                                        ? vehicle.assignedDriver.fullName
                                        : "Нет закреплённого водителя"}
                                    </span>
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(340px,0.38fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Итоговый график</CardTitle>
                <CardDescription>
                  После сохранения этот план появится на объекте.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart
                  tasks={stageTasks}
                  emptyText="Расчёт ещё не выполнен."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Назначенная техника</CardTitle>
                <CardDescription>
                  Проверьте состав перед итоговым сохранением.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {!draft ? (
                  <p className="text-sm text-muted-foreground">
                    Нажмите `Рассчитать`, чтобы увидеть итог.
                  </p>
                ) : (
                  draft.stages.flatMap((stage) =>
                    stage.demands.map((demand) => {
                      const key = demandKey(stage.sequence, demand.vehicleType)
                      const selected = selectedVehicles[key] ?? []

                      return (
                        <div key={key} className="rounded-md border p-3">
                          <p className="text-sm font-medium">
                            {stage.name} · {FLEET_VEHICLE_TYPE_LABELS[demand.vehicleType]}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selected
                              .map((id) => {
                                const vehicle = vehicles.find((item) => item.id === id)
                                return vehicle ? vehicleLabel(vehicle) : null
                              })
                              .filter(Boolean)
                              .join(", ") || "Техника не выбрана"}
                          </p>
                        </div>
                      )
                    })
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((value) => Math.max(value - 1, 0))}
              disabled={step === 0}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (step === 1 && !draft) {
                  void handleCalculate()
                  return
                }
                setStep((value) => Math.min(value + 1, 3))
              }}
              disabled={step === 3}
            >
              Далее
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalculate}
              disabled={loading}
            >
              Рассчитать
            </Button>
            <Button size="sm" onClick={handleFinalSave} disabled={!draft || loading}>
              Спланировать итогово
            </Button>
          </div>
        </DialogFooter>

        <StageEditorDialog
          key={stageEditorKey}
          open={stageEditorOpen}
          stage={editingStage}
          onOpenChange={setStageEditorOpen}
          onSave={saveStage}
        />
      </DialogContent>
    </Dialog>
  )
}

function ObjectSidebar({
  sites,
  selectedSiteId,
  stagesBySite,
  onSelect,
}: {
  sites: ConstructionSite[]
  selectedSiteId: string
  stagesBySite: Map<string, number>
  onSelect: (siteId: string) => void
}) {
  return (
    <ScrollArea className="h-[calc(100vh-13rem)]">
      <div className="flex flex-col gap-2 pr-3">
        {sites.map((site) => {
          const count = stagesBySite.get(site.id) ?? 0

          return (
            <button
              key={site.id}
              type="button"
              onClick={() => onSelect(site.id)}
              className={cn(
                "rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted",
                selectedSiteId === site.id && "border-primary bg-muted"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{site.name}</p>
                <Badge variant={count > 0 ? "default" : "secondary"}>
                  {count > 0 ? "План" : "Нет"}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {site.workType || site.address}
              </p>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function SavedPlanView({
  site,
  stages,
  plans,
  serviceEvents,
  onPlanClick,
}: {
  site: ConstructionSite
  stages: RoadWorkStage[]
  plans: EquipmentPlan[]
  serviceEvents: ServiceEvent[]
  onPlanClick: () => void
}) {
  const tasks = getStageTasksFromSaved(stages)
  const plannedVehicleIds = new Set(plans.map((plan) => plan.vehicleId))
  const range = getDateRange(tasks)
  const serviceRisks = serviceEvents.filter((event) => {
    if (event.status === "completed") return false
    if (!plannedVehicleIds.has(event.vehicleId)) return false
    if (event.status === "in_progress" || event.status === "overdue") return true
    if (!event.dueAt || !range) return event.type === "repair"

    const dueAt = new Date(event.dueAt)
    const dayMs = 24 * 60 * 60 * 1000
    return (
      dueAt >= new Date(range.min.getTime() - 3 * dayMs) &&
      dueAt <= new Date(range.max.getTime() + 3 * dayMs)
    )
  })

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{site.name}</CardTitle>
          <CardDescription>
            План по объекту ещё не создан.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={onPlanClick}>
            Спланировать
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{site.name}</CardTitle>
            <CardDescription>
              {site.workType} · {plans.length} смен техники
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onPlanClick}>
            Перерассчитать
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Диаграмма Ганта по этапам</p>
            <p className="text-xs text-muted-foreground">
              Сроки этапов объекта и пересечения работ на общей временной шкале.
            </p>
          </div>
          <GanttChart tasks={tasks} emptyText="План по объекту ещё не создан." />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.6fr)_minmax(340px,0.4fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Назначения техники</CardTitle>
            <CardDescription>
              Смены, созданные итоговым планированием.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Дата</TableHead>
                  <TableHead>Этап</TableHead>
                  <TableHead>Техника</TableHead>
                  <TableHead>Часы</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="pl-6">{formatDate(plan.workDate)}</TableCell>
                    <TableCell>{plan.stageName ?? "Без этапа"}</TableCell>
                    <TableCell>{plan.vehicleLabel}</TableCell>
                    <TableCell>{plan.plannedHours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Риски</CardTitle>
            <CardDescription>
              ТО, ремонты и заявки сервиса по технике плана.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {serviceRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Активных сервисных рисков по назначенной технике нет.
              </p>
            ) : (
              serviceRisks.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{event.vehicleLabel}</p>
                    <Badge variant="secondary">
                      {SERVICE_EVENT_STATUS_LABELS[event.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {SERVICE_EVENT_TYPE_LABELS[event.type]} · {event.title}
                    {event.dueAt ? ` · ${formatDate(event.dueAt)}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function WorkTypeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [lengthKm, setLengthKm] = useState("1")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Укажите название вида работ")
      return
    }

    try {
      setSaving(true)
      await api.equipmentPlans.createWorkType({
        name: name.trim(),
        code:
          code.trim() ||
          name
            .trim()
            .toLowerCase()
            .replace(/[^a-zа-яё0-9]+/gi, "_")
            .replace(/^_+|_+$/g, ""),
        defaultLengthKm: Number(lengthKm),
        defaultWidthM: 7,
        defaultShiftHours: 8,
        defaultHaulDistanceKm: 12,
        productionRateMPerDay: 500,
        description: "Пользовательский вид работ для планирования техники.",
        sourceNote: "Добавлено в базе видов работ.",
      })
      toast.success("Вид работ добавлен")
      setName("")
      setCode("")
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось добавить вид работ"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый вид работ</DialogTitle>
          <DialogDescription>
            Вид работ используется как база для мастера планирования.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Название</FieldLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Типовая протяжённость, км</FieldLabel>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={lengthKm}
              onChange={(event) => setLengthKm(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StageTemplateDialog({
  open,
  workTypes,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  workTypes: RoadWorkTypeTemplate[]
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  const [workTypeId, setWorkTypeId] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<RoadWorkStageType>("preparation")
  const [durationDays, setDurationDays] = useState("1")
  const [vehicleType, setVehicleType] = useState<FleetVehicleType>("dump_truck")
  const [calculationKind, setCalculationKind] =
    useState<EquipmentCalculationKind>("fixed")
  const [baseCount, setBaseCount] = useState("1")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && !workTypeId && workTypes[0]) setWorkTypeId(workTypes[0].id)
  }, [open, workTypeId, workTypes])

  const handleSave = async () => {
    const workType = workTypes.find((item) => item.id === workTypeId)
    if (!workType) {
      toast.error("Выберите вид работ")
      return
    }
    if (!name.trim()) {
      toast.error("Укажите название этапа")
      return
    }

    try {
      setSaving(true)
      await api.equipmentPlans.createStageTemplate(workTypeId, {
        name: name.trim(),
        type,
        sequence: workType.stageTemplates.length + 1,
        startOffsetDays: workType.stageTemplates.length,
        durationDays: Number(durationDays),
        canOverlap: false,
        notes: "Добавлено в базе этапов.",
        equipmentRules: [
          {
            vehicleType,
            calculationKind,
            baseCount: Number(baseCount),
            countPerKm: 0,
            minCount: 1,
            plannedHours: 8,
            priority: "normal",
            notes: "",
          },
        ],
      })
      toast.success("Этап добавлен")
      setName("")
      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось добавить этап"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый этап в базе</DialogTitle>
          <DialogDescription>
            Этап будет предлагаться в мастере выбранного вида работ.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel>Вид работ</FieldLabel>
            <Select value={workTypeId} onValueChange={setWorkTypeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите вид работ" />
              </SelectTrigger>
              <SelectContent>
                {workTypes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Название этапа</FieldLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Тип этапа</FieldLabel>
            <Select
              value={type}
              onValueChange={(value) => setType(value as RoadWorkStageType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stageTypeOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROAD_WORK_STAGE_TYPE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Длительность, дней</FieldLabel>
            <Input
              type="number"
              min={1}
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Техника</FieldLabel>
            <Select
              value={vehicleType}
              onValueChange={(value) => setVehicleType(value as FleetVehicleType)}
            >
              <SelectTrigger className="w-full">
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
            <FieldLabel>Метод расчёта</FieldLabel>
            <Select
              value={calculationKind}
              onValueChange={(value) =>
                setCalculationKind(value as EquipmentCalculationKind)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calculationOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {EQUIPMENT_CALCULATION_KIND_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Базовое количество</FieldLabel>
            <Input
              type="number"
              min={1}
              value={baseCount}
              onChange={(event) => setBaseCount(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PlanningPage() {
  const { canEdit } = useRole()
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [workTypes, setWorkTypes] = useState<RoadWorkTypeTemplate[]>([])
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [stages, setStages] = useState<RoadWorkStage[]>([])
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [planningOpen, setPlanningOpen] = useState(false)
  const [workTypeDialogOpen, setWorkTypeDialogOpen] = useState(false)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [
        sitesData,
        workTypesData,
        plansData,
        stagesData,
        vehiclesData,
        serviceEventsData,
      ] = await Promise.all([
        api.sites.getAll(),
        api.equipmentPlans.getWorkTypes(),
        api.equipmentPlans.getAll(),
        api.equipmentPlans.getStages(),
        api.fleet.getAll(),
        api.serviceEvents.getAll(),
      ])
      setSites(sitesData)
      setWorkTypes(workTypesData)
      setPlans(plansData)
      setStages(stagesData)
      setVehicles(vehiclesData)
      setServiceEvents(serviceEventsData)
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить планирование"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const selectedSite =
    sites.find((site) => site.id === selectedSiteId) ?? null
  const selectedStages = stages.filter((stage) => stage.siteId === selectedSiteId)
  const selectedPlans = plans.filter((plan) => plan.siteId === selectedSiteId)
  const hasSelectedPlan = planExists(selectedStages, selectedPlans)
  const stagesBySite = useMemo(() => {
    const map = new Map<string, number>()
    stages.forEach((stage) => map.set(stage.siteId, (map.get(stage.siteId) ?? 0) + 1))
    return map
  }, [stages])

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
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Планы, графики и база работ</h1>
        <p className="text-sm text-muted-foreground">
          Планирование начинается с выбора объекта, затем мастер строит этапы, технику и итоговый график.
        </p>
      </div>

      <Tabs defaultValue="plans" className="px-4 lg:px-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="plans">Планы</TabsTrigger>
          <TabsTrigger value="work-types">Виды работ</TabsTrigger>
          <TabsTrigger value="stages">Этапы</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-12rem)] rounded-lg border"
          >
            <ResizablePanel defaultSize="28%" minSize="20%" maxSize="38%">
              <div className="flex h-full flex-col gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">Дорожные объекты</p>
                  <p className="text-xs text-muted-foreground">
                    Выберите объект, чтобы открыть его план.
                  </p>
                </div>
                <ObjectSidebar
                  sites={sites}
                  selectedSiteId={selectedSiteId}
                  stagesBySite={stagesBySite}
                  onSelect={setSelectedSiteId}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="72%">
              <div className="h-full p-4">
                {!selectedSite ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Объект не выбран</CardTitle>
                      <CardDescription>
                        Слева выберите объект. До выбора объекта графики не отображаются.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <SavedPlanView
                    site={selectedSite}
                    stages={selectedStages}
                    plans={selectedPlans}
                    serviceEvents={serviceEvents}
                    onPlanClick={() => setPlanningOpen(true)}
                  />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </TabsContent>

        <TabsContent value="work-types">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>База видов работ</CardTitle>
                <CardDescription>
                  Вид работ хранит типовые параметры и набор этапов.
                </CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" onClick={() => setWorkTypeDialogOpen(true)}>
                  <HugeiconsIcon
                    icon={PlusSignCircleIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Вид работ
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              {workTypes.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    <Badge variant="secondary">
                      {item.stageTemplates.length} этапов
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Типовая протяжённость: {item.defaultLengthKm} км · смена{" "}
                    {item.defaultShiftHours} ч
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stages">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>База этапов</CardTitle>
                <CardDescription>
                  Этапы привязаны к виду работ и содержат правила потребности в технике.
                </CardDescription>
              </div>
              {canEdit && (
                <Button size="sm" onClick={() => setStageDialogOpen(true)}>
                  <HugeiconsIcon
                    icon={PlusSignCircleIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Этап
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {workTypes.map((workType) => (
                <div key={workType.id} className="rounded-lg border">
                  <div className="border-b p-4">
                    <p className="text-sm font-medium">{workType.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {workType.stageTemplates.length} этапов в шаблоне
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Этап</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Дней</TableHead>
                        <TableHead>Техника</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workType.stageTemplates.map((stage) => (
                        <TableRow key={stage.id}>
                          <TableCell className="pl-4 font-medium">
                            {stage.name}
                          </TableCell>
                          <TableCell>
                            {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]}
                          </TableCell>
                          <TableCell>{stage.durationDays}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {stage.equipmentRules.map((rule) => (
                                <Badge key={rule.id} variant="outline">
                                  {FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PlanWizardDialog
        open={planningOpen}
        site={selectedSite}
        hasExistingPlan={hasSelectedPlan}
        workTypes={workTypes}
        vehicles={vehicles}
        allPlans={plans}
        onOpenChange={setPlanningOpen}
        onSaved={fetchData}
      />
      <WorkTypeDialog
        open={workTypeDialogOpen}
        onOpenChange={setWorkTypeDialogOpen}
        onSaved={fetchData}
      />
      <StageTemplateDialog
        open={stageDialogOpen}
        workTypes={workTypes}
        onOpenChange={setStageDialogOpen}
        onSaved={fetchData}
      />
    </div>
  )
}
