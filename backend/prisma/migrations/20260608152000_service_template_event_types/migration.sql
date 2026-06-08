ALTER TABLE "FleetRepairTemplate"
ADD COLUMN "serviceEventType" "FleetServiceEventType" NOT NULL DEFAULT 'repair';

UPDATE "FleetRepairTemplate"
SET "serviceEventType" = CASE
  WHEN "category" = 'scheduled_service'::"FleetRepairCategory" THEN 'maintenance'::"FleetServiceEventType"
  WHEN "category" = 'diagnostics'::"FleetRepairCategory" THEN 'diagnostics'::"FleetServiceEventType"
  ELSE 'repair'::"FleetServiceEventType"
END;

UPDATE "FleetRepairTemplate"
SET "serviceEventType" = 'diagnostics'::"FleetServiceEventType"
WHERE "id" IN (
  'repair-template-crane-hydraulics',
  'repair-template-loader-transmission',
  'repair-template-milling-drum'
);

UPDATE "FleetServiceEvent" AS event
SET "type" = template."serviceEventType"
FROM "FleetRepairTemplate" AS template
WHERE event."repairTemplateId" = template."id";

INSERT INTO "FleetRepairTemplate" (
  "id",
  "vehicleType",
  "serviceEventType",
  "category",
  "name",
  "durationDays",
  "sortOrder",
  "notes",
  "updatedAt"
) VALUES
  (
    'repair-template-crane-scheduled-service',
    'crane'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО автокрана: опоры, лебёдка, гидролинии',
    2,
    20,
    'Проверка узлов, которые влияют на безопасную работу на объекте.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-crane-load-limiter-diagnostics',
    'crane'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'diagnostics'::"FleetRepairCategory",
    'Диагностика ограничителя грузоподъёмности автокрана',
    1,
    30,
    'Проверяется перед подъёмом дорожных плит, знаков и временных конструкций.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-excavator-scheduled-service',
    'excavator'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО гусеничного экскаватора: масла, фильтры, гидролинии',
    2,
    30,
    'Плановое обслуживание перед земляными работами и устройством основания.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-loader-scheduled-service',
    'loader'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО фронтального погрузчика',
    1,
    20,
    'Контроль ковша, мостов и гидравлики перед погрузкой инертных материалов.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-loader-bucket-hydraulics',
    'loader'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'hydraulics'::"FleetRepairCategory",
    'Ремонт гидроцилиндров ковша фронтального погрузчика',
    3,
    30,
    'Техника недоступна для погрузки щебня и асфальтобетонной смеси.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-paver-scheduled-service',
    'asphalt_paver'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО асфальтоукладчика перед сменой укладки',
    2,
    20,
    'Проверка подачи смеси, шнеков, выглаживающей плиты и датчиков.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-paver-sensors-diagnostics',
    'asphalt_paver'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'diagnostics'::"FleetRepairCategory",
    'Диагностика системы подачи смеси и датчиков уклона',
    1,
    30,
    'Используется перед этапом укладки асфальтобетонного покрытия.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-roller-scheduled-service',
    'road_roller'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО вибрационного дорожного катка',
    1,
    20,
    'Проверка вальцов, вибрационного механизма и гидропривода.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-roller-hydraulics-diagnostics',
    'road_roller'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'hydraulics'::"FleetRepairCategory",
    'Диагностика гидропривода вибрации и рулевого управления',
    1,
    30,
    'Нужна перед уплотнением основания и асфальтобетонных слоёв.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-milling-scheduled-service',
    'road_milling_machine'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО дорожной фрезы: привод барабана и конвейер',
    2,
    20,
    'Плановое окно перед фрезерованием покрытия на объекте.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-milling-conveyor-repair',
    'road_milling_machine'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'working_equipment'::"FleetRepairCategory",
    'Ремонт конвейера отвода фрезерованного материала',
    3,
    30,
    'Ремонт влияет на возможность непрерывного фрезерования и вывоза материала.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-passenger-car-scheduled-service',
    'passenger_car'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО легкового автомобиля сопровождения',
    1,
    20,
    'Замена расходников и проверка готовности к выезду на объект.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-passenger-car-chassis-diagnostics',
    'passenger_car'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'diagnostics'::"FleetRepairCategory",
    'Диагностика ходовой и рулевого управления легкового автомобиля',
    1,
    30,
    'Проверяется перед регулярными объездами дорожных объектов.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-van-electrical-diagnostics',
    'van'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'electrical'::"FleetRepairCategory",
    'Диагностика электрики и зарядной системы фургона снабжения',
    1,
    20,
    'Важна для перевозки инструмента, аккумуляторного оборудования и связи.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-van-brakes-repair',
    'van'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'brakes'::"FleetRepairCategory",
    'Ремонт тормозной системы фургона снабжения',
    2,
    30,
    'Фургон выводится из графика подвоза материалов и малой механизации.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-flatbed-scheduled-service',
    'flatbed_truck'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО бортового автомобиля',
    1,
    20,
    'Проверка креплений платформы, тормозов и световой сигнализации.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-flatbed-brakes-diagnostics',
    'flatbed_truck'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'diagnostics'::"FleetRepairCategory",
    'Диагностика тормозной системы и световой сигнализации',
    1,
    30,
    'Проводится перед перевозкой дорожных знаков и ограждений.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-bulldozer-scheduled-service',
    'bulldozer'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО бульдозера: масла, фильтры, натяжение гусениц',
    2,
    10,
    'Плановое обслуживание перед земляными работами.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-bulldozer-blade-repair',
    'bulldozer'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'working_equipment'::"FleetRepairCategory",
    'Ремонт отвала и гидроцилиндров подъёма бульдозера',
    4,
    20,
    'Ремонт блокирует работы по профилированию и перемещению грунта.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-bulldozer-transmission-diagnostics',
    'bulldozer'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'transmission'::"FleetRepairCategory",
    'Диагностика трансмиссии и бортовых редукторов бульдозера',
    1,
    30,
    'Проверка перед длительной работой на участке основания.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-tractor-scheduled-service',
    'tractor'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО трактора дорожной службы',
    1,
    10,
    'Проверка навесного оборудования, масел и тормозов.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-tractor-hydraulics-repair',
    'tractor'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'hydraulics'::"FleetRepairCategory",
    'Ремонт навесного оборудования и гидросистемы трактора',
    3,
    20,
    'Влияет на использование щёток, отвалов и прицепного оборудования.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-tractor-transmission-diagnostics',
    'tractor'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'transmission'::"FleetRepairCategory",
    'Диагностика сцепления и коробки передач трактора',
    1,
    30,
    'Проводится при рывках и потере тяги на объекте.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-motor-grader-scheduled-service',
    'motor_grader'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО автогрейдера: нож, гидросистема, ходовая часть',
    2,
    10,
    'Плановое обслуживание перед профилированием основания.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-motor-grader-circle-repair',
    'motor_grader'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'working_equipment'::"FleetRepairCategory",
    'Ремонт поворотного круга и отвала автогрейдера',
    4,
    20,
    'Без ремонта техника не назначается на планировку и профилирование.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-motor-grader-hydraulics-diagnostics',
    'motor_grader'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'hydraulics'::"FleetRepairCategory",
    'Диагностика гидравлики управления отвалом автогрейдера',
    1,
    30,
    'Проверка точности управления рабочим органом.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-truck-tractor-scheduled-service',
    'truck_tractor'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО седельного тягача: двигатель, тормоза, седло',
    2,
    10,
    'Плановое окно перед перевозкой тяжёлой дорожной техники.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-truck-tractor-transmission-repair',
    'truck_tractor'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'transmission'::"FleetRepairCategory",
    'Ремонт сцепления и коробки передач седельного тягача',
    4,
    20,
    'Ремонт влияет на доставку техники и материалов на объекты.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-truck-tractor-brakes-diagnostics',
    'truck_tractor'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'brakes'::"FleetRepairCategory",
    'Диагностика пневмосистемы и тормозов седельного тягача',
    1,
    30,
    'Проверка обязательна перед движением с полуприцепом.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-semi-trailer-scheduled-service',
    'semi_trailer'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'ТО полуприцепа: оси, светотехника, сцепное устройство',
    1,
    10,
    'Проверка перед перевозкой асфальтоукладчика или дорожной фрезы.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-semi-trailer-chassis-repair',
    'semi_trailer'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'chassis'::"FleetRepairCategory",
    'Ремонт подвески и тормозных камер полуприцепа',
    3,
    20,
    'Полуприцеп недоступен для перебазировки тяжёлой техники.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-semi-trailer-electrical-diagnostics',
    'semi_trailer'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'electrical'::"FleetRepairCategory",
    'Диагностика ABS и электрической линии полуприцепа',
    1,
    30,
    'Проверка светотехники и электрической линии перед рейсом.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-pickup-scheduled-service',
    'pickup'::"FleetVehicleType",
    'maintenance'::"FleetServiceEventType",
    'scheduled_service'::"FleetRepairCategory",
    'Плановое ТО пикапа сопровождения',
    1,
    10,
    'Проверка перед выездом инженера на дорожный объект.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-pickup-chassis-repair',
    'pickup'::"FleetVehicleType",
    'repair'::"FleetServiceEventType",
    'chassis'::"FleetRepairCategory",
    'Ремонт подвески и шин пикапа сопровождения',
    2,
    20,
    'Пикап выводится из поездок на объекты и контрольных объездов.',
    CURRENT_TIMESTAMP
  ),
  (
    'repair-template-pickup-electrical-diagnostics',
    'pickup'::"FleetVehicleType",
    'diagnostics'::"FleetServiceEventType",
    'electrical'::"FleetRepairCategory",
    'Диагностика электрики и средств связи пикапа',
    1,
    30,
    'Проверяется питание радиостанции, маяков и зарядных устройств.',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX "FleetRepairTemplate_serviceEventType_idx" ON "FleetRepairTemplate"("serviceEventType");
