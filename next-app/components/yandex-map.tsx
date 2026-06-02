"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

type YMapsGeoObject = {
  getAddressLine?: () => string
  properties: {
    get: (key: string) => unknown
  }
  geometry: {
    getCoordinates: () => [number, number]
  }
}

type YMapsGeocodeResponse = {
  geoObjects: {
    get: (index: number) => YMapsGeoObject | null
  }
}

type YMapsEvent = {
  get: (key: string) => unknown
}

type YMapsEventManager = {
  add: (eventName: string, handler: (event: YMapsEvent) => void) => void
}

type YMapsPlacemark = {
  events: YMapsEventManager
  geometry: {
    getCoordinates: () => [number, number]
  }
}

type YMapsGeoObjectCollection = {
  add: (object: YMapsPlacemark) => void
  remove: (object: YMapsPlacemark) => void
  getBounds: () => unknown
}

type YMapsMap = {
  events: YMapsEventManager
  geoObjects: YMapsGeoObjectCollection
  destroy: () => void
  getZoom: () => number
  setBounds: (bounds: unknown, options?: Record<string, unknown>) => void
  setCenter: (coords: [number, number], zoom?: number) => void
}

type YMapsApi = {
  ready: (callback: () => void) => void
  geocode: (
    target: string | [number, number],
    options?: Record<string, unknown>,
  ) => Promise<YMapsGeocodeResponse>
  Map: new (container: HTMLElement, options: Record<string, unknown>) => YMapsMap
  Placemark: new (
    coords: [number, number],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YMapsPlacemark
}

declare global {
  interface Window {
    ymaps?: YMapsApi
  }
}

/* ========================================================================== */
/*  Constants                                                                 */
/* ========================================================================== */

const DARK_MAP_FILTER = "invert(0.92) hue-rotate(180deg)"
const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173]
const COORD_EPSILON = 0.000001

/* ========================================================================== */
/*  Script loader                                                             */
/* ========================================================================== */

let ymapsPromise: Promise<YMapsApi> | null = null

function loadYmaps(): Promise<YMapsApi> {
  if (ymapsPromise) return ymapsPromise

  ymapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"))
      return
    }

    if (window.ymaps) {
      const ymaps = window.ymaps
      ymaps.ready(() => resolve(ymaps))
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    let src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU"
    if (apiKey) src += "&apikey=" + apiKey

    const script = document.createElement("script")
    script.src = src
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error("Yandex Maps API not available"))
        return
      }
      const ymaps = window.ymaps
      ymaps.ready(() => resolve(ymaps))
    }
    script.onerror = () => {
      ymapsPromise = null
      reject(new Error("Failed to load Yandex Maps"))
    }
    document.head.appendChild(script)
  })

  return ymapsPromise
}

/* ========================================================================== */
/*  Helpers                                                                   */
/* ========================================================================== */

