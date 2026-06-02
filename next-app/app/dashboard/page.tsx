"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import type {
  ConstructionSite,
  EquipmentPlan,
  EquipmentPlanStats,
  FleetVehicle,
  ServiceStats,
} from "@/lib/types"
import {
  EQUIPMENT_PLAN_SHIFT_LABELS,
  EQUIPMENT_PLAN_STATUS_LABELS,
} from "@/lib/types"
import { getErrorMessage } from "@/lib/feedback"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Building06Icon,
  Calendar03Icon,
  Car01Icon,
  CheckmarkBadge01Icon,
  HourglassIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

const statusStyles: Record<string, string> = {
  planned: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

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
    withoutDriver: 0,
  })
  const [plans, setPlans] = useState<EquipmentPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [vehiclesData, sitesData, serviceData, planStatsData, plansData] =
          await Promise.all([
            api.fleet.getAll(),
            api.sites.getAll(),
            api.serviceEvents.getStats(),
            api.equipmentPlans.getStats(),
            api.equipmentPlans.getAll(),
          ])
        setVehicles(vehiclesData)
        setSites(sitesData)
        setServiceStats(serviceData)
        setPlanStats(planStatsData)
        setPlans(plansData)
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось загрузить дашборд"))
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const upcomingPlans = useMemo(
    () =>
      plans
        .filter((plan) => new Date(plan.workDate) >= new Date())
        .slice(0, 6),
    [plans]
  )

  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === "active")
  const reserveVehicles = vehicles.filter((vehicle) => vehicle.status === "reserve")
  const repairVehicles = vehicles.filter((vehicle) => vehicle.status === "repair")
  const vehiclesWithoutDriver = vehicles.filter(
    (vehicle) => vehicle.status === "active" && !vehicle.assignedDriver
  )
  const sitesWithEquipment = sites.filter((site) => site.vehicleCount > 0)

  const cards = [
    {
      label: "Техника в работе",
      value: activeVehicles.length,
      note: `${vehiclesWithoutDriver.length} без водителя`,
      icon: CheckmarkBadge01Icon,
      className: "text-emerald-600 bg-emerald-500/10",
    },
    {
      label: "В ремонте и ТО",
      value: repairVehicles.length,
      note: `${serviceStats.overdue} просроченных заявок`,
      icon: Wrench01Icon,
      className: "text-amber-600 bg-amber-500/10",
    },
    {
      label: "Резерв техники",
      value: reserveVehicles.length,
      note: "Доступно для планирования",
      icon: HourglassIcon,
      className: "text-sky-600 bg-sky-500/10",
    },
    {
      label: "Дорожные объекты",
      value: sitesWithEquipment.length,
      note: `${sites.length} активных всего`,
      icon: Building06Icon,
      className: "text-primary bg-primary/10",
    },
    {
      label: "Плановые смены",
      value: planStats.planned + planStats.inProgress,
      note: `${planStats.missingActual} требуют факта`,
      icon: Calendar03Icon,
      className: "text-violet-600 bg-violet-500/10",
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Мониторинг дорожной техники</h1>
        <p className="text-sm text-muted-foreground">
          Сводка загрузки техники, дорожных объектов и ближайших смен
        </p>
      </div>

      <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-5 lg:px-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.className}`}
              >
                <HugeiconsIcon icon={card.icon} strokeWidth={2} className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums leading-none">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-medium">{card.label}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {card.note}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 px-4 xl:grid-cols-[1.4fr_1fr] lg:px-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle>Ближайшие смены техники</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      План-график пока не заполнен
                    </TableCell>
                  </TableRow>
                ) : (
                  upcomingPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="pl-6 text-sm">
                        {formatDate(plan.workDate)}
                      </TableCell>
                      <TableCell className="font-medium">{plan.siteName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plan.vehicleLabel}
                      </TableCell>
                      <TableCell className="text-sm">
                        {EQUIPMENT_PLAN_SHIFT_LABELS[plan.shift]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`border-0 ${statusStyles[plan.status]}`}
                        >
                          {EQUIPMENT_PLAN_STATUS_LABELS[plan.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-5 text-amber-600"
            />
            <CardTitle>Контрольные риски</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Активная техника без водителя</span>
              <Badge variant="secondary">{vehiclesWithoutDriver.length}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Просроченные сервисные заявки</span>
              <Badge variant="secondary">{serviceStats.overdue}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">План без фактических часов</span>
              <Badge variant="secondary">{planStats.missingActual}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Срывы смен</span>
              <Badge variant="secondary">{planStats.failed}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Плановые записи без водителя</span>
              <Badge variant="secondary">{planStats.withoutDriver}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
