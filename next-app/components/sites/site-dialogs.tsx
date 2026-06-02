"use client"

import { useState } from "react"
import type { ConstructionSite } from "@/lib/types"
import { YandexMapPicker, forwardGeocode } from "@/components/yandex-map"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  Building06Icon,
  Delete02Icon,
  PencilEdit02Icon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"

const DAY_IN_MS = 1000 * 60 * 60 * 24

function formatDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10)
}

function getRelativeDate(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * DAY_IN_MS)
    .toISOString()
    .slice(0, 10)
}

export interface SiteFormValues {
  name: string
  workType: string
  address: string
  latitude: string
  longitude: string
  workPeriodStart: string
  workPeriodEnd: string
  notes: string
}

function createInitialForm(site?: ConstructionSite | null): SiteFormValues {
  return {
    name: site?.name ?? "",
    workType: site?.workType ?? "",
    address: site?.address ?? "",
    latitude: site?.latitude != null ? String(site.latitude) : "",
    longitude: site?.longitude != null ? String(site.longitude) : "",
    workPeriodStart: site?.workPeriodStart
      ? formatDateInput(site.workPeriodStart)
      : getRelativeDate(0),
    workPeriodEnd: site?.workPeriodEnd
      ? formatDateInput(site.workPeriodEnd)
      : getRelativeDate(90),
    notes: site?.notes ?? "",
  }
}

export function SiteFormDialog({
  open,
  onOpenChange,
  site,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: ConstructionSite | null
  onSave: (values: {
    name: string
    workType?: string
    address?: string
    latitude?: number
    longitude?: number
    workPeriodStart: string
    workPeriodEnd: string
    notes?: string
  }) => void
}) {
  const isEdit = !!site
  const [geocoding, setGeocoding] = useState(false)
  const [form, setForm] = useState<SiteFormValues>(() =>
    createInitialForm(site)
  )

  const handleSearchAddress = () => {
    const addr = form.address.trim()
    if (!addr) return
    setGeocoding(true)
    forwardGeocode(addr)
      .then((result) => {
        if (result) {
          setForm((prev) => ({
            ...prev,
            latitude: result.lat.toFixed(6),
            longitude: result.lng.toFixed(6),
            address: result.address || prev.address,
          }))
        }
      })
      .finally(() => setGeocoding(false))
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Укажите название объекта")
      return
    }
    if (!form.workPeriodStart) {
      toast.error("Укажите начало периода работ")
      return
    }
    if (!form.workPeriodEnd) {
      toast.error("Укажите конец периода работ")
      return
    }
    if (form.workPeriodEnd < form.workPeriodStart) {
      toast.error("Конец периода не может быть раньше начала")
      return
    }

    const lat = form.latitude.trim()
      ? Number.parseFloat(form.latitude)
      : undefined
    const lon = form.longitude.trim()
      ? Number.parseFloat(form.longitude)
      : undefined

    if (lat !== undefined && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
      toast.error("Широта должна быть числом от -90 до 90")
      return
    }
    if (
      lon !== undefined &&
      (Number.isNaN(lon) || lon < -180 || lon > 180)
    ) {
      toast.error("Долгота должна быть числом от -180 до 180")
      return
    }

    onSave({
      name: form.name.trim(),
      workType: form.workType.trim() || undefined,
      address: form.address.trim() || undefined,
      latitude: lat,
      longitude: lon,
      workPeriodStart: form.workPeriodStart,
      workPeriodEnd: form.workPeriodEnd,
      notes: form.notes.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={isEdit ? PencilEdit02Icon : Building06Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            {isEdit ? "Изменение объекта" : "Новый объект"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Актуализируйте параметры дорожного объекта."
              : "Добавьте новый дорожный объект."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Название объекта *
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ремонт трассы М-5, км 34+200 — 42+600"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Вид работ
              </label>
              <Input
                value={form.workType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, workType: e.target.value }))
                }
                placeholder="Капитальный ремонт дорожного покрытия"
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Адрес
            </label>
            <div className="flex gap-2">
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSearchAddress()
                  }
                }}
                placeholder="Москва, Ленинградское ш., вл. 45"
                className="h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                disabled={!form.address.trim() || geocoding}
                onClick={handleSearchAddress}
              >
                {geocoding ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-primary" />
                ) : (
                  "Найти"
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Широта (latitude)
              </label>
              <Input
                value={form.latitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, latitude: e.target.value }))
                }
                placeholder="55.7558"
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Долгота (longitude)
              </label>
              <Input
                value={form.longitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, longitude: e.target.value }))
                }
                placeholder="37.6173"
                className="h-9"
              />
            </div>
          </div>

          {/* Map picker — click to select coordinates and auto-fill address */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Выберите точку на карте
            </label>
            <YandexMapPicker
              latitude={
                form.latitude ? Number.parseFloat(form.latitude) : undefined
              }
              longitude={
                form.longitude ? Number.parseFloat(form.longitude) : undefined
              }
              onSelect={(lat, lng, address) => {
                setForm((prev) => ({
                  ...prev,
                  latitude: lat.toFixed(6),
                  longitude: lng.toFixed(6),
                  address: address || prev.address,
                }))
              }}
              height={250}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Кликните по карте для выбора координат. Адрес заполнится
              автоматически.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Начало периода работ *
              </label>
              <Input
                type="date"
                value={form.workPeriodStart}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    workPeriodStart: e.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Конец периода работ *
              </label>
              <Input
                type="date"
                value={form.workPeriodEnd}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    workPeriodEnd: e.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Комментарий
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Краткая оперативная заметка по объекту"
              className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            {isEdit ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteSiteDialog({
  open,
  onOpenChange,
  site,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  site: ConstructionSite | null
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
            Удаление объекта
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Удалить объект{" "}
            <span className="font-semibold text-foreground">
              {site?.name ?? ""}
            </span>
            ? Действие нельзя отменить.
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

export function CompleteSiteDialog({
  open,
  onOpenChange,
  site,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  site: ConstructionSite | null
  onConfirm: () => void
}) {
  const isEarly =
    site != null && new Date() < new Date(site.workPeriodEnd)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="!place-items-center !text-center">
          <div
            className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
              isEarly
                ? "bg-amber-100 dark:bg-amber-900/30"
                : "bg-emerald-100 dark:bg-emerald-900/30"
            }`}
          >
            <HugeiconsIcon
              icon={isEarly ? AlertCircleIcon : CheckmarkBadge01Icon}
              strokeWidth={2}
              className={`size-6 ${isEarly ? "text-amber-600" : "text-emerald-600"}`}
            />
          </div>
          <AlertDialogTitle className="text-center">
            Завершение объекта
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isEarly ? (
              <>
                <span className="mb-2 block font-semibold text-amber-600">
                  Раньше срока!
                </span>
                Период работ ещё не завершён. Вы уверены, что хотите пометить
                объект{" "}
                <span className="font-semibold text-foreground">
                  {site?.name}
                </span>{" "}
                как готовый?
              </>
            ) : (
              <>
                Пометить объект{" "}
                <span className="font-semibold text-foreground">
                  {site?.name}
                </span>{" "}
                как завершённый? Он будет перемещён в архив.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button
            variant={isEarly ? "default" : "default"}
            className={
              isEarly
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
            onClick={onConfirm}
          >
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              className="mr-1 size-4"
            />
            {isEarly ? "Всё равно завершить" : "Готово"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
