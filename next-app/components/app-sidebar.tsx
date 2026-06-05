"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, UserGroupIcon, CommandIcon, ContainerTruckIcon, Wrench01Icon, Car01Icon, Building06Icon, Settings02Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { api } from "@/lib/api"
import { useRole } from "@/contexts/role-context"
import { DASHBOARD_COUNTS_REFRESH_EVENT } from "@/lib/dashboard-events"

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; username: string; avatar: string }
}) {
  const [unassignedCount, setUnassignedCount] = useState(0)
  const [unassignedMechanicsCount, setUnassignedMechanicsCount] = useState(0)
  const [activeServiceCount, setActiveServiceCount] = useState(0)
  const { isAdmin, canEdit } = useRole()

  const refreshCounts = useCallback(() => {
    if (!canEdit) return

    void Promise.allSettled([
      api.drivers.getUnassigned(),
      api.mechanics.getUnassigned(),
      api.serviceEvents.getStats(),
    ]).then(([driversResult, mechanicsResult, serviceResult]) => {
      if (driversResult.status === "fulfilled") {
        setUnassignedCount(driversResult.value.length)
      }
      if (mechanicsResult.status === "fulfilled") {
        setUnassignedMechanicsCount(mechanicsResult.value.length)
      }
      if (serviceResult.status === "fulfilled") {
        setActiveServiceCount(
          serviceResult.value.inProgress + serviceResult.value.overdue
        )
      }
    })
  }, [canEdit])

  useEffect(() => {
    refreshCounts()
    window.addEventListener(DASHBOARD_COUNTS_REFRESH_EVENT, refreshCounts)

    return () => {
      window.removeEventListener(DASHBOARD_COUNTS_REFRESH_EVENT, refreshCounts)
    }
  }, [refreshCounts])

  const navMain = [
    {
      title: "Дашборд",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "План-график",
      url: "/dashboard/planning",
      icon: (
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
      ),
      children: [
        {
          title: "Планирование",
          url: "/dashboard/planning",
        },
        {
          title: "Виды работ",
          url: "/dashboard/planning/work-types",
        },
        {
          title: "Этапы",
          url: "/dashboard/planning/stages",
        },
      ],
    },
    {
      title: "Строительная техника",
      url: "/dashboard/fleet",
      icon: (
        <HugeiconsIcon icon={Car01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "ТО и ремонты",
      url: "/dashboard/service",
      icon: (
        <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
      ),
      badge: canEdit ? activeServiceCount : undefined,
    },
    {
      title: "Дорожные объекты",
      url: "/dashboard/sites",
      icon: (
        <HugeiconsIcon icon={Building06Icon} strokeWidth={2} />
      ),
    },
  ]

  const personnel = [
    {
      name: "Водители",
      url: "/dashboard/drivers",
      icon: <HugeiconsIcon icon={ContainerTruckIcon} strokeWidth={2} />,
      badge: canEdit ? unassignedCount : undefined,
    },
    {
      name: "Механики",
      url: "/dashboard/mechanics",
      icon: <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} />,
      badge: canEdit ? unassignedMechanicsCount : undefined,
    },
  ]

  const admin = [
    {
      name: "Пользователи",
      url: "/dashboard/users",
      icon: (
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      ),
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
                <span className="text-base font-semibold">Панель управления</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={personnel} label="Персонал" />
        {isAdmin && <NavDocuments items={admin} label="Администрирование" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
