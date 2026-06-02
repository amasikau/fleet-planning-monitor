import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ?? "http://localhost:4000/api"

type RouteContext = {
  params: Promise<unknown>
}

async function proxyToBackend(request: NextRequest, context: RouteContext) {
  const { path = [] } = (await context.params) as { path?: string[] }
  const requestUrl = new URL(request.url)
  const targetUrl = new URL(`${BACKEND_API_BASE}/${path.join("/")}`)
  targetUrl.search = requestUrl.search

  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value
  const headers = new Headers(request.headers)

  headers.delete("cookie")
  headers.delete("host")
  headers.delete("content-length")

  if (token) {
    headers.set("authorization", `Bearer ${token}`)
  }

  const method = request.method.toUpperCase()
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  })

  const responseHeaders = new Headers(backendResponse.headers)
  responseHeaders.delete("set-cookie")
  responseHeaders.delete("transfer-encoding")
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  const response =
    method === "HEAD"
      ? new NextResponse(null, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders,
        })
      : new NextResponse(await backendResponse.arrayBuffer(), {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders,
        })

  if (backendResponse.status === 401 || path.join("/") === "auth/logout") {
    response.cookies.delete("accessToken")
    response.cookies.delete("session")
  }

  return response
}

export const GET = proxyToBackend
export const POST = proxyToBackend
export const PUT = proxyToBackend
export const PATCH = proxyToBackend
export const DELETE = proxyToBackend
export const HEAD = proxyToBackend
