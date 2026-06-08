"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  FleetVehicle,
  RepairTemplate,
  ServiceEvent,
  ServiceEventType,
  ServiceEventStatus,
} from "@/lib/types"
import {
  FLEET_REPAIR_CATEGORY_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
  SERVICE_EVENT_STATUS_LABELS,
} from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  Wrench01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  PlusSignCircleIcon,
  Cancel01Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"

export interface ServiceEventFormValues {
  vehicleId: string
  repairTemplateId: string
  type: ServiceEventType
  title: string
  startDate: string
  durationDays: number
  dueAt: string
  status?: ServiceEventStatus
  completedAt?: string | null
  mileageKm?: number | null
  defectDescription: string
  notes: string
  workLogs: {
    performedAt: string
    title: string
    description: string
    mileageKm: number | null
  }[]
}

function createInitialForm(
  event?: ServiceEvent | null,
  vehicles?: FleetVehicle[],
  repairTemplates?: RepairTemplate[]
): ServiceEventFormValues {
  const vehicleId = event?.vehicleId ?? vehicles?.[0]?.id ?? ""
  const vehicle = vehicles?.find((item) => item.id === vehicleId)
  const firstTemplate = repairTemplates?.find(
    (template) => template.vehicleType === vehicle?.type
  )
  return {
    vehicleId,
    repairTemplateId: event?.repairTemplate?.id ?? firstTemplate?.id ?? "",
    type: event?.type ?? "repair",
    title: event?.title ?? firstTemplate?.name ?? "",
    startDate:
      event?.startDate?.slice(0, 10) ??
      event?.dueAt?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10),
    durationDays: event?.durationDays ?? firstTemplate?.durationDays ?? 1,
    dueAt: event?.endDate?.slice(0, 10) ?? event?.dueAt?.slice(0, 10) ?? "",
    status: event?.status ?? undefined,
    completedAt: event?.completedAt?.slice(0, 10) ?? null,
    mileageKm: event?.mileageKm ?? null,
    defectDescription: event?.defectDescription ?? "",
    notes: event?.notes ?? "",
    workLogs:
      event?.workLogs.map((log) => ({
        performedAt: log.performedAt.slice(0, 10),
        title: log.title,
        description: log.description,
        mileageKm: log.mileageKm,
      })) ?? [],
  }
}

