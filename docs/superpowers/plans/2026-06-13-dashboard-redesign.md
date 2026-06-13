# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `next-app/app/dashboard/page.tsx` — add mini map, stacked occupancy chart, shadcn calendar with tooltips, free equipment list; remove card borders.

**Architecture:** All changes in one file. New inline components use existing data already fetched by DashboardPage. No new API calls, no new packages.

**Tech Stack:** recharts ^3.8, react-day-picker ^9.14, date-fns ^4.1, shadcn (Calendar, ToggleGroup, Tooltip, Skeleton), Yandex map (SitesOverviewMap).

---

## File Structure

| File | Change |
|------|--------|
| `next-app/app/dashboard/page.tsx` | Full rewrite — all new components inline |

---

### Task 1: Full rewrite of dashboard/page.tsx

**Files:**
- Modify: `next-app/app/dashboard/page.tsx`

- [ ] Write the complete new file (see content below)
- [ ] Verify TypeScript compiles: `cd next-app && npx tsc --noEmit`
- [ ] Start dev server and check visually
- [ ] Commit

New structure:
- Imports (recharts, date-fns/locale ru, Calendar, ToggleGroup, Tooltip, Skeleton, SitesOverviewMap)
- `VEHICLE_TYPE_COLORS` palette
- `PlansByDateContext` + `MiniCalendarDayButton` + `MiniCalendar`
- `EquipmentOccupancyChart` with period filter
- `FreeEquipmentByType`
- Modified `DashboardPage` with new layout (no card borders, shadow-sm)
