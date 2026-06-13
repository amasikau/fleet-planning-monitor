"use client"

import { useState, useEffect, useCallback } from "react"
import { UsersStats } from "@/components/users/users-stats"
import { UsersTable } from "@/components/users/users-table"
import { AuditLog } from "@/components/users/audit-log"
import type { User, AuditLogEntry } from "@/lib/types"
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/types"
import { api } from "@/lib/api"
import { ExportActions } from "@/components/export-actions"
import { useRole } from "@/contexts/role-context"
import { useRouter } from "next/navigation"
import { getErrorMessage } from "@/lib/feedback"
import {
  exportDataAsDocx,
  exportDataAsXlsx,
  formatRuDate,
  todayInputDate,
  type ExportDocumentConfig,
} from "@/lib/export-documents"
import { toast } from "sonner"

function buildUsersExportConfig(users: User[]): ExportDocumentConfig {
  const today = todayInputDate()

  return {
    fileName: `users_${today}`,
    title: "Список пользователей",
    subtitle: "Учетные записи и права доступа",
    documentDate: today,
    sections: [
      {
        title: "Пользователи",
        table: {
          emptyText: "Пользователи отсутствуют",
          columns: [
            { header: "Логин", value: "username", width: 18 },
            { header: "Фамилия", value: "lastName", width: 18 },
            { header: "Имя", value: "firstName", width: 18 },
            { header: "Отчество", value: "middleName", width: 18 },
            { header: "Роль", value: "role", width: 18 },
            { header: "Должность", value: "position", width: 26 },
            { header: "Статус", value: "status", width: 16 },
            { header: "Создан", value: "createdAt", width: 16 },
          ],
          rows: users.map((user) => ({
            username: user.username,
            lastName: user.lastName,
            firstName: user.firstName,
            middleName: user.middleName || "—",
            role: USER_ROLE_LABELS[user.role],
            position: user.position || "—",
            status: USER_STATUS_LABELS[user.status],
            createdAt: formatRuDate(user.createdAt),
          })),
        },
      },
    ],
  }
}

export default function UsersPage() {
  const { isAdmin, role, username } = useRole()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUsername, setCurrentUsername] = useState<string>("")

  useEffect(() => {
    if (role && !isAdmin) {
      router.replace("/dashboard")
    }
  }, [role, isAdmin, router])

  const fetchData = useCallback(async () => {
    try {
      const [usersData, auditData] = await Promise.all([
        api.users.getAll(),
        api.users.getAuditLog(),
      ])
      setUsers(usersData)
      setAuditLog(auditData)
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось загрузить данные"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin && role) return
    fetchData()
    setCurrentUsername(username ?? "")
  }, [fetchData, isAdmin, role, username])

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm">Перенаправление...</p>
        </div>
      </div>
    )
  }

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
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Управление пользователями</h1>
          <p className="text-sm text-muted-foreground">
            Просмотр, создание, редактирование и управление доступом пользователей
          </p>
        </div>
        <ExportActions
          onExportExcel={() => exportDataAsXlsx(buildUsersExportConfig(users))}
          onExportDocx={() => exportDataAsDocx(buildUsersExportConfig(users))}
        />
      </div>
      <UsersStats users={users} />
      <UsersTable initialUsers={users} onDataChange={fetchData} currentUsername={currentUsername} />
      <AuditLog entries={auditLog} />
    </div>
  )
}
