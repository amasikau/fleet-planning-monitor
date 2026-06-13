"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ru } from "date-fns/locale"
import { api } from "@/lib/api"
import type {
  ConstructionSite,
  EquipmentCoverageItem,
  EquipmentPlan,
  EquipmentPlanStats,
  FleetVehicle,
  FleetVehicleType,
  ServiceStats,
} from "@/lib/types"
import {
  EQUIPMENT_PLAN_SHIFT_LABELS,
  EQUIPMENT_PLAN_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
} from "@/lib/types"
import { getErrorMessage } from "@/lib/feedback"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Building06Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
  HourglassIcon,
  Location01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"
import { SitesOverviewMap } from "@/components/yandex-map"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { DayButton } from "react-day-picker"

/* ─── helpers ─── */

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function dateKey(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10)
}

function todayKey() {
  return dateKey(new Date())
}

/* ─── constants ─── */

const statusStyles: Record<string, string> = {
  planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const VEHICLE_TYPE_COLORS: Partial<Record<FleetVehicleType, string>> = {
  dump_truck: "#3b82f6",
  crane: "#f59e0b",
  excavator: "#8b5cf6",
  bulldozer: "#ef4444",
  tractor: "#10b981",
  loader: "#0ea5e9",
  asphalt_paver: "#f97316",
  road_roller: "#ec4899",
  road_milling_machine: "#84cc16",
  motor_grader: "#14b8a6",
  truck_tractor: "#a855f7",
  flatbed_truck: "#64748b",
  semi_trailer: "#6366f1",
  passenger_car: "#d97706",
  van: "#0891b2",
  pickup: "#16a34a",
}

const FALLBACK_COLORS = [
  "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444",
  "#10b981", "#0ea5e9", "#f97316", "#ec4899",
]

/* ─── MiniCalendar ─── */

const PlansByDateContext = createContext<Map<string, EquipmentPlan[]>>(new Map())

function MiniCalendarDayButton(props: React.ComponentProps<typeof DayButton>) {
  const plansByDate = useContext(PlansByDateContext)
  const key = dateKey(props.day.date)
  const dayPlans = plansByDate.get(key) ?? []
  const shown = dayPlans.slice(0, 3)
  const extra = dayPlans.length - 3

  if (dayPlans.length === 0) {
    return <CalendarDayButton {...props} />
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative inline-flex w-full">
          <CalendarDayButton {...props} />
          <span className="pointer-events-none absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="flex flex-col gap-0.5 text-xs max-w-[220px]">
        {shown.map((p) => (
          <span key={p.id} className="truncate">{p.siteName} · {p.vehicleLabel}</span>
        ))}
        {extra > 0 && <span className="opacity-70">+{extra} ещё</span>}
      </TooltipContent>
    </Tooltip>
  )
}

function MiniCalendar({ plans }: { plans: EquipmentPlan[] }) {
  const plansByDate = useMemo(() => {
    const map = new Map<string, EquipmentPlan[]>()
    for (const plan of plans) {
      const key = plan.workDate.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), plan])
    }
    return map
  }, [plans])

  return (
    <PlansByDateContext.Provider value={plansByDate}>
      <TooltipProvider>
        <Calendar
          locale={ru}
          components={{ DayButton: MiniCalendarDayButton }}
          className="w-full"
        />
      </TooltipProvider>
    </PlansByDateContext.Provider>
  )
}

/* ─── EquipmentOccupancyChart ─── */

type PeriodFilter = "today" | "3days" | "week" | "month"

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  today: "Сегодня",
  "3days": "3 дня",
  week: "Неделя",
  month: "Месяц",
}

function getPeriodRange(filter: PeriodFilter): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)

  if (filter === "3days") end.setDate(end.getDate() + 2)
  else if (filter === "week") end.setDate(end.getDate() + 6)
  else if (filter === "month") end.setDate(end.getDate() + 29)

  return { start, end }
}

type OccupancyRow = Record<string, string | number>

function buildOccupancyData(plans: EquipmentPlan[], filter: PeriodFilter) {
  const { start, end } = getPeriodRange(filter)

  const dates: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }

  const periodPlans = plans.filter((p) => {
    const d = new Date(p.workDate)
    d.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })

  const typesSet = new Set<FleetVehicleType>()
  for (const p of periodPlans) typesSet.add(p.vehicleType)
  const types = Array.from(typesSet)

  const rows: OccupancyRow[] = dates.map((date) => {
    const dk = dateKey(date)
    const row: OccupancyRow = {
      date: new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" }).format(date),
      dateKey: dk,
    }
    for (const type of types) {
      const ids = new Set(
        periodPlans
          .filter((p) => p.workDate.slice(0, 10) === dk && p.vehicleType === type)
          .map((p) => p.vehicleId)
      )
      row[type] = ids.size
    }
    return row
  })

  return { rows, types }
}

