"use client"

import type { FleetVehicle } from "@/lib/types"
import { FLEET_VEHICLE_STATUS_LABELS } from "@/lib/types"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Car01Icon,
  ContainerTruckIcon,
  Delete02Icon,
  MoreHorizontalCircle01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"

const statusStyles: Record<FleetVehicle["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  reserve: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  repair: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export function FleetCardGrid({
  vehicles,
  onEdit,
  onDelete,
}: {
  vehicles: FleetVehicle[]
  onEdit: (vehicle: FleetVehicle) => void
  onDelete: (vehicle: FleetVehicle) => void
}) {
  return (
    <div className="mx-4 grid gap-4 md:grid-cols-2 lg:mx-6 xl:grid-cols-3">
      {vehicles.length === 0 ? (
        <Card className="md:col-span-2 xl:col-span-3">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <HugeiconsIcon
              icon={Car01Icon}
              strokeWidth={1.6}
              className="size-8"
            />
            <p className="text-sm">Машины не найдены</p>
          </CardContent>
        </Card>
      ) : (
        vehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            className="relative overflow-hidden border-border/80"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent_0%,var(--color-primary)_35%,transparent_100%)] opacity-70" />
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <HugeiconsIcon
                      icon={Car01Icon}
                      strokeWidth={1.8}
                      className="size-5 text-primary"
                    />
                  </div>
                  <div>
                    <CardTitle>{vehicle.brand}</CardTitle>
                    <CardDescription>{vehicle.model}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <HugeiconsIcon
                        icon={MoreHorizontalCircle01Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                      <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                      Изменить
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(vehicle)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0 text-[10px]"
                >
                  {vehicle.plateNumber}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`border-0 ${statusStyles[vehicle.status]}`}
                >
                  {FLEET_VEHICLE_STATUS_LABELS[vehicle.status]}
                </Badge>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-start gap-2">
                  <HugeiconsIcon
                    icon={ContainerTruckIcon}
                    strokeWidth={1.8}
                    className="mt-0.5 size-4 text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {vehicle.assignedDriver?.fullName ??
                        "Водитель не закреплён"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.assignedDriver?.username ??
                        "Можно назначить в карточке редактирования"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="min-h-10 text-sm leading-6 text-muted-foreground">
                {vehicle.notes || "Примечание не добавлено"}
              </p>

              <div className="text-xs text-muted-foreground">
                Обновлено {formatDate(vehicle.updatedAt)}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
