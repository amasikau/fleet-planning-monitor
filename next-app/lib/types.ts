export type UserRole = "admin" | "moderator" | "mechanic" | "driver"

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  mechanic: "Механик",
  driver: "Водитель",
}

export type UserStatus = "active" | "blocked"

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Активен",
  blocked: "Заблокирован",
}

export interface User {
  id: string
  username: string
  lastName: string
  firstName: string
  middleName: string
  role: UserRole
  position: string
  status: UserStatus
  avatar: string
  isOnline: boolean
  createdAt: string
}

export type AuditAction =
  | "login"
  | "logout"
  | "block"
  | "unblock"
  | "delete"
  | "edit"
  | "create"

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: "Вход в систему",
  logout: "Выход из системы",
  block: "Блокировка",
  unblock: "Разблокировка",
  delete: "Удаление",
  edit: "Редактирование",
  create: "Создание",
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: AuditAction
  targetUser: string
  performedBy: string
  details: string
}

/* ── Driver-specific types ── */

export type DrivingCategory = "A" | "B" | "C" | "D" | "E" | "BE" | "CE" | "DE"

export const DRIVING_CATEGORIES: DrivingCategory[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "BE",
  "CE",
  "DE",
]

export type DriverDocType = "medical" | "license"

export const DRIVER_DOC_LABELS: Record<DriverDocType, string> = {
  medical: "Мед. справка",
  license: "Водительское удостоверение",
}

export interface DriverDocument {
  type: DriverDocType
  fileName: string
  filePath: string
  uploadedAt: string
}

export interface Driver {
  userId: string
  username: string
  lastName: string
  firstName: string
  middleName: string
  position: string
  categories: DrivingCategory[]
  documents: DriverDocument[]
  assignedAt: string
}

export type DriverAuditAction =
  | "assign"
  | "doc_upload"
  | "doc_remove"
  | "category_change"
  | "unassign"

export const DRIVER_AUDIT_LABELS: Record<DriverAuditAction, string> = {
  assign: "Назначение",
  doc_upload: "Загрузка документа",
  doc_remove: "Удаление документа",
  category_change: "Изменение категорий",
  unassign: "Снятие назначения",
}

export interface DriverAuditEntry {
  id: string
  timestamp: string
  action: DriverAuditAction
  targetUser: string
  performedBy: string
  details: string
}

/* ── Mechanic-specific types ── */

export type MechanicSpecialization =
  | "engine"
  | "transmission"
  | "electrical"
  | "suspension"
  | "brakes"
  | "diagnostics"
  | "bodywork"
  | "tire_service"

export const MECHANIC_SPECIALIZATIONS: MechanicSpecialization[] = [
  "engine",
  "transmission",
  "electrical",
  "suspension",
  "brakes",
  "diagnostics",
  "bodywork",
  "tire_service",
]

export const MECHANIC_SPECIALIZATION_LABELS: Record<
  MechanicSpecialization,
  string
> = {
  engine: "Двигатель",
  transmission: "Трансмиссия",
  electrical: "Электрика",
  suspension: "Подвеска",
  brakes: "Тормоза",
  diagnostics: "Диагностика",
  bodywork: "Кузовные работы",
  tire_service: "Шиномонтаж",
}

export type MechanicDocType = "certificate" | "medical"

export const MECHANIC_DOC_LABELS: Record<MechanicDocType, string> = {
  certificate: "Удостоверение механика",
  medical: "Мед. справка",
}

export interface MechanicDocument {
  type: MechanicDocType
  fileName: string
  filePath: string
  uploadedAt: string
}

export interface Mechanic {
  userId: string
  username: string
  lastName: string
  firstName: string
  middleName: string
  position: string
  specializations: MechanicSpecialization[]
  documents: MechanicDocument[]
  assignedAt: string
}

export type MechanicAuditAction =
  | "assign"
  | "doc_upload"
  | "doc_remove"
  | "specialization_change"
  | "unassign"

export const MECHANIC_AUDIT_LABELS: Record<MechanicAuditAction, string> = {
  assign: "Назначение",
  doc_upload: "Загрузка документа",
  doc_remove: "Удаление документа",
  specialization_change: "Изменение специализаций",
  unassign: "Снятие назначения",
}

export interface MechanicAuditEntry {
  id: string
  timestamp: string
  action: MechanicAuditAction
  targetUser: string
  performedBy: string
  details: string
}

/* ── Fleet-specific types ── */

export type FleetVehicleStatus = "active" | "reserve" | "repair"

