WITH invalid_quality AS (
  SELECT
    quality."id",
    quality."startDate" AS old_start,
    quality."endDate" AS old_end,
    MAX(physical."endDate") + INTERVAL '1 day' AS new_start,
    MAX(physical."endDate") + INTERVAL '1 day' + (quality."endDate" - quality."startDate") AS new_end
  FROM "RoadWorkStage" AS quality
  JOIN "RoadWorkStage" AS physical
    ON physical."siteId" = quality."siteId"
   AND physical."type" NOT IN (
      'traffic_control'::"RoadWorkStageType",
      'quality_control'::"RoadWorkStageType",
      'maintenance'::"RoadWorkStageType"
    )
  WHERE quality."type" = 'quality_control'::"RoadWorkStageType"
  GROUP BY quality."id", quality."startDate", quality."endDate"
  HAVING quality."startDate" <= MAX(physical."endDate")
),
safe_quality AS (
  SELECT invalid_quality.*
  FROM invalid_quality
  WHERE NOT EXISTS (
    SELECT 1
    FROM "EquipmentPlanAssignment" AS assignment
    JOIN "EquipmentPlanAssignment" AS other_assignment
      ON other_assignment."id" <> assignment."id"
     AND other_assignment."vehicleId" = assignment."vehicleId"
     AND other_assignment."shift" = assignment."shift"
     AND other_assignment."workDate" = invalid_quality.new_start + (assignment."workDate" - invalid_quality.old_start)
    WHERE assignment."stageId" = invalid_quality."id"
  )
),
updated_assignments AS (
  UPDATE "EquipmentPlanAssignment" AS assignment
  SET "workDate" = safe_quality.new_start + (assignment."workDate" - safe_quality.old_start)
  FROM safe_quality
  WHERE assignment."stageId" = safe_quality."id"
  RETURNING assignment."id"
)
UPDATE "RoadWorkStage" AS stage
SET
  "startDate" = safe_quality.new_start,
  "endDate" = safe_quality.new_end,
  "updatedAt" = CURRENT_TIMESTAMP
FROM safe_quality
WHERE stage."id" = safe_quality."id";
