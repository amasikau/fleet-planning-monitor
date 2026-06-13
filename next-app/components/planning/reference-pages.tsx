"use client"

import { useCallback, useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit02Icon, PlusSignCircleIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { useRole } from "@/contexts/role-context"
import type {
  EquipmentCalculationKind,
  EquipmentDemandPriority,
  FleetVehicleType,
  RoadWorkStageTemplate,
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
import { ExportActions } from "@/components/export-actions"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"

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

const vehicleTypeOptions: FleetVehicleType[] = [
  "dump_truck",
  "crane",
  "excavator",
  "bulldozer",
  "tractor",
  "loader",
  "asphalt_paver",
  "road_roller",
  "road_milling_machine",
  "motor_grader",
  "truck_tractor",
  "flatbed_truck",
  "semi_trailer",
  "passenger_car",
  "van",
  "pickup",
]

const calculationOptions: EquipmentCalculationKind[] = [
  "fixed",
  "per_km",
  "asphalt_delivery",
]

const priorityOptions: EquipmentDemandPriority[] = ["normal", "high", "critical"]

type StageRuleForm = {
  vehicleType: FleetVehicleType
  calculationKind: EquipmentCalculationKind
  baseCount: string
  countPerKm: string
  minCount: string
  maxCount: string
  plannedHours: string
  priority: EquipmentDemandPriority
  notes: string
}

function getDefaultRule(): StageRuleForm {
  return {
    vehicleType: "dump_truck",
    calculationKind: "fixed",
    baseCount: "1",
    countPerKm: "0",
    minCount: "1",
    maxCount: "",
    plannedHours: "8",
    priority: "normal",
    notes: "",
  }
}

function getStageRuleForm(
  rule?: RoadWorkStageTemplate["equipmentRules"][number]
): StageRuleForm {
  return {
    vehicleType: rule?.vehicleType ?? "dump_truck",
    calculationKind: rule?.calculationKind ?? "fixed",
    baseCount: String(rule?.baseCount ?? 1),
    countPerKm: String(rule?.countPerKm ?? 0),
    minCount: String(rule?.minCount ?? 1),
    maxCount: rule?.maxCount == null ? "" : String(rule.maxCount),
    plannedHours: String(rule?.plannedHours ?? 8),
    priority: rule?.priority ?? "normal",
    notes: rule?.notes ?? "",
  }
}

function buildWorkTypesExportConfig(
  workTypes: RoadWorkTypeTemplate[]
): ExportDocumentConfig {
  const today = todayInputDate()

  return {
    fileName: `work_types_${today}`,
    title: "Справочник видов дорожных работ",
    subtitle: "Технологические карты и выбранные этапы",
    documentDate: today,
    sections: [
      {
        title: "Виды работ",
        table: {
          emptyText: "Виды работ отсутствуют",
          columns: [
            { header: "Код", value: "code", width: 16 },
            { header: "Вид работ", value: "name", width: 30 },
            { header: "Описание", value: "description", width: 38 },
            { header: "Протяженность, км", value: "length", width: 16 },
            { header: "Ширина, м", value: "width", width: 14 },
            { header: "Смена, ч", value: "shift", width: 12 },
            { header: "Плечо доставки, км", value: "haul", width: 16 },
            { header: "Производительность, м/смена", value: "rate", width: 18 },
            { header: "Этапы", value: "stages", width: 42 },
          ],
          rows: workTypes.map((workType) => ({
            code: workType.code,
            name: workType.name,
            description: workType.description || "—",
            length: workType.defaultLengthKm,
            width: workType.defaultWidthM,
            shift: workType.defaultShiftHours,
            haul: workType.defaultHaulDistanceKm,
            rate: workType.productionRateMPerDay,
            stages:
              workType.stageTemplates.length > 0
                ? workType.stageTemplates.map((stage) => stage.name).join("; ")
                : "этапы не выбраны",
          })),
        },
      },
      {
        title: "Этапы по видам работ",
        table: {
          emptyText: "Связи видов работ и этапов отсутствуют",
          columns: [
            { header: "Вид работ", value: "workType", width: 30 },
            { header: "Этап", value: "stage", width: 30 },
            { header: "Тип этапа", value: "type", width: 24 },
            { header: "Дней", value: "days", width: 10 },
            { header: "Параллельно", value: "overlap", width: 14 },
            { header: "Техника", value: "equipment", width: 40 },
          ],
          rows: workTypes.flatMap((workType) =>
            workType.stageTemplates.map((stage) => ({
              workType: workType.name,
              stage: stage.name,
              type: ROAD_WORK_STAGE_TYPE_LABELS[stage.type],
              days: stage.durationDays,
              overlap: stage.canOverlap ? "да" : "нет",
              equipment:
                stage.equipmentRules.length > 0
                  ? stage.equipmentRules
                      .map((rule) => FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType])
                      .join("; ")
                  : "не указана",
            }))
          ),
        },
      },
    ],
  }
}

function buildStageTemplatesExportConfig(
  stageTemplates: RoadWorkStageTemplate[]
): ExportDocumentConfig {
  const today = todayInputDate()

  return {
    fileName: `stage_templates_${today}`,
    title: "Справочник этапов дорожных работ",
    subtitle: "Типовые этапы и правила потребности в технике",
    documentDate: today,
    sections: [
      {
        title: "Этапы",
        table: {
          emptyText: "Этапы отсутствуют",
          columns: [
            { header: "Этап", value: "name", width: 34 },
            { header: "Тип этапа", value: "type", width: 26 },
            { header: "Дней", value: "days", width: 10 },
            { header: "Параллельно", value: "overlap", width: 14 },
            { header: "Техника", value: "equipment", width: 40 },
            { header: "Примечание", value: "notes", width: 34 },
          ],
          rows: stageTemplates.map((stage) => ({
            name: stage.name,
            type: ROAD_WORK_STAGE_TYPE_LABELS[stage.type],
            days: stage.durationDays,
            overlap: stage.canOverlap ? "да" : "нет",
            equipment:
              stage.equipmentRules.length > 0
                ? stage.equipmentRules
                    .map((rule) => FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType])
                    .join("; ")
                : "не указана",
            notes: stage.notes || "—",
          })),
        },
      },
      {
        title: "Правила потребности в технике",
        table: {
          emptyText: "Правила потребности отсутствуют",
          columns: [
            { header: "Этап", value: "stage", width: 30 },
            { header: "Тип техники", value: "vehicleType", width: 28 },
            { header: "Метод расчета", value: "calculation", width: 22 },
            { header: "База", value: "base", width: 10 },
            { header: "Ед./км", value: "perKm", width: 10 },
            { header: "Мин.", value: "min", width: 8 },
            { header: "Макс.", value: "max", width: 8 },
            { header: "Часы", value: "hours", width: 10 },
            { header: "Приоритет", value: "priority", width: 16 },
            { header: "Примечание", value: "notes", width: 30 },
          ],
          rows: stageTemplates.flatMap((stage) =>
            stage.equipmentRules.map((rule) => ({
              stage: stage.name,
              vehicleType: FLEET_VEHICLE_TYPE_LABELS[rule.vehicleType],
              calculation: EQUIPMENT_CALCULATION_KIND_LABELS[rule.calculationKind],
              base: rule.baseCount,
              perKm: rule.countPerKm,
              min: rule.minCount,
              max: rule.maxCount ?? "—",
              hours: rule.plannedHours,
              priority: EQUIPMENT_DEMAND_PRIORITY_LABELS[rule.priority],
              notes: rule.notes || "—",
            }))
          ),
        },
      },
    ],
  }
}

