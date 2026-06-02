import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard"]
const publicRoutes = ["/login"]

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some((route) => path.startsWith(route))
  const isPublic = publicRoutes.some((route) => path.startsWith(route))

  const accessToken = request.cookies.get("accessToken")?.value

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isPublic && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