function isValidCoord(lat?: number, lng?: number): boolean {
  return lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function reverseGeocode(
  ymaps: YMapsApi,
  coords: [number, number],
): Promise<string> {
  return ymaps
    .geocode(coords, { results: 1 })
    .then((res) => {
      const obj = res.geoObjects.get(0)
      if (!obj) return ""
      // Try multiple methods to extract address
      try {
        const addr = obj.getAddressLine?.()
        if (addr) return addr
      } catch {}
      try {
        const text = asString(obj.properties.get("text"))
        if (text) return text
      } catch {}
      try {
        const meta = obj.properties.get("metaDataProperty") as
          | { GeocoderMetaData?: { text?: string } }
          | null
          | undefined
        const geocoderText = meta?.GeocoderMetaData?.text
        if (geocoderText) return geocoderText
      } catch {}
      try {
        const name = asString(obj.properties.get("name"))
        if (name) return name
      } catch {}
      return ""
    })
    .catch((err: unknown) => {
      console.warn("[YandexMap] Reverse geocode failed:", err)
      return ""
    })
}

export function forwardGeocode(
  address: string,
): Promise<{ lat: number; lng: number; address: string } | null> {
  return loadYmaps()
    .then((ymaps) =>
      ymaps.geocode(address, { results: 1 }).then((res) => {
        const obj = res.geoObjects.get(0)
        if (!obj) return null
        const c = obj.geometry.getCoordinates() as [number, number]
        let fullAddr = ""
        try {
          fullAddr = obj.getAddressLine?.() ?? ""
        } catch {}
        if (!fullAddr) {
          try {
            fullAddr = asString(obj.properties.get("text"))
          } catch {}
        }
        return { lat: c[0], lng: c[1], address: fullAddr || address }
      }),
    )
    .catch((err) => {
      console.warn("[YandexMap] Forward geocode failed:", err)
      return null
    })
}

export { loadYmaps }

/* ========================================================================== */
/*  YandexMapView — read-only dark map with single marker (memoised)          */
/* ========================================================================== */

export const YandexMapView = React.memo(
  function YandexMapView({
    latitude,
    longitude,
    zoom = 15,
    height = 250,
  }: {
    latitude: number
    longitude: number
    zoom?: number
    height?: number
  }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<YMapsMap | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      let cancelled = false

      loadYmaps()
        .then((ymaps) => {
          if (cancelled || !containerRef.current) return

          if (mapRef.current) {
            mapRef.current.destroy()
            mapRef.current = null
          }

          const map = new ymaps.Map(containerRef.current, {
            center: [latitude, longitude],
            zoom,
            controls: ["zoomControl"],
          })

          const placemark = new ymaps.Placemark(
            [latitude, longitude],
            {},
            { preset: "islands#redDotIcon" },
          )
          map.geoObjects.add(placemark)
          mapRef.current = map
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })

      return () => {
        cancelled = true
        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }
      }
    }, [latitude, longitude, zoom])

    return (
      <div className="relative">
        <div
          ref={containerRef}
          style={{ width: "100%", height, filter: DARK_MAP_FILTER }}
          className="overflow-hidden rounded-lg border border-border/40"
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
      </div>
    )
  },
  (prev, next) =>
    prev.latitude === next.latitude &&
    prev.longitude === next.longitude &&
    prev.zoom === next.zoom &&
    prev.height === next.height,
)

/* ========================================================================== */
/*  YandexMapPicker — interactive dark map for forms                          */
/*  Click map → fills lat/lng immediately + geocodes address                  */
/*  Drag marker → same                                                       */
/*  Manual lat/lng input → moves marker & pans map                            */
/* ========================================================================== */