export function WorkTypesPage() {
  const { canEdit } = useRole()
  const [workTypes, setWorkTypes] = useState<RoadWorkTypeTemplate[]>([])
  const [stageTemplates, setStageTemplates] = useState<RoadWorkStageTemplate[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWorkType, setEditingWorkType] =
    useState<RoadWorkTypeTemplate | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [workTypeData, stageTemplateData] = await Promise.all([
        api.equipmentPlans.getWorkTypes(),
        api.equipmentPlans.getStageTemplates(),
      ])
      setWorkTypes(workTypeData)
      setStageTemplates(stageTemplateData)
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить виды работ"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const openDialog = (workType: RoadWorkTypeTemplate | null) => {
    setEditingWorkType(workType)
    setDialogKey((value) => value + 1)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Виды работ</h1>
          <p className="text-sm text-muted-foreground">
            Технологические карты выбирают этапы из общей базы справочника.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportActions
            onExportExcel={() =>
              exportDataAsXlsx(buildWorkTypesExportConfig(workTypes))
            }
            onExportDocx={() =>
              exportDataAsDocx(buildWorkTypesExportConfig(workTypes))
            }
          />
          {canEdit && (
            <Button size="sm" onClick={() => openDialog(null)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Вид работ
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>База видов дорожных работ</CardTitle>
            <CardDescription>
              При создании выбираются уже существующие этапы, а не создаются новые внутри вида работ.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Вид работ</TableHead>
                  <TableHead>Типовой участок</TableHead>
                  <TableHead>Этапы</TableHead>
                  <TableHead className="w-28 text-right pr-6">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="pl-6" colSpan={4}>
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : (
                  workTypes.map((workType) => (
                    <TableRow key={workType.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{workType.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workType.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        {workType.defaultLengthKm} км · {workType.defaultWidthM} м ·{" "}
                        {workType.defaultShiftHours} ч
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {workType.stageTemplates.map((stage) => (
                            <Badge key={stage.id} variant="outline">
                              {stage.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(workType)}
                          >
                            <HugeiconsIcon
                              icon={PencilEdit02Icon}
                              strokeWidth={2}
                              data-icon="inline-start"
                            />
                            Изменить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <WorkTypeDialog
        key={dialogKey}
        open={dialogOpen}
        workType={editingWorkType}
        stageTemplates={stageTemplates}
        onOpenChange={setDialogOpen}
        onSaved={fetchData}
      />
    </div>
  )
}

function WorkTypeDialog({
  open,
  workType,
  stageTemplates,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  workType: RoadWorkTypeTemplate | null
  stageTemplates: RoadWorkStageTemplate[]
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(workType?.name ?? "")
  const [code, setCode] = useState(workType?.code ?? "")
  const [description, setDescription] = useState(workType?.description ?? "")
  const [defaultLengthKm, setDefaultLengthKm] = useState(
    String(workType?.defaultLengthKm ?? 1)
  )
  const [defaultWidthM, setDefaultWidthM] = useState(
    String(workType?.defaultWidthM ?? 7)
  )
  const [defaultShiftHours, setDefaultShiftHours] = useState(
    String(workType?.defaultShiftHours ?? 8)
  )
  const [defaultHaulDistanceKm, setDefaultHaulDistanceKm] = useState(
    String(workType?.defaultHaulDistanceKm ?? 12)
  )
  const [productionRateMPerDay, setProductionRateMPerDay] = useState(
    String(workType?.productionRateMPerDay ?? 500)
  )
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>(
    workType
      ? workType.stageTemplates.map((stage) => stage.id)
      : stageTemplates.map((stage) => stage.id)
  )
  const [saving, setSaving] = useState(false)

  const toggleStage = (stageId: string) => {
    setSelectedStageIds((current) =>
      current.includes(stageId)
        ? current.filter((id) => id !== stageId)
        : [...current, stageId]
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Укажите название вида работ")
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: name.trim(),
        code:
          code.trim() ||
          name
            .trim()
            .toLowerCase()
            .replace(/[^a-zа-яё0-9]+/gi, "_")
            .replace(/^_+|_+$/g, ""),
        description: description.trim(),
        defaultLengthKm: Number(defaultLengthKm),
        defaultWidthM: Number(defaultWidthM),
        defaultShiftHours: Number(defaultShiftHours),
        defaultHaulDistanceKm: Number(defaultHaulDistanceKm),
        productionRateMPerDay: Number(productionRateMPerDay),
        sourceNote: workType?.sourceNote ?? "Сформировано из справочника этапов.",
        stageTemplateIds: selectedStageIds,
      }

      if (workType) {
        await api.equipmentPlans.updateWorkType(workType.id, payload)
        toast.success("Вид работ обновлён")
      } else {
        await api.equipmentPlans.createWorkType(payload)
        toast.success("Вид работ добавлен")
      }

      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить вид работ"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{workType ? "Редактирование вида работ" : "Новый вид работ"}</DialogTitle>
          <DialogDescription>
            Этапы выбираются из общей базы. Изменение вида работ не меняет сам справочник этапов.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Название</FieldLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Описание</FieldLabel>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Типовая протяжённость, км</FieldLabel>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={defaultLengthKm}
              onChange={(event) => setDefaultLengthKm(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Ширина, м</FieldLabel>
            <Input
              type="number"
              min={1}
              step={0.1}
              value={defaultWidthM}
              onChange={(event) => setDefaultWidthM(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Смена, ч</FieldLabel>
            <Input
              type="number"
              min={1}
              max={24}
              value={defaultShiftHours}
              onChange={(event) => setDefaultShiftHours(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Плечо доставки, км</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={defaultHaulDistanceKm}
              onChange={(event) => setDefaultHaulDistanceKm(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Производительность, м/смена</FieldLabel>
            <Input
              type="number"
              min={50}
              value={productionRateMPerDay}
              onChange={(event) => setProductionRateMPerDay(event.target.value)}
            />
          </Field>
        </FieldGroup>

        <Separator />

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">Этапы вида работ</p>
            <p className="text-xs text-muted-foreground">
              По умолчанию новый вид работ получает все этапы из справочника; ненужные можно снять.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {stageTemplates.map((stage) => (
              <label
                key={stage.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <Checkbox
                  checked={selectedStageIds.includes(stage.id)}
                  onCheckedChange={() => toggleStage(stage.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{stage.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} · {stage.durationDays} дн.
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

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

export function StageTemplatesPage() {
  const { canEdit } = useRole()
  const [stageTemplates, setStageTemplates] = useState<RoadWorkStageTemplate[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<RoadWorkStageTemplate | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setStageTemplates(await api.equipmentPlans.getStageTemplates())
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить этапы"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const openDialog = (stage: RoadWorkStageTemplate | null) => {
    setEditingStage(stage)
    setDialogKey((value) => value + 1)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Этапы</h1>
          <p className="text-sm text-muted-foreground">
            Общий справочник технологических этапов, из которого собираются виды работ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportActions
            onExportExcel={() =>
              exportDataAsXlsx(buildStageTemplatesExportConfig(stageTemplates))
            }
            onExportDocx={() =>
              exportDataAsDocx(buildStageTemplatesExportConfig(stageTemplates))
            }
          />
          {canEdit && (
            <Button size="sm" onClick={() => openDialog(null)}>
              <HugeiconsIcon
                icon={PlusSignCircleIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Этап
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>База этапов</CardTitle>
            <CardDescription>
              Этапы больше не закреплены за одним видом работ и могут использоваться в разных технологических картах.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Этап</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Дней</TableHead>
                  <TableHead>Техника</TableHead>
                  <TableHead className="w-28 text-right pr-6">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell className="pl-6" colSpan={5}>
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : (
                  stageTemplates.map((stage) => (
                    <TableRow key={stage.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{stage.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stage.notes}
                        </p>
                      </TableCell>
                      <TableCell>{ROAD_WORK_STAGE_TYPE_LABELS[stage.type]}</TableCell>
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
                      <TableCell className="pr-6 text-right">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(stage)}
                          >
                            <HugeiconsIcon
                              icon={PencilEdit02Icon}
                              strokeWidth={2}
                              data-icon="inline-start"
                            />
                            Изменить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StageTemplateDialog
        key={dialogKey}
        open={dialogOpen}
        stage={editingStage}
        onOpenChange={setDialogOpen}
        onSaved={fetchData}
      />
    </div>
  )
}

function StageTemplateDialog({
  open,
  stage,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  stage: RoadWorkStageTemplate | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(stage?.name ?? "")
  const [type, setType] = useState<RoadWorkStageType>(
    stage?.type ?? "preparation"
  )
  const [durationDays, setDurationDays] = useState(
    String(stage?.durationDays ?? 1)
  )
  const [canOverlap, setCanOverlap] = useState(stage?.canOverlap ?? false)
  const [notes, setNotes] = useState(stage?.notes ?? "")
  const [rules, setRules] = useState<StageRuleForm[]>(
    stage?.equipmentRules.length
      ? stage.equipmentRules.map((rule) => getStageRuleForm(rule))
      : [getDefaultRule()]
  )
  const [saving, setSaving] = useState(false)

  const updateRule = (
    index: number,
    patch: Partial<StageRuleForm>
  ) => {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule
      )
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Укажите название этапа")
      return
    }

    try {
      setSaving(true)
      const payload = {
        name: name.trim(),
        type,
        durationDays: Number(durationDays),
        canOverlap,
        notes: notes.trim(),
        equipmentRules: rules.map((rule) => ({
          vehicleType: rule.vehicleType,
          calculationKind: rule.calculationKind,
          baseCount: Number(rule.baseCount),
          countPerKm: Number(rule.countPerKm),
          minCount: Number(rule.minCount),
          maxCount: rule.maxCount ? Number(rule.maxCount) : null,
          plannedHours: Number(rule.plannedHours),
          priority: rule.priority,
          notes: rule.notes.trim(),
        })),
      }

      if (stage) {
        await api.equipmentPlans.updateStageTemplate(stage.id, payload)
        toast.success("Этап обновлён")
      } else {
        await api.equipmentPlans.createStageTemplate(payload)
        toast.success("Этап добавлен")
      }

      onOpenChange(false)
      await onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить этап"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{stage ? "Редактирование этапа" : "Новый этап"}</DialogTitle>
          <DialogDescription>
            Это общий справочник этапов. Виды работ только выбирают эти этапы.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field className="sm:col-span-2">
            <FieldLabel>Название этапа</FieldLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Тип этапа</FieldLabel>
            <Select value={type} onValueChange={(value) => setType(value as RoadWorkStageType)}>
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
          <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Checkbox
              checked={canOverlap}
              onCheckedChange={(checked) => setCanOverlap(checked === true)}
            />
            Может идти параллельно
          </label>
          <Field className="sm:col-span-2 lg:col-span-3">
            <FieldLabel>Примечание</FieldLabel>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </FieldGroup>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Потребность в технике</p>
              <p className="text-xs text-muted-foreground">
                Правила используются при автоматическом расчёте плана.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRules((current) => [...current, getDefaultRule()])}
            >
              Добавить технику
            </Button>
          </div>

          {rules.map((rule, index) => (
            <div key={index} className="grid gap-3 rounded-md border p-3 lg:grid-cols-6">
              <Field className="lg:col-span-2">
                <FieldLabel>Тип техники</FieldLabel>
                <Select
                  value={rule.vehicleType}
                  onValueChange={(value) =>
                    updateRule(index, { vehicleType: value as FleetVehicleType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypeOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {FLEET_VEHICLE_TYPE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="lg:col-span-2">
                <FieldLabel>Метод расчёта</FieldLabel>
                <Select
                  value={rule.calculationKind}
                  onValueChange={(value) =>
                    updateRule(index, {
                      calculationKind: value as EquipmentCalculationKind,
                    })
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
                <FieldLabel>База</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={rule.baseCount}
                  onChange={(event) =>
                    updateRule(index, { baseCount: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Ед./км</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={rule.countPerKm}
                  onChange={(event) =>
                    updateRule(index, { countPerKm: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Мин.</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={rule.minCount}
                  onChange={(event) =>
                    updateRule(index, { minCount: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Макс.</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={rule.maxCount}
                  onChange={(event) =>
                    updateRule(index, { maxCount: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Часы</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={rule.plannedHours}
                  onChange={(event) =>
                    updateRule(index, { plannedHours: event.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Приоритет</FieldLabel>
                <Select
                  value={rule.priority}
                  onValueChange={(value) =>
                    updateRule(index, { priority: value as EquipmentDemandPriority })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {EQUIPMENT_DEMAND_PRIORITY_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="lg:col-span-5">
                <FieldLabel>Примечание к технике</FieldLabel>
                <Input
                  value={rule.notes}
                  onChange={(event) => updateRule(index, { notes: event.target.value })}
                />
              </Field>
              <div className="flex items-end justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={rules.length === 1}
                  onClick={() =>
                    setRules((current) =>
                      current.filter((_, ruleIndex) => ruleIndex !== index)
                    )
                  }
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>

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
