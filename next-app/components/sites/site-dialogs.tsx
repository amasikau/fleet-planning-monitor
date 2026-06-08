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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  Building06Icon,
  Delete02Icon,
  PencilEdit02Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"

const BELARUS_CITIES = [
  "Минск",
  "Гомель",
  "Могилёв",
  "Витебск",
  "Гродно",
  "Брест",
  "Бобруйск",
  "Барановичи",
  "Борисов",
  "Пинск",
]

export interface SiteFormValues {
  name: string
  city: string
  address: string
  latitude: string
  longitude: string
}

function createInitialForm(site?: ConstructionSite | null): SiteFormValues {
  return {
    name: site?.name ?? "",
    city: site?.city ?? "",
    address: site?.address ?? "",
    latitude: site?.latitude != null ? String(site.latitude) : "",
    longitude: site?.longitude != null ? String(site.longitude) : "",
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
    city?: string
    address?: string
    latitude?: number
    longitude?: number
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
    forwardGeocode(form.city ? `${form.city}, ${addr}` : addr)
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
    if (!isEdit && !form.city) {
      toast.error("Выберите город")
      return
    }
    if (!form.address.trim()) {
      toast.error("Укажите адрес объекта")
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
    if (lon !== undefined && (Number.isNaN(lon) || lon < -180 || lon > 180)) {
      toast.error("Долгота должна быть числом от -180 до 180")
      return
    }
    if (!isEdit && (lat === undefined || lon === undefined)) {
      toast.error("Выберите точку объекта на карте")
      return
    }

    onSave({
      name: form.name.trim(),
      ...(!isEdit ? { city: form.city } : {}),
      address: form.address.trim() || undefined,
      ...(!isEdit ? { latitude: lat, longitude: lon } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
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
              ? "Измените название и адрес дорожного объекта."
              : "Добавьте дорожный объект для дальнейшего планирования работ."}
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
            {!isEdit && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Город *
                </label>
                <Select
                  value={form.city}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {BELARUS_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
                placeholder="Улица, район или участок дороги"
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

          {/* Map picker — click to select coordinates and auto-fill address */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Точка объекта на карте *
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
              {form.latitude && form.longitude && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {Number.parseFloat(form.latitude).toFixed(4)},{" "}
                  {Number.parseFloat(form.longitude).toFixed(4)}
                </p>
              )}
            </div>
          )}
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="!place-items-center !text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              className="size-6 text-emerald-600"
            />
          </div>
          <AlertDialogTitle className="text-center">
            Завершение объекта
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Пометить объект{" "}
            <span className="font-semibold text-foreground">{site?.name}</span>{" "}
            как завершённый? Он будет перемещён в архив.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button
            variant="default"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onConfirm}
          >
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              className="mr-1 size-4"
            />
            Готово
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