function EquipmentOccupancyChart({ plans }: { plans: EquipmentPlan[] }) {
  const [period, setPeriod] = useState<PeriodFilter>("week")
  const { rows, types } = useMemo(() => buildOccupancyData(plans, period), [plans, period])
  const today = todayKey()

  if (rows.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Занятость техники</p>
              <p className="text-xs text-muted-foreground">Количество единиц по дням</p>
            </div>
          </div>
          <PeriodToggle value={period} onChange={setPeriod} />
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">Нет данных за выбранный период</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Занятость техники</p>
            <p className="text-xs text-muted-foreground">Единиц в работе по дням, разбивка по типам</p>
          </div>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={period === "month" ? 8 : 20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <RechartsTooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend
            formatter={(value) => FLEET_VEHICLE_TYPE_LABELS[value as FleetVehicleType] ?? value}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          {rows.some((r) => r.dateKey === today) && (
            <ReferenceLine
              x={rows.find((r) => r.dateKey === today)?.date as string}
              stroke="hsl(var(--primary))"
              strokeDasharray="4 2"
              strokeWidth={1.5}
            />
          )}
          {types.map((type, i) => (
            <Bar
              key={type}
              dataKey={type}
              name={type}
              stackId="a"
              fill={VEHICLE_TYPE_COLORS[type] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              radius={i === types.length - 1 ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function PeriodToggle({ value, onChange }: { value: PeriodFilter; onChange: (v: PeriodFilter) => void }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onChange(v as PeriodFilter) }}
      variant="outline"
      size="sm"
    >
      {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
        <ToggleGroupItem key={key} value={key}>{PERIOD_LABELS[key]}</ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/* ─── FreeEquipmentByType ─── */

function FreeEquipmentByType({ vehicles }: { vehicles: FleetVehicle[] }) {
  const { freeByType, allTypes } = useMemo(() => {
    const free = new Map<FleetVehicleType, number>()
    const total = new Map<FleetVehicleType, number>()
    for (const v of vehicles) {
      total.set(v.type, (total.get(v.type) ?? 0) + 1)
      if (v.status === "reserve") free.set(v.type, (free.get(v.type) ?? 0) + 1)
    }
    const types = Array.from(total.keys()).sort(
      (a, b) => (free.get(b) ?? 0) - (free.get(a) ?? 0)
    )
    return { freeByType: free, allTypes: types }
  }, [vehicles])

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10">
          <HugeiconsIcon icon={HourglassIcon} strokeWidth={2} className="size-5 text-sky-600" />
        </div>
        <div>
          <p className="text-sm font-semibold">Свободная техника</p>
          <p className="text-xs text-muted-foreground">По видам, статус «резерв»</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {allTypes.map((type) => {
          const free = freeByType.get(type) ?? 0
          return (
            <div
              key={type}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30",
                free === 0 && "opacity-40"
              )}
            >
              <span className="text-sm truncate">{FLEET_VEHICLE_TYPE_LABELS[type]}</span>
              <Badge
                variant="secondary"
                className={cn("tabular-nums shrink-0 ml-2", free > 0 && "bg-sky-500/10 text-sky-700 dark:text-sky-300")}
              >
                {free}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── DashboardPage ─── */

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([])
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [serviceStats, setServiceStats] = useState<ServiceStats>({
    scheduled: 0,
    inProgress: 0,
    overdue: 0,
    completed: 0,
  })
  const [planStats, setPlanStats] = useState<EquipmentPlanStats>({
    planned: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    missingActual: 0,
    deficitDemands: 0,
    criticalDeficits: 0,
    averageCoverage: 100,
  })
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [coverage, setCoverage] = useState<EquipmentCoverageItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [vehiclesData, sitesData, serviceData, planStatsData, plansData, coverageData] =
          await Promise.all([
            api.fleet.getAll(),
            api.sites.getAll(),
            api.serviceEvents.getStats(),
            api.equipmentPlans.getStats(),
            api.equipmentPlans.getAll(),
            api.equipmentPlans.getCoverage(),
          ])
        setVehicles(vehiclesData)
        setSites(sitesData)
        setServiceStats(serviceData)
        setPlanStats(planStatsData)
        setPlans(plansData)
        setCoverage(coverageData)
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось загрузить дашборд"))
      } finally {
        setLoading(false)
      }
    }
    void loadDashboard()
  }, [])

  const upcomingPlans = useMemo(
    () => plans.filter((p) => new Date(p.workDate) >= new Date()).slice(0, 8),
    [plans]
  )

  const activeVehicles = vehicles.filter((v) => v.status === "active")
  const reserveVehicles = vehicles.filter((v) => v.status === "reserve")
  const repairVehicles = vehicles.filter((v) => v.status === "repair")
  const sitesWithEquipment = sites.filter((s) => s.vehicleCount > 0)
  const sitesWithCoords = sites.filter((s) => s.latitude != null && s.longitude != null)
  const criticalCoverageItems = coverage.filter((item) => item.deficit > 0 && item.priority === "critical")

  const today = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date())

  const kpiCards = [
    {
      label: "Техника в работе",
      value: activeVehicles.length,
      note: `${planStats.deficitDemands} дефицитов в планах`,
      icon: CheckmarkBadge01Icon,
      iconClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "В ремонте и ТО",
      value: repairVehicles.length,
      note: `${serviceStats.overdue} просроченных заявок`,
      icon: Wrench01Icon,
      iconClass: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "Резерв техники",
      value: reserveVehicles.length,
      note: "Доступно для планирования",
      icon: HourglassIcon,
      iconClass: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Дорожные объекты",
      value: sitesWithEquipment.length,
      note: `${sites.length} активных всего`,
      icon: Building06Icon,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Обеспеченность",
      value: `${planStats.averageCoverage}%`,
      note: `${planStats.deficitDemands} дефицитов потребности`,
      icon: Calendar03Icon,
      iconClass: "bg-violet-500/10 text-violet-600",
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-5 lg:px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 px-4 xl:grid-cols-[1.5fr_1fr] lg:px-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Мониторинг дорожной техники</h1>
          <p className="text-sm text-muted-foreground">
            Сводка загрузки техники, дорожных объектов и ближайших смен
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Row 1: KPI cards */}
      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-5 lg:px-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", card.iconClass)}>
              <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums leading-none">{card.value}</p>
              <p className="mt-1 text-xs font-medium">{card.label}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Map + Calendar */}
      <div className="grid gap-4 px-4 xl:grid-cols-[1.5fr_1fr] lg:px-6">
        {sitesWithCoords.length > 0 ? (
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-primary" />
              <p className="text-sm font-semibold">Карта объектов</p>
              <Badge variant="secondary" className="text-xs">{sitesWithCoords.length}</Badge>
            </div>
            <SitesOverviewMap sites={sites} height={300} />
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm p-6 flex items-center justify-center text-sm text-muted-foreground">
            Объекты с координатами не найдены
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-primary" />
            <p className="text-sm font-semibold">Календарь смен</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Наведите на дату — увидите объект и технику
          </p>
          {plans.length > 0 ? (
            <MiniCalendar plans={plans} />
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">Смены не запланированы</p>
          )}
        </div>
      </div>

      {/* Row 3: Occupancy chart */}
      <div className="px-4 lg:px-6">
        <EquipmentOccupancyChart plans={plans} />
      </div>

      {/* Row 4: Free equipment + Control risks */}
      <div className="grid gap-4 px-4 xl:grid-cols-[1.4fr_1fr] lg:px-6">
        <FreeEquipmentByType vehicles={vehicles} />

        <div className="bg-card rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-5 text-amber-600" />
            </div>
            <p className="text-sm font-semibold">Контрольные риски</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { label: "Просроченные сервисные заявки", value: serviceStats.overdue },
              { label: "План без фактических часов", value: planStats.missingActual },
              { label: "Срывы смен", value: planStats.failed },
              { label: "Дефицит потребностей объектов", value: planStats.deficitDemands },
              { label: "Критические дефициты техники", value: planStats.criticalDeficits },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-sm">{label}</span>
                <Badge
                  variant="secondary"
                  className={cn("tabular-nums", value > 0 && "bg-amber-500/10 text-amber-700 dark:text-amber-300")}
                >
                  {value}
                </Badge>
              </div>
            ))}
            {criticalCoverageItems.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-lg bg-red-500/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.siteName}</span>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-300 tabular-nums">
                    -{item.deficit}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {FLEET_VEHICLE_TYPE_LABELS[item.vehicleType]} · {item.stageName ?? "без этапа"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Upcoming shifts */}
      <div className="px-4 lg:px-6">
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-primary" />
            <p className="text-sm font-semibold">Ближайшие смены техники</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Дата</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead>Техника</TableHead>
                <TableHead>Смена</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    План-график пока не заполнен
                  </TableCell>
                </TableRow>
              ) : (
                upcomingPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="pl-6 text-sm">{formatDate(plan.workDate)}</TableCell>
                    <TableCell className="font-medium">{plan.siteName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{plan.vehicleLabel}</TableCell>
                    <TableCell className="text-sm">{EQUIPMENT_PLAN_SHIFT_LABELS[plan.shift]}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("border-0", statusStyles[plan.status])}>
                        {EQUIPMENT_PLAN_STATUS_LABELS[plan.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
