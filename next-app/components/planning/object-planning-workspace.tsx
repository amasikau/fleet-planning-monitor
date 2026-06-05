"use client"

import { useEffect, useMemo, useState } from "react"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type {
  ConstructionSite,
  EquipmentCalculationKind,
  EquipmentCoverageItem,
  EquipmentDemand,
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
  EQUIPMENT_DEMAND_PRIORITY_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  ROAD_WORK_STAGE_TYPE_LABELS,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

import { EngineeringPlanningBoard } from "./engineering-planning-board"

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

type WizardRule = {
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

type WizardStage = {
  templateStageId?: string
  type: RoadWorkStageType
  name: string
  sequence: number
  startOffsetDays: number
  durationDays: number
  canOverlap: boolean
  notes: string
  equipmentRules: WizardRule[]
}

type StageForm = {
  type: RoadWorkStageType
  name: string
  startOffsetDays: string
  durationDays: string
  vehicleType: FleetVehicleType
  calculationKind: EquipmentCalculationKind
  baseCount: string
  countPerKm: string
  priority: EquipmentDemandPriority
}

type SelectedVehicles = Record<string, string[]>

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function toDateKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function dateKeysBetween(startDate: string, endDate: string) {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    dates.push(toDateKey(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function buildStagesFromTemplate(template: RoadWorkTypeTemplate | null) {
  if (!template) return []

  return template.stageTemplates.map((stage) => ({
    templateStageId: stage.id,
    type: stage.type,
    name: stage.name,
    sequence: stage.sequence,
    startOffsetDays: stage.startOffsetDays,
    durationDays: stage.durationDays,
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

function createStageForm(stage?: WizardStage | null): StageForm {
  const firstRule = stage?.equipmentRules[0]

  return {
    type: stage?.type ?? "preparation",
    name: stage?.name ?? "",
    startOffsetDays: String(stage?.startOffsetDays ?? 0),
    durationDays: String(stage?.durationDays ?? 1),
    vehicleType: firstRule?.vehicleType ?? "dump_truck",
    calculationKind: firstRule?.calculationKind ?? "fixed",
    baseCount: String(firstRule?.baseCount ?? 1),
    countPerKm: String(firstRule?.countPerKm ?? 0),
    priority: firstRule?.priority ?? "normal",
  }
}

function makeDemandKey(stageSequence: number, vehicleType: FleetVehicleType) {
  return `${stageSequence}:${vehicleType}`
}

function vehicleLabel(vehicle: FleetVehicle) {
  return `${vehicle.brand} ${vehicle.model} · ${vehicle.plateNumber}`
}

function stageHasExistingPlan(stages: RoadWorkStage[], plans: EquipmentPlan[]) {
  return stages.length > 0 || plans.length > 0
}

function hasConflictForDates(
  vehicleId: string,
  dateKeys: string[],
  plans: EquipmentPlan[]
) {
  return plans.some(
    (plan) =>
      plan.vehicleId === vehicleId &&
      plan.status !== "failed" &&
      dateKeys.includes(toDateKey(plan.workDate))
  )
}

function buildDefaultSelections(
  draft: EquipmentPlanDraft,
  vehicles: FleetVehicle[],
  existingPlans: EquipmentPlan[]
): SelectedVehicles {
  const result: SelectedVehicles = {}

  draft.stages.forEach((stage) => {
    const dateKeys = dateKeysBetween(stage.startDate, stage.endDate)

    stage.demands.forEach((demand) => {
      const candidates = vehicles
        .filter(
          (vehicle) =>
            vehicle.type === demand.vehicleType &&
            vehicle.status !== "repair" &&
            !hasConflictForDates(vehicle.id, dateKeys, existingPlans)
        )
        .sort((a, b) => {
          if (a.assignedDriver && !b.assignedDriver) return -1
          if (!a.assignedDriver && b.assignedDriver) return 1
          return vehicleLabel(a).localeCompare(vehicleLabel(b), "ru")
        })

      result[makeDemandKey(stage.sequence, demand.vehicleType)] = candidates
        .slice(0, demand.requiredCount)
        .map((vehicle) => vehicle.id)
    })
  })

  return result
}

function StageDialog({
  open,
  stage,
  onOpenChange,
  onSave,
}: {
  open: boolean
  stage?: WizardStage | null
  onOpenChange: (open: boolean) => void
  onSave: (stage: Omit<WizardStage, "sequence">) => void
}) {
  const [form, setForm] = useState<StageForm>(() => createStageForm(stage))

  useEffect(() => {
    if (open) setForm(createStageForm(stage))
  }, [open, stage])

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
      toast.error("Смещение от начала не может быть отрицательным")
      return
    }
    if (Number.isNaN(baseCount) || baseCount < 1) {
      toast.error("Количество техники должно быть не меньше 1")
      return
    }

    onSave({
      templateStageId: stage?.templateStageId,
      type: form.type,
      name: form.name.trim(),
      startOffsetDays,
      durationDays,
      canOverlap: stage?.canOverlap ?? false,
      notes: stage?.notes ?? "Изменено в конструкторе плана.",
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
            Изменения применяются только к текущему расчёту. Шаблон вида работ в базе не меняется.
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
                setForm((prev) => ({
                  ...prev,
                  type: value as RoadWorkStageType,
                }))
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
                setForm((prev) => ({
                  ...prev,
                  durationDays: event.target.value,
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel>Требуемая техника</FieldLabel>
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
                setForm((prev) => ({
                  ...prev,
                  baseCount: event.target.value,
                }))
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
                setForm((prev) => ({
                  ...prev,
                  countPerKm: event.target.value,
                }))
              }
            />
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
              <SelectTrigger className="w-full">
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

function PlanningConstructorDialog({
  open,
  site,
  sitesPlans,
  vehicles,
  canEdit,
  onOpenChange,
  onApplied,
}: {
  open: boolean
  site: ConstructionSite | null
  sitesPlans: EquipmentPlan[]
  vehicles: FleetVehicle[]
  canEdit: boolean
  onOpenChange: (open: boolean) => void
  onApplied: () => Promise<void> | void
}) {
  const [workTypes, setWorkTypes] = useState<RoadWorkTypeTemplate[]>([])
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState("")
  const [startDate, setStartDate] = useState(todayInput())
  const [lengthKm, setLengthKm] = useState("1")
  const [widthM, setWidthM] = useState("7")
  const [haulDistanceKm, setHaulDistanceKm] = useState("12")
  const [stages, setStages] = useState<WizardStage[]>([])
  const [draft, setDraft] = useState<EquipmentPlanDraft | null>(null)
  const [selectedVehicles, setSelectedVehicles] = useState<SelectedVehicles>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null)
  const [addingStage, setAddingStage] = useState(false)

  const selectedWorkType = workTypes.find(
    (template) => template.id === selectedWorkTypeId
  )

  useEffect(() => {
    if (!open) return

    api.equipmentPlans
      .getWorkTypes()
      .then((items) => {
        setWorkTypes(items)
        const first = items[0]
        if (!first) return

        setSelectedWorkTypeId(first.id)
        setLengthKm(String(first.defaultLengthKm))
        setWidthM(String(first.defaultWidthM))
        setHaulDistanceKm(String(first.defaultHaulDistanceKm))
        setStages(buildStagesFromTemplate(first))
        setDraft(null)
        setSelectedVehicles({})
        setCurrentStep(0)
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error, "Не удалось загрузить виды работ"))
      })
  }, [open])

  const handleWorkTypeChange = (id: string) => {
    const template = workTypes.find((item) => item.id === id) ?? null
    setSelectedWorkTypeId(id)
    setDraft(null)
    setSelectedVehicles({})

    if (template) {
      setLengthKm(String(template.defaultLengthKm))
      setWidthM(String(template.defaultWidthM))
      setHaulDistanceKm(String(template.defaultHaulDistanceKm))
      setStages(buildStagesFromTemplate(template))
    }
  }

  const payload = () => ({
    siteId: site?.id ?? "",
    workTypeId: selectedWorkTypeId,
    startDate,
    lengthKm: Number(lengthKm),
    widthM: Number(widthM),
    shiftHours: 8,
    haulDistanceKm: Number(haulDistanceKm),
    stages: stages.map((stage, index) => ({
      ...stage,
      sequence: index + 1,
    })),
  })

  const handleGenerate = async () => {
    if (!site || !selectedWorkTypeId || stages.length === 0) {
      toast.error("Выберите объект, вид работ и этапы")
      return
    }

    try {
      setLoading(true)
      const result = await api.equipmentPlans.generateDraft(payload())
      setDraft(result)
      setSelectedVehicles(buildDefaultSelections(result, vehicles, sitesPlans))
      setCurrentStep(2)
      toast.success("Расчёт выполнен, выберите свободную технику")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось рассчитать план"))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return

    try {
      setLoading(true)
      await api.equipmentPlans.applyDraft({
        ...payload(),
        createAssignments: true,
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
      toast.success("План объекта сохранён")
      onOpenChange(false)
      await onApplied()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить план"))
    } finally {
      setLoading(false)
    }
  }

  const saveStage = (stage: Omit<WizardStage, "sequence">) => {
    setDraft(null)
    setSelectedVehicles({})

    if (addingStage) {
      setStages((prev) => [
        ...prev,
        {
          ...stage,
          sequence: prev.length + 1,
        },
      ])
      setAddingStage(false)
      return
    }

    if (editingStageIndex == null) return
    setStages((prev) =>
      prev.map((item, index) =>
        index === editingStageIndex
          ? {
              ...stage,
              sequence: index + 1,
            }
          : item
      )
    )
    setEditingStageIndex(null)
  }

  const toggleVehicle = (
    key: string,
    vehicleId: string,
    requiredCount: number
  ) => {
    setSelectedVehicles((prev) => {
      const current = prev[key] ?? []
      const exists = current.includes(vehicleId)
      const next = exists
        ? current.filter((id) => id !== vehicleId)
        : current.length < requiredCount
          ? [...current, vehicleId]
          : current

      if (!exists && current.length >= requiredCount) {
        toast.warning(`Для этой потребности нужно ${requiredCount} ед. техники`)
      }

      return {
        ...prev,
        [key]: next,
      }
    })
  }

  const stepLabels = ["Параметры", "Этапы", "Техника", "Сохранение"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Расчёт плана-графика объекта</DialogTitle>
          <DialogDescription>
            {site
              ? site.name
              : "Выберите объект перед запуском конструктора планирования."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-4">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentStep(index)}
              className="flex items-center gap-2 rounded-md border bg-background p-3 text-left"
            >
              <Badge variant={currentStep === index ? "default" : "secondary"}>
                {index + 1}
              </Badge>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {currentStep === 0 && (
          <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field className="md:col-span-2">
              <FieldLabel>Вид работ</FieldLabel>
              <Select
                value={selectedWorkTypeId}
                onValueChange={handleWorkTypeChange}
              >
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
                onChange={(event) => {
                  setLengthKm(event.target.value)
                  setDraft(null)
                }}
              />
            </Field>
            <Field>
              <FieldLabel>Ширина, м</FieldLabel>
              <Input
                type="number"
                min={1}
                step={0.5}
                value={widthM}
                onChange={(event) => {
                  setWidthM(event.target.value)
                  setDraft(null)
                }}
              />
            </Field>
            <Field>
              <FieldLabel>Плечо доставки, км</FieldLabel>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={haulDistanceKm}
                onChange={(event) => {
                  setHaulDistanceKm(event.target.value)
                  setDraft(null)
                }}
              />
            </Field>
            {selectedWorkType && (
              <div className="rounded-lg border p-3 md:col-span-2 xl:col-span-4">
                <p className="text-sm font-medium">{selectedWorkType.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedWorkType.description}
                </p>
              </div>
            )}
          </FieldGroup>
        )}

        {currentStep === 1 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Конструктор этапов</p>
                <p className="text-sm text-muted-foreground">
                  Эти изменения действуют только внутри текущего расчёта.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddingStage(true)
                  setEditingStageIndex(null)
                }}
              >
                Добавить этап
              </Button>
            </div>

            {stages.map((stage, index) => (
              <div key={`${stage.name}-${index}`} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <p className="text-sm font-medium">{stage.name}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} · старт +
                      {stage.startOffsetDays} дн. · {stage.durationDays} дн.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingStageIndex(index)
                        setAddingStage(false)
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStages((prev) =>
                          prev
                            .filter((_, itemIndex) => itemIndex !== index)
                            .map((item, itemIndex) => ({
                              ...item,
                              sequence: itemIndex + 1,
                            }))
                        )
                        setDraft(null)
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stage.equipmentRules.map((rule, ruleIndex) => (
                    <Badge key={`${rule.vehicleType}-${ruleIndex}`} variant="outline">
                      {FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType]} ·{" "}
                      {EQUIPMENT_CALCULATION_KIND_LABELS[rule.calculationKind]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-4">
            {!draft ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Сначала выполните расчёт</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  После расчёта здесь появится свободная техника по каждому этапу и типу.
                </p>
              </div>
            ) : (
              draft.stages.map((stage) => (
                <div key={stage.sequence} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium">{stage.name}</p>
                    <Badge variant="secondary">
                      {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {stage.demands.map((demand) => {
                      const key = makeDemandKey(
                        stage.sequence,
                        demand.vehicleType
                      )
                      const dateKeys = dateKeysBetween(
                        stage.startDate,
                        stage.endDate
                      )
                      const candidates = vehicles
                        .filter(
                          (vehicle) =>
                            vehicle.type === demand.vehicleType &&
                            vehicle.status !== "repair" &&
                            !hasConflictForDates(vehicle.id, dateKeys, sitesPlans)
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
                              выбрано {selected.length}/{demand.requiredCount}
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
                                    onCheckedChange={() =>
                                      toggleVehicle(
                                        key,
                                        vehicle.id,
                                        demand.requiredCount
                                      )
                                    }
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

        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            {!draft ? (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Выполните расчёт и назначьте технику перед сохранением.
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{draft.summary.totalStages}</p>
                    <p className="text-sm text-muted-foreground">этапов</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">
                      {draft.summary.totalRequiredUnits}
                    </p>
                    <p className="text-sm text-muted-foreground">ед. техники</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">
                      {draft.summary.plannedAssignments}
                    </p>
                    <p className="text-sm text-muted-foreground">смен</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">
                      {draft.summary.criticalRisks}
                    </p>
                    <p className="text-sm text-muted-foreground">рисков</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {draft.stages.map((stage) => (
                    <div key={stage.sequence} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium">{stage.name}</p>
                        <Badge variant="secondary">
                          {formatDate(stage.startDate)} - {formatDate(stage.endDate)}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid gap-2 md:grid-cols-2">
                        {stage.demands.map((demand) => {
                          const key = makeDemandKey(
                            stage.sequence,
                            demand.vehicleType
                          )
                          const selected = selectedVehicles[key] ?? []

                          return (
                            <div key={key} className="rounded-md bg-muted p-3">
                              <p className="text-sm font-medium">
                                {FLEET_VEHICLE_TYPE_LABELS[demand.vehicleType]} ·{" "}
                                {selected.length}/{demand.requiredCount} ед.
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {selected
                                  .map((id) => {
                                    const vehicle = vehicles.find(
                                      (item) => item.id === id
                                    )
                                    return vehicle ? vehicleLabel(vehicle) : null
                                  })
                                  .filter(Boolean)
                                  .join(", ") || "Техника не выбрана"}
                              </p>
                              {demand.risks.length > 0 && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {demand.risks.join(" ")}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
              disabled={currentStep === 0}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 3))}
              disabled={currentStep === 3}
            >
              Далее
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={!canEdit || loading}
            >
              Рассчитать
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!draft || loading}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>

        <StageDialog
          open={editingStageIndex != null || addingStage}
          stage={editingStageIndex != null ? stages[editingStageIndex] : null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setEditingStageIndex(null)
              setAddingStage(false)
            }
          }}
          onSave={saveStage}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ObjectPlanningWorkspace({
  sites,
  selectedSiteId,
  onSelectedSiteChange,
  stages,
  demands,
  plans,
  coverage,
  vehicles,
  serviceEvents,
  canEdit,
  onApplied,
}: {
  sites: ConstructionSite[]
  selectedSiteId: string
  onSelectedSiteChange: (siteId: string) => void
  stages: RoadWorkStage[]
  demands: EquipmentDemand[]
  plans: EquipmentPlan[]
  coverage: EquipmentCoverageItem[]
  vehicles: FleetVehicle[]
  serviceEvents: ServiceEvent[]
  canEdit: boolean
  onApplied: () => Promise<void> | void
}) {
  const [constructorOpen, setConstructorOpen] = useState(false)
  const selectedSite =
    sites.find((site) => site.id === selectedSiteId) ?? null
  const hasPlan = stageHasExistingPlan(stages, plans)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Планы и графики объекта</CardTitle>
              <CardDescription>
                Выберите дорожный объект, чтобы увидеть сохранённый график Ганта, назначения техники и риски.
              </CardDescription>
            </div>
            {selectedSite && canEdit && (
              <Button size="sm" onClick={() => setConstructorOpen(true)}>
                {hasPlan ? "Перерассчитать" : "Рассчитать"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Дорожный объект</FieldLabel>
            <Select
              value={selectedSiteId || undefined}
              onValueChange={onSelectedSiteChange}
            >
              <SelectTrigger className="w-full md:max-w-xl">
                <SelectValue placeholder="Выберите объект из списка" />
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

          {!selectedSite ? (
            <div className="rounded-lg border p-6 text-sm text-muted-foreground">
              График не отображается, пока не выбран объект.
            </div>
          ) : !hasPlan ? (
            <div className="rounded-lg border p-6">
              <p className="text-sm font-medium">План по объекту ещё не рассчитан</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Запустите расчёт, чтобы выбрать вид работ, протяжённость, дату начала, этапы и свободную технику.
              </p>
              {canEdit && (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setConstructorOpen(true)}
                >
                  Рассчитать
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{stages.length}</p>
                <p className="text-sm text-muted-foreground">этапов</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{plans.length}</p>
                <p className="text-sm text-muted-foreground">смен техники</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">{demands.length}</p>
                <p className="text-sm text-muted-foreground">потребностей</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">
                  {coverage.filter((item) => item.deficit > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">дефицитов</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSite && hasPlan && (
        <EngineeringPlanningBoard
          stages={stages}
          demands={demands}
          plans={plans}
          coverage={coverage}
          serviceEvents={serviceEvents}
        />
      )}

      <PlanningConstructorDialog
        open={constructorOpen}
        site={selectedSite}
        sitesPlans={plans}
        vehicles={vehicles}
        canEdit={canEdit}
        onOpenChange={setConstructorOpen}
        onApplied={onApplied}
      />
    </div>
  )
}
