"use client"

import { useEffect, useMemo, useState } from "react"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type {
  ConstructionSite,
  EquipmentCalculationKind,
  EquipmentDemandPriority,
  EquipmentPlanDraft,
  FleetVehicleType,
  RoadWorkStageType,
  RoadWorkTypeTemplate,
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

const priorityStyles: Record<EquipmentDemandPriority, string> = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const riskStyles: Record<EquipmentPlanDraft["stages"][number]["demands"][number]["riskLevel"], string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "bg-red-500/10 text-red-700 dark:text-red-300",
}

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

type NewStageForm = {
  type: RoadWorkStageType
  name: string
  durationDays: string
  vehicleType: FleetVehicleType
  calculationKind: EquipmentCalculationKind
  baseCount: string
}

function todayInput() {
  return new Date().toISOString().slice(0, 10)
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function StepIndicator({
  currentStep,
  onStepChange,
}: {
  currentStep: number
  onStepChange: (step: number) => void
}) {
  const steps = ["Объект", "Параметры", "Этапы", "Расчёт"]

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => (
        <button
          key={step}
          type="button"
          onClick={() => onStepChange(index)}
          className="flex items-center gap-2 rounded-md border bg-background p-3 text-left"
        >
          <Badge variant={index === currentStep ? "default" : "secondary"}>
            {index + 1}
          </Badge>
          <span className="text-sm font-medium">{step}</span>
        </button>
      ))}
    </div>
  )
}

function AddStageDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (stage: Omit<WizardStage, "sequence" | "startOffsetDays">) => void
}) {
  const [form, setForm] = useState<NewStageForm>({
    type: "preparation",
    name: "",
    durationDays: "1",
    vehicleType: "dump_truck",
    calculationKind: "fixed",
    baseCount: "1",
  })

  const handleAdd = () => {
    const durationDays = Number.parseInt(form.durationDays, 10)
    const baseCount = Number.parseInt(form.baseCount, 10)

    if (!form.name.trim()) {
      toast.error("Укажите название этапа")
      return
    }
    if (Number.isNaN(durationDays) || durationDays < 1) {
      toast.error("Длительность этапа должна быть не меньше 1 дня")
      return
    }
    if (Number.isNaN(baseCount) || baseCount < 1) {
      toast.error("Количество техники должно быть не меньше 1")
      return
    }

    onAdd({
      type: form.type,
      name: form.name.trim(),
      durationDays,
      canOverlap: false,
      notes: "Добавлено вручную в мастере планирования.",
      equipmentRules: [
        {
          vehicleType: form.vehicleType,
          calculationKind: form.calculationKind,
          baseCount,
          countPerKm: 0,
          minCount: 1,
          maxCount: null,
          plannedHours: 8,
          priority: "normal",
          notes: "",
        },
      ],
    })
    setForm((prev) => ({ ...prev, name: "" }))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавление этапа в план</DialogTitle>
          <DialogDescription>
            Этап попадёт в черновик расчёта и будет создан при применении плана.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Название этапа</FieldLabel>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Например, устройство обочин"
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
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleAdd}>
            Добавить этап
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PlanningStepWizard({
  sites,
  canEdit,
  onApplied,
}: {
  sites: ConstructionSite[]
  canEdit: boolean
  onApplied: () => Promise<void> | void
}) {
  const [workTypes, setWorkTypes] = useState<RoadWorkTypeTemplate[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState("")
  const [startDate, setStartDate] = useState(todayInput())
  const [lengthKm, setLengthKm] = useState("1")
  const [widthM, setWidthM] = useState("7")
  const [shiftHours, setShiftHours] = useState("8")
  const [haulDistanceKm, setHaulDistanceKm] = useState("12")
  const [stages, setStages] = useState<WizardStage[]>([])
  const [draft, setDraft] = useState<EquipmentPlanDraft | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)

  useEffect(() => {
    api.equipmentPlans
      .getWorkTypes()
      .then((items) => {
        setWorkTypes(items)
        const first = items[0]
        if (first) {
          setSelectedWorkTypeId(first.id)
          setLengthKm(String(first.defaultLengthKm))
          setWidthM(String(first.defaultWidthM))
          setShiftHours(String(first.defaultShiftHours))
          setHaulDistanceKm(String(first.defaultHaulDistanceKm))
          setStages(buildStagesFromTemplate(first))
        }
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error, "Не удалось загрузить виды работ"))
      })
  }, [])

  const selectedWorkType = useMemo(
    () => workTypes.find((item) => item.id === selectedWorkTypeId) ?? null,
    [selectedWorkTypeId, workTypes]
  )

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [selectedSiteId, sites]
  )

  const canGenerate =
    canEdit &&
    selectedSiteId &&
    selectedWorkTypeId &&
    stages.length > 0 &&
    Number(lengthKm) > 0 &&
    Number(widthM) > 0 &&
    Number(shiftHours) > 0

  const buildPayload = () => ({
    siteId: selectedSiteId,
    workTypeId: selectedWorkTypeId,
    startDate,
    lengthKm: Number(lengthKm),
    widthM: Number(widthM),
    shiftHours: Number(shiftHours),
    haulDistanceKm: Number(haulDistanceKm),
    stages: stages.map((stage, index) => ({
      ...stage,
      sequence: index + 1,
      startOffsetDays: stage.startOffsetDays,
      durationDays: stage.durationDays,
      equipmentRules: stage.equipmentRules,
    })),
  })

  const handleWorkTypeChange = (id: string) => {
    const template = workTypes.find((item) => item.id === id) ?? null
    setSelectedWorkTypeId(id)
    setDraft(null)
    if (template) {
      setLengthKm(String(template.defaultLengthKm))
      setWidthM(String(template.defaultWidthM))
      setShiftHours(String(template.defaultShiftHours))
      setHaulDistanceKm(String(template.defaultHaulDistanceKm))
      setStages(buildStagesFromTemplate(template))
    }
  }

  const handleAddStage = (
    stage: Omit<WizardStage, "sequence" | "startOffsetDays">
  ) => {
    const last = stages[stages.length - 1]
    setStages((prev) => [
      ...prev,
      {
        ...stage,
        sequence: prev.length + 1,
        startOffsetDays: last
          ? last.startOffsetDays + Math.max(last.durationDays, 1)
          : 0,
      },
    ])
    setDraft(null)
  }

  const handleRemoveStage = (index: number) => {
    setStages((prev) =>
      prev
        .filter((_, itemIndex) => itemIndex !== index)
        .map((stage, itemIndex) => ({ ...stage, sequence: itemIndex + 1 }))
    )
    setDraft(null)
  }

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error("Заполните объект, вид работ и параметры участка")
      return
    }
    try {
      setLoading(true)
      const result = await api.equipmentPlans.generateDraft(buildPayload())
      setDraft(result)
      setCurrentStep(3)
      toast.success("Инженерный черновик плана рассчитан")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось рассчитать план"))
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!draft) return
    try {
      setLoading(true)
      const result = await api.equipmentPlans.applyDraft({
        ...buildPayload(),
        createAssignments: true,
      })
      toast.success(
        `Создано этапов: ${result.createdStages}, назначений: ${result.createdAssignments}`
      )
      if (result.skippedAssignments > 0) {
        toast.warning(
          `Не закрыто назначений из-за дефицита техники: ${result.skippedAssignments}`
        )
      }
      await onApplied()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось применить мастер-план"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Мастер инженерного планирования техники</CardTitle>
        <CardDescription>
          Пошаговый сценарий: объект, вид работ, параметры участка, этапы, расчёт техники и автоматическое назначение смен.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <StepIndicator currentStep={currentStep} onStepChange={setCurrentStep} />

        {currentStep === 0 && (
          <FieldGroup className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
            <Field>
              <FieldLabel>Дорожный объект</FieldLabel>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите объект для планирования" />
                </SelectTrigger>
                <SelectContent>
                  {sites
                    .filter((site) => !site.isCompleted)
                    .map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                {selectedSite?.name ?? "Объект не выбран"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedSite?.workType ?? "Выберите объект, чтобы перейти к виду работ."}
              </p>
            </div>
          </FieldGroup>
        )}

        {currentStep === 1 && (
          <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field className="md:col-span-2 xl:col-span-1">
              <FieldLabel>Вид дорожных работ</FieldLabel>
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
              <FieldLabel>Длина участка, км</FieldLabel>
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
              <FieldLabel>Часы в смену</FieldLabel>
              <Input
                type="number"
                min={1}
                max={24}
                value={shiftHours}
                onChange={(event) => {
                  setShiftHours(event.target.value)
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
              <div className="rounded-lg border p-3 md:col-span-2 xl:col-span-3">
                <p className="text-sm font-medium">{selectedWorkType.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedWorkType.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedWorkType.sourceNote}
                </p>
              </div>
            )}
          </FieldGroup>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Предложенные этапы</p>
                <p className="text-sm text-muted-foreground">
                  Этапы можно убрать или дополнить перед расчётом.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStageDialogOpen(true)}
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
                      {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} ·{" "}
                      {stage.durationDays} дн. · старт +{stage.startOffsetDays} дн.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStage(index)}
                  >
                    Удалить
                  </Button>
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

        {currentStep === 3 && (
          <div className="flex flex-col gap-4">
            {!draft ? (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Запустите расчёт, чтобы получить даты этапов, потребность в технике и риски по парку.
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
                    <div key={`${stage.name}-${stage.sequence}`} className="rounded-lg border p-3">
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
                      <Separator className="my-3" />
                      <div className="grid gap-2 md:grid-cols-2">
                        {stage.demands.map((demand, index) => (
                          <div
                            key={`${stage.sequence}-${demand.vehicleType}-${index}`}
                            className="rounded-md bg-muted p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">
                                {FLEET_VEHICLE_TYPE_LABELS[demand.vehicleType]} ·{" "}
                                {demand.requiredCount} ед.
                              </p>
                              <Badge
                                variant="secondary"
                                className={`border-0 ${riskStyles[demand.riskLevel]}`}
                              >
                                {EQUIPMENT_DEMAND_PRIORITY_LABELS[demand.priority]}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {demand.calculationNote}
                            </p>
                            {demand.risks.length > 0 && (
                              <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                                {demand.risks.map((risk) => (
                                  <li key={risk}>{risk}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3">
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
              disabled={!canGenerate || loading}
            >
              Рассчитать план
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!draft || loading}>
              Создать этапы и назначить технику
            </Button>
          </div>
        </div>

        <AddStageDialog
          open={stageDialogOpen}
          onOpenChange={setStageDialogOpen}
          onAdd={handleAddStage}
        />
      </CardContent>
    </Card>
  )
}