export function YandexMapPicker({
  latitude,
  longitude,
  onSelect,
  height = 300,
}: {
  latitude?: number
  longitude?: number
  onSelect: (lat: number, lng: number, address: string) => void
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const ymapsRef = useRef<YMapsApi | null>(null)
  const placemarkRef = useRef<YMapsPlacemark | null>(null)
  const [loading, setLoading] = useState(true)

  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // Skip sync effect when change came from map click/drag
  const skipSyncRef = useRef(false)

  const setMarker = useCallback(
    (
      ymaps: YMapsApi,
      map: YMapsMap,
      coords: [number, number],
      pan: boolean,
    ) => {
      if (placemarkRef.current) {
        map.geoObjects.remove(placemarkRef.current)
      }

      const pm = new ymaps.Placemark(
        coords,
        {},
        {
          preset: "islands#redCircleDotIcon",
          draggable: true,
        },
      )

      pm.events.add("dragend", () => {
        const c = pm.geometry.getCoordinates() as [number, number]
        skipSyncRef.current = true
        onSelectRef.current(c[0], c[1], "")
        reverseGeocode(ymaps, c).then((addr) => {
          if (addr) onSelectRef.current(c[0], c[1], addr)
        })
      })

      map.geoObjects.add(pm)
      placemarkRef.current = pm

      if (pan) {
        map.setCenter(coords, Math.max(map.getZoom(), 14))
      }
    },
    [],
  )

  // Create map once on mount
  useEffect(() => {
    let cancelled = false

    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return

        ymapsRef.current = ymaps

        const hasCoords = isValidCoord(latitude, longitude)
        const center: [number, number] = hasCoords
          ? [latitude!, longitude!]
          : DEFAULT_CENTER

        const map = new ymaps.Map(containerRef.current, {
          center,
          zoom: hasCoords ? 15 : 10,
          controls: ["zoomControl", "searchControl"],
        })

        if (hasCoords) {
          setMarker(ymaps, map, [latitude!, longitude!], false)
        }

        map.events.add("click", (e) => {
          const coords = e.get("coords") as [number, number]
          setMarker(ymaps, map, coords, false)

          // Immediately update coordinates in the form
          skipSyncRef.current = true
          onSelectRef.current(coords[0], coords[1], "")

          // Then async geocode for address
          reverseGeocode(ymaps, coords).then((addr) => {
            if (addr) onSelectRef.current(coords[0], coords[1], addr)
          })
        })

        mapRef.current = map
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
      placemarkRef.current = null
      ymapsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bidirectional sync: manual input → map marker
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      return
    }

    if (!mapRef.current || !ymapsRef.current) return
    if (!isValidCoord(latitude, longitude)) return

    // Skip if marker already at these coords
    if (placemarkRef.current) {
      const cur = placemarkRef.current.geometry.getCoordinates()
      if (
        Math.abs(cur[0] - latitude!) < COORD_EPSILON &&
        Math.abs(cur[1] - longitude!) < COORD_EPSILON
      ) {
        return
      }
    }

    setMarker(
      ymapsRef.current,
      mapRef.current,
      [latitude!, longitude!],
      true,
    )
  }, [latitude, longitude, setMarker])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ width: "100%", height, filter: DARK_MAP_FILTER }}
        className="overflow-hidden rounded-lg border border-border/40"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
    </div>
  )
}

/* ========================================================================== */
/*  SitesOverviewMap — all sites as placemarks (dark, auto-fit bounds)        */
/* ========================================================================== */

export function SitesOverviewMap({
  sites,
  height = 400,
  onSiteClick,
}: {
  sites: {
    id: string
    name: string
    latitude: number | null
    longitude: number | null
    workType: string
  }[]
  height?: number
  onSiteClick?: (siteId: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YMapsMap | null>(null)
  const [loading, setLoading] = useState(true)

  const onSiteClickRef = useRef(onSiteClick)

  useEffect(() => {
    onSiteClickRef.current = onSiteClick
  }, [onSiteClick])

  useEffect(() => {
    let cancelled = false

    const sitesWithCoords = sites.filter(
      (s) => s.latitude != null && s.longitude != null,
    )

    if (sitesWithCoords.length === 0) {
      return
    }

    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return

        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }

        const map = new ymaps.Map(containerRef.current, {
          center: [
            sitesWithCoords[0].latitude!,
            sitesWithCoords[0].longitude!,
          ],
          zoom: 10,
          controls: ["zoomControl"],
        })

        sitesWithCoords.forEach((site) => {
          const pm = new ymaps.Placemark(
            [site.latitude!, site.longitude!],
            {
              hintContent: site.name,
              balloonContent:
                "<strong>" +
                site.name +
                "</strong><br/>" +
                (site.workType || "Вид работ не указан"),
            },
            { preset: "islands#blueCircleDotIcon" },
          )

          if (onSiteClickRef.current) {
            pm.events.add("click", () => {
              onSiteClickRef.current?.(site.id)
            })
          }

          map.geoObjects.add(pm)
        })

        if (sitesWithCoords.length > 1) {
          map.setBounds(map.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 40,
          })
        }

        mapRef.current = map
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [sites])

  const sitesWithCoords = sites.filter(
    (s) => s.latitude != null && s.longitude != null,
  )

  if (sitesWithCoords.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ width: "100%", height, filter: DARK_MAP_FILTER }}
        className="overflow-hidden rounded-lg border border-border/40"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
    </div>
  )
}
