"use client"

import type { ConstructionSite } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon } from "@hugeicons/core-free-icons"
import { SitesOverviewMap } from "@/components/yandex-map"

export function SitesMapCard({
  sites,
  onSiteClick,
}: {
  sites: ConstructionSite[]
  onSiteClick?: (siteId: string) => void
}) {
  const sitesWithCoords = sites.filter(
    (s) => s.latitude != null && s.longitude != null,
  )

  if (sitesWithCoords.length === 0) return null

  return (
    <Card className="mx-4 overflow-hidden lg:mx-6">
      <CardHeader className="flex-row items-center gap-3">
        <div className="mr-auto flex items-center gap-2">
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={2}
            className="size-5 text-primary"
          />
          <CardTitle className="shrink-0">Карта объектов</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {sitesWithCoords.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <SitesOverviewMap
          sites={sites}
          height={400}
          onSiteClick={onSiteClick}
        />
      </CardContent>
    </Card>
  )
}
