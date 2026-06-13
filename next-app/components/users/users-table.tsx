"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, UserRole } from "@/lib/types"
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/types"
import { UserDialog, DeleteDialog, BlockDialog } from "@/components/users/user-dialogs"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  MoreHorizontalCircle01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  UserBlock01Icon,
  UserCheck01Icon,
  PlusSignCircleIcon,
  SearchIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserCircleIcon,
  TextFontIcon,
  SecurityCheckIcon,
  Briefcase01Icon,
  Activity01Icon,
  Cancel01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

const roleBadgeVariants: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  user: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
}

type SortKey = "username" | "lastName" | "firstName" | "middleName" | "position" | "status"
type SortDir = "asc" | "desc"

interface UsersTableProps {
  initialUsers: User[]
  onDataChange?: () => void
  currentUsername?: string
}

export function UsersTable({ initialUsers, onDataChange, currentUsername }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)

  useEffect(() => { setUsers(initialUsers) }, [initialUsers])
  const [editUser, setEditUser] = useState<User | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [blockUser, setBlockUser] = useState<User | null>(null)

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("lastName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = users

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q) ||
          u.middleName.toLowerCase().includes(q) ||
          u.position.toLowerCase().includes(q)
      )
    }

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter)
    }

    result = [...result].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const cmp = String(av).localeCompare(String(bv), "ru")
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [users, search, roleFilter, sortKey, sortDir])

  const renderSortIcon = (col: SortKey) => {
    if (sortKey !== col) return null
    return (
      <HugeiconsIcon
        icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
        strokeWidth={2}
        className="ml-1 inline size-3"
      />
    )
  }

  const handleSave = async (data: Partial<User> & { password?: string }) => {
    try {
      if (data.id) {
        await api.users.update(data.id, {
          lastName: data.lastName,
          firstName: data.firstName,
          middleName: data.middleName,
          role: data.role,
          position: data.position,
          ...(data.password ? { password: data.password } : {}),
        })
        toast.success("Пользователь сохранён")
      } else {
        await api.users.create({
          username: data.username,
          password: data.password || "password",
          lastName: data.lastName,
          firstName: data.firstName,
          middleName: data.middleName,
          role: data.role,
          position: data.position,
        })
        toast.success("Пользователь создан")
      }
      onDataChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить пользователя"))
    }
  }

  const handleDelete = async () => {
    if (deleteUser) {
      try {
        await api.users.delete(deleteUser.id)
        toast.success("Пользователь удалён")
        onDataChange?.()
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось удалить пользователя"))
      }
      setDeleteUser(null)
    }
  }

  const handleToggleBlock = async () => {
    if (blockUser) {
      try {
        await api.users.toggleBlock(blockUser.id)
        toast.success("Статус пользователя изменён")
        onDataChange?.()
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось изменить статус пользователя"))
      }
      setBlockUser(null)
    }
  }

  return (
    <>
      <Card className="mx-4 lg:mx-6 overflow-hidden">
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5 text-primary" />
            <CardTitle className="shrink-0">Пользователи</CardTitle>
            {users.length > 0 && (
              <Badge variant="secondary" className="text-xs">{users.length}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-8 w-40 pl-8 text-sm sm:w-56"
              />
            </div>

            <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={() => setShowAddDialog(true)}>
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="mr-1.5 size-4" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 cursor-pointer select-none" onClick={() => toggleSort("username")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Пользователь
                    {renderSortIcon("username")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("lastName")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Фамилия
                    {renderSortIcon("lastName")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("firstName")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Имя
                    {renderSortIcon("firstName")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("middleName")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Отчество
                    {renderSortIcon("middleName")}
                  </span>
                </TableHead>
                {/* Role — dropdown filter instead of sort */}
                <TableHead className="select-none">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                        Роль
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1" align="start">
                      {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRoleFilter(roleFilter === value ? null : value as UserRole)}
                          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent ${roleFilter === value ? "bg-accent font-medium" : ""}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${roleBadgeVariants[value]?.split(" ")[0] ?? ""}`} />
                          {label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                  {roleFilter && (
                    <Badge
                      variant="secondary"
                      className={`ml-1.5 cursor-pointer gap-1 text-[10px] px-1.5 py-0 ${roleBadgeVariants[roleFilter] ?? ""}`}
                      onClick={() => setRoleFilter(null)}
                    >
                      {USER_ROLE_LABELS[roleFilter]}
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
                    </Badge>
                  )}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("position")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Должность
                    {renderSortIcon("position")}
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                    Статус
                    {renderSortIcon("status")}
                  </span>
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Ничего не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user.lastName[0]}{user.firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.middleName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs font-normal ${roleBadgeVariants[user.role] ?? ""}`}>
                        {USER_ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.position}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "blocked" ? "destructive" : "secondary"} className="text-xs">
                        {USER_STATUS_LABELS[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                            Редактировать
                          </DropdownMenuItem>
                          {currentUsername !== user.username && (
                            <>
                              <DropdownMenuItem onClick={() => setBlockUser(user)}>
                                <HugeiconsIcon icon={user.status === "blocked" ? UserCheck01Icon : UserBlock01Icon} strokeWidth={2} />
                                {user.status === "blocked" ? "Разблокировать" : "Заблокировать"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteUser(user)}>
                                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                                Удалить
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserDialog key="add" open={showAddDialog} onOpenChange={setShowAddDialog} onSave={handleSave} />
      <UserDialog key={editUser?.id ?? "edit"} open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)} user={editUser} onSave={handleSave} />
      <DeleteDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)} username={deleteUser?.username ?? ""} onConfirm={handleDelete} />
      <BlockDialog open={!!blockUser} onOpenChange={(o) => !o && setBlockUser(null)} username={blockUser?.username ?? ""} isBlocked={blockUser?.status === "blocked"} onConfirm={handleToggleBlock} />
    </>
  )
}
