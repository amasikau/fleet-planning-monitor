import type { Driver, DriverAuditEntry } from "@/lib/types"

export const mockDrivers: Driver[] = [
  {
    userId: "4",
    username: "kozlov_dv",
    lastName: "Козлов",
    firstName: "Дмитрий",
    middleName: "Владимирович",
    position: "Водитель категории С",
    categories: ["B", "C"],
    documents: [
      { type: "medical", fileName: "med_kozlov.pdf", filePath: "", uploadedAt: "2026-03-15" },
      { type: "license", fileName: "vu_kozlov.pdf", filePath: "", uploadedAt: "2026-03-15" },
    ],
    assignedAt: "2026-03-16",
  },
  {
    userId: "9",
    username: "sokolov_ar",
    lastName: "Соколов",
    firstName: "Артём",
    middleName: "Романович",
    position: "Водитель категории С",
    categories: ["B", "C", "CE"],
    documents: [
      { type: "medical", fileName: "med_sokolov.pdf", filePath: "", uploadedAt: "2026-03-20" },
      { type: "license", fileName: "vu_sokolov.pdf", filePath: "", uploadedAt: "2026-03-20" },
    ],
    assignedAt: "2026-03-21",
  },
]

// Users with role="driver" who are NOT yet in mockDrivers → unassigned
export const unassignedDriverUserIds = ["6"] // volkov_iv

export const mockDriverAuditLog: DriverAuditEntry[] = [
  {
    id: "da1",
    timestamp: "2026-04-04T10:00:00",
    action: "assign",
    targetUser: "sokolov_ar",
    performedBy: "admin",
    details: "Назначен водителем, категории: B, C, CE",
  },
  {
    id: "da2",
    timestamp: "2026-04-04T09:50:00",
    action: "doc_upload",
    targetUser: "sokolov_ar",
    performedBy: "admin",
    details: "Загружена мед. справка: med_sokolov.pdf",
  },
  {
    id: "da3",
    timestamp: "2026-04-04T09:50:00",
    action: "doc_upload",
    targetUser: "sokolov_ar",
    performedBy: "admin",
    details: "Загружено ВУ: vu_sokolov.pdf",
  },
  {
    id: "da4",
    timestamp: "2026-04-03T14:00:00",
    action: "assign",
    targetUser: "kozlov_dv",
    performedBy: "admin",
    details: "Назначен водителем, категории: B, C",
  },
  {
    id: "da5",
    timestamp: "2026-04-03T13:55:00",
    action: "doc_upload",
    targetUser: "kozlov_dv",
    performedBy: "admin",
    details: "Загружена мед. справка: med_kozlov.pdf",
  },
  {
    id: "da6",
    timestamp: "2026-04-03T13:55:00",
    action: "doc_upload",
    targetUser: "kozlov_dv",
    performedBy: "admin",
    details: "Загружено ВУ: vu_kozlov.pdf",
  },
  {
    id: "da7",
    timestamp: "2026-04-02T11:00:00",
    action: "category_change",
    targetUser: "kozlov_dv",
    performedBy: "admin",
    details: "Добавлена категория CE",
  },
]
