"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Notification03Icon,
  Settings02Icon,
  CheckmarkCircle02Icon,
  FlashIcon,
  ComputerIcon,
  AlertCircleIcon,
  UserAdd01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  ContainerTruckIcon,
  UserBlock01Icon,
  LockPasswordIcon,
  MedicalFileIcon,
} from "@hugeicons/core-free-icons"
import { useNotifications, type NotificationCategory } from "@/contexts/notification-context"

const categoryConfig: Record<
  NotificationCategory,
  { label: string; bg: string; text: string; darkText: string; icon: typeof Notification03Icon }
> = {
  system: {
    label: "Системные",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    darkText: "dark:text-blue-400",
    icon: FlashIcon,
  },
  security: {
    label: "Безопасность",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    darkText: "dark:text-amber-400",
    icon: AlertCircleIcon,
  },
  action: {
    label: "Действия",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
    icon: UserAdd01Icon,
  },
}

/* Map known notification titles to specific icons */
const titleIconMap: Record<string, typeof Notification03Icon> = {
  "Обновление системы": FlashIcon,
  "Резервное копирование": CheckmarkCircle02Icon,
  "Техническое обслуживание": Settings02Icon,
  "Новый вход в систему": ComputerIcon,
  "Неудачная попытка входа": AlertCircleIcon,
  "Смена пароля": LockPasswordIcon,
  "Блокировка аккаунта": UserBlock01Icon,
  "Новый пользователь": UserAdd01Icon,
  "Назначение водителя": ContainerTruckIcon,
  "Документы загружены": MedicalFileIcon,
  "Редактирование профиля": PencilEdit02Icon,
  "Удаление пользователя": Delete02Icon,
}

function getNotificationIcon(title: string, category: NotificationCategory) {
  return titleIconMap[title] ?? categoryConfig[category].icon
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "только что"
  if (mins < 60) return `${mins} мин назад`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} назад`
  const days = Math.floor(hours / 24)
  if (days === 1) return "вчера"
  return `${days} ${days < 5 ? "дня" : "дней"} назад`
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

const tabToCategory: Record<string, NotificationCategory | null> = {
  all: null,
  system: "system",
  security: "security",
  action: "action",
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [activeTab, setActiveTab] = useState("all")
  const [settings, setSettings] = useState({
    system: true,
    security: true,
    actions: true,
    push: false,
  })

  const todayCount = useMemo(
    () => notifications.filter((n) => isToday(n.createdAt)).length,
    [notifications]
  )

  const filtered = useMemo(() => {
    const cat = tabToCategory[activeTab]
    return cat ? notifications.filter((n) => n.category === cat) : notifications
  }, [notifications, activeTab])

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Загрузка уведомлений…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          <p className="text-sm text-muted-foreground">
            Системные оповещения и события
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="default" className="tabular-nums">
              {unreadCount} непрочитанных
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              strokeWidth={2}
              className="mr-1.5 size-4"
            />
            Прочитать все
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 px-4 lg:px-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                icon={Notification03Icon}
                strokeWidth={2}
                className="size-5 text-primary"
              />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {notifications.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Всего</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="size-5 text-blue-600 dark:text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {unreadCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Непрочитанных
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <HugeiconsIcon
                icon={FlashIcon}
                strokeWidth={2}
                className="size-5 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {todayCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Сегодня</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Notifications List */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mx-4 lg:mx-6"
      >
        <TabsList>
          <TabsTrigger value="all">
            Все
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="system">Системные</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="action">Действия</TabsTrigger>
        </TabsList>

        {["all", "system", "security", "action"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <HugeiconsIcon
                      icon={Notification03Icon}
                      strokeWidth={1.5}
                      className="size-7 text-muted-foreground"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Нет уведомлений в этой категории
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {filtered.map((n) => {
                    const cfg = categoryConfig[n.category]
                    const icon = getNotificationIcon(n.title, n.category)
                    return (
                      <div
                        key={n.id}
                        className={`group/row flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:items-center sm:gap-4 sm:px-6 ${
                          !n.read
                            ? "border-l-2 border-l-blue-500 bg-blue-500/[0.03] dark:bg-blue-500/[0.06]"
                            : "border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
                        >
                          <HugeiconsIcon
                            icon={icon}
                            strokeWidth={2}
                            className={`size-[18px] ${cfg.text} ${cfg.darkText}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`truncate text-sm ${
                                !n.read ? "font-semibold" : "font-medium"
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {n.description}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>

                        {/* Action */}
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 px-2 text-xs opacity-0 transition-opacity group-hover/row:opacity-100 max-sm:opacity-100"
                            onClick={() => markAsRead(n.id)}
                          >
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              strokeWidth={2}
                              className="mr-1 size-3.5"
                            />
                            Прочитано
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Settings */}
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                icon={Settings02Icon}
                strokeWidth={2}
                className="size-[18px] text-primary"
              />
            </div>
            <CardTitle>Настройки уведомлений</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {(
            [
              {
                key: "system" as const,
                title: "Системные уведомления",
                description:
                  "Обновления, техобслуживание, резервное копирование",
              },
              {
                key: "security" as const,
                title: "Уведомления безопасности",
                description: "Входы в систему, блокировки, смены паролей",
              },
              {
                key: "actions" as const,
                title: "Уведомления о действиях",
                description:
                  "Создание, редактирование, удаление записей",
              },
              {
                key: "push" as const,
                title: "Push-уведомления в браузере",
                description:
                  "Показывать уведомления даже когда вкладка неактивна",
              },
            ] as const
          ).map((item, idx, arr) => (
            <div key={item.key}>
              <label className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={() => toggleSetting(item.key)}
                />
              </label>
              {idx < arr.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
