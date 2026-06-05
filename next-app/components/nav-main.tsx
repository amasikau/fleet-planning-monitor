"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    badge?: number
    children?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const childActive =
              item.children?.some((child) => pathname === child.url) ?? false
            const isActive = pathname === item.url || childActive
            const isOpen = openItems[item.title] ?? childActive

            return (
              <SidebarMenuItem key={item.title}>
                {item.children?.length ? (
                  <>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() =>
                        setOpenItems((current) => ({
                          ...current,
                          [item.title]: !isOpen,
                        }))
                      }
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      <span className="ml-auto text-xs">{isOpen ? "−" : "+"}</span>
                    </SidebarMenuButton>
                    {isOpen && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === child.url}
                            >
                              <Link href={child.url}>
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                {item.badge != null && item.badge > 0 && (
                  <SidebarMenuBadge className="bg-destructive/15 text-destructive text-[11px] font-semibold">
                    {item.badge}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
