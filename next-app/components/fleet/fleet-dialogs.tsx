"use client"

import { useState } from "react"
import type { Driver, FleetVehicle, FleetVehicleStatus } from "@/lib/types"
import { FLEET_VEHICLE_STATUS_LABELS } from "@/lib/types"
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
  Car01Icon,
  ContainerTruckIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"

const EMPTY_DRIVER_VALUE = "__none__"

export interface FleetVehicleFormValues {
  brand: string
  model: string
  plateNumber: string
  status: FleetVehicleStatus
  assignedDriverUserId: string | null
  notes: string
}

function getDriverLabel(driver: Driver) {
  return `${driver.lastName} ${driver.firstName} ${driver.middleName}`.trim()
}

function createInitialForm(
  vehicle?: FleetVehicle | null
): FleetVehicleFormValues {
  return {
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    plateNumber: vehicle?.plateNumber ?? "",
    status: vehicle?.status ?? "reserve",
    assignedDriverUserId: vehicle?.assignedDriver?.userId ?? null,
    notes: vehicle?.notes ?? "",
  }
}

export function FleetVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  drivers,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: FleetVehicle | null
  drivers: Driver[]
  onSave: (values: FleetVehicleFormValues) => void
}) {
  const isEdit = !!vehicle
  const [form, setForm] = useState<FleetVehicleFormValues>(() =>
    createInitialForm(vehicle)
  )

  const handleSave = () => {
    if (!form.brand.trim()) {
      toast.error("Укажите марку")
      return
    }
    if (!form.model.trim()) {
      toast.error("Укажите модель")
      return
    }
    if (!form.plateNumber.trim()) {
      toast.error("Укажите госномер")
      return
    }

    onSave({
      ...form,
      brand: form.brand.trim(),
      model: form.model.trim(),
      plateNumber: form.plateNumber.trim().toUpperCase(),
      notes: form.notes.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={isEdit ? PencilEdit02Icon : Car01Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            {isEdit ? "Изменение техники" : "Новая единица техники"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные техники и сохраните изменения"
              : "Добавьте новую единицу строительной техники"}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Марка
            </label>
            <Input
              value={form.brand}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brand: event.target.value }))
              }
              placeholder="КамАЗ"
              className="h-9"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Модель
            </label>
            <Input
              value={form.model}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, model: event.target.value }))
              }
              placeholder="65115"
              className="h-9"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Госномер
            </label>
            <Input
              value={form.plateNumber}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  plateNumber: event.target.value,
                }))
              }
              placeholder="А123АА 77"
              className="h-9"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Статус
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as FleetVehicleStatus,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(
                    FLEET_VEHICLE_STATUS_LABELS
                  ) as FleetVehicleStatus[]
                )
                  .filter((status) => status !== "repair")
                  .map((status) => (
                    <SelectItem key={status} value={status}>
                      {FLEET_VEHICLE_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Закреплённый водитель
            </label>
            <Select
              value={form.assignedDriverUserId ?? EMPTY_DRIVER_VALUE}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  assignedDriverUserId:
                    value === EMPTY_DRIVER_VALUE ? null : value,
                }))
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Без закрепления" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_DRIVER_VALUE}>
                  Не закреплять
                </SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.userId} value={driver.userId}>
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={ContainerTruckIcon}
                        strokeWidth={1.8}
                        className="size-4 text-muted-foreground"
                      />
                      <span>{getDriverLabel(driver)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              placeholder="Краткая пометка по машине"
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

export function DeleteFleetVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: FleetVehicle | null
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
            Удаление техники
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Удалить единицу техники{" "}
            <span className="font-semibold text-foreground">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}
            </span>
            ? Запись исчезнет из автопарка, а действие останется в журнале.
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