export const FLEET_VEHICLE_STATUS_LABELS: Record<FleetVehicleStatus, string> = {
  active: "В работе",
  reserve: "Не используется",
  repair: "В ремонте",
}

export type FleetAuditAction =
  | "create"
  | "edit"
  | "delete"
  | "status_change"
  | "assign_driver"
  | "unassign_driver"

export const FLEET_AUDIT_ACTION_LABELS: Record<FleetAuditAction, string> = {
  create: "Создание",
  edit: "Редактирование",
  delete: "Удаление",
  status_change: "Смена статуса",
  assign_driver: "Закрепление водителя",
  unassign_driver: "Открепление водителя",
}

export type FleetVehicleType =
  | "dump_truck"
  | "crane"
  | "excavator"
  | "loader"
  | "van"
  | "pickup"

export const FLEET_VEHICLE_TYPE_LABELS: Record<FleetVehicleType, string> = {
  dump_truck: "Самосвал",
  crane: "Автокран",
  excavator: "Экскаватор",
  loader: "Погрузчик",
  van: "Фургон снабжения",
  pickup: "Пикап",
}

export interface FleetAssignedDriver {
  userId: string
  username: string
  fullName: string
}

export interface FleetVehicle {
  id: string
  brand: string
  model: string
  plateNumber: string
  type: FleetVehicleType
  status: FleetVehicleStatus
  notes: string
  assignedDriver: FleetAssignedDriver | null
  createdAt: string
  updatedAt: string
}

export interface FleetAuditEntry {
  id: string
  timestamp: string
  action: FleetAuditAction
  vehicleLabel: string
  performedBy: string
  details: string
}

/* ── Service events ── */

export type ServiceEventType =
  | "maintenance"
  | "inspection"
  | "repair"
  | "insurance"
  | "diagnostics"

export const SERVICE_EVENT_TYPE_LABELS: Record<ServiceEventType, string> = {
  maintenance: "Плановое ТО",
  inspection: "Осмотр",
  repair: "Ремонт",
  insurance: "Страхование",
  diagnostics: "Диагностика",
}

export type ServiceEventStatus =
  | "scheduled"
  | "in_progress"
  | "overdue"
  | "completed"

export const SERVICE_EVENT_STATUS_LABELS: Record<ServiceEventStatus, string> = {
  scheduled: "Ожидает назначения",
  in_progress: "В ремонте",
  overdue: "Просрочено",
  completed: "Завершено",
}

export interface ServiceEventMechanic {
  userId: string
  fullName: string
}

export interface ServiceEvent {
  id: string
  vehicleId: string
  vehicleLabel: string
  type: ServiceEventType
  status: ServiceEventStatus
  title: string
  dueAt: string | null
  completedAt: string | null
  mileageKm: number | null
  mechanic: ServiceEventMechanic | null
  reporter: { userId: string; fullName: string; role: UserRole } | null
  workLogs: {
    id: string
    performedAt: string
    title: string
    description: string
    mileageKm: number | null
    createdBy: string | null
    createdAt: string
  }[]
  defectDescription: string
  notes: string
  createdAt: string
  updatedAt: string
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canAssign: boolean
    isOwnRepair: boolean
    isOwnVehicleRepair: boolean
  }
}

export interface ServiceStats {
  scheduled: number
  inProgress: number
  overdue: number
  completed: number
}

/* ── Equipment planning ── */

export type EquipmentPlanShift = "day" | "night"

export const EQUIPMENT_PLAN_SHIFT_LABELS: Record<EquipmentPlanShift, string> = {
  day: "Дневная",
  night: "Ночная",
}

export type EquipmentPlanStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "failed"

export const EQUIPMENT_PLAN_STATUS_LABELS: Record<
  EquipmentPlanStatus,
  string
> = {
  planned: "Запланировано",
  in_progress: "В работе",
  completed: "Выполнено",
  failed: "Срыв",
}

export type RoadWorkStageType =
  | "preparation"
  | "earthworks"
  | "milling"
  | "base_layer"
  | "asphalt_paving"
  | "compaction"
  | "material_delivery"
  | "marking"
  | "maintenance"

export const ROAD_WORK_STAGE_TYPE_LABELS: Record<RoadWorkStageType, string> = {
  preparation: "Подготовка участка",
  earthworks: "Земляные работы",
  milling: "Фрезерование покрытия",
  base_layer: "Устройство основания",
  asphalt_paving: "Укладка асфальта",
  compaction: "Уплотнение",
  material_delivery: "Подвоз смеси и материалов",
  marking: "Разметка",
  maintenance: "Содержание дороги",
}

