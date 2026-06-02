"use client"

import { useMemo, useState, useRef, useCallback } from "react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import type { Mechanic, MechanicSpecialization } from "@/lib/types"
import { MECHANIC_SPECIALIZATIONS, MECHANIC_SPECIALIZATION_LABELS } from "@/lib/types"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { toast } from "sonner"
import {
  SearchIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserCircleIcon,
  TextFontIcon,
  Settings02Icon,
  MedicalFileIcon,
  Calendar03Icon,
  Wrench01Icon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
  MoreHorizontalCircle01Icon,
  PencilEdit02Icon,
  UserBlock01Icon,
  FileUploadIcon,
  Certificate01Icon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"

type SortKey = "username" | "lastName" | "specializations" | "documents" | "assignedAt"
type SortDir = "asc" | "desc"

interface ActiveMechanicsTableProps {
  mechanics: Mechanic[]
  onUnassign: (userId: string) => void
  onEdit: (userId: string, data: { specializations?: MechanicSpecialization[]; documents?: { type: string; fileName: string; filePath: string }[] }) => void
  readonly?: boolean
}

export function ActiveMechanicsTable({ mechanics, onUnassign, onEdit, readonly }: ActiveMechanicsTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("lastName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [editMechanic, setEditMechanic] = useState<Mechanic | null>(null)
  const [unassignMechanic, setUnassignMechanic] = useState<Mechanic | null>(null)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    let result = mechanics

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          m.username.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          m.firstName.toLowerCase().includes(q) ||
          m.specializations.some((s) => MECHANIC_SPECIALIZATION_LABELS[s].toLowerCase().includes(q))
      )
    }

    result = [...result].sort((a, b) => {
      let cmp: number
      if (sortKey === "specializations") {
        cmp = a.specializations.length - b.specializations.length
      } else if (sortKey === "documents") {
        cmp = a.documents.length - b.documents.length
      } else {
        cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "ru")
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [mechanics, search, sortKey, sortDir])

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

  return (
    <>
      <Card className="mx-4 lg:mx-6">
        <CardHeader className="flex-row items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} className="size-5 text-blue-500" />
            <CardTitle>Активные механики</CardTitle>
            {mechanics.length > 0 && (
              <Badge variant="secondary" className="text-xs">{mechanics.length}</Badge>
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
              <HugeiconsIcon icon={Wrench01Icon} strokeWidth={1.5} className="size-8" />
              <p className="text-sm">
                {mechanics.length === 0 ? "Нет активных механиков" : "Ничего не найдено"}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <div className="min-w-[750px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6 cursor-pointer select-none" onClick={() => toggleSort("username")}>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                          Пользователь
                          {renderSortIcon("username")}
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("lastName")}>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                          ФИО
                          {renderSortIcon("lastName")}
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("specializations")}>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                          Специализации
                          {renderSortIcon("specializations")}
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("documents")}>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={MedicalFileIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                          Документы
                          {renderSortIcon("documents")}
                        </span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("assignedAt")}>
                        <span className="inline-flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                          Назначен
                          {renderSortIcon("assignedAt")}
                        </span>
                      </TableHead>
                      {!readonly && <TableHead className="w-12" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((mechanic) => {
                      const hasCertificate = mechanic.documents.some((d) => d.type === "certificate")
                      const hasMedical = mechanic.documents.some((d) => d.type === "medical")
                      const docsOk = hasCertificate && hasMedical

                      return (
                        <TableRow key={mechanic.userId}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {mechanic.lastName[0]}{mechanic.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{mechanic.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {mechanic.lastName} {mechanic.firstName} {mechanic.middleName}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {mechanic.specializations.map((spec) => (
                                <Badge key={spec} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  {MECHANIC_SPECIALIZATION_LABELS[spec]}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {docsOk ? (
                                <Badge variant="secondary" className="gap-1 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-3" />
                                  Полный комплект
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3" />
                                  {mechanic.documents.length}/2
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums text-sm text-muted-foreground">
                            {new Date(mechanic.assignedAt).toLocaleDateString("ru-RU")}
                          </TableCell>
                          {!readonly && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => setEditMechanic(mechanic)}>
                                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
                                    Редактировать
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onClick={() => setUnassignMechanic(mechanic)}>
                                    <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} />
                                    Снять назначение
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!readonly && (
        <>
          {/* Edit mechanic dialog */}
          {editMechanic && (
            <EditMechanicDialog
              key={editMechanic.userId}
              open={!!editMechanic}
              onOpenChange={(o) => !o && setEditMechanic(null)}
              mechanic={editMechanic}
              onSave={(specializations, documents) => {
                onEdit(editMechanic.userId, { specializations, documents })
                setEditMechanic(null)
              }}
            />
          )}

          {/* Unassign confirmation dialog */}
          <AlertDialog open={!!unassignMechanic} onOpenChange={(o) => !o && setUnassignMechanic(null)}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader className="!place-items-center !text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="size-6 text-amber-600" />
                </div>
                <AlertDialogTitle className="text-center">Снять назначение</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  Снять назначение механика <span className="font-semibold text-foreground">{unassignMechanic?.username}</span>?
                  Он вернётся в список неназначенных.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <Button variant="destructive" onClick={() => { if (unassignMechanic) { onUnassign(unassignMechanic.userId); setUnassignMechanic(null) } }}>
                  <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="mr-1 size-4" />
                  Снять
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  )
}

/* ── Edit Mechanic Dialog ── */

interface UploadedDoc {
  type: "certificate" | "medical"
  fileName: string
  filePath: string
}

function EditMechanicDialog({
  open,
  onOpenChange,
  mechanic,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mechanic: Mechanic
  onSave: (specializations: MechanicSpecialization[], documents: { type: string; fileName: string; filePath: string }[]) => void
}) {
  const [specializations, setSpecializations] = useState<MechanicSpecialization[]>(mechanic.specializations)
  const existingCertificate = mechanic.documents.find((d) => d.type === "certificate")
  const existingMedical = mechanic.documents.find((d) => d.type === "medical")
  const [certificateDoc, setCertificateDoc] = useState<UploadedDoc | null>(
    existingCertificate ? { type: "certificate", fileName: existingCertificate.fileName, filePath: existingCertificate.filePath } : null
  )
  const [medicalDoc, setMedicalDoc] = useState<UploadedDoc | null>(
    existingMedical ? { type: "medical", fileName: existingMedical.fileName, filePath: existingMedical.filePath } : null
  )
  const [uploading, setUploading] = useState<"certificate" | "medical" | null>(null)

  const certificateInputRef = useRef<HTMLInputElement>(null)
  const medicalInputRef = useRef<HTMLInputElement>(null)

  const wrappedOnOpenChange = (v: boolean) => {
    onOpenChange(v)
  }

  const toggleSpecialization = (spec: MechanicSpecialization) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const handleUpload = useCallback(async (file: File, docType: "certificate" | "medical") => {
    setUploading(docType)
    try {
      const result = await api.uploads.uploadDocument(file)
      const doc: UploadedDoc = { type: docType, fileName: result.fileName, filePath: result.filePath }
      if (docType === "certificate") setCertificateDoc(doc)
      else setMedicalDoc(doc)
    } catch (err) {
      toast.error(getErrorMessage(err, "Ошибка загрузки файла"))
    } finally {
      setUploading(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: "certificate" | "medical") => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file, docType)
    e.target.value = ""
  }

  const handleDrop = useCallback((e: React.DragEvent, docType: "certificate" | "medical") => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file, docType)
  }, [handleUpload])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleSave = () => {
    if (specializations.length === 0) {
      toast.error("Выберите хотя бы одну специализацию")
      return
    }
    const documents: { type: string; fileName: string; filePath: string }[] = []
    if (certificateDoc) documents.push(certificateDoc)
    if (medicalDoc) documents.push(medicalDoc)
    onSave(specializations, documents)
  }

  return (
    <Dialog open={open} onOpenChange={wrappedOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-5 text-primary" />
            Редактирование механика
          </DialogTitle>
          <DialogDescription>
            {mechanic.lastName} {mechanic.firstName} ({mechanic.username})
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            Специализации
          </label>
          <div className="flex flex-wrap gap-2">
            {MECHANIC_SPECIALIZATIONS.map((spec) => {
              const selected = specializations.includes(spec)
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  {selected && <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-3.5" />}
                  {MECHANIC_SPECIALIZATION_LABELS[spec]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <HugeiconsIcon icon={FileUploadIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            Документы
          </label>
          <div className="grid gap-2">
            <EditDropZone
              label="Удостоверение механика"
              icon={Certificate01Icon}
              iconColor="text-blue-600"
              uploadedDoc={certificateDoc}
              isUploading={uploading === "certificate"}
              inputRef={certificateInputRef}
              onFileSelect={(e) => handleFileSelect(e, "certificate")}
              onDrop={(e) => handleDrop(e, "certificate")}
              onDragOver={handleDragOver}
              onRemove={() => setCertificateDoc(null)}
              onClickZone={() => certificateInputRef.current?.click()}
            />
            <EditDropZone
              label="Мед. справка"
              icon={MedicalFileIcon}
              iconColor="text-green-600"
              uploadedDoc={medicalDoc}
              isUploading={uploading === "medical"}
              inputRef={medicalInputRef}
              onFileSelect={(e) => handleFileSelect(e, "medical")}
              onDrop={(e) => handleDrop(e, "medical")}
              onDragOver={handleDragOver}
              onRemove={() => setMedicalDoc(null)}
              onClickZone={() => medicalInputRef.current?.click()}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => wrappedOnOpenChange(false)}>Отмена</Button>
          <Button size="sm" disabled={specializations.length === 0 || !!uploading} onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Reusable Drop Zone for Edit Dialog ── */

function EditDropZone({
  label,
  icon,
  iconColor,
  uploadedDoc,
  isUploading,
  inputRef,
  onFileSelect,
  onDrop,
  onDragOver,
  onRemove,
  onClickZone,
}: {
  label: string
  icon: IconSvgElement
  iconColor: string
  uploadedDoc: UploadedDoc | null
  isUploading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onRemove: () => void
  onClickZone: () => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div
      className={`group relative rounded-lg border-2 border-dashed p-3 transition-colors ${
        isDragOver
          ? "border-primary bg-primary/5"
          : uploadedDoc
            ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
            : "border-muted-foreground/25 hover:border-muted-foreground/40"
      }`}
      onDrop={(e) => { setIsDragOver(false); onDrop(e) }}
      onDragOver={(e) => { setIsDragOver(true); onDragOver(e) }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={onFileSelect}
      />

      {isUploading ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      ) : uploadedDoc ? (
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={icon} strokeWidth={2} className={`size-5 shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{label}</p>
            <p className="truncate text-xs text-muted-foreground">{uploadedDoc.fileName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onClickZone}
          className="flex w-full items-center gap-3 text-left"
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} className={`size-5 shrink-0 ${iconColor}`} />
          <div className="flex-1">
            <p className="text-xs font-medium">{label}</p>
            <p className="text-[11px] text-muted-foreground">
              Перетащите файл или <span className="text-primary underline underline-offset-2">выберите</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60">PDF, JPEG, PNG, WebP — до 10 МБ</p>
          </div>
        </button>
      )}
    </div>
  )
}
