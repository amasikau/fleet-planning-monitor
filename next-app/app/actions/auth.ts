"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { translateErrorMessage } from "@/lib/feedback"

const API_BASE = process.env.BACKEND_API_BASE ?? "http://localhost:4000/api"

export type AuthState = {
  success: boolean
  error?: string
}

export async function login(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { success: false, error: "Введите логин и пароль" }
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return {
        success: false,
        error: translateErrorMessage(data.message || "Неверный логин или пароль"),
      }
    }

    const data = await res.json()
    const cookieStore = await cookies()

    cookieStore.set(
      "session",
      JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    )

    cookieStore.set("accessToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return { success: true }
  } catch {
    return { success: false, error: "Сервер недоступен" }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value

  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // ignore errors, still clear cookies
    }
  }

  cookieStore.delete("session")
  cookieStore.delete("accessToken")
  redirect("/login")
}

export async function getSession(): Promise<{
  id?: string
  username: string
  role?: string
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    if (!res.ok) return null

    const user = await res.json()
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    }
  } catch {
    return null
  }
}
