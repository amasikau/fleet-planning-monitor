import type {
  User,
  AuditLogEntry,
  ConstructionSite,
  ConstructionSiteDetail,
  AvailableVehicle,
  FleetAuditEntry,
  FleetVehicle,
  ServiceEvent,
  ServiceStats,
  SiteAuditEntry,
  EquipmentPlan,
  EquipmentPlanStats,
  RoadWorkStage,
  EquipmentDemand,
  EquipmentCoverageItem,
  RoadWorkTypeTemplate,
  RoadWorkStageTemplate,
  EquipmentPlanDraft,
  AppliedEquipmentPlanDraft,
} from "@/lib/types"
import { translateErrorMessage } from "@/lib/feedback"

const API_BASE = "/api"

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    window.location.href = "/login"
    throw new Error("Требуется повторный вход в систему")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(translateErrorMessage(error.message || res.statusText))
  }

  return res.json()
}

export const api = {
  uploads: {
    uploadDocument: async (
      file: File
    ): Promise<{
      fileName: string
      filePath: string
      size: number
      mimetype: string
    }> => {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${API_BASE}/uploads/documents`, {
        method: "POST",
        body: formData,
      })

      if (res.status === 401) {
        window.location.href = "/login"
        throw new Error("Требуется повторный вход в систему")
      }

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: res.statusText }))
        throw new Error(translateErrorMessage(error.message || res.statusText))
      }

      return res.json()
    },
    getDocumentUrl: (filePath: string) =>
      `${API_BASE}/uploads/documents/${encodeURIComponent(filePath)}`,
  },
  auth: {
    login: (username: string, password: string) =>
      fetchApi<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      fetchApi<{ success: boolean }>("/auth/logout", { method: "POST" }),
    session: () => fetchApi<User>("/auth/session"),
  },
  users: {
    getAll: () => fetchApi<User[]>("/users"),
    create: (data: Record<string, unknown>) =>
      fetchApi<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<User>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
    toggleBlock: (id: string) =>
      fetchApi<User>(`/users/${id}/block`, { method: "PATCH" }),
    getAuditLog: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<AuditLogEntry[]>(`/users/audit-log${qs}`)
    },
  },
  serviceEvents: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<ServiceEvent[]>(`/service-events${qs}`)
    },
    getStats: () => fetchApi<ServiceStats>("/service-events/stats"),
    create: (data: Record<string, unknown>) =>
      fetchApi<ServiceEvent>("/service-events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<ServiceEvent>(`/service-events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/service-events/${id}`, {
        method: "DELETE",
      }),
  },
  equipmentPlans: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<EquipmentPlan[]>(`/equipment-plans${qs}`)
    },
    getStats: () => fetchApi<EquipmentPlanStats>("/equipment-plans/stats"),
    getStages: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<RoadWorkStage[]>(`/equipment-plans/stages${qs}`)
    },
    createStage: (data: Record<string, unknown>) =>
      fetchApi<RoadWorkStage>("/equipment-plans/stages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStage: (id: string, data: Record<string, unknown>) =>
      fetchApi<RoadWorkStage>(`/equipment-plans/stages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteStage: (id: string) =>
      fetchApi<{ success: boolean }>(`/equipment-plans/stages/${id}`, {
        method: "DELETE",
      }),
    getDemands: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<EquipmentDemand[]>(`/equipment-plans/demands${qs}`)
    },
    createDemand: (data: Record<string, unknown>) =>
      fetchApi<EquipmentDemand>("/equipment-plans/demands", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateDemand: (id: string, data: Record<string, unknown>) =>
      fetchApi<EquipmentDemand>(`/equipment-plans/demands/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteDemand: (id: string) =>
      fetchApi<{ success: boolean }>(`/equipment-plans/demands/${id}`, {
        method: "DELETE",
      }),
    getCoverage: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<EquipmentCoverageItem[]>(`/equipment-plans/coverage${qs}`)
    },
    getWorkTypes: () =>
      fetchApi<RoadWorkTypeTemplate[]>("/equipment-plans/work-types"),
    getStageTemplates: () =>
      fetchApi<RoadWorkStageTemplate[]>("/equipment-plans/stage-templates"),
    createWorkType: (data: Record<string, unknown>) =>
      fetchApi<RoadWorkTypeTemplate>("/equipment-plans/work-types", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateWorkType: (id: string, data: Record<string, unknown>) =>
      fetchApi<RoadWorkTypeTemplate>(`/equipment-plans/work-types/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteWorkType: (id: string) =>
      fetchApi<{ success: boolean }>(`/equipment-plans/work-types/${id}`, {
        method: "DELETE",
      }),
    createStageTemplateForWorkType: (
      workTypeId: string,
      data: Record<string, unknown>
    ) =>
      fetchApi<RoadWorkTypeTemplate>(
        `/equipment-plans/work-types/${workTypeId}/stages`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    createStageTemplate: (data: Record<string, unknown>) =>
      fetchApi<RoadWorkStageTemplate>("/equipment-plans/stage-templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStageTemplate: (id: string, data: Record<string, unknown>) =>
      fetchApi<RoadWorkStageTemplate>(`/equipment-plans/stage-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteStageTemplate: (id: string) =>
      fetchApi<{ success: boolean }>(`/equipment-plans/stage-templates/${id}`, {
        method: "DELETE",
      }),
    generateDraft: (data: Record<string, unknown>) =>
      fetchApi<EquipmentPlanDraft>("/equipment-plans/draft", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    applyDraft: (data: Record<string, unknown>) =>
      fetchApi<AppliedEquipmentPlanDraft>("/equipment-plans/apply-draft", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    create: (data: Record<string, unknown>) =>
      fetchApi<EquipmentPlan>("/equipment-plans", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchApi<EquipmentPlan>(`/equipment-plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/equipment-plans/${id}`, {
        method: "DELETE",
      }),
  },
  fleet: {
    getAll: () => fetchApi<FleetVehicle[]>("/fleet"),
    create: (data: unknown) =>
      fetchApi<FleetVehicle>("/fleet", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      fetchApi<FleetVehicle>(`/fleet/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/fleet/${id}`, { method: "DELETE" }),
    getAuditLog: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<FleetAuditEntry[]>(`/fleet/audit-log${qs}`)
    },
  },
  sites: {
    getAll: () => fetchApi<ConstructionSite[]>("/sites"),
    getArchived: () => fetchApi<ConstructionSite[]>("/sites/archived"),
    getOne: (id: string) => fetchApi<ConstructionSiteDetail>(`/sites/${id}`),
    create: (data: unknown) =>
      fetchApi<ConstructionSite>("/sites", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      fetchApi<ConstructionSite>(`/sites/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/sites/${id}`, { method: "DELETE" }),
    complete: (id: string) =>
      fetchApi<ConstructionSite>(`/sites/${id}/complete`, { method: "PATCH" }),
    assignVehicle: (siteId: string, vehicleId: string) =>
      fetchApi<{ success: boolean }>(`/sites/${siteId}/vehicles`, {
        method: "POST",
        body: JSON.stringify({ vehicleId }),
      }),
    unassignVehicle: (siteId: string, vehicleId: string) =>
      fetchApi<{ success: boolean }>(`/sites/${siteId}/vehicles/${vehicleId}`, {
        method: "DELETE",
      }),
    getAvailableVehicles: (siteId?: string) => {
      const qs = siteId ? `?siteId=${siteId}` : ""
      return fetchApi<AvailableVehicle[]>(`/sites/available-vehicles${qs}`)
    },
    getAuditLog: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : ""
      return fetchApi<SiteAuditEntry[]>(`/sites/audit-log${qs}`)
    },
  },
  profile: {
    get: () => fetchApi<User>("/profile"),
    update: (data: Record<string, unknown>) =>
      fetchApi<User>("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      fetchApi<{ success: boolean }>("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
}