export function ServiceEventDialog({
  open,
  onOpenChange,
  event,
  vehicles,
  repairTemplates,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: ServiceEvent | null
  vehicles: FleetVehicle[]
  repairTemplates: RepairTemplate[]
  onSave: (values: ServiceEventFormValues) => void
}) {
  const isEdit = !!event
  const [form, setForm] = useState<ServiceEventFormValues>(() =>
    createInitialForm(event, vehicles, repairTemplates)
  )

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId)
  const availableTemplates = repairTemplates.filter(
    (template) => template.vehicleType === selectedVehicle?.type
  )
  const selectedTemplate = repairTemplates.find(
    (template) => template.id === form.repairTemplateId
  )
  const calculatedEndDate = form.startDate
    ? (() => {
        const date = new Date(`${form.startDate}T00:00:00.000Z`)
        date.setUTCDate(date.getUTCDate() + Math.max(form.durationDays, 1) - 1)
        return date.toISOString().slice(0, 10)
      })()
    : ""

  const handleSave = () => {
    if (!form.vehicleId) {
      toast.error("Выберите технику")
      return
    }
    if (!form.repairTemplateId) {
      toast.error("Выберите ремонт из справочника")
      return
    }
    if (!form.startDate) {
      toast.error("Укажите дату начала ремонта")
      return
    }
    if (form.workLogs.some((log) => !log.performedAt || !log.title.trim())) {
      toast.error("У каждой выполненной работы должны быть дата и название")
      return
    }
    onSave({
      ...form,
      title: (form.title || selectedTemplate?.name || "").trim(),
      dueAt: calculatedEndDate,
      defectDescription: form.defectDescription.trim(),
      notes: form.notes.trim(),
      workLogs: form.workLogs.map((log) => ({
        ...log,
        title: log.title.trim(),
        description: log.description.trim(),
      })),
    })
  }

  const updateWorkLog = (
    index: number,
    patch: Partial<ServiceEventFormValues["workLogs"][number]>
  ) => {
    setForm((prev) => ({
      ...prev,
      workLogs: prev.workLogs.map((log, i) =>
        i === index ? { ...log, ...patch } : log
      ),
    }))
  }

  const addWorkLog = () => {
    setForm((prev) => ({
      ...prev,
      workLogs: [
        {
          performedAt: new Date().toISOString().slice(0, 10),
          title: "",
          description: "",
          mileageKm: null,
        },
        ...prev.workLogs,
      ],
    }))
  }

  const removeWorkLog = (index: number) => {
    setForm((prev) => ({
      ...prev,
      workLogs: prev.workLogs.filter((_, i) => i !== index),
    }))
  }

  const hasInvalidWorkLogs = () =>
    form.workLogs.some((log) => !log.performedAt || !log.title.trim())

  const saveAsCompleted = () => {
    if (hasInvalidWorkLogs()) {
      toast.error("У каждой выполненной работы должны быть дата и название")
      return
    }
    onSave({
      ...form,
      status: "completed",
      completedAt: new Date().toISOString().slice(0, 10),
      title: (form.title || selectedTemplate?.name || "").trim(),
      dueAt: calculatedEndDate,
      defectDescription: form.defectDescription.trim(),
      notes: form.notes.trim(),
      workLogs: form.workLogs.map((log) => ({
        ...log,
        title: log.title.trim(),
        description: log.description.trim(),
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pr-14">
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={isEdit ? PencilEdit02Icon : Wrench01Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            {isEdit ? "Редактирование заявки" : "Новая сервисная заявка"}
          </DialogTitle>
          <DialogDescription>
            Укажите технику, тип обслуживания, срок и описание влияния на готовность.
          </DialogDescription>
        </DialogHeader>

        <Separator className="mx-6 my-5 w-auto shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {isEdit && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Техника</p>
                    <p className="mt-1 text-sm font-medium">
                      {event.vehicleLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Создал</p>
                    <p className="mt-1 text-sm font-medium">
                      {event.reporter?.fullName ?? "Не указан"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Работ в журнале
                    </p>
                    <p className="mt-1 text-sm font-medium tabular-nums">
                      {form.workLogs.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Техника
              </label>
              <Select
                value={form.vehicleId}
                onValueChange={(value) =>
                  setForm((prev) => {
                    const nextVehicle = vehicles.find(
                      (vehicle) => vehicle.id === value
                    )
                    const nextTemplate = repairTemplates.find(
                      (template) => template.vehicleType === nextVehicle?.type
                    )
                    return {
                      ...prev,
                      vehicleId: value,
                      repairTemplateId: nextTemplate?.id ?? "",
                      title: nextTemplate?.name ?? "",
                      durationDays: nextTemplate?.durationDays ?? 1,
                    }
                  })
                }
                disabled={isEdit}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Выберите технику" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} · {vehicle.plateNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Ремонт из справочника
              </label>
              <Select
                value={form.repairTemplateId}
                onValueChange={(value) => {
                  const template = repairTemplates.find(
                    (item) => item.id === value
                  )
                  setForm((prev) => ({
                    ...prev,
                    repairTemplateId: value,
                    title: template?.name ?? prev.title,
                    durationDays: template?.durationDays ?? prev.durationDays,
                    type:
                      template?.category === "diagnostics"
                        ? "diagnostics"
                        : template?.category === "scheduled_service"
                          ? "maintenance"
                          : "repair",
                  }))
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Выберите ремонт" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} · {template.durationDays} дн.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTemplates.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  Для выбранного типа техники нет активных позиций справочника.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Тип заявки
              </label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value as ServiceEventType,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_EVENT_TYPE_LABELS) as ServiceEventType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {SERVICE_EVENT_TYPE_LABELS[type]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {isEdit && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Статус
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      status: value as ServiceEventStatus,
                    }))
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        SERVICE_EVENT_STATUS_LABELS
                      ) as ServiceEventStatus[]
                    ).map((status) => (
                      <SelectItem key={status} value={status}>
                        {SERVICE_EVENT_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={isEdit ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Название
              </label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Берётся из справочника ремонта"
                className="h-9"
              />
            </div>

            <div className={isEdit ? "" : "sm:col-span-2"}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Дата начала
              </label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    startDate: event.target.value,
                  }))
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
                value={form.durationDays}
                min={1}
                max={60}
                className="h-9"
                readOnly
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Окончание
              </label>
              <Input value={calculatedEndDate || "—"} className="h-9" readOnly />
            </div>

            {selectedTemplate && (
              <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Раздел ремонта</p>
                <p className="mt-1 text-sm font-medium">
                  {FLEET_REPAIR_CATEGORY_LABELS[selectedTemplate.category]}
                </p>
                {selectedTemplate.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedTemplate.notes}
                  </p>
                )}
              </div>
            )}

            {isEdit && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Пробег (км)
                </label>
                <Input
                  type="number"
                  value={form.mileageKm ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mileageKm: event.target.value
                        ? parseInt(event.target.value)
                        : null,
                    }))
                  }
                  placeholder="—"
                  className="h-9"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Описание
              </label>
              <textarea
                value={form.defectDescription}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    defectDescription: event.target.value,
                  }))
                }
                placeholder="Что обнаружено, как влияет на готовность техники и план работ"
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                placeholder="Дополнительная информация"
                className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {isEdit && (
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Wrench01Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                  <label className="mr-auto text-sm font-medium">
                    Выполненные работы
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addWorkLog}
                  >
                    <HugeiconsIcon
                      icon={PlusSignCircleIcon}
                      strokeWidth={2}
                      className="mr-1.5 size-4"
                    />
                    Добавить
                  </Button>
                </div>

                <div className="grid gap-2">
                  {form.workLogs.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      Работы пока не добавлены
                    </div>
                  ) : (
                    form.workLogs.map((log, index) => (
                      <div key={index} className="rounded-lg border bg-card p-3">
                        <div className="grid gap-2 sm:grid-cols-[150px_1fr_110px_32px]">
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                              Дата
                            </label>
                            <div className="relative">
                              <HugeiconsIcon
                                icon={Calendar03Icon}
                                strokeWidth={2}
                                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                              />
                              <Input
                                type="date"
                                value={log.performedAt}
                                onChange={(event) =>
                                  updateWorkLog(index, {
                                    performedAt: event.target.value,
                                  })
                                }
                                className="h-8 pl-8"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                              Работа
                            </label>
                            <Input
                              value={log.title}
                              onChange={(event) =>
                                updateWorkLog(index, { title: event.target.value })
                              }
                              placeholder="Замена масла, диагностика..."
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                              Пробег
                            </label>
                            <Input
                              type="number"
                              value={log.mileageKm ?? ""}
                              onChange={(event) =>
                                updateWorkLog(index, {
                                  mileageKm: event.target.value
                                    ? parseInt(event.target.value)
                                    : null,
                                })
                              }
                              placeholder="—"
                              className="h-8"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeWorkLog(index)}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                strokeWidth={2}
                                className="size-4"
                              />
                            </Button>
                          </div>
                        </div>
                        <textarea
                          value={log.description}
                          onChange={(event) =>
                            updateWorkLog(index, {
                              description: event.target.value,
                            })
                          }
                          placeholder="Детали работы, материалы, замечания"
                          className="mt-2 min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4">
          {isEdit && form.status !== "completed" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={saveAsCompleted}
            >
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                strokeWidth={2}
                className="mr-1.5 size-4"
              />
              Завершить
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!form.vehicleId}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteServiceEventDialog({
  open,
  onOpenChange,
  event,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: ServiceEvent | null
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="!place-items-center !text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="size-6 text-red-600"
            />
          </div>
          <AlertDialogTitle className="text-center">
            Удаление заявки
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Удалить заявку{" "}
            <span className="font-semibold text-foreground">
              {event?.title}
            </span>
            ? Статус техники будет пересчитан автоматически.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm}>
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="mr-1 size-4"
            />
            Удалить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
