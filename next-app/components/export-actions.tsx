"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download04Icon,
  File02Icon,
  FileChartColumnIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/feedback"

type ExportKind = "xlsx" | "docx"

export function ExportActions({
  onExportExcel,
  onExportDocx,
  disabled,
}: {
  onExportExcel: () => Promise<void>
  onExportDocx: () => Promise<void>
  disabled?: boolean
}) {
  const [loading, setLoading] = useState<ExportKind | null>(null)

  const runExport = async (kind: ExportKind, action: () => Promise<void>) => {
    try {
      setLoading(kind)
      await action()
      toast.success(kind === "xlsx" ? "Excel-файл сформирован" : "DOCX-файл сформирован")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сформировать файл"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading != null}
        onClick={() => void runExport("xlsx", onExportExcel)}
      >
        <HugeiconsIcon
          icon={loading === "xlsx" ? Download04Icon : FileChartColumnIcon}
          strokeWidth={2}
          className="mr-1.5 size-4"
        />
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading != null}
        onClick={() => void runExport("docx", onExportDocx)}
      >
        <HugeiconsIcon
          icon={loading === "docx" ? Download04Icon : File02Icon}
          strokeWidth={2}
          className="mr-1.5 size-4"
        />
        DOCX
      </Button>
    </div>
  )
}
