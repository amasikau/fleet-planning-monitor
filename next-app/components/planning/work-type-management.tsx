"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import type {
  EquipmentCalculationKind,
  EquipmentDemandPriority,
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
}

function WorkTypeDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [lengthKm, setLengthKm] = useState("1")
  const [widthM, setWidthM] = useState("7")
  const [haulDistanceKm, setHaulDistanceKm] = useState("12")
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
        code: code.trim() || slugify(name),
        description: description.trim(),
        defaultLengthKm: Number(lengthKm),
        defaultWidthM: Number(widthM),
        defaultShiftHours: 8,
        defaultHaulDistanceKm: Number(haulDistanceKm),
        productionRateMPerDay: 500,
        sourceNote: "Добавлено пользователем в справочник технологических шаблонов.",
      })
      toast.success("Вид работ добавлен")
      setName("")
      setCode("")
      setDescription("")
      onOpenChange(false)
      await onCreated()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось добавить вид работ"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый вид дорожных работ</DialogTitle>
          <DialogDescription>
            Вид работ хранит типовые параметры участка и набор этапов для мастера планирования.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Название</FieldLabel>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, укрепление обочин"
            />
          </Field>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="shoulder_reinforcement"
            />
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>Описание</FieldLabel>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Кратко опишите технологический процесс"
            />
          </Field>
          <Field>
            <FieldLabel>Типовая длина, км</FieldLabel>
            <Input
              type="number"
              min={0.1}
              step={0.1}
              value={lengthKm}
              onChange={(event) => setLengthKm(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Типовая ширина, м</FieldLabel>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={widthM}
              onChange={(event) => setWidthM(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Плечо доставки, км</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={haulDistanceKm}
              onChange={(event) => setHaulDistanceKm(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StageTemplateDialog({
  open,
  onOpenChange,
  workTypes,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workTypes: RoadWorkTypeTemplate[]
  onCreated: () => Promise<void>
}) {
  const [workTypeId, setWorkTypeId] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<RoadWorkStageType>("preparation")
  const [durationDays, setDurationDays] = useState("1")
  const [startOffsetDays, setStartOffsetDays] = useState("0")
  const [vehicleType, setVehicleType] = useState<FleetVehicleType>("dump_truck")
  const [calculationKind, setCalculationKind] =
    useState<EquipmentCalculationKind>("fixed")
  const [baseCount, setBaseCount] = useState("1")
  const [countPerKm, setCountPerKm] = useState("0")
  const [priority, setPriority] = useState<EquipmentDemandPriority>("normal")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!workTypeId && workTypes[0]) setWorkTypeId(workTypes[0].id)
  }, [workTypeId, workTypes])

  const selectedWorkType = workTypes.find((item) => item.id === workTypeId)
  const nextSequence = (selectedWorkType?.stageTemplates.length ?? 0) + 1

  const handleSave = async () => {
    if (!workTypeId) {
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
        type,
        name: name.trim(),
        sequence: nextSequence,
        startOffsetDays: Number(startOffsetDays),
        durationDays: Number(durationDays),
        canOverlap: false,
        notes: "Добавлено пользователем в справочник этапов.",
        equipmentRules: [
          {
            vehicleType,
            calculationKind,
            baseCount: Number(baseCount),
            countPerKm: Number(countPerKm),
            minCount: 1,
            plannedHours: 8,
            priority,
            notes: "",
          },
        ],
      })
      toast.success("Этап добавлен в шаблон")
      setName("")
      onOpenChange(false)
      await onCreated()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось добавить этап"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Новый этап вида работ</DialogTitle>
          <DialogDescription>
            Этап станет частью шаблона и будет предлагаться в пошаговом мастере.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field className="sm:col-span-2 lg:col-span-3">
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
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Например, планировка обочины"
            />
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
            <FieldLabel>Смещение от старта, дней</FieldLabel>
            <Input
              type="number"
              min={0}
              value={startOffsetDays}
              onChange={(event) => setStartOffsetDays(event.target.value)}
            />
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
            <FieldLabel>Тип техники</FieldLabel>
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
          <Field>
            <FieldLabel>Ед./км</FieldLabel>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={countPerKm}
              onChange={(event) => setCountPerKm(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Приоритет</FieldLabel>
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as EquipmentDemandPriority)
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
          <Button size="sm" onClick={handleSave} disabled={saving}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WorkTypeManagement() {
  const [workTypes, setWorkTypes] = useState<RoadWorkTypeTemplate[]>([])
  const [workTypeDialogOpen, setWorkTypeDialogOpen] = useState(false)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)

  const loadWorkTypes = async () => {
    const items = await api.equipmentPlans.getWorkTypes()
    setWorkTypes(items)
  }

  useEffect(() => {
    loadWorkTypes().catch((error: unknown) => {
      toast.error(getErrorMessage(error, "Не удалось загрузить виды работ"))
    })
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Справочник видов работ и этапов</CardTitle>
            <CardDescription>
              Технологические шаблоны, из которых мастер формирует план-график техники.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStageDialogOpen(true)}
            >
              Добавить этап
            </Button>
            <Button size="sm" onClick={() => setWorkTypeDialogOpen(true)}>
              Добавить вид работ
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {workTypes.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.name}</p>
              <Badge variant="secondary">{item.stageTemplates.length} этапов</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.stageTemplates.slice(0, 4).map((stage) => (
                <Badge key={stage.id} variant="outline">
                  {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]}
                </Badge>
              ))}
              {item.stageTemplates.length > 4 && (
                <Badge variant="outline">+{item.stageTemplates.length - 4}</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>

      <WorkTypeDialog
        open={workTypeDialogOpen}
        onOpenChange={setWorkTypeDialogOpen}
        onCreated={loadWorkTypes}
      />
      <StageTemplateDialog
        open={stageDialogOpen}
        onOpenChange={setStageDialogOpen}
        workTypes={workTypes}
        onCreated={loadWorkTypes}
      />
    </Card>
  )
}
