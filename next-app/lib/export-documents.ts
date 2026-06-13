"use client"

export type ExportCellValue = string | number | boolean | null | undefined

export type ExportColumn<T> = {
  header: string
  width?: number
  value: keyof T | ((row: T, index: number) => ExportCellValue)
}

export type ExportTable<T = Record<string, ExportCellValue>> = {
  title?: string
  columns: ExportColumn<T>[]
  rows: T[]
  emptyText?: string
}

export type ExportGanttTask = {
  name: string
  startDate: string
  endDate: string
  subtitle?: string
}

export type ExportGantt = {
  title: string
  tasks: ExportGanttTask[]
  emptyText?: string
}

export type ExportSection<T = Record<string, ExportCellValue>> = {
  title: string
  paragraphs?: string[]
  table?: ExportTable<T>
  gantt?: ExportGantt
}

export type ExportDocumentConfig = {
  fileName: string
  title: string
  subtitle?: string
  documentDate?: string
  sections: ExportSection[]
}

const GOST_FONT = "Times New Roman"
const DOCX_BODY_SIZE = 28
const DOCX_SMALL_SIZE = 24
const DOCX_TITLE_SIZE = 32
const DOCX_TABLE_WIDTH = 100

export function formatRuDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function todayInputDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120)
}

function sanitizeSheetName(value: string, fallback: string) {
  const normalized = value.replace(/[\\/?*\[\]:]/g, " ").trim()
  return (normalized || fallback).slice(0, 31)
}

function getColumnValue<T>(
  row: T,
  column: ExportColumn<T>,
  index: number
): ExportCellValue {
  if (typeof column.value === "function") return column.value(row, index)
  return row[column.value] as ExportCellValue
}

function normalizeCell(value: ExportCellValue) {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "да" : "нет"
  return value
}

