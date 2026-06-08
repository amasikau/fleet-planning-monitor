"use client"

import { createContext, useContext, type ReactNode } from "react"

export type UserRole = "admin" | "user"

interface RoleContextValue {
  userId: string | null
  username: string | null
  role: UserRole | null
  isAdmin: boolean
  canEdit: boolean
  canViewAudit: boolean
}

const RoleContext = createContext<RoleContextValue>({
  userId: null,
  username: null,
  role: null,
  isAdmin: false,
  canEdit: false,
  canViewAudit: false,
})

export function RoleProvider({
  userId,
  username,
  role: initialRole,
  children,
}: {
  userId?: string
  username?: string
  role?: string
  children: ReactNode
}) {
  const role = (initialRole as UserRole) ?? null

  const isAdmin = role === "admin"
  const canEdit = role === "admin" || role === "user"
  const canViewAudit = canEdit

  return (
    <RoleContext.Provider
      value={{
        userId: userId ?? null,
        username: username ?? null,
        role,
        isAdmin,
        canEdit,
        canViewAudit,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
