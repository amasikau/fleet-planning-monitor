"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User, MechanicSpecialization } from "@/lib/types"
import { MECHANIC_SPECIALIZATIONS, MECHANIC_SPECIALIZATION_LABELS, USER_ROLE_LABELS } from "@/lib/types"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/feedback"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { toast } from "sonner"
import {
  FileUploadIcon,
  MedicalFileIcon,
  Certificate01Icon,
  UserAdd01Icon,
  CheckmarkBadge01Icon,
  Cancel01Icon,
  Loading03Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"

interface UploadedDoc {
  type: "certificate" | "medical"
  fileName: string
  filePath: string
}

interface AssignMechanicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onAssign: (data: { userId: string; specializations: MechanicSpecialization[]; documents: { type: string; fileName: string; filePath: string }[] }) => void
}

export function AssignMechanicDialog({ open, onOpenChange, user, onAssign }: AssignMechanicDialogProps) {
  const [specializations, setSpecializations] = useState<MechanicSpecialization[]>([])
  const [certificateDoc, setCertificateDoc] = useState<UploadedDoc | null>(null)
  const [medicalDoc, setMedicalDoc] = useState<UploadedDoc | null>(null)
  const [uploading, setUploading] = useState<"certificate" | "medical" | null>(null)

  const certificateInputRef = useRef<HTMLInputElement>(null)
  const medicalInputRef = useRef<HTMLInputElement>(null)

  const wrappedOnOpenChange = (v: boolean) => {
    if (!v) {
      setSpecializations([])
      setCertificateDoc(null)
      setMedicalDoc(null)
    }
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
      const doc: UploadedDoc = {
        type: docType,
        fileName: result.fileName,
        filePath: result.filePath,
      }
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

  const canAssign = specializations.length > 0

  const handleAssign = () => {
    if (specializations.length === 0) {
      toast.error("Выберите хотя бы одну специализацию")
      return
    }

    const documents: { type: string; fileName: string; filePath: string }[] = []
    if (certificateDoc) documents.push(certificateDoc)
    if (medicalDoc) documents.push(medicalDoc)

    onAssign({ userId: user.id, specializations, documents })
  }

  const initials = `${user.lastName[0] ?? ""}${user.firstName[0] ?? ""}`

  return (
    <Dialog open={open} onOpenChange={wrappedOnOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-5 text-primary" />
            Назначение механика
          </DialogTitle>
          <DialogDescription>
            Заполните данные для назначения пользователя механиком
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* User info — read-only */}
        <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 gap-0.5">
            <p className="font-medium">{user.lastName} {user.firstName} {user.middleName}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{user.username}</span>
              <span>•</span>
              <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {USER_ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{user.position}</p>
          </div>
        </div>

        {/* Specializations */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            Специализации <span className="text-destructive">*</span>
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
          {specializations.length === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">Выберите хотя бы одну специализацию</p>
          )}
        </div>

        {/* Documents with drag & drop */}
        <div className="grid gap-3">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <HugeiconsIcon icon={FileUploadIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            Документы
          </label>

          <div className="grid gap-2">
            {/* Certificate document */}
            <DropZone
              docType="certificate"
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

            {/* Medical document */}
            <DropZone
              docType="medical"
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
          <Button variant="outline" size="sm" onClick={() => wrappedOnOpenChange(false)}>
            Отмена
          </Button>
          <Button size="sm" disabled={!canAssign || !!uploading} onClick={handleAssign}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="mr-1.5 size-4" />
            Назначить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Reusable Drop Zone Component ── */

function DropZone({
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
  docType: string
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
              Перетащите файл сюда или <span className="text-primary underline underline-offset-2">выберите</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60">PDF, JPEG, PNG, WebP — до 10 МБ</p>
          </div>
        </button>
      )}
    </div>
  )
}
