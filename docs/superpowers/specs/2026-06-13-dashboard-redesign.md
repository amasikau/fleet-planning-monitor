# Dashboard Redesign Spec
Date: 2026-06-13
File: `next-app/app/dashboard/page.tsx`

## Goals

Redesign the main dashboard page to add:
- Mini site map (reuse existing Yandex map component)
- Equipment occupancy stacked bar chart with period filter
- Mini shadcn Calendar with per-day tooltip showing active equipment
- Free equipment count by vehicle type
- Card style: no border, shadow-only, rounded-xl

Keep all existing data sources (`vehicles`, `sites`, `plans`, `coverage`, `serviceStats`, `planStats`). No new API calls needed — all new widgets derive data from already-fetched state.

---

## Layout (Option A — vertical stack)

```
┌─────────────────────────────────────────────────────┐
│  [KPI card] [KPI card] [KPI card] [KPI card] [KPI]  │  ← row 1
├────────────────────────────┬────────────────────────┤
│  Mini Map (60%)            │  Mini Calendar (40%)   │  ← row 2
├─────────────────────────────────────────────────────┤
│  Equipment Occupancy Chart (full width)             │  ← row 3
├────────────────────────────┬────────────────────────┤
│  Free Equipment (60%)      │  Control Risks (40%)   │  ← row 4
├─────────────────────────────────────────────────────┤
│  Upcoming Shifts table (full width)                 │  ← row 5
└─────────────────────────────────────────────────────┘
```

---

## Section 1 — KPI Cards

**Style change:** Replace `<Card>` (which adds border) with a plain `div`:
```tsx
className="bg-card rounded-xl shadow-sm p-4 flex items-center gap-4"
```
Icon: colored rounded square (`rounded-lg`, solid background color). Number: `text-2xl font-bold`. Label + note below.

No structural data changes — same 5 metrics.

---

## Section 2 — Mini Map

**Component:** Reuse `SitesMapCard` from `@/components/sites/sites-map`.
- Props: `sites={sites}` (already loaded)
- Height: `280px`
- Wrap in same shadow-sm / no-border container style
- Grid column: `xl:col-span-3` out of 5 (≈60%)

---

## Section 3 — Mini Calendar

**Component:** shadcn `<Calendar>` (already exists at `components/ui/calendar.tsx`, uses `react-day-picker`)
- Single month, no date selection (`mode="default"` or no mode)
- Grid column: `xl:col-span-2` (≈40%)

**Per-day indicators:**
- Build a `Map<string, EquipmentPlan[]>` keyed by `dateKey(plan.workDate)` from `plans[]`
- Pass custom `components={{ DayButton }}` to Calendar
- `DayButton`: if the date has plans, render a small colored dot below the day number

**Tooltip on hover:**
- Use shadcn `<Tooltip>` wrapping the custom DayButton
- `TooltipContent`: list up to 3 entries of `plan.siteName + " · " + plan.vehicleLabel`, then `+N ещё` if more
- Locale: `ru` (already used project-wide via `Intl.DateTimeFormat`)

---

## Section 4 — Equipment Occupancy Chart

**Library:** `recharts` (already installed, `^3.8.0`)

**Component name:** `EquipmentOccupancyChart`

**Period filter:** shadcn `ToggleGroup` with 4 values: `today` / `3days` / `week` / `month`. Default: `week`.

**Data derivation (client-side, no API call):**
```
periodPlans = plans filtered to [periodStart, periodEnd]
groupBy workDate → groupBy vehicleType → count
```
`EquipmentPlan` already carries `vehicleType: FleetVehicleType` — no join needed.

**Chart:**
- `<BarChart>` with `<Bar>` per `FleetVehicleType` that appears in the period, `stackId="a"`
- Colors: fixed palette per type (8 colors cycling)
- `<ReferenceLine x={today} stroke="hsl(var(--primary))" strokeDasharray="4 2" />` for today marker
- `<Tooltip>` showing breakdown by type on hover
- `<Legend>` below chart, only types that have data
- Axis X: formatted dates (`dd.MM`)
- Axis Y: integer ticks, label «Ед. техники»

---

## Section 5 — Free Equipment by Type

**Component name:** `FreeEquipmentByType`

**Data:** `vehicles.filter(v => v.status === "reserve")` grouped by `v.type`.

**Layout:** Card with `shadow-sm`, no border. List of rows:
```
[type icon/emoji]  [FLEET_VEHICLE_TYPE_LABELS[type]]   [Badge count]
```
Types with zero free vehicles: rendered with `text-muted-foreground opacity-50`.
Sort: types with free vehicles first, descending by count.

---

## Section 6 — Control Risks (style only)

No data changes. Style change: replace `rounded-lg border p-3` on each risk row with `rounded-lg bg-muted/40 p-3` (remove `border`, add subtle muted background).

---

## Section 7 — Upcoming Shifts Table

Same data and columns. Style change: card wrapper gets `shadow-sm` and no `border`. Increase row limit from 6 to 8 (`upcomingPlans.slice(0, 8)`).

---

## Additional Improvements

- **Header date:** Add `new Intl.DateTimeFormat("ru-RU", {…}).format(new Date())` next to page title as `text-sm text-muted-foreground`.
- **Skeleton loading:** Replace the spinner with shadcn `<Skeleton>` components matching the card shapes.
- **Empty state for chart:** If no plans in the selected period, show a centered muted message.

---

## Data Flow

All data is fetched once in `useEffect` (unchanged):
```
api.fleet.getAll()          → vehicles[]
api.sites.getAll()          → sites[]
api.serviceEvents.getStats() → serviceStats
api.equipmentPlans.getStats() → planStats
api.equipmentPlans.getAll()  → plans[]
api.equipmentPlans.getCoverage() → coverage[]
```

New derived state (client-only, `useMemo`):
- `plansByDate: Map<string, EquipmentPlan[]>` — for calendar tooltips
- `occupancyData: OccupancyRow[]` — for chart, recomputed when `periodFilter` changes (`plan.vehicleType` used directly)
- `freeByType: Map<FleetVehicleType, number>` — for free equipment section

---

## Files to Change

| File | Change |
|------|--------|
| `next-app/app/dashboard/page.tsx` | Full redesign — add new sections, new derived state, new child components |
| No other files needed | All components inline in `page.tsx` (consistent with existing pattern) |

Components added inline in `page.tsx`:
- `EquipmentOccupancyChart` 
- `FreeEquipmentByType`
- `MiniCalendar`

---

## Constraints

- No new API endpoints
- No new npm packages (recharts and shadcn Calendar already present)
- Keep TypeScript strict — no `any`
- Russian locale throughout
- Match existing shadcn component usage patterns
