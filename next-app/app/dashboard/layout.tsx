import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { NotificationProvider } from "@/contexts/notification-context"
import { RoleProvider } from "@/contexts/role-context"
import { getSession } from "@/app/actions/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const user = {
    name: session.username,
    username: session.username,
    avatar: "",
  }

  return (
    <RoleProvider
      userId={session.id}
      username={session.username}
      role={session.role}
    >
      <NotificationProvider>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <AppSidebar variant="inset" user={user} />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </NotificationProvider>
    </RoleProvider>
  )
}
