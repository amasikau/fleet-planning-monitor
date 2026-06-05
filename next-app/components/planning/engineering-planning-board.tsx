"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import type {
  EquipmentCoverageItem,
  EquipmentDemand,
  EquipmentPlan,
  FleetVehicleType,
  RoadWorkStage,
  ServiceEvent,
} from "@/lib/types"
import {
  FLEET_VEHICLE_TYPE_LABELS,
  SERVICE_EVENT_STATUS_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
  ROAD_WORK_STAGE_STATUS_LABELS,
  ROAD_WORK_STAGE_TYPE_LABELS,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value))
}

function diffDays(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  return Math.max(Math.round((end.getTime() - start.getTime()) / dayMs), 0)
}

function getDateRange(stages: RoadWorkStage[]) {
  if (stages.length === 0) return null

  const starts = stages.map((stage) => new Date(stage.startDate).getTime())
  const ends = stages.map((stage) => new Date(stage.endDate).getTime())
  const min = new Date(Math.min(...starts))
  const max = new Date(Math.max(...ends))
  min.setHours(0, 0, 0, 0)
  max.setHours(0, 0, 0, 0)
  return { min, max, totalDays: Math.max(diffDays(min, max) + 1, 1) }
}

function buildDateTicks(min: Date, totalDays: number) {
  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(min)
    date.setDate(date.getDate() + index)
    return date
  })
}

export function EngineeringPlanningBoard({
  stages,
  demands,
  plans,
  coverage,
  serviceEvents = [],
}: {
  stages: RoadWorkStage[]
  demands: EquipmentDemand[]
  plans: EquipmentPlan[]
  coverage: EquipmentCoverageItem[]
  serviceEvents?: ServiceEvent[]
}) {
  const ganttRange = useMemo(() => getDateRange(stages), [stages])
  const dateTicks = useMemo(
    () =>
      ganttRange ? buildDateTicks(ganttRange.min, ganttRange.totalDays) : [],
    [ganttRange]
  )

  const loadChartData = useMemo(() => {
    const demandByType = new Map<FleetVehicleType, number>()
    const assignedByType = new Map<FleetVehicleType, Set<string>>()

    demands.forEach((demand) => {
      demandByType.set(
        demand.vehicleType,
        (demandByType.get(demand.vehicleType) ?? 0) + demand.requiredCount
      )
    })
    plans.forEach((plan) => {
      const set = assignedByType.get(plan.vehicleType) ?? new Set<string>()
      set.add(plan.vehicleId)
      assignedByType.set(plan.vehicleType, set)
    })

    const types = new Set<FleetVehicleType>([
      ...demandByType.keys(),
      ...assignedByType.keys(),
    ])

    return Array.from(types).map((type) => ({
      type: FLEET_VEHICLE_TYPE_LABELS[type],
      required: demandByType.get(type) ?? 0,
      assigned: assignedByType.get(type)?.size ?? 0,
    }))
  }, [demands, plans])

  const highRiskItems = coverage.filter(
    (item) => item.deficit > 0 || item.riskLevel !== "low"
  )

  const serviceRisks = useMemo(() => {
    if (plans.length === 0) return []

    const plannedVehicleIds = new Set(plans.map((plan) => plan.vehicleId))
    const range = getDateRange(stages)
    const minDate = range?.min
    const maxDate = range?.max
    const dayMs = 24 * 60 * 60 * 1000

    return serviceEvents
      .filter((event) => {
        if (event.status === "completed") return false
        if (!plannedVehicleIds.has(event.vehicleId)) return false
        if (event.status === "in_progress" || event.status === "overdue") return true
        if (!event.dueAt || !minDate || !maxDate) return event.type === "repair"

        const dueAt = new Date(event.dueAt)
        return (
          dueAt >= new Date(minDate.getTime() - 3 * dayMs) &&
          dueAt <= new Date(maxDate.getTime() + 3 * dayMs)
        )
      })
      .slice(0, 5)
  }, [plans, serviceEvents, stages])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Диаграмма Ганта по этапам дорожных работ</CardTitle>
          <CardDescription>
            Даты этапов, длительность захваток и пересечения технологических потоков.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ganttRange || stages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Этапы пока не заданы. Создайте план через мастер или добавьте этап вручную.
            </p>
          ) : (
            <div className="flex flex-col gap-3 overflow-x-auto">
              <div
                className="grid min-w-[720px] items-center gap-1 pl-56 text-[11px] text-muted-foreground"
                style={{
                  gridTemplateColumns: `repeat(${dateTicks.length}, minmax(28px, 1fr))`,
                }}
              >
                {dateTicks.map((date) => (
                  <span key={date.toISOString()} className="text-center">
                    {formatShortDate(date.toISOString())}
                  </span>
                ))}
              </div>

              <div className="flex min-w-[720px] flex-col gap-2">
                {stages
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.startDate).getTime() -
                      new Date(b.startDate).getTime()
                  )
                  .map((stage) => {
                    const start = new Date(stage.startDate)
                    const end = new Date(stage.endDate)
                    const left =
                      (diffDays(ganttRange.min, start) / ganttRange.totalDays) *
                      100
                    const width =
                      ((diffDays(start, end) + 1) / ganttRange.totalDays) * 100

                    return (
                      <div
                        key={stage.id}
                        className="grid grid-cols-[14rem_minmax(480px,1fr)] items-center gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {stage.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {ROAD_WORK_STAGE_TYPE_LABELS[stage.type]} ·{" "}
                            {ROAD_WORK_STAGE_STATUS_LABELS[stage.status]}
                          </p>
                        </div>
                        <div className="relative h-8 rounded-md bg-muted">
                          <div
                            className="absolute top-1 h-6 rounded-md bg-primary/80"
                            style={{
                              left: `${left}%`,
                              width: `${Math.max(width, 4)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Потребность и назначение техники</CardTitle>
            <CardDescription>
              Сравнение расчётной потребности с фактически назначенными единицами.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Нет данных для диаграммы загрузки.
              </p>
            ) : (
              <ChartContainer
                config={{
                  required: { label: "Нужно", color: "var(--chart-1)" },
                  assigned: { label: "Назначено", color: "var(--chart-2)" },
                }}
                className="h-[280px] w-full"
              >
                <BarChart data={loadChartData} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    dataKey="type"
                    type="category"
                    width={132}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="required" fill="var(--color-required)" radius={4} />
                  <Bar dataKey="assigned" fill="var(--color-assigned)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Инженерные риски плана</CardTitle>
            <CardDescription>
              Дефицит техники, занятость на других сменах и незакрытые потребности.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {highRiskItems.length === 0 && serviceRisks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Критических рисков по текущим потребностям не выявлено.
              </p>
            ) : (
              <>
                {highRiskItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {item.stageName ?? item.siteName}
                      </p>
                      <Badge variant="secondary">Дефицит {item.deficit}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {FLEET_VEHICLE_TYPE_LABELS[item.vehicleType]} ·{" "}
                      {item.recommendation}
                    </p>
                  </div>
                ))}
                {serviceRisks.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{event.vehicleLabel}</p>
                      <Badge variant="secondary">
                        {SERVICE_EVENT_STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {SERVICE_EVENT_TYPE_LABELS[event.type]} · {event.title}
                      {event.dueAt ? ` · ${formatShortDate(event.dueAt)}` : ""}
                    </p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
