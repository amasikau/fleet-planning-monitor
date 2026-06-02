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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ConstructionSite } from "@/lib/types"
import {
  SiteFormDialog,
  DeleteSiteDialog,
  CompleteSiteDialog,
} from "@/components/sites/site-dialogs"
import { SiteDetailDialog } from "@/components/sites/site-detail-dialog"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import {
  PlusSignCircleIcon,
  SearchIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Building06Icon,
  Car01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"

type SortKey = "name" | "workType" | "workPeriodEnd"
type SortDir = "asc" | "desc"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

interface SitesTableProps {
  initialSites: ConstructionSite[]
  onDataChange?: () => void
  readonly?: boolean
  title?: string
  isArchive?: boolean
}

export function SitesTable({
  initialSites,
  onDataChange,
  readonly,
  title = "Объекты",
  isArchive = false,
}: SitesTableProps) {
  const [sites, setSites] = useState<ConstructionSite[]>(initialSites)

  useEffect(() => {
    setSites(initialSites)
  }, [initialSites])

  const [editingSite, setEditingSite] = useState<ConstructionSite | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deletingSite, setDeletingSite] = useState<ConstructionSite | null>(null)
  const [completingSite, setCompletingSite] = useState<ConstructionSite | null>(null)
  const [detailSiteId, setDetailSiteId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
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
    let result = sites

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.workType.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.notes.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      const av = String(a[sortKey] ?? "")
      const bv = String(b[sortKey] ?? "")
      const cmp = av.localeCompare(bv, "ru")
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [sites, search, sortKey, sortDir])

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

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      if (editingSite) {
        await api.sites.update(editingSite.id, values)
        toast.success("Объект сохранён")
      } else {
        await api.sites.create(values)
        toast.success("Объект добавлен")
      }
      setShowAddDialog(false)
      setEditingSite(null)
      onDataChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить объект"))
    }
  }

  const handleDelete = async () => {
    if (deletingSite) {
      try {
        await api.sites.delete(deletingSite.id)
        toast.success("Объект удалён")
        onDataChange?.()
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось удалить объект"))
      }
      setDeletingSite(null)
    }
  }

  const handleComplete = async () => {
    if (completingSite) {
      try {
        await api.sites.complete(completingSite.id)
        toast.success("Объект завершён")
        onDataChange?.()
      } catch (err) {
        toast.error(getErrorMessage(err, "Не удалось завершить объект"))
      }
      setCompletingSite(null)
    }
  }

  return (
    <>
      <Card className="mx-4 overflow-hidden lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="mr-auto flex items-center gap-2">
            <HugeiconsIcon
              icon={Building06Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            <CardTitle className="shrink-0">{title}</CardTitle>
            {sites.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sites.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <HugeiconsIcon
                icon={SearchIcon}
                strokeWidth={2}
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-8 w-40 pl-8 text-sm sm:w-56"
              />
            </div>

            {!readonly && !isArchive && (
              <Button
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setShowAddDialog(true)}
              >
                <HugeiconsIcon
                  icon={PlusSignCircleIcon}
                  strokeWidth={2}
                  className="mr-1.5 size-4"
                />
                Добавить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer pl-6 select-none"
                  onClick={() => toggleSort("name")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Building06Icon}
                      strokeWidth={2}
                      className="size-3.5 text-muted-foreground"
                    />
                    Наименование объекта
                    {renderSortIcon("name")}
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("workType")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Вид работ
                    {renderSortIcon("workType")}
                  </span>
                </TableHead>
                <TableHead className="select-none">
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      strokeWidth={2}
                      className="size-3.5 text-muted-foreground"
                    />
                    Координаты
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort("workPeriodEnd")}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Период работ
                    {renderSortIcon("workPeriodEnd")}
                  </span>
                </TableHead>
                <TableHead className="select-none">
                  <span className="inline-flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={Car01Icon}
                      strokeWidth={2}
                      className="size-3.5 text-muted-foreground"
                    />
                    Техника
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Ничего не найдено
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((site) => (
                  <TableRow
                    key={site.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetailSiteId(site.id)}
                  >
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-medium">{site.name}</p>
                        {site.address && (
                          <p className="text-xs text-muted-foreground">
                            {site.address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {site.workType || "—"}
                    </TableCell>
                    <TableCell>
                      {site.latitude != null && site.longitude != null ? (
                        <a
                          href={`https://yandex.ru/maps/?ll=${site.longitude},${site.latitude}&z=15`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {site.latitude.toFixed(4)},{" "}
                          {site.longitude.toFixed(4)}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(site.workPeriodStart)} —{" "}
                      {formatDate(site.workPeriodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {site.vehicleCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <SiteDetailDialog
        open={!!detailSiteId}
        onOpenChange={(o) => !o && setDetailSiteId(null)}
        siteId={detailSiteId}
        readonly={readonly}
        onEdit={(site) => setEditingSite(site as unknown as ConstructionSite)}
        onDelete={(site) => setDeletingSite(site as unknown as ConstructionSite)}
        onComplete={(site) =>
          setCompletingSite(site as unknown as ConstructionSite)
        }
        onDataChange={() => onDataChange?.()}
      />

      {!readonly && (
        <>
          <SiteFormDialog
            key="add"
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSave={handleSave}
          />
          <SiteFormDialog
            key={editingSite?.id ?? "edit"}
            open={!!editingSite}
            onOpenChange={(o) => !o && setEditingSite(null)}
            site={editingSite}
            onSave={handleSave}
          />
          <DeleteSiteDialog
            open={!!deletingSite}
            onOpenChange={(o) => !o && setDeletingSite(null)}
            site={deletingSite}
            onConfirm={handleDelete}
          />
          <CompleteSiteDialog
            open={!!completingSite}
            onOpenChange={(o) => !o && setCompletingSite(null)}
            site={completingSite}
            onConfirm={handleComplete}
          />
        </>
      )}
    </>
  )
}
