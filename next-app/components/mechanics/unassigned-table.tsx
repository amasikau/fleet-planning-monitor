"use client"

import { useState } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { FleetVehicleType, User } from "@/lib/types"
import { AssignMechanicDialog } from "./assign-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, UserAdd01Icon, HourglassIcon } from "@hugeicons/core-free-icons"

interface UnassignedTableProps {
  users: User[]
  onAssign: (data: { userId: string; vehicleTypes: FleetVehicleType[]; documents: { type: string; fileName: string; filePath: string }[] }) => void
  readonly?: boolean
}

export function UnassignedMechanicsTable({ users, onAssign, readonly }: UnassignedTableProps) {
  const [search, setSearch] = useState("")
  const [assignUser, setAssignUser] = useState<User | null>(null)

  const filtered = search
    ? users.filter((u) => {
        const q = search.toLowerCase()
        return (
          u.username.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.firstName.toLowerCase().includes(q)
        )
      })
    : users

  return (
    <>
      <Card className="mx-4 lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <HugeiconsIcon icon={HourglassIcon} strokeWidth={2} className="size-5 text-amber-500" />
            <CardTitle>Неназначенные механики</CardTitle>
            {users.length > 0 && (
              <Badge variant="secondary" className="text-xs">{users.length}</Badge>
            )}
          </div>

          <div className="relative w-40 sm:w-56">
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={1.5} className="size-8" />
              <p className="text-sm">
                {users.length === 0
                  ? "Все механики назначены"
                  : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Пользователь</TableHead>
                  <TableHead>Фамилия</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Отчество</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Статус</TableHead>
                  {!readonly && <TableHead className="w-32" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
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
                    <TableCell className="text-muted-foreground">{user.position}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "blocked" ? "destructive" : "secondary"} className="text-xs">
                        {user.status === "blocked" ? "Заблокирован" : "Активен"}
                      </Badge>
                    </TableCell>
                    {!readonly && (
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => setAssignUser(user)}
                          disabled={user.status === "blocked"}
                        >
                          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="mr-1.5 size-4" />
                          Назначить
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!readonly && assignUser && (
        <AssignMechanicDialog
          key={assignUser.id}
          open={!!assignUser}
          onOpenChange={(o) => !o && setAssignUser(null)}
          user={assignUser}
          onAssign={(data) => {
            onAssign(data)
            setAssignUser(null)
          }}
        />
      )}
    </>
  )
}
