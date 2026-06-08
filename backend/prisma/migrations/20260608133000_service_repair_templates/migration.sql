CREATE TYPE "FleetRepairCategory" AS ENUM (
  'engine',
  'transmission',
  'hydraulics',
  'electrical',
  'chassis',
  'brakes',
  'tires',
  'working_equipment',
  'diagnostics',
  'scheduled_service'
);

CREATE TABLE "FleetRepairTemplate" (
  "id" TEXT NOT NULL,
  "vehicleType" "FleetVehicleType" NOT NULL,
  "category" "FleetRepairCategory" NOT NULL,
  "name" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 100,
  "notes" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FleetRepairTemplate_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FleetRepairTemplate" (
  "id",
  "vehicleType",
  "category",
  "name",
  "durationDays",
  "sortOrder",
  "notes",
  "updatedAt"
) VALUES
  (
    'repair-template-dump-truck-to2',
    'dump_truck'::"FleetVehicleType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО-2 самосвала: масла, фильтры, тормозная система',
    2,
    10,
    'Плановое обслуживание с выводом техники из графика на две смены.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-dump-truck-hydraulics',
    'dump_truck'::"FleetVehicleType",
    'hydraulics'::"FleetRepairCategory",
    'Ревизия гидросистемы подъёма кузова',
    3,
    20,
    'Диагностика гидроцилиндра, рукавов высокого давления и насоса.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-dump-truck-transmission',
    'dump_truck'::"FleetVehicleType",
    'transmission'::"FleetRepairCategory",
    'Ремонт сцепления и коробки передач самосвала',
    4,
    30,
    'Работы требуют снятия узлов трансмиссии.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-crane-hydraulics',
    'crane'::"FleetVehicleType",
    'hydraulics'::"FleetRepairCategory",
    'Проверка гидравлики стрелы и опор автокрана',
    2,
    10,
    'Обязательная проверка перед работами на временных ограждениях.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-excavator-hydraulics',
    'excavator'::"FleetVehicleType",
    'hydraulics'::"FleetRepairCategory",
    'Ремонт гидроцилиндра стрелы экскаватора',
    5,
    10,
    'Включает снятие цилиндра, замену манжет и проверку давления.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-excavator-chassis',
    'excavator'::"FleetVehicleType",
    'chassis'::"FleetRepairCategory",
    'Ремонт ходовой части гусеничного экскаватора',
    4,
    20,
    'Проверка катков, траков и натяжителей.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-loader-transmission',
    'loader'::"FleetVehicleType",
    'transmission'::"FleetRepairCategory",
    'Диагностика трансмиссии фронтального погрузчика',
    2,
    10,
    'Проверка гидротрансформатора и мостов.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-paver-screed',
    'asphalt_paver'::"FleetVehicleType",
    'working_equipment'::"FleetRepairCategory",
    'Ремонт выглаживающей плиты асфальтоукладчика',
    3,
    10,
    'Работы критичны для качества укладки покрытия.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-roller-vibration',
    'road_roller'::"FleetVehicleType",
    'working_equipment'::"FleetRepairCategory",
    'Ремонт вибровозбудителя дорожного катка',
    3,
    10,
    'Техника недоступна для этапов уплотнения на весь период ремонта.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-milling-drum',
    'road_milling_machine'::"FleetVehicleType",
    'working_equipment'::"FleetRepairCategory",
    'Замена резцов и диагностика барабана дорожной фрезы',
    2,
    10,
    'Планируется перед фрезерованием покрытия.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-passenger-car-brakes',
    'passenger_car'::"FleetVehicleType",
    'brakes'::"FleetRepairCategory",
    'Замена тормозных колодок и масла',
    2,
    10,
    'Окно ремонта учитывается при назначении машины на объект.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-van-service',
    'van'::"FleetVehicleType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО фургона снабжения',
    1,
    10,
    'Однодневное обслуживание перед выходом в резерв.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-flatbed-chassis',
    'flatbed_truck'::"FleetVehicleType",
    'chassis'::"FleetRepairCategory",
    'Ремонт подвески и рамы бортового автомобиля',
    3,
    10,
    'Выводит технику из подвоза знаков и малой механизации.',
    CURRENT_TIMESTAMP
  );

ALTER TABLE "FleetServiceEvent"
ADD COLUMN "repairTemplateId" TEXT,
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 1;

UPDATE "FleetServiceEvent"
SET
  "startDate" = COALESCE("dueAt", "createdAt"),
  "endDate" = COALESCE("dueAt", "createdAt")
WHERE "startDate" IS NULL OR "endDate" IS NULL;

CREATE INDEX "FleetRepairTemplate_vehicleType_idx" ON "FleetRepairTemplate"("vehicleType");
CREATE INDEX "FleetRepairTemplate_category_idx" ON "FleetRepairTemplate"("category");
CREATE INDEX "FleetRepairTemplate_sortOrder_idx" ON "FleetRepairTemplate"("sortOrder");
CREATE INDEX "FleetRepairTemplate_isActive_idx" ON "FleetRepairTemplate"("isActive");

CREATE INDEX "FleetServiceEvent_repairTemplateId_idx" ON "FleetServiceEvent"("repairTemplateId");
CREATE INDEX "FleetServiceEvent_startDate_idx" ON "FleetServiceEvent"("startDate");
CREATE INDEX "FleetServiceEvent_endDate_idx" ON "FleetServiceEvent"("endDate");

ALTER TABLE "FleetServiceEvent"
ADD CONSTRAINT "FleetServiceEvent_repairTemplateId_fkey"
FOREIGN KEY ("repairTemplateId") REFERENCES "FleetRepairTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