function normalizeText(value: ExportCellValue) {
  return String(normalizeCell(value))
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function parseDateStart(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function diffDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

function taskRange(task: ExportGanttTask) {
  const start = parseDateStart(task.startDate)
  const end = parseDateStart(task.endDate)
  return start <= end ? { start, end } : { start: end, end: start }
}

function buildGanttBuckets(tasks: ExportGanttTask[]) {
  if (tasks.length === 0) return []

  const ranges = tasks.map(taskRange)
  const min = new Date(Math.min(...ranges.map((range) => range.start.getTime())))
  const max = new Date(Math.max(...ranges.map((range) => range.end.getTime())))
  const totalDays = Math.max(diffDays(min, max) + 1, 1)
  const bucketSize = totalDays > 31 ? 7 : 1
  const bucketCount = Math.ceil(totalDays / bucketSize)

  return Array.from({ length: bucketCount }, (_, index) => {
    const start = addDays(min, index * bucketSize)
    const end = new Date(Math.min(addDays(start, bucketSize - 1).getTime(), max.getTime()))
    const label =
      bucketSize === 1
        ? formatRuDate(start).slice(0, 5)
        : `${formatRuDate(start).slice(0, 5)}-${formatRuDate(end).slice(0, 5)}`

    return { start, end, label }
  })
}

function taskIntersectsBucket(task: ExportGanttTask, bucket: { start: Date; end: Date }) {
  const range = taskRange(task)
  return range.start <= bucket.end && range.end >= bucket.start
}

function getGeneratedDate(config: ExportDocumentConfig) {
  return config.documentDate
    ? `Дата данных: ${formatRuDate(config.documentDate)}`
    : `Дата формирования: ${formatRuDate(new Date())}`
}

export async function exportDataAsXlsx(config: ExportDocumentConfig) {
  const XLSX = await import("xlsx")
  const workbook = XLSX.utils.book_new()

  config.sections.forEach((section, index) => {
    const rows: (string | number | boolean)[][] = [
      [config.title],
      [config.subtitle ?? ""],
      [getGeneratedDate(config)],
      [],
      [section.title],
    ]

    if (section.paragraphs?.length) {
      for (const paragraph of section.paragraphs) rows.push([paragraph])
      rows.push([])
    }

    if (section.table) {
      rows.push(section.table.columns.map((column) => column.header))

      if (section.table.rows.length === 0) {
        rows.push([section.table.emptyText ?? "Данные отсутствуют"])
      } else {
        section.table.rows.forEach((row, rowIndex) => {
          rows.push(
            section.table!.columns.map((column) =>
              normalizeCell(getColumnValue(row, column, rowIndex))
            ) as (string | number | boolean)[]
          )
        })
      }
    }

    if (section.gantt) {
      rows.push([])
      rows.push([section.gantt.title])
      const buckets = buildGanttBuckets(section.gantt.tasks)
      rows.push(["Этап", "Начало", "Окончание", ...buckets.map((bucket) => bucket.label)])

      if (section.gantt.tasks.length === 0) {
        rows.push([section.gantt.emptyText ?? "Данные отсутствуют"])
      } else {
        section.gantt.tasks.forEach((task) => {
          rows.push([
            task.name,
            formatRuDate(task.startDate),
            formatRuDate(task.endDate),
            ...buckets.map((bucket) => (taskIntersectsBucket(task, bucket) ? "■" : "")),
          ])
        })
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const tableColumns = section.table?.columns ?? []
    worksheet["!cols"] = [
      { wch: 34 },
      { wch: 16 },
      { wch: 16 },
      ...tableColumns.slice(3).map((column) => ({ wch: column.width ?? 18 })),
    ]
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sanitizeSheetName(section.title, `Лист ${index + 1}`)
    )
  })

  const array = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer

  downloadBlob(
    new Blob([array], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${sanitizeFileName(config.fileName)}.xlsx`
  )
}

export async function exportDataAsDocx(config: ExportDocumentConfig) {
  const docx = await import("docx")
  const hasGantt = config.sections.some((section) => section.gantt)
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    WidthType,
  } = docx

  const border = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "000000",
  }

  const paragraph = (
    text: string,
    options: {
      bold?: boolean
      alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
      size?: number
      spacingAfter?: number
    } = {}
  ) =>
    new Paragraph({
      alignment: options.alignment,
      spacing: { line: 360, after: options.spacingAfter ?? 120 },
      children: [
        new TextRun({
          text,
          bold: options.bold,
          font: GOST_FONT,
          size: options.size ?? DOCX_BODY_SIZE,
        }),
      ],
    })

  const blank = () => new Paragraph({ children: [] })

  const tableCell = (
    text: string,
    options: {
      bold?: boolean
      shading?: string
      alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
      size?: number
      width?: number
    } = {}
  ) =>
    new TableCell({
      margins: { top: 90, bottom: 90, left: 90, right: 90 },
      width:
        options.width != null
          ? { size: options.width, type: WidthType.PERCENTAGE }
          : undefined,
      borders: {
        top: border,
        bottom: border,
        left: border,
        right: border,
      },
      shading: options.shading
        ? { fill: options.shading, type: ShadingType.CLEAR }
        : undefined,
      children: [
        paragraph(text, {
          bold: options.bold,
          alignment: options.alignment,
          size: options.size ?? DOCX_SMALL_SIZE,
          spacingAfter: 0,
        }),
      ],
    })

  const buildDocxTable = <T,>(table: ExportTable<T>) => {
    const columnWidth = Math.floor(DOCX_TABLE_WIDTH / Math.max(table.columns.length, 1))
    const rows = [
      new TableRow({
        tableHeader: true,
        children: table.columns.map((column) =>
          tableCell(column.header, {
            bold: true,
            shading: "EDEDED",
            alignment: AlignmentType.CENTER,
            width: columnWidth,
          })
        ),
      }),
    ]

    if (table.rows.length === 0) {
      rows.push(
        new TableRow({
          children: [
            tableCell(table.emptyText ?? "Данные отсутствуют", {
              width: DOCX_TABLE_WIDTH,
            }),
          ],
        })
      )
    } else {
      table.rows.forEach((row, rowIndex) => {
        rows.push(
          new TableRow({
            children: table.columns.map((column) =>
              tableCell(normalizeText(getColumnValue(row, column, rowIndex)), {
                width: columnWidth,
              })
            ),
          })
        )
      })
    }

    return new Table({
      width: { size: DOCX_TABLE_WIDTH, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
      borders: {
        top: border,
        bottom: border,
        left: border,
        right: border,
        insideHorizontal: border,
        insideVertical: border,
      },
      rows,
    })
  }

  const buildDocxGantt = (gantt: ExportGantt) => {
    const buckets = buildGanttBuckets(gantt.tasks)
    const stageWidth = 24
    const dateWidth = 12
    const bucketWidth = Math.max(
      3,
      Math.floor((DOCX_TABLE_WIDTH - stageWidth - dateWidth * 2) / Math.max(buckets.length, 1))
    )

    if (gantt.tasks.length === 0) {
      return [paragraph(gantt.emptyText ?? "Данные отсутствуют")]
    }

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          tableCell("Этап", { bold: true, shading: "EDEDED", width: stageWidth }),
          tableCell("Начало", { bold: true, shading: "EDEDED", alignment: AlignmentType.CENTER, width: dateWidth }),
          tableCell("Окончание", { bold: true, shading: "EDEDED", alignment: AlignmentType.CENTER, width: dateWidth }),
          ...buckets.map((bucket) =>
            tableCell(bucket.label, {
              bold: true,
              shading: "EDEDED",
              alignment: AlignmentType.CENTER,
              width: bucketWidth,
            })
          ),
        ],
      }),
      ...gantt.tasks.map(
        (task) =>
          new TableRow({
            children: [
              tableCell(task.name, { width: stageWidth }),
              tableCell(formatRuDate(task.startDate), {
                alignment: AlignmentType.CENTER,
                width: dateWidth,
              }),
              tableCell(formatRuDate(task.endDate), {
                alignment: AlignmentType.CENTER,
                width: dateWidth,
              }),
              ...buckets.map((bucket) =>
                tableCell(taskIntersectsBucket(task, bucket) ? "" : " ", {
                  shading: taskIntersectsBucket(task, bucket) ? "4472C4" : undefined,
                  width: bucketWidth,
                })
              ),
            ],
          })
      ),
    ]

    return [
      new Table({
        width: { size: DOCX_TABLE_WIDTH, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.AUTOFIT,
        borders: {
          top: border,
          bottom: border,
          left: border,
          right: border,
          insideHorizontal: border,
          insideVertical: border,
        },
        rows,
      }),
    ]
  }

  const children: any[] = [
    paragraph(config.title, {
      bold: true,
      alignment: AlignmentType.CENTER,
      size: DOCX_TITLE_SIZE,
      spacingAfter: 180,
    }),
    ...(config.subtitle
      ? [
          paragraph(config.subtitle, {
            alignment: AlignmentType.CENTER,
            spacingAfter: 120,
          }),
        ]
      : []),
    paragraph(getGeneratedDate(config), {
      alignment: AlignmentType.RIGHT,
      spacingAfter: 240,
    }),
  ]

  config.sections.forEach((section, index) => {
    if (index > 0) children.push(blank())
    children.push(
      paragraph(section.title, {
        bold: true,
        alignment: AlignmentType.CENTER,
        spacingAfter: 160,
      })
    )

    section.paragraphs?.forEach((item) => children.push(paragraph(item)))

    if (section.table) {
      if (section.table.title) {
        children.push(paragraph(section.table.title, { bold: true }))
      }
      children.push(buildDocxTable(section.table))
    }

    if (section.gantt) {
      children.push(paragraph(section.gantt.title, { bold: true }))
      children.push(...buildDocxGantt(section.gantt))
    }
  })

  const document = new Document({
    creator: "АИС дорожной техники",
    styles: {
      default: {
        document: {
          run: { font: GOST_FONT, size: DOCX_BODY_SIZE },
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: hasGantt
                ? PageOrientation.LANDSCAPE
                : PageOrientation.PORTRAIT,
            },
            margin: {
              top: 1134,
              right: 567,
              bottom: 1134,
              left: 1701,
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(document)
  downloadBlob(blob, `${sanitizeFileName(config.fileName)}.docx`)
}
