import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard"]

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some((route) => path.startsWith(route))

  const accessToken = request.cookies.get("accessToken")?.value

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
