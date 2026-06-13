"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
  EquipmentPlanStatus,
  FleetVehicle,
  FleetVehicleType,
  ServiceEvent,
  ServiceStats,
} from "@/lib/types"
import {
  EQUIPMENT_PLAN_STATUS_LABELS,
  FLEET_VEHICLE_STATUS_LABELS,
  FLEET_VEHICLE_TYPE_LABELS,
  SERVICE_EVENT_STATUS_LABELS,
  SERVICE_EVENT_TYPE_LABELS,
} from "@/lib/types"
import { getErrorMessage } from "@/lib/feedback"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { ExportActions } from "@/components/export-actions"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  formatRuDate,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"

/* ─── helpers ─── */

/** Local YYYY-MM-DD — must match `plan.workDate.slice(0,10)` without TZ shift. */
function localDateKey(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${day}`
}

function todayKey() {
  return localDateKey(new Date())
}

const dayMonthFmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" })
const longDayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" })

function dateInPeriod(date: string, startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return false

  const target = new Date(date)
  const start = new Date(startDate ?? endDate ?? date)
  const end = new Date(endDate ?? startDate ?? date)
  target.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return target >= start && target <= end
}

function buildDashboardExportConfig({
  exportDate,
  vehicles,
  sites,
  plans,
  serviceEvents,
  serviceStats,
  planStats,
  coverage,
}: {
  exportDate: string
  vehicles: FleetVehicle[]
  sites: ConstructionSite[]
  plans: EquipmentPlan[]
  serviceEvents: ServiceEvent[]
  serviceStats: ServiceStats
  planStats: EquipmentPlanStats
  coverage: EquipmentCoverageItem[]
}): ExportDocumentConfig {
  const dayPlans = plans.filter((plan) => plan.workDate.slice(0, 10) === exportDate)
  const dayServiceEvents = serviceEvents.filter((event) =>
    dateInPeriod(exportDate, event.startDate, event.endDate ?? event.dueAt)
  )
  const dayVehicleIds = new Set(dayPlans.map((plan) => plan.vehicleId))
  const daySiteIds = new Set(dayPlans.map((plan) => plan.siteId))
  const repairVehicleIds = new Set(dayServiceEvents.map((event) => event.vehicleId))
  const readyVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.status !== "repair" &&
      !dayVehicleIds.has(vehicle.id) &&
      !repairVehicleIds.has(vehicle.id)
  )
  const criticalCoverageItems = coverage.filter(
    (item) => item.deficit > 0 && item.priority === "critical"
  )

  return {
    fileName: `dashboard_${exportDate}`,
    title: "Сводные данные мониторинга дорожной техники",
    subtitle: "Показатели загрузки, объектов и сервисных рисков",
    documentDate: exportDate,
    sections: [
      {
        title: "Основные показатели",
        table: {
          columns: [
            { header: "Показатель", value: "label", width: 38 },
            { header: "Значение", value: "value", width: 18 },
            { header: "Примечание", value: "note", width: 42 },
          ],
          rows: [
            {
              label: "Всего единиц техники",
              value: vehicles.length,
              note: "Единицы строительной техники в системе",
            },
            {
              label: "Назначено на дату",
              value: dayVehicleIds.size,
              note: "Уникальная техника в план-графике",
            },
            {
              label: "Доступно без назначения",
              value: readyVehicles.length,
              note: "Готова или не используется, без смены на выбранную дату",
            },
            {
              label: "ТО и ремонты на дату",
              value: dayServiceEvents.length,
              note: "Заявки, период которых пересекает выбранную дату",
            },
            {
              label: "Дорожные объекты с техникой",
              value: daySiteIds.size,
              note: `${sites.length} активных объектов всего`,
            },
            {
              label: "Средняя обеспеченность",
              value: `${planStats.averageCoverage}%`,
              note: `${planStats.deficitDemands} дефицитов потребности`,
            },
            {
              label: "Критические дефициты",
              value: criticalCoverageItems.length,
              note: "Потребности с высоким приоритетом и нехваткой техники",
            },
            {
              label: "Просроченные заявки",
              value: serviceStats.overdue,
              note: "Общая контрольная величина раздела ТО и ремонтов",
            },
          ],
        },
      },
      {
        title: "Назначения техники на дату",
        table: {
          emptyText: "На выбранную дату техника не назначена",
          columns: [
            { header: "Объект", value: "site", width: 30 },
            { header: "Этап", value: "stage", width: 28 },
            { header: "Техника", value: "vehicle", width: 32 },
            { header: "Тип техники", value: "type", width: 28 },
            { header: "Смена", value: "shift", width: 14 },
            { header: "Часы", value: "hours", width: 10 },
            { header: "Статус", value: "status", width: 18 },
          ],
          rows: dayPlans.map((plan) => ({
            site: plan.siteName,
            stage: plan.stageName ?? "без этапа",
            vehicle: plan.vehicleLabel,
            type: FLEET_VEHICLE_TYPE_LABELS[plan.vehicleType],
            shift: plan.shift === "day" ? "Дневная" : "Ночная",
            hours: plan.plannedHours,
            status: EQUIPMENT_PLAN_STATUS_LABELS[plan.status],
          })),
        },
      },
      {
        title: "ТО и ремонты на дату",
        table: {
          emptyText: "На выбранную дату активных ТО и ремонтов нет",
          columns: [
            { header: "Техника", value: "vehicle", width: 32 },
            { header: "Заявка", value: "title", width: 34 },
            { header: "Тип", value: "type", width: 18 },
            { header: "Период", value: "period", width: 24 },
            { header: "Статус", value: "status", width: 18 },
          ],
          rows: dayServiceEvents.map((event) => ({
            vehicle: event.vehicleLabel,
            title: event.title,
            type: SERVICE_EVENT_TYPE_LABELS[event.type],
            period: `${formatRuDate(event.startDate)} - ${formatRuDate(event.endDate ?? event.dueAt)}`,
            status: SERVICE_EVENT_STATUS_LABELS[event.status],
          })),
        },
      },
      {
        title: "Состояние техники",
        table: {
          columns: [
            { header: "Техника", value: "vehicle", width: 32 },
            { header: "Тип", value: "type", width: 28 },
            { header: "Госномер", value: "plate", width: 16 },
            { header: "Состояние", value: "status", width: 18 },
            { header: "План на дату", value: "assignment", width: 38 },
          ],
          rows: vehicles.map((vehicle) => {
            const assignments = dayPlans
              .filter((plan) => plan.vehicleId === vehicle.id)
              .map((plan) => plan.siteName)
            const service = dayServiceEvents.find((event) => event.vehicleId === vehicle.id)

            return {
              vehicle: `${vehicle.brand} ${vehicle.model}`,
              type: FLEET_VEHICLE_TYPE_LABELS[vehicle.type],
              plate: vehicle.plateNumber,
              status: FLEET_VEHICLE_STATUS_LABELS[vehicle.status],
              assignment:
                assignments.length > 0
                  ? Array.from(new Set(assignments)).join("; ")
                  : service
                    ? `ТО/ремонт: ${service.title}`
                    : "не назначена",
            }
          }),
        },
      },
    ],
  }
}

/* ─── constants ─── */

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

function typeColor(type: FleetVehicleType, index = 0) {
  return VEHICLE_TYPE_COLORS[type] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

const STATUS_ORDER: EquipmentPlanStatus[] = ["planned", "in_progress", "completed", "failed"]

const STATUS_COLORS: Record<EquipmentPlanStatus, string> = {
  planned: "#0ea5e9",
  in_progress: "#f59e0b",
  completed: "#10b981",
  failed: "#ef4444",
}

const RECHARTS_TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
} as const

/* ─── MiniCalendar ─── */

const PlansByDateContext = createContext<Map<string, EquipmentPlan[]>>(new Map())

function MiniCalendarDayButton(props: React.ComponentProps<typeof DayButton>) {
  const plansByDate = useContext(PlansByDateContext)
  const key = localDateKey(props.day.date)
  const dayPlans = plansByDate.get(key) ?? []

  // Unique vehicle types present that day → coloured dots under the number.
  const dotTypes: FleetVehicleType[] = []
  for (const p of dayPlans) {
    if (!dotTypes.includes(p.vehicleType)) dotTypes.push(p.vehicleType)
  }
  const shownDots = dotTypes.slice(0, 4)

  // Group equipment by site for the hover tooltip.
  const bySite = new Map<string, EquipmentPlan[]>()
  for (const p of dayPlans) {
    bySite.set(p.siteName, [...(bySite.get(p.siteName) ?? []), p])
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative inline-flex w-full">
          <CalendarDayButton {...props} />
          {shownDots.length > 0 && (
            <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
              {shownDots.map((t) => (
                <span
                  key={t}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: typeColor(t) }}
                />
              ))}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        className="flex max-w-[260px] flex-col items-start gap-1.5"
      >
        <p className="text-xs font-semibold">{longDayFmt.format(props.day.date)}</p>
        {dayPlans.length === 0 ? (
          <p className="text-xs text-background/70">Назначенной техники нет</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {Array.from(bySite.entries()).map(([site, sitePlans]) => (
              <div key={site} className="flex flex-col gap-0.5">
                <p className="text-xs font-medium">{site}</p>
                <ul className="flex flex-col gap-0.5">
                  {sitePlans.map((p) => (
                    <li key={p.id} className="flex items-center gap-1.5 text-xs text-background/75">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: typeColor(p.vehicleType) }}
                      />
                      <span className="truncate">{p.vehicleLabel}</span>
                      <span className="text-background/55">· {FLEET_VEHICLE_TYPE_LABELS[p.vehicleType]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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
          /* No selection mode — onDayClick only flips react-day-picker into
             "interactive" mode so it renders DayButton (and our dots/tooltip). */
          onDayClick={() => {}}
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

function eachDay(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

type OccupancyRow = Record<string, string | number>

function buildOccupancyData(plans: EquipmentPlan[], filter: PeriodFilter) {
  const { start, end } = getPeriodRange(filter)
  const dates = eachDay(start, end)

  const periodPlans = plans.filter((p) => {
    const d = new Date(p.workDate)
    d.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })

  const typesSet = new Set<FleetVehicleType>()
  for (const p of periodPlans) typesSet.add(p.vehicleType)
  const types = Array.from(typesSet)

  const rows: OccupancyRow[] = dates.map((date) => {
    const dk = localDateKey(date)
    const row: OccupancyRow = { date: dayMonthFmt.format(date), dateKey: dk }
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

  const hasData = periodPlans.length > 0
  return { rows, types, hasData }
}

function SectionHeader({
  icon,
  iconClass,
  title,
  subtitle,
  action,
}: {
  icon: typeof Calendar03Icon
  iconClass?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10", iconClass)}>
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
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

function EquipmentOccupancyChart({ plans }: { plans: EquipmentPlan[] }) {
  const [period, setPeriod] = useState<PeriodFilter>("week")
  const { rows, types, hasData } = useMemo(() => buildOccupancyData(plans, period), [plans, period])
  const today = todayKey()

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <SectionHeader
        icon={Calendar03Icon}
        title="Занятость техники"
        subtitle="Единиц в работе по дням, разбивка по типам"
        action={<PeriodToggle value={period} onChange={setPeriod} />}
      />
      {!hasData ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          На выбранный период назначенной техники нет
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={period === "month" ? 8 : 20}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={RECHARTS_TOOLTIP_STYLE} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
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
                name={FLEET_VEHICLE_TYPE_LABELS[type] ?? type}
                stackId="a"
                fill={typeColor(type, i)}
                radius={i === types.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ─── UpcomingShiftsChart ─── */

const UPCOMING_HORIZON_DAYS = 14

function buildUpcomingByDay(plans: EquipmentPlan[]) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + UPCOMING_HORIZON_DAYS - 1)
  const dates = eachDay(start, end)

  const inRange = plans.filter((p) => {
    const d = new Date(p.workDate)
    d.setHours(0, 0, 0, 0)
    return d >= start && d <= end
  })

  const rows = dates.map((date) => {
    const dk = localDateKey(date)
    const dayPlans = inRange.filter((p) => p.workDate.slice(0, 10) === dk)
    const row: Record<string, string | number> = { date: dayMonthFmt.format(date) }
    for (const status of STATUS_ORDER) {
      row[status] = dayPlans.filter((p) => p.status === status).length
    }
    return row
  })

  return { rows, total: inRange.length }
}

function UpcomingShiftsChart({ plans }: { plans: EquipmentPlan[] }) {
  const { rows, total } = useMemo(() => buildUpcomingByDay(plans), [plans])

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <SectionHeader
        icon={Calendar03Icon}
        title="Ближайшие смены техники"
        subtitle={`Количество смен по дням на ${UPCOMING_HORIZON_DAYS} дней, по статусу`}
        action={<Badge variant="secondary" className="tabular-nums">{total} смен</Badge>}
      />
      {total === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Ближайших смен не запланировано
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={RECHARTS_TOOLTIP_STYLE} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {STATUS_ORDER.map((status, i) => (
              <Bar
                key={status}
                dataKey={status}
                name={EQUIPMENT_PLAN_STATUS_LABELS[status]}
                stackId="a"
                fill={STATUS_COLORS[status]}
                radius={i === STATUS_ORDER.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ─── ControlRisks ─── */

function ControlRisks({
  serviceStats,
  planStats,
  criticalItems,
}: {
  serviceStats: ServiceStats
  planStats: EquipmentPlanStats
  criticalItems: EquipmentCoverageItem[]
}) {
  const tiles = [
    { label: "Просроченные заявки", value: serviceStats.overdue },
    { label: "Без фактических часов", value: planStats.missingActual },
    { label: "Срывы смен", value: planStats.failed },
    { label: "Дефицит потребностей", value: planStats.deficitDemands },
    { label: "Критические дефициты", value: planStats.criticalDeficits },
    { label: "Объекты в зоне риска", value: criticalItems.length },
  ]

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <SectionHeader
        icon={AlertCircleIcon}
        iconClass="bg-amber-500/10"
        title="Контрольные риски"
        subtitle="Сводка проблемных зон планирования"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map(({ label, value }) => {
          const danger = value > 0
          return (
            <div
              key={label}
              className={cn(
                "flex flex-col gap-1 rounded-lg p-3",
                danger ? "bg-amber-500/10" : "bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums leading-none",
                  danger ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                {value}
              </span>
              <span className="text-xs leading-tight text-muted-foreground">{label}</span>
            </div>
          )
        })}
      </div>
      {criticalItems.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Критические дефициты по объектам</p>
          {criticalItems.slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-lg bg-red-500/5 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.siteName}</span>
                <Badge variant="secondary" className="bg-red-500/10 text-red-700 tabular-nums dark:text-red-300">
                  -{item.deficit}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {FLEET_VEHICLE_TYPE_LABELS[item.vehicleType]} · {item.stageName ?? "без этапа"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── SiteAnalytics (dropdown-driven) ─── */

const ALL_SITES = "__all__"

function buildSiteAnalytics(
  plans: EquipmentPlan[],
  coverage: EquipmentCoverageItem[],
  siteId: string
) {
  const sitePlans = siteId === ALL_SITES ? plans : plans.filter((p) => p.siteId === siteId)
  const siteCoverage = siteId === ALL_SITES ? coverage : coverage.filter((c) => c.siteId === siteId)

  // Equipment distribution by type (unique vehicles).
  const unitsByType = new Map<FleetVehicleType, Set<string>>()
  for (const p of sitePlans) {
    if (!unitsByType.has(p.vehicleType)) unitsByType.set(p.vehicleType, new Set())
    unitsByType.get(p.vehicleType)!.add(p.vehicleId)
  }
  const typeData = Array.from(unitsByType.entries())
    .map(([type, ids], i) => ({
      key: type,
      name: FLEET_VEHICLE_TYPE_LABELS[type],
      value: ids.size,
      color: typeColor(type, i),
    }))
    .sort((a, b) => b.value - a.value)

  // Shift status distribution.
  const statusData = STATUS_ORDER.map((status) => ({
    key: status,
    name: EQUIPMENT_PLAN_STATUS_LABELS[status],
    value: sitePlans.filter((p) => p.status === status).length,
    color: STATUS_COLORS[status],
  })).filter((d) => d.value > 0)

  const uniqueVehicles = new Set(sitePlans.map((p) => p.vehicleId)).size
  const avgCoverage = siteCoverage.length
    ? Math.round(siteCoverage.reduce((sum, c) => sum + c.coveragePercent, 0) / siteCoverage.length)
    : 100
  const deficit = siteCoverage.reduce((sum, c) => sum + c.deficit, 0)

  return {
    typeData,
    statusData,
    kpis: {
      shifts: sitePlans.length,
      uniqueVehicles,
      types: unitsByType.size,
      avgCoverage,
      deficit,
    },
  }
}

function AnalyticsDonut({
  title,
  data,
}: {
  title: string
  data: { key: string; name: string; value: number; color: string }[]
}) {
  return (
    <div className="flex flex-col">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {data.length === 0 ? (
        <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
          Нет данных
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={RECHARTS_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function SiteAnalytics({
  plans,
  sites,
  coverage,
}: {
  plans: EquipmentPlan[]
  sites: ConstructionSite[]
  coverage: EquipmentCoverageItem[]
}) {
  const [siteId, setSiteId] = useState<string>(ALL_SITES)
  const { typeData, statusData, kpis } = useMemo(
    () => buildSiteAnalytics(plans, coverage, siteId),
    [plans, coverage, siteId]
  )

  const kpiTiles = [
    { label: "Смен запланировано", value: kpis.shifts },
    { label: "Единиц техники", value: kpis.uniqueVehicles },
    { label: "Видов техники", value: kpis.types },
    { label: "Средняя обеспеченность", value: `${kpis.avgCoverage}%` },
    { label: "Дефицит единиц", value: kpis.deficit },
  ]

  return (
    <div className="bg-card rounded-xl shadow-sm p-4">
      <SectionHeader
        icon={Building06Icon}
        title="Аналитика по объекту"
        subtitle="Сводная статистика по выбранному дорожному объекту"
        action={
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="w-[240px]" size="sm">
              <SelectValue placeholder="Выберите объект" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SITES}>Все объекты (общая)</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {kpis.shifts === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          По выбранному объекту запланированной техники нет
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {kpiTiles.map((tile) => (
              <div key={tile.label} className="rounded-lg bg-muted/40 p-3">
                <p className="text-2xl font-bold tabular-nums leading-none">{tile.value}</p>
                <p className="mt-1 text-xs leading-tight text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AnalyticsDonut title="Техника по типам" data={typeData} />
            <AnalyticsDonut title="Статусы смен" data={statusData} />
          </div>
        </div>
      )}
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
  const [serviceEvents, setServiceEvents] = useState<ServiceEvent[]>([])
  const [exportDate, setExportDate] = useState(todayInputDate())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          vehiclesData,
          sitesData,
          serviceData,
          planStatsData,
          plansData,
          coverageData,
          serviceEventsData,
        ] =
          await Promise.all([
            api.fleet.getAll(),
            api.sites.getAll(),
            api.serviceEvents.getStats(),
            api.equipmentPlans.getStats(),
            api.equipmentPlans.getAll(),
            api.equipmentPlans.getCoverage(),
            api.serviceEvents.getAll(),
          ])
        setVehicles(vehiclesData)
        setSites(sitesData)
        setServiceStats(serviceData)
        setPlanStats(planStatsData)
        setPlans(plansData)
        setCoverage(coverageData)
        setServiceEvents(serviceEventsData)
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось загрузить дашборд"))
      } finally {
        setLoading(false)
      }
    }
    void loadDashboard()
  }, [])

  const activeVehicles = vehicles.filter((v) => v.status === "active")
  const reserveVehicles = vehicles.filter((v) => v.status === "reserve")
  const repairVehicles = vehicles.filter((v) => v.status === "repair")
  const sitesWithEquipment = sites.filter((s) => s.vehicleCount > 0)
  const sitesWithCoords = sites.filter((s) => s.latitude != null && s.longitude != null)
  const criticalCoverageItems = coverage.filter((item) => item.deficit > 0 && item.priority === "critical")

  const today = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date())

  const kpiCards = [
    {
      label: "Готовая техника",
      value: activeVehicles.length,
      note: "Назначение выполняется через план-график",
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

  const dashboardExportConfig = () =>
    buildDashboardExportConfig({
      exportDate,
      vehicles,
      sites,
      plans,
      serviceEvents,
      serviceStats,
      planStats,
      coverage,
    })

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
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Мониторинг дорожной техники</h1>
          <p className="text-sm text-muted-foreground">
            Сводка загрузки техники, дорожных объектов и ближайших смен
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Дата данных
            <Input
              type="date"
              value={exportDate}
              onChange={(event) => setExportDate(event.target.value)}
              className="h-8 w-40 bg-card"
            />
          </label>
          <ExportActions
            onExportExcel={() => exportDataAsXlsx(dashboardExportConfig())}
            onExportDocx={() => exportDataAsDocx(dashboardExportConfig())}
          />
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
      </div>

      {/* Row 1: KPI cards */}
      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-5 lg:px-6">
        {kpiCards.map((card) => (
          <div key={card.label} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm">
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
      <div className="grid items-start gap-4 px-4 xl:grid-cols-[1.5fr_1fr] lg:px-6">
        {sitesWithCoords.length > 0 ? (
          <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-primary" />
              <p className="text-sm font-semibold">Карта объектов</p>
              <Badge variant="secondary" className="text-xs">{sitesWithCoords.length}</Badge>
            </div>
            <SitesOverviewMap sites={sites} height={440} />
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Объекты с координатами не найдены
          </div>
        )}

        <div className="rounded-xl bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-primary" />
            <p className="text-sm font-semibold">Календарь смен</p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Точки — типы техники. Наведите на дату, чтобы увидеть объект и технику
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

      {/* Row 4: Upcoming shifts chart + Control risks */}
      <div className="grid gap-4 px-4 xl:grid-cols-[1.4fr_1fr] lg:px-6">
        <UpcomingShiftsChart plans={plans} />
        <ControlRisks
          serviceStats={serviceStats}
          planStats={planStats}
          criticalItems={criticalCoverageItems}
        />
      </div>

      {/* Row 5: Per-site analytics */}
      <div className="px-4 lg:px-6">
        <SiteAnalytics plans={plans} sites={sites} coverage={coverage} />
      </div>
    </div>
  )
}