export type RoadWorkStageStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "delayed"

export const ROAD_WORK_STAGE_STATUS_LABELS: Record<
  RoadWorkStageStatus,
  string
> = {
  planned: "Запланирован",
  in_progress: "В работе",
  completed: "Выполнен",
  delayed: "Отстаёт",
}

export type EquipmentDemandPriority = "normal" | "high" | "critical"

export const EQUIPMENT_DEMAND_PRIORITY_LABELS: Record<
  EquipmentDemandPriority,
  string
> = {
  normal: "Обычная",
  high: "Высокая",
  critical: "Критическая",
}

export interface EquipmentPlan {
  id: string
  siteId: string
  siteName: string
  siteWorkType: string
  stageId: string | null
  stageName: string | null
  stageType: RoadWorkStageType | null
  demandId: string | null
  demandVehicleType: FleetVehicleType | null
  vehicleId: string
  vehicleLabel: string
  vehicleType: FleetVehicleType
  vehicleStatus: "active" | "reserve" | "maintenance" | "repair"
  driver: { userId: string; fullName: string } | null
  workDate: string
  shift: EquipmentPlanShift
  plannedHours: number
  actualHours: number | null
  status: EquipmentPlanStatus
  notes: string
  warnings: string[]
  createdAt: string
  updatedAt: string
}

export interface EquipmentPlanStats {
  planned: number
  inProgress: number
  completed: number
  failed: number
  missingActual: number
  withoutDriver: number
  deficitDemands: number
  criticalDeficits: number
  averageCoverage: number
}

export interface RoadWorkStage {
  id: string
  siteId: string
  siteName: string
  siteWorkType: string
  type: RoadWorkStageType
  name: string
  startDate: string
  endDate: string
  status: RoadWorkStageStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentDemand {
  id: string
  siteId: string
  siteName: string
  siteWorkType: string
  stageId: string | null
  stageName: string | null
  stageType: RoadWorkStageType | null
  vehicleType: FleetVehicleType
  requiredCount: number
  plannedHours: number
  priority: EquipmentDemandPriority
  notes: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentCoverageItem {
  id: string
  siteId: string
  siteName: string
  stageId: string | null
  stageName: string | null
  stageType: RoadWorkStageType | null
  vehicleType: FleetVehicleType
  requiredCount: number
  assignedCount: number
  deficit: number
  coveragePercent: number
  plannedHours: number
  assignedPlannedHours: number
  priority: EquipmentDemandPriority
  riskLevel: "low" | "medium" | "high"
  recommendation: string
}

/* ── Construction sites ── */

export interface ConstructionSite {
  id: string
  name: string
  workType: string
  address: string
  latitude: number | null
  longitude: number | null
  workPeriodStart: string
  workPeriodEnd: string
  isCompleted: boolean
  completedAt: string | null
  notes: string
  vehicleCount: number
  createdAt: string
  updatedAt: string
}

export interface SiteVehicleView {
  id: string
  vehicleId: string
  brand: string
  model: string
  plateNumber: string
  driver: { userId: string; fullName: string } | null
  assignedAt: string
}

export interface ConstructionSiteDetail extends ConstructionSite {
  vehicles: SiteVehicleView[]
}

export interface AvailableVehicle {
  id: string
  brand: string
  model: string
  plateNumber: string
  driver: { userId: string; fullName: string } | null
}

export type SiteAuditAction =
  | "create"
  | "edit"
  | "delete"
  | "complete"
  | "assign_vehicle"
  | "unassign_vehicle"

export const SITE_AUDIT_ACTION_LABELS: Record<SiteAuditAction, string> = {
  create: "Создание",
  edit: "Редактирование",
  delete: "Удаление",
  complete: "Завершение",
  assign_vehicle: "Назначение техники",
  unassign_vehicle: "Снятие техники",
}

export interface SiteAuditEntry {
  id: string
  timestamp: string
  action: SiteAuditAction
  siteLabel: string
  performedBy: string
  details: string
}

/* ── Notifications ── */

export type NotificationCategory = "system" | "security" | "action"

export const NOTIFICATION_CATEGORY_LABELS: Record<
  NotificationCategory,
  string
> = {
  system: "Системные",
  security: "Безопасность",
  action: "Действия",
}

export interface NotificationItem {
  id: string
  category: NotificationCategory
  title: string
  description: string
  createdAt: string
  read: boolean
}
