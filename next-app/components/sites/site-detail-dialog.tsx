"use client"

import { useCallback, useEffect, useState } from "react"
import type {
  AvailableVehicle,
  ConstructionSiteDetail,
  EquipmentCoverageItem,
  EquipmentPlan,
} from "@/lib/types"
import {
  EQUIPMENT_PLAN_SHIFT_LABELS,
  EQUIPMENT_PLAN_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
} from "@/lib/types"
import Link from "next/link"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { YandexMapView } from "@/components/yandex-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building06Icon,
  Car01Icon,
  Calendar03Icon,
  Location01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  CheckmarkBadge01Icon,
  PlusSignCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export function SiteDetailDialog({
  open,
  onOpenChange,
  siteId,
  readonly,
  onEdit,
  onDelete,
  onComplete,
  onDataChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string | null
  readonly?: boolean
  onEdit: (site: ConstructionSiteDetail) => void
  onDelete: (site: ConstructionSiteDetail) => void
  onComplete: (site: ConstructionSiteDetail) => void
  onDataChange: () => void
}) {
  const [detail, setDetail] = useState<ConstructionSiteDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableVehicles, setAvailableVehicles] = useState<AvailableVehicle[]>([])
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [coverage, setCoverage] = useState<EquipmentCoverageItem[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [assignLoading, setAssignLoading] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!siteId) return
    setLoading(true)
    try {
      const [siteData, vehicles, planData, coverageData] = await Promise.all([
        api.sites.getOne(siteId),
        api.sites.getAvailableVehicles(siteId),
        api.equipmentPlans.getAll({ siteId }),
        api.equipmentPlans.getCoverage({ siteId }),
      ])
      setDetail(siteData)
      setAvailableVehicles(vehicles)
      setPlans(planData)
      setCoverage(coverageData)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные объекта"))
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    if (open && siteId) {
      void fetchDetail()
    } else {
      setDetail(null)
      setPlans([])
      setCoverage([])
      setSelectedVehicleId("")
    }
  }, [open, siteId, fetchDetail])

  const handleAssignVehicle = async () => {
    if (!siteId || !selectedVehicleId) return
    setAssignLoading(true)
    try {
      await api.sites.assignVehicle(siteId, selectedVehicleId)
      setSelectedVehicleId("")
      await fetchDetail()
      toast.success("Техника назначена")
      onDataChange()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось назначить технику"))
    } finally {
      setAssignLoading(false)
    }
  }

  const handleUnassignVehicle = async (vehicleId: string) => {
    if (!siteId) return
    try {
      await api.sites.unassignVehicle(siteId, vehicleId)
      await fetchDetail()
      toast.success("Техника снята с объекта")
      onDataChange()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось снять технику"))
    }
  }

  const hasCoordinates = detail?.latitude != null && detail?.longitude != null
  const coverageDeficits = coverage.filter((item) => item.deficit > 0)
  const averageCoverage =
    coverage.length > 0
      ? Math.round(
          coverage.reduce((sum, item) => sum + item.coveragePercent, 0) /
            coverage.length
        )
      : 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {detail ? (
              <>
                <HugeiconsIcon
                  icon={Building06Icon}
                  strokeWidth={2}
                  className="size-5 text-primary"
                />
                {detail.name}
              </>
            ) : (
              <span className="sr-only">Детали объекта</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : detail ? (
          <>

            {/* Map preview (memoised — won't re-render on vehicle changes) */}
            {hasCoordinates && (
              <YandexMapView
                latitude={detail.latitude!}
                longitude={detail.longitude!}
              />
            )}

            {/* General info */}
            <div className="grid gap-3 rounded-lg border p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <HugeiconsIcon
                    icon={Building06Icon}
                    strokeWidth={1.8}
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Вид работ</p>
                    <p className="font-medium">
                      {detail.workType || "Не указан"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    strokeWidth={1.8}
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">Адрес</p>
                    <p className="font-medium">
                      {detail.address || "Не указан"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={1.8}
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Период работ
                    </p>
                    <p className="font-medium">
                      {formatDate(detail.workPeriodStart)} —{" "}
                      {formatDate(detail.workPeriodEnd)}
                    </p>
                  </div>
                </div>
                {hasCoordinates && (
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      strokeWidth={1.8}
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Координаты
                      </p>
                      <a
                        href={`https://yandex.ru/maps/?ll=${detail.longitude},${detail.latitude}&z=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {detail.latitude?.toFixed(4)},{" "}
                        {detail.longitude?.toFixed(4)}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {detail.notes && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {detail.notes}
                  </p>
                </>
              )}
              {detail.isCompleted && detail.completedAt && (
                <Badge
                  variant="secondary"
                  className="w-fit bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                >
                  Завершён {formatDate(detail.completedAt)}
                </Badge>
              )}
            </div>

            {/* Equipment planning */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={2}
                    className="size-4 text-primary"
                  />
                  Потребность и план техники
                  <Badge variant="secondary" className="text-xs">
                    {averageCoverage}%
                  </Badge>
                </h3>
                {!readonly && !detail.isCompleted && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/planning">План-график</Link>
                  </Button>
                )}
              </div>

              {coverage.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {coverage.slice(0, 4).map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">
                          {FLEET_VEHICLE_TYPE_LABELS[item.vehicleType]}
                        </p>
                        <Badge
                          variant="secondary"
                          className={
                            item.deficit > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          }
                        >
                          {item.coveragePercent}%
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.stageName ?? "Без этапа"} · нужно{" "}
                        {item.requiredCount}, назначено {item.assignedCount}
                      </p>
                      {item.deficit > 0 && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          Дефицит: {item.deficit} ед.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {coverageDeficits.length > 0 && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Не закрыто потребностей: {coverageDeficits.length}. Откройте
                  план-график для перераспределения техники.
                </p>
              )}

              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Сменные назначения техники ещё не запланированы
                </p>
              ) : (
                <div className="space-y-2">
                  {plans.slice(0, 4).map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{plan.vehicleLabel}</p>
                        <Badge variant="secondary" className="text-xs">
                          {EQUIPMENT_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(plan.workDate)} ·{" "}
                        {EQUIPMENT_PLAN_SHIFT_LABELS[plan.shift]} ·{" "}
                        {plan.plannedHours} ч план /{" "}
                        {plan.actualHours ?? "—"} ч факт
                      </p>
                      {plan.warnings.length > 0 && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          {plan.warnings.join("; ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <HugeiconsIcon
                    icon={Car01Icon}
                    strokeWidth={2}
                    className="size-4 text-primary"
                  />
                  Назначенная техника
                  <Badge variant="secondary" className="text-xs">
                    {detail.vehicles.length}
                  </Badge>
                </h3>
              </div>

              {detail.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Техника не назначена
                </p>
              ) : (
                <div className="space-y-2">
                  {detail.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <HugeiconsIcon
                            icon={Car01Icon}
                            strokeWidth={1.8}
                            className="size-4 text-primary"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {v.brand} {v.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {v.plateNumber}
                          </p>
                        </div>
                      </div>
                      {!readonly && !detail.isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleUnassignVehicle(v.vehicleId)}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add vehicle */}
              {!readonly && !detail.isCompleted && availableVehicles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger className="h-9 flex-1">
                      <SelectValue placeholder="Выберите технику..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <span>
                            {v.brand} {v.model} ({v.plateNumber})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!selectedVehicleId || assignLoading}
                    onClick={handleAssignVehicle}
                  >
                    <HugeiconsIcon
                      icon={PlusSignCircleIcon}
                      strokeWidth={2}
                      className="mr-1 size-4"
                    />
                    Назначить
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            {!readonly && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onEdit(detail)
                      onOpenChange(false)
                    }}
                  >
                    <HugeiconsIcon
                      icon={PencilEdit02Icon}
                      strokeWidth={2}
                      className="mr-1 size-4"
                    />
                    Редактировать
                  </Button>
                  {!detail.isCompleted && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        onComplete(detail)
                        onOpenChange(false)
                      }}
                    >
                      <HugeiconsIcon
                        icon={CheckmarkBadge01Icon}
                        strokeWidth={2}
                        className="mr-1 size-4"
                      />
                      Готово
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDelete(detail)
                      onOpenChange(false)
                    }}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      strokeWidth={2}
                      className="mr-1 size-4"
                    />
                    Удалить
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Объект не найден
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
