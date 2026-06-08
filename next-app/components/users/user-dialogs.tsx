"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User, UserRole } from "@/lib/types"
import { USER_ROLE_LABELS } from "@/lib/types"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, UserBlock01Icon, UserCheck01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSave: (data: Partial<User>) => void
}

const roleDotColors: Record<UserRole, string> = {
  admin: "bg-red-500",
  user: "bg-slate-500",
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
  const isEdit = !!user
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    username: user?.username ?? "",
    lastName: user?.lastName ?? "",
    firstName: user?.firstName ?? "",
    middleName: user?.middleName ?? "",
    role: (user?.role ?? "user") as UserRole,
    position: user?.position ?? "",
    password: "",
  })

  const wrappedOnOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  const handleSave = () => {
    if (!isEdit && form.username.length < 3) {
      toast.error("Логин должен содержать минимум 3 символа")
      return
    }
    if (!isEdit && form.password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов")
      return
    }
    if (!form.lastName.trim() || !form.firstName.trim()) {
      toast.error("Фамилия и имя обязательны")
      return
    }
    if (!form.position.trim()) {
      toast.error("Укажите должность")
      return
    }
    onSave({ ...user, ...form })
    onOpenChange(false)
  }

  const initials = form.lastName && form.firstName
    ? `${form.lastName[0]}${form.firstName[0]}`
    : "?"

  return (
    <Dialog open={open} onOpenChange={wrappedOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Редактирование" : "Новый пользователь"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные и нажмите Сохранить"
              : "Заполните все поля для создания пользователя"}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex gap-5">
          <div className="flex flex-col items-center gap-2 pt-1">
            <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/25">
              <AvatarFallback className="text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className={`h-2 w-2 rounded-full ${roleDotColors[form.role]}`} />
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Логин</label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="username" disabled={isEdit} className="h-8 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Фамилия</label>
              <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Иванов" className="h-8 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Имя</label>
              <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Алексей" className="h-8 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Отчество</label>
              <Input value={form.middleName} onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))} placeholder="Петрович" className="h-8 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Роль</label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${roleDotColors[value as UserRole]}`} />
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Должность</label>
              <Input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} placeholder="Специалист по планированию" className="h-8 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {isEdit ? "Новый пароль" : "Пароль"}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={isEdit ? "Оставьте пустым, если не меняется" : "Введите пароль"}
                  className="h-8 pr-9 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => wrappedOnOpenChange(false)}>Отмена</Button>
          <Button size="sm" onClick={handleSave}>{isEdit ? "Сохранить" : "Создать"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Delete dialog with red theme, icon, and confirmation checkbox ── */

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  onConfirm: () => void
}

export function DeleteDialog({ open, onOpenChange, username, onConfirm }: DeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleOpenChange = (v: boolean) => {
    if (!v) setConfirmed(false)
    onOpenChange(v)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-red-200 dark:border-red-900/50">
        <AlertDialogHeader className="!place-items-center !text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center">Удаление пользователя</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Вы собираетесь удалить пользователя <span className="font-semibold text-foreground">{username}</span>.
            Все данные будут потеряны безвозвратно.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
          <Checkbox
            id="confirm-delete"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
            className="mt-0.5 border-red-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <label htmlFor="confirm-delete" className="text-sm leading-snug text-red-800 dark:text-red-300 cursor-pointer select-none">
            Я подтверждаю удаление пользователя и понимаю, что это действие необратимо
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmed(false)}>Отмена</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!confirmed}
            onClick={() => { onConfirm(); setConfirmed(false) }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-1 size-4" />
            Удалить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ── Block / Unblock dialog with icon ── */

interface BlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  isBlocked?: boolean
  onConfirm: () => void
}

export function BlockDialog({ open, onOpenChange, username, isBlocked, onConfirm }: BlockDialogProps) {
  const unblock = !!isBlocked

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="!place-items-center !text-center">
          <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${unblock ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
            <HugeiconsIcon
              icon={unblock ? UserCheck01Icon : UserBlock01Icon}
              strokeWidth={2}
              className={`size-6 ${unblock ? "text-emerald-600" : "text-amber-600"}`}
            />
          </div>
          <AlertDialogTitle className="text-center">
            {unblock ? "Разблокировка" : "Блокировка"} пользователя
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {unblock
              ? <>Разблокировать <span className="font-semibold text-foreground">{username}</span>? Пользователь снова получит доступ к системе.</>
              : <>Заблокировать <span className="font-semibold text-foreground">{username}</span>? Пользователь потеряет доступ к системе.</>
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <Button
            variant={unblock ? "default" : "destructive"}
            onClick={onConfirm}
          >
            <HugeiconsIcon icon={unblock ? UserCheck01Icon : UserBlock01Icon} strokeWidth={2} className="mr-1 size-4" />
            {unblock ? "Разблокировать" : "Заблокировать"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
