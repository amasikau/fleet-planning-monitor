"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/types"
import type { User } from "@/lib/types"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Activity01Icon,
  Briefcase01Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
  LockPasswordIcon,
  Moon02Icon,
  PencilEdit02Icon,
  SecurityCheckIcon,
  TextFontIcon,
  UserCircleIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons"

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  moderator:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  mechanic:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  driver: "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400",
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "Не указано"

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

function ReadOnlyField({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: typeof TextFontIcon
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="min-h-6 truncate text-sm font-medium">{value || "-"}</div>
    </div>
  )
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  onVisibleChange,
  onChange,
}: {
  id: string
  label: string
  value: string
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => onVisibleChange(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
        >
          <HugeiconsIcon
            icon={visible ? ViewOffIcon : ViewIcon}
            strokeWidth={2}
            className="size-4"
          />
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [username, setUsername] = useState("")
  const [usernameSaving, setUsernameSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    api.profile
      .get()
      .then((data) => {
        if (!mounted) return
        setUser(data)
        setUsername(data.username)
      })
      .catch(() => {
        if (mounted) toast.error("Не удалось загрузить профиль")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const fullName = useMemo(() => {
    if (!user) return ""
    return [user.lastName, user.firstName, user.middleName]
      .filter(Boolean)
      .join(" ")
  }, [user])

  const initials = useMemo(() => {
    if (!user) return ""
    return `${user.lastName[0] ?? ""}${user.firstName[0] ?? ""}` || "П"
  }, [user])

  async function handleUsernameSave() {
    if (!user) return

    const nextUsername = username.trim()

    if (nextUsername.length < 3) {
      toast.error("Логин должен содержать минимум 3 символа")
      return
    }

    if (nextUsername === user.username) {
      toast.info("Логин не изменился")
      return
    }

    try {
      setUsernameSaving(true)
      const updated = await api.profile.update({ username: nextUsername })
      setUser(updated)
      setUsername(updated.username)
      toast.success("Логин обновлён")
      router.refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось обновить логин"))
    } finally {
      setUsernameSaving(false)
    }
  }

  async function handlePasswordSave() {
    if (!currentPassword) {
      toast.error("Введите текущий пароль")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Новый пароль должен содержать минимум 6 символов")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают")
      return
    }

    try {
      setPasswordSaving(true)
      await api.profile.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Пароль обновлён")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось обновить пароль"))
    } finally {
      setPasswordSaving(false)
    }
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

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="rounded-lg border bg-card px-5 py-4 text-sm text-muted-foreground">
          Профиль недоступен
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-normal">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          {fullName || `@${user.username}`}
        </p>
      </div>

      <div className="grid gap-4 px-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-6">
        <Card className="overflow-hidden">
          <div className="h-2 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--chart-2)),hsl(var(--chart-5)))]" />
          <CardContent className="flex flex-col gap-5 p-5">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 rounded-xl">
                <AvatarFallback className="rounded-xl bg-primary/10 text-xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{fullName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={`${ROLE_BADGE_COLORS[user.role]} border-0`}>
                {USER_ROLE_LABELS[user.role]}
              </Badge>
              <Badge
                variant={user.status === "blocked" ? "destructive" : "secondary"}
              >
                {USER_STATUS_LABELS[user.status]}
              </Badge>
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <HugeiconsIcon
                    icon={Activity01Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <span className="flex-1 text-muted-foreground">Состояние</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Онлайн
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                </span>
                <span className="flex-1 text-muted-foreground">
                  Регистрация
                </span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    strokeWidth={2}
                    className="size-5 text-muted-foreground"
                  />
                </span>
                <CardTitle className="text-base">Данные сотрудника</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ReadOnlyField
                label="Фамилия"
                value={user.lastName}
                icon={TextFontIcon}
              />
              <ReadOnlyField
                label="Имя"
                value={user.firstName}
                icon={TextFontIcon}
              />
              <ReadOnlyField
                label="Отчество"
                value={user.middleName}
                icon={TextFontIcon}
              />
              <ReadOnlyField
                label="Должность"
                value={user.position}
                icon={Briefcase01Icon}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <HugeiconsIcon
                    icon={PencilEdit02Icon}
                    strokeWidth={2}
                    className="size-5 text-muted-foreground"
                  />
                </span>
                <CardTitle className="text-base">Логин</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-muted-foreground">
                  Текущий логин
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="max-w-xl"
                />
              </div>
              <Button
                onClick={handleUsernameSave}
                disabled={usernameSaving || username.trim() === user.username}
                className="lg:w-40"
              >
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                Сохранить
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <HugeiconsIcon
                    icon={SecurityCheckIcon}
                    strokeWidth={2}
                    className="size-5 text-muted-foreground"
                  />
                </span>
                <CardTitle className="text-base">Пароль</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <PasswordInput
                  id="current-password"
                  label="Текущий пароль"
                  value={currentPassword}
                  visible={showCurrentPassword}
                  onVisibleChange={setShowCurrentPassword}
                  onChange={setCurrentPassword}
                />
                <PasswordInput
                  id="new-password"
                  label="Новый пароль"
                  value={newPassword}
                  visible={showNewPassword}
                  onVisibleChange={setShowNewPassword}
                  onChange={setNewPassword}
                />
                <PasswordInput
                  id="confirm-password"
                  label="Подтверждение"
                  value={confirmPassword}
                  visible={showConfirmPassword}
                  onVisibleChange={setShowConfirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={handlePasswordSave}
                  disabled={
                    passwordSaving ||
                    !currentPassword ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  Обновить пароль
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <HugeiconsIcon
                    icon={Moon02Icon}
                    strokeWidth={2}
                    className="size-5 text-muted-foreground"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Тёмная тема</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {theme === "dark" ? "Включена" : "Выключена"}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
