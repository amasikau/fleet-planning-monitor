"use client"

import { createContext, useContext, type ReactNode } from "react"

export type UserRole = "admin" | "moderator" | "mechanic" | "driver"

interface RoleContextValue {
  userId: string | null
  username: string | null
  role: UserRole | null
  isAdmin: boolean
  isModerator: boolean
  canEdit: boolean // admin | moderator
  canViewAudit: boolean // admin | moderator
}

const RoleContext = createContext<RoleContextValue>({
  userId: null,
  username: null,
  role: null,
  isAdmin: false,
  isModerator: false,
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
  const isModerator = role === "moderator"
  const canEdit = isAdmin || isModerator
  const canViewAudit = isAdmin || isModerator

  return (
    <RoleContext.Provider
      value={{
        userId: userId ?? null,
        username: username ?? null,
        role,
        isAdmin,
        isModerator,
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
