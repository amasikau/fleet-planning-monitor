"use client"

import { useId } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { FleetVehicleType } from "@/lib/types"
import { FLEET_VEHICLE_TYPE_LABELS } from "@/lib/types"

const vehicleTypeGroups: {
  title: string
  description: string
  types: FleetVehicleType[]
}[] = [
  {
    title: "Дорожные машины",
    description: "Техника для земляных работ, укладки и уплотнения покрытия",
    types: [
      "excavator",
      "bulldozer",
      "loader",
      "asphalt_paver",
      "road_roller",
      "motor_grader",
      "tractor",
    ],
  },
  {
    title: "Грузовой парк",
    description: "Перевозка материалов, тягачи, бортовые машины и кран",
    types: [
      "dump_truck",
      "truck_tractor",
      "flatbed_truck",
      "semi_trailer",
      "crane",
    ],
  },
  {
    title: "Сопровождение",
    description: "Снабжение, выезды мастера и малые оперативные задачи",
    types: ["van", "pickup", "passenger_car"],
  },
]

interface VehicleTypePermissionPickerProps {
  value: FleetVehicleType[]
  onChange: (value: FleetVehicleType[]) => void
  className?: string
}

export function VehicleTypePermissionPicker({
  value,
  onChange,
  className,
}: VehicleTypePermissionPickerProps) {
  const id = useId()

  const toggle = (type: FleetVehicleType) => {
    onChange(
      value.includes(type)
        ? value.filter((selected) => selected !== type)
        : [...value, type]
    )
  }

  return (
    <div className={cn("rounded-lg border bg-muted/20", className)}>
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Допуск по типам техники</p>
          <p className="text-xs text-muted-foreground">
            Выберите типы машин, которые механик может обслуживать
          </p>
        </div>
        <Badge variant={value.length > 0 ? "secondary" : "outline"}>
          {value.length}
        </Badge>
      </div>

      <ScrollArea className="h-72">
        <div className="grid gap-3 p-3">
          {vehicleTypeGroups.map((group) => (
            <div key={group.title} className="grid gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {group.description}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.types.map((type) => {
                  const selected = value.includes(type)
                  const checkboxId = `${id}-${type}`

                  return (
                    <label
                      key={type}
                      htmlFor={checkboxId}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-start gap-3 rounded-md border bg-background p-3 transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={selected}
                        onCheckedChange={() => toggle(type)}
                        className="mt-0.5"
                      />
                      <span className="grid gap-0.5">
                        <span className="text-sm font-medium leading-5">
                          {FLEET_VEHICLE_TYPE_LABELS[type]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Доступ к заявкам и работам по этому типу техники
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
