import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.equipmentPlanAssignment.deleteMany();
  await prisma.equipmentDemand.deleteMany();
  await prisma.roadWorkStage.deleteMany();
  await prisma.roadWorkTypeStageTemplate.deleteMany();
  await prisma.roadWorkStageEquipmentTemplate.deleteMany();
  await prisma.roadWorkStageTemplate.deleteMany();
  await prisma.roadWorkTypeTemplate.deleteMany();
  await prisma.constructionSiteAuditLog.deleteMany();
  await prisma.siteVehicle.deleteMany();
  await prisma.constructionSite.deleteMany();
  await prisma.fleetAuditLog.deleteMany();
  await prisma.fleetServiceEvent.deleteMany();
  await prisma.fleetVehicle.deleteMany();
  await prisma.driverAuditLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.driverDocument.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hash,
      lastName: 'Иванов',
      firstName: 'Алексей',
      middleName: 'Петрович',
      role: 'admin',
      position: 'Системный администратор',
      status: 'active',
      isOnline: true,
      createdAt: new Date('2024-01-15T00:00:00.000Z'),
    },
  });

  const petrov = await prisma.user.create({
    data: {
      username: 'petrov_sm',
      password: hash,
      lastName: 'Петров',
      firstName: 'Сергей',
      middleName: 'Михайлович',
      role: 'moderator',
      position: 'Руководитель отдела',
      status: 'active',
      isOnline: true,
      createdAt: new Date('2024-02-10T00:00:00.000Z'),
    },
  });

  const sidorova = await prisma.user.create({
    data: {
      username: 'sidorova_ek',
      password: hash,
      lastName: 'Сидорова',
      firstName: 'Елена',
      middleName: 'Константиновна',
      role: 'moderator',
      position: 'Модератор',
      status: 'active',
      isOnline: false,
      createdAt: new Date('2024-03-05T00:00:00.000Z'),
    },
  });

  const kozlov = await prisma.user.create({
    data: {
      username: 'kozlov_dv',
      password: hash,
      lastName: 'Козлов',
      firstName: 'Дмитрий',
      middleName: 'Владимирович',
      role: 'driver',
      position: 'Водитель категории С',
      status: 'active',
      isOnline: true,
      createdAt: new Date('2024-03-20T00:00:00.000Z'),
    },
  });

  const morozov = await prisma.user.create({
    data: {
      username: 'morozov_an',
      password: hash,
      lastName: 'Морозов',
      firstName: 'Андрей',
      middleName: 'Николаевич',
      role: 'mechanic',
      position: 'Старший механик',
      status: 'active',
      isOnline: false,
      createdAt: new Date('2024-04-12T00:00:00.000Z'),
    },
  });

  await prisma.user.create({
    data: {
      username: 'volkov_iv',
      password: hash,
      lastName: 'Волков',
      firstName: 'Игорь',
      middleName: 'Васильевич',
      role: 'driver',
      position: 'Водитель категории В',
      status: 'active',
      isOnline: false,
      createdAt: new Date('2024-05-01T00:00:00.000Z'),
    },
  });

  const novikova = await prisma.user.create({
    data: {
      username: 'novikova_ma',
      password: hash,
      lastName: 'Новикова',
      firstName: 'Мария',
      middleName: 'Алексеевна',
      role: 'moderator',
      position: 'Старший модератор',
      status: 'active',
      isOnline: true,
      createdAt: new Date('2024-05-15T00:00:00.000Z'),
    },
  });

  const lebedev = await prisma.user.create({
    data: {
      username: 'lebedev_pa',
      password: hash,
      lastName: 'Лебедев',
      firstName: 'Павел',
      middleName: 'Андреевич',
      role: 'mechanic',
      position: 'Механик',
      status: 'blocked',
      isOnline: false,
      createdAt: new Date('2024-06-01T00:00:00.000Z'),
    },
  });

  const sokolov = await prisma.user.create({
    data: {
      username: 'sokolov_ar',
      password: hash,
      lastName: 'Соколов',
      firstName: 'Артём',
      middleName: 'Романович',
      role: 'driver',
      position: 'Водитель категории С',
      status: 'active',
      isOnline: false,
      createdAt: new Date('2024-06-20T00:00:00.000Z'),
    },
  });

  const fedorova = await prisma.user.create({
    data: {
      username: 'fedorova_ol',
      password: hash,
      lastName: 'Фёдорова',
      firstName: 'Ольга',
      middleName: 'Игоревна',
      role: 'moderator',
      position: 'Модератор по логистике',
      status: 'active',
      isOnline: true,
      createdAt: new Date('2024-07-10T00:00:00.000Z'),
    },
  });

  // Create drivers (assigned)
  const driverKozlov = await prisma.driver.create({
    data: {
      userId: kozlov.id,
      categories: ['B', 'C'],
      assignedAt: new Date('2026-03-16T00:00:00.000Z'),
      documents: {
        create: [
          {
            type: 'medical',
            fileName: 'med_kozlov.pdf',
            uploadedAt: new Date('2026-03-15T00:00:00.000Z'),
          },
          {
            type: 'license',
            fileName: 'vu_kozlov.pdf',
            uploadedAt: new Date('2026-03-15T00:00:00.000Z'),
          },
        ],
      },
    },
  });

  const driverSokolov = await prisma.driver.create({
    data: {
      userId: sokolov.id,
      categories: ['B', 'C', 'CE'],
      assignedAt: new Date('2026-03-21T00:00:00.000Z'),
      documents: {
        create: [
          {
            type: 'medical',
            fileName: 'med_sokolov.pdf',
            uploadedAt: new Date('2026-03-20T00:00:00.000Z'),
          },
          {
            type: 'license',
            fileName: 'vu_sokolov.pdf',
            uploadedAt: new Date('2026-03-20T00:00:00.000Z'),
          },
        ],
      },
    },
  });

  // volkov_iv is UNASSIGNED (no Driver record)

  // Seed AuditLog entries
  await prisma.auditLog.createMany({
    data: [
      {
        timestamp: new Date('2026-04-04T10:30:00.000Z'),
        action: 'login',
        targetUserId: admin.id,
        performedById: admin.id,
        details: 'Вход в систему с IP 192.168.1.10',
      },
      {
        timestamp: new Date('2026-04-04T09:15:00.000Z'),
        action: 'create',
        targetUserId: sokolov.id,
        performedById: admin.id,
        details: 'Создан пользователь sokolov_ar',
      },
      {
        timestamp: new Date('2026-04-03T16:45:00.000Z'),
        action: 'edit',
        targetUserId: petrov.id,
        performedById: admin.id,
        details: 'Изменены данные пользователя: должность',
      },
      {
        timestamp: new Date('2026-04-03T14:20:00.000Z'),
        action: 'block',
        targetUserId: lebedev.id,
        performedById: admin.id,
        details: 'Пользователь lebedev_pa заблокирован',
      },
      {
        timestamp: new Date('2026-04-02T11:00:00.000Z'),
        action: 'login',
        targetUserId: petrov.id,
        performedById: petrov.id,
        details: 'Вход в систему с IP 192.168.1.15',
      },
      {
        timestamp: new Date('2026-04-02T08:30:00.000Z'),
        action: 'logout',
        targetUserId: sidorova.id,
        performedById: sidorova.id,
        details: 'Выход из системы',
      },
      {
        timestamp: new Date('2026-04-01T17:00:00.000Z'),
        action: 'edit',
        targetUserId: novikova.id,
        performedById: admin.id,
        details: 'Изменены данные пользователя: роль, должность',
      },
      {
        timestamp: new Date('2026-04-01T12:00:00.000Z'),
        action: 'create',
        targetUserId: fedorova.id,
        performedById: admin.id,
        details: 'Создан пользователь fedorova_ol',
      },
    ],
  });

  // Seed DriverAuditLog entries
  await prisma.driverAuditLog.createMany({
    data: [
      {
        timestamp: new Date('2026-03-21T10:00:00.000Z'),
        action: 'assign',
        targetUserId: sokolov.id,
        performedById: admin.id,
        details: 'Назначен водителем с категориями: B, C, CE',
      },
      {
        timestamp: new Date('2026-03-20T14:00:00.000Z'),
        action: 'doc_upload',
        targetUserId: sokolov.id,
        performedById: admin.id,
        details: 'Загружен документ: med_sokolov.pdf (medical)',
      },
      {
        timestamp: new Date('2026-03-20T14:05:00.000Z'),
        action: 'doc_upload',
        targetUserId: sokolov.id,
        performedById: admin.id,
        details: 'Загружен документ: vu_sokolov.pdf (license)',
      },
      {
        timestamp: new Date('2026-03-16T09:00:00.000Z'),
        action: 'assign',
        targetUserId: kozlov.id,
        performedById: admin.id,
        details: 'Назначен водителем с категориями: B, C',
      },
      {
        timestamp: new Date('2026-03-15T11:00:00.000Z'),
        action: 'doc_upload',
        targetUserId: kozlov.id,
        performedById: admin.id,
        details: 'Загружен документ: med_kozlov.pdf (medical)',
      },
      {
        timestamp: new Date('2026-03-15T11:05:00.000Z'),
        action: 'doc_upload',
        targetUserId: kozlov.id,
        performedById: admin.id,
        details: 'Загружен документ: vu_kozlov.pdf (license)',
      },
    ],
  });

  const kamazDump = await prisma.fleetVehicle.create({
    data: {
      name: 'КАМАЗ 65201-53',
      brand: 'КАМАЗ',
      model: '65201-53',
      plateNumber: '1842 AB-7',
      vin: 'XTC652015R0001842',
      type: 'dump_truck',
      status: 'active',
      year: 2021,
      odometerKm: 84210,
      fuelLevelPercent: 74,
      baseName: 'Минская производственная база',
      currentSite: 'Ремонт трассы М-5, км 34+200 — 42+600',
      assignedDriverUserId: driverKozlov.userId,
      nextMaintenanceAt: new Date('2026-04-18T08:00:00.000Z'),
      nextMaintenanceKm: 85000,
      insuranceExpiresAt: new Date('2026-05-02T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-06-16T00:00:00.000Z'),
      notes: 'Грузовой самосвал из ведомости автотранспорта, подвоз щебня и асфальтобетонной смеси.',
    },
  });

  const mazDump = await prisma.fleetVehicle.create({
    data: {
      name: 'МАЗ 6516B9-480-000',
      brand: 'МАЗ',
      model: '6516B9-480-000',
      plateNumber: '2213 AK-7',
      vin: 'Y3M6516B9R0002213',
      type: 'dump_truck',
      status: 'repair',
      year: 2020,
      odometerKm: 126440,
      fuelLevelPercent: 38,
      baseName: 'Минская производственная база',
      currentSite: 'Асфальтирование ул. Центральная',
      assignedDriverUserId: driverSokolov.userId,
      nextMaintenanceAt: new Date('2026-04-09T09:00:00.000Z'),
      nextMaintenanceKm: 127000,
      insuranceExpiresAt: new Date('2026-05-21T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-04-27T00:00:00.000Z'),
      notes: 'Грузовой самосвал МАЗ из ведомости, стоит на ТО с ревизией гидролинии.',
    },
  });

  const mazCrane = await prisma.fleetVehicle.create({
    data: {
      name: 'МАЗ 5337A2-340P',
      brand: 'МАЗ',
      model: '5337A2-340P',
      plateNumber: '3098 AM-7',
      vin: 'Y3M5337A2R0003098',
      type: 'crane',
      status: 'active',
      year: 2019,
      odometerKm: 48120,
      fuelLevelPercent: 61,
      baseName: 'Гомельская дорожная база',
      currentSite: 'Фрезерование покрытия на проспекте Мира',
      nextMaintenanceAt: new Date('2026-04-23T10:00:00.000Z'),
      nextMaintenanceKm: 50000,
      insuranceExpiresAt: new Date('2026-04-29T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-05-19T00:00:00.000Z'),
      notes: 'Автомобильный кран из раздела автотранспорта, используется на монтаже временных ограждений.',
    },
  });

  const jcbExcavator = await prisma.fleetVehicle.create({
    data: {
      name: 'JCB JS220SC T2',
      brand: 'JCB',
      model: 'JS220SC T2',
      plateNumber: '4675 EB-7',
      vin: 'JCBJS220SCR004675',
      type: 'excavator',
      status: 'repair',
      year: 2018,
      odometerKm: 158930,
      fuelLevelPercent: 19,
      baseName: 'Могилёвская дорожная база',
      currentSite: 'Устройство основания дороги к промзоне Восток',
      nextMaintenanceAt: new Date('2026-04-05T07:30:00.000Z'),
      nextMaintenanceKm: 158500,
      insuranceExpiresAt: new Date('2026-04-14T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-04-11T00:00:00.000Z'),
      notes: 'Экскаватор гусеничный из ведомости ДСМ, выведен в ремонт после замечаний по гидравлике.',
    },
  });

  const gazVan = await prisma.fleetVehicle.create({
    data: {
      name: 'ГАЗ C45R02 CERMES',
      brand: 'ГАЗ',
      model: 'C45R02 CERMES',
      plateNumber: '5124 AT-5',
      vin: 'X96C45R02R0005124',
      type: 'van',
      status: 'reserve',
      year: 2022,
      odometerKm: 19240,
      fuelLevelPercent: 52,
      baseName: 'Минская производственная база',
      currentSite: 'Резерв снабжения дорожных бригад',
      nextMaintenanceAt: new Date('2026-05-25T08:00:00.000Z'),
      nextMaintenanceKm: 25000,
      insuranceExpiresAt: new Date('2026-07-02T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-18T00:00:00.000Z'),
      notes: 'Автомобиль для подвоза знаков, конусов, инструмента и мелких запчастей.',
    },
  });

  const hyundaiTucson = await prisma.fleetVehicle.create({
    data: {
      name: 'Hyundai Tucson',
      brand: 'Hyundai',
      model: 'Tucson',
      plateNumber: '7341 AO-7',
      vin: 'KMHJ3812R0007341',
      type: 'passenger_car',
      status: 'active',
      year: 2021,
      odometerKm: 56320,
      fuelLevelPercent: 83,
      baseName: 'Гомельская дорожная база',
      currentSite: 'Ямочный ремонт городской сети',
      nextMaintenanceAt: new Date('2026-05-06T08:00:00.000Z'),
      nextMaintenanceKm: 60000,
      insuranceExpiresAt: new Date('2026-06-12T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-06-29T00:00:00.000Z'),
      notes: 'Легковой автомобиль из ведомости, используется для оперативных выездов мастера.',
    },
  });

  const hyundaiExcavator = await prisma.fleetVehicle.create({
    data: {
      name: 'Hyundai R-250LC-7',
      brand: 'Hyundai',
      model: 'R-250LC-7',
      plateNumber: '6402 BA-7',
      vin: 'HHKHK604KR0006402',
      type: 'excavator',
      status: 'active',
      year: 2017,
      odometerKm: 113600,
      fuelLevelPercent: 67,
      baseName: 'Минская производственная база',
      currentSite: 'Устройство основания дороги к промзоне Восток',
      nextMaintenanceAt: new Date('2026-05-14T08:00:00.000Z'),
      nextMaintenanceKm: 114000,
      insuranceExpiresAt: new Date('2026-07-20T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-02T00:00:00.000Z'),
      notes: 'Экскаватор гусеничный категории Г из ведомости ДСМ.',
    },
  });

  const shantuiBulldozer = await prisma.fleetVehicle.create({
    data: {
      name: 'Shantui SD16',
      brand: 'Shantui',
      model: 'SD16',
      plateNumber: '8056 BT-7',
      vin: 'SSSD16R0008056',
      type: 'bulldozer',
      status: 'active',
      year: 2016,
      odometerKm: 96500,
      fuelLevelPercent: 58,
      baseName: 'Могилёвская дорожная база',
      currentSite: 'Дорога к промзоне Восток',
      nextMaintenanceAt: new Date('2026-05-18T08:00:00.000Z'),
      nextMaintenanceKm: 97000,
      insuranceExpiresAt: new Date('2026-08-04T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-16T00:00:00.000Z'),
      notes: 'Бульдозер из ведомости ДСМ, применяется на земляных работах и планировке основания.',
    },
  });

  const amkodorLoader = await prisma.fleetVehicle.create({
    data: {
      name: 'Амкодор 342C4',
      brand: 'Амкодор',
      model: '342C4',
      plateNumber: '1964 AX-5',
      vin: 'Y4A342C4R0001964',
      type: 'loader',
      status: 'reserve',
      year: 2020,
      odometerKm: 74800,
      fuelLevelPercent: 70,
      baseName: 'Минская производственная база',
      currentSite: 'Резерв погрузки инертных материалов',
      nextMaintenanceAt: new Date('2026-06-03T08:00:00.000Z'),
      nextMaintenanceKm: 75500,
      insuranceExpiresAt: new Date('2026-09-10T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-09-18T00:00:00.000Z'),
      notes: 'Погрузчик фронтальный из ведомости ДСМ, резерв для подмены на складе щебня.',
    },
  });

  const vogelePaver = await prisma.fleetVehicle.create({
    data: {
      name: 'Vogele Super 1800-2',
      brand: 'Vogele',
      model: 'Super 1800-2',
      plateNumber: '2739 AP-7',
      vin: 'WVG18002R0002739',
      type: 'asphalt_paver',
      status: 'active',
      year: 2018,
      odometerKm: 68400,
      fuelLevelPercent: 64,
      baseName: 'Минская производственная база',
      currentSite: 'Асфальтирование ул. Центральная',
      nextMaintenanceAt: new Date('2026-05-28T08:00:00.000Z'),
      nextMaintenanceKm: 69000,
      insuranceExpiresAt: new Date('2026-08-30T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-09-12T00:00:00.000Z'),
      notes: 'Асфальтоукладчик из ведомости ДСМ, ключевая единица на укладке покрытия.',
    },
  });

  const bomagRoller = await prisma.fleetVehicle.create({
    data: {
      name: 'Bomag BW 211 D-4',
      brand: 'Bomag',
      model: 'BW 211 D-4',
      plateNumber: '4180 AC-7',
      vin: 'BOM211D4R0004180',
      type: 'road_roller',
      status: 'active',
      year: 2017,
      odometerKm: 73200,
      fuelLevelPercent: 69,
      baseName: 'Минская производственная база',
      currentSite: 'Асфальтирование ул. Центральная',
      nextMaintenanceAt: new Date('2026-05-22T08:00:00.000Z'),
      nextMaintenanceKm: 73800,
      insuranceExpiresAt: new Date('2026-08-12T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-26T00:00:00.000Z'),
      notes: 'Каток вибрационный дорожный из ведомости ДСМ, используется на уплотнении покрытия.',
    },
  });

  const wirtgenMilling = await prisma.fleetVehicle.create({
    data: {
      name: 'Wirtgen W 2000',
      brand: 'Wirtgen',
      model: 'W 2000',
      plateNumber: '9236 EK-7',
      vin: 'W2000BYR0009236',
      type: 'road_milling_machine',
      status: 'active',
      year: 2016,
      odometerKm: 61200,
      fuelLevelPercent: 72,
      baseName: 'Минская производственная база',
      currentSite: 'Фрезерование покрытия на проспекте Мира',
      nextMaintenanceAt: new Date('2026-06-01T08:00:00.000Z'),
      nextMaintenanceKm: 62000,
      insuranceExpiresAt: new Date('2026-08-18T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-09-05T00:00:00.000Z'),
      notes: 'Дорожная фреза для холодного фрезерования покрытия и погрузки фрезерата в самосвалы.',
    },
  });

  const volvoGrader = await prisma.fleetVehicle.create({
    data: {
      name: 'Volvo G930',
      brand: 'Volvo',
      model: 'G930',
      plateNumber: '5097 EO-5',
      vin: 'VCEG930R0005097',
      type: 'motor_grader',
      status: 'reserve',
      year: 2015,
      odometerKm: 104500,
      fuelLevelPercent: 46,
      baseName: 'Могилёвская дорожная база',
      currentSite: 'Резерв планировки основания',
      nextMaintenanceAt: new Date('2026-06-08T08:00:00.000Z'),
      nextMaintenanceKm: 105000,
      insuranceExpiresAt: new Date('2026-07-18T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-01T00:00:00.000Z'),
      notes: 'Автогрейдер категории Е из ведомости ДСМ для профилирования основания.',
    },
  });

  const mazTractor = await prisma.fleetVehicle.create({
    data: {
      name: 'МАЗ 5440L9-520-031',
      brand: 'МАЗ',
      model: '5440L9-520-031',
      plateNumber: '6284 AO-7',
      vin: 'Y3M5440L9R0006284',
      type: 'truck_tractor',
      status: 'active',
      year: 2021,
      odometerKm: 118400,
      fuelLevelPercent: 77,
      baseName: 'Минская производственная база',
      currentSite: 'Перевозка полуприцепов с инертными материалами',
      nextMaintenanceAt: new Date('2026-05-30T08:00:00.000Z'),
      nextMaintenanceKm: 119000,
      insuranceExpiresAt: new Date('2026-07-24T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-08T00:00:00.000Z'),
      notes: 'Грузовой седельный тягач из ведомости автотранспорта.',
    },
  });

  const mazSemiTrailer = await prisma.fleetVehicle.create({
    data: {
      name: 'МАЗ 938660-1011',
      brand: 'МАЗ',
      model: '938660-1011 ПСБ-20',
      plateNumber: '7710 AI-7',
      vin: 'Y3M938660R0007710',
      type: 'semi_trailer',
      status: 'reserve',
      year: 2019,
      odometerKm: 0,
      fuelLevelPercent: 100,
      baseName: 'Минская производственная база',
      currentSite: 'Резерв перевозки дорожных материалов',
      nextMaintenanceAt: new Date('2026-06-12T08:00:00.000Z'),
      nextMaintenanceKm: 0,
      insuranceExpiresAt: new Date('2026-09-01T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-09-15T00:00:00.000Z'),
      notes: 'Полуприцеп специальный из ведомости, учитывается отдельно от тягача.',
    },
  });

  const gazFlatbed = await prisma.fleetVehicle.create({
    data: {
      name: 'ГАЗ-3309',
      brand: 'ГАЗ',
      model: '3309',
      plateNumber: '8905 AT-5',
      vin: 'X96330900R0008905',
      type: 'flatbed_truck',
      status: 'reserve',
      year: 2016,
      odometerKm: 88200,
      fuelLevelPercent: 55,
      baseName: 'Гомельская дорожная база',
      currentSite: 'Подвоз дорожных знаков и малой механизации',
      nextMaintenanceAt: new Date('2026-06-05T08:00:00.000Z'),
      nextMaintenanceKm: 89000,
      insuranceExpiresAt: new Date('2026-08-21T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-09-02T00:00:00.000Z'),
      notes: 'Грузовой бортовой автомобиль из ведомости автотранспорта.',
    },
  });

  await prisma.fleetServiceEvent.createMany({
    data: [
      {
        vehicleId: kamazDump.id,
        type: 'maintenance',
        status: 'scheduled',
        title: 'Плановое ТО-2',
        dueAt: new Date('2026-04-18T08:00:00.000Z'),
        mileageKm: 85000,
        mechanicId: morozov.id,
        notes: 'Замена масла, фильтров и проверка тормозной системы.',
      },
      {
        vehicleId: kamazDump.id,
        type: 'inspection',
        status: 'completed',
        title: 'Предрейсовый техосмотр',
        dueAt: new Date('2026-03-28T06:30:00.000Z'),
        completedAt: new Date('2026-03-28T06:45:00.000Z'),
        mileageKm: 82910,
        mechanicId: morozov.id,
        notes: 'Замечаний не выявлено.',
      },
      {
        vehicleId: mazDump.id,
        type: 'maintenance',
        status: 'in_progress',
        title: 'ТО с ревизией гидролинии',
        dueAt: new Date('2026-04-09T09:00:00.000Z'),
        mileageKm: 127000,
        mechanicId: morozov.id,
        notes: 'Работы выполняются в ремонтной зоне №2.',
      },
      {
        vehicleId: mazDump.id,
        type: 'inspection',
        status: 'completed',
        title: 'Сезонный осмотр',
        dueAt: new Date('2026-03-24T08:00:00.000Z'),
        completedAt: new Date('2026-03-24T09:20:00.000Z'),
        mileageKm: 124980,
        mechanicId: morozov.id,
        notes: 'Подтверждён износ передней оси, включён в план ТО.',
      },
      {
        vehicleId: mazCrane.id,
        type: 'insurance',
        status: 'scheduled',
        title: 'Продление полиса ОСАГО',
        dueAt: new Date('2026-04-29T00:00:00.000Z'),
        notes: 'Документы подготовлены, ожидается подтверждение от страховой.',
      },
      {
        vehicleId: mazCrane.id,
        type: 'inspection',
        status: 'completed',
        title: 'Проверка грузоподъёмного оборудования',
        dueAt: new Date('2026-03-30T11:00:00.000Z'),
        completedAt: new Date('2026-03-30T12:10:00.000Z'),
        mechanicId: morozov.id,
        notes: 'Разрешён к работе на объекте без ограничений.',
      },
      {
        vehicleId: jcbExcavator.id,
        type: 'repair',
        status: 'overdue',
        title: 'Ремонт гидроцилиндра стрелы',
        dueAt: new Date('2026-04-05T07:30:00.000Z'),
        mileageKm: 158500,
        mechanicId: morozov.id,
        notes: 'Требуется поставка ремкомплекта, техника простаивает.',
      },
      {
        vehicleId: jcbExcavator.id,
        type: 'diagnostics',
        status: 'scheduled',
        title: 'Продление диагностической карты',
        dueAt: new Date('2026-04-11T00:00:00.000Z'),
        notes: 'Нужно завершить ремонт до подачи на диагностику.',
      },
      {
        vehicleId: gazVan.id,
        type: 'inspection',
        status: 'completed',
        title: 'Подготовка в резерв',
        dueAt: new Date('2026-03-27T09:30:00.000Z'),
        completedAt: new Date('2026-03-27T10:00:00.000Z'),
        mileageKm: 19040,
        mechanicId: morozov.id,
        notes: 'Машина готова к оперативному вводу в работу.',
      },
      {
        vehicleId: hyundaiTucson.id,
        type: 'maintenance',
        status: 'scheduled',
        title: 'Замена колодок и масла',
        dueAt: new Date('2026-05-06T08:00:00.000Z'),
        mileageKm: 60000,
        mechanicId: morozov.id,
        notes: 'Запланировано на окно после завершения выездов по объекту.',
      },
      {
        vehicleId: hyundaiTucson.id,
        type: 'inspection',
        status: 'completed',
        title: 'Еженедельный осмотр',
        dueAt: new Date('2026-04-02T07:00:00.000Z'),
        completedAt: new Date('2026-04-02T07:20:00.000Z'),
        mileageKm: 55980,
        mechanicId: morozov.id,
        notes: 'Техника в исправном состоянии.',
      },
    ],
  });

  await prisma.fleetAuditLog.createMany({
    data: [
      {
        timestamp: new Date('2026-04-05T08:10:00.000Z'),
        action: 'status_change',
        targetVehicleId: mazDump.id,
        vehicleLabel: 'МАЗ 6516B9-480-000 · 2213 AK-7',
        performedById: admin.id,
        details: 'Статус изменён: В работе -> В ремонте',
      },
      {
        timestamp: new Date('2026-04-04T18:20:00.000Z'),
        action: 'assign_driver',
        targetVehicleId: kamazDump.id,
        vehicleLabel: 'КАМАЗ 65201-53 · 1842 AB-7',
        performedById: admin.id,
        details: 'Закреплён водитель Козлов Дмитрий Владимирович',
      },
      {
        timestamp: new Date('2026-04-04T18:05:00.000Z'),
        action: 'create',
        targetVehicleId: kamazDump.id,
        vehicleLabel: 'КАМАЗ 65201-53 · 1842 AB-7',
        performedById: admin.id,
        details: 'Создана единица техники КАМАЗ 65201-53 · 1842 AB-7',
      },
      {
        timestamp: new Date('2026-04-03T15:40:00.000Z'),
        action: 'edit',
        targetVehicleId: jcbExcavator.id,
        vehicleLabel: 'JCB JS220SC T2 · 4675 EB-7',
        performedById: admin.id,
        details: 'Изменены данные техники: примечание',
      },
      {
        timestamp: new Date('2026-04-03T11:30:00.000Z'),
        action: 'create',
        targetVehicleId: jcbExcavator.id,
        vehicleLabel: 'JCB JS220SC T2 · 4675 EB-7',
        performedById: admin.id,
        details: 'Создана единица техники JCB JS220SC T2 · 4675 EB-7',
      },
      {
        timestamp: new Date('2026-04-02T16:20:00.000Z'),
        action: 'create',
        targetVehicleId: gazVan.id,
        vehicleLabel: 'ГАЗ C45R02 CERMES · 5124 AT-5',
        performedById: admin.id,
        details: 'Создана единица техники ГАЗ C45R02 CERMES · 5124 AT-5',
      },
      {
        timestamp: new Date('2026-04-02T09:50:00.000Z'),
        action: 'assign_driver',
        targetVehicleId: mazDump.id,
        vehicleLabel: 'МАЗ 6516B9-480-000 · 2213 AK-7',
        performedById: admin.id,
        details: 'Закреплён водитель Соколов Артём Романович',
      },
      {
        timestamp: new Date('2026-04-02T09:35:00.000Z'),
        action: 'create',
        targetVehicleId: mazDump.id,
        vehicleLabel: 'МАЗ 6516B9-480-000 · 2213 AK-7',
        performedById: admin.id,
        details: 'Создана единица техники МАЗ 6516B9-480-000 · 2213 AK-7',
      },
    ],
  });

  const m5Repair = await prisma.constructionSite.create({
    data: {
      name: 'Ремонт трассы М-5, км 34+200 — 42+600',
      workType: 'Капитальный ремонт дорожного покрытия',
      address: 'Республика Беларусь, Минская обл., трасса М5 Минск — Гомель',
      latitude: 53.6888,
      longitude: 27.5462,
      workPeriodStart: new Date('2025-10-15T00:00:00.000Z'),
      workPeriodEnd: new Date('2026-04-24T00:00:00.000Z'),
      notes: 'Фрезерование старого покрытия завершено, идёт вывоз материала и подготовка основания.',
    },
  });

  const centralStreet = await prisma.constructionSite.create({
    data: {
      name: 'Асфальтирование ул. Центральная',
      workType: 'Укладка асфальтобетонного покрытия',
      address: 'Республика Беларусь, г. Борисов, ул. Центральная',
      latitude: 54.2279,
      longitude: 28.5050,
      workPeriodStart: new Date('2025-11-03T00:00:00.000Z'),
      workPeriodEnd: new Date('2026-05-18T00:00:00.000Z'),
      notes:
        'Требуется синхронизировать поставку смеси, работу катков и ночные ограничения движения.',
    },
  });

  const avenueMilling = await prisma.constructionSite.create({
    data: {
      name: 'Фрезерование покрытия на проспекте Мира',
      workType: 'Фрезерование и подготовка карты ремонта',
      address: 'Республика Беларусь, г. Гомель, проспект Мира, участок 112–128',
      latitude: 52.4459,
      longitude: 31.0002,
      workPeriodStart: new Date('2024-08-01T00:00:00.000Z'),
      workPeriodEnd: new Date('2026-03-30T00:00:00.000Z'),
      isCompleted: true,
      completedAt: new Date('2026-03-28T00:00:00.000Z'),
      notes:
        'Участок завершён, исполнительная документация передана заказчику.',
    },
  });

  const potholeProgram = await prisma.constructionSite.create({
    data: {
      name: 'Ямочный ремонт городской сети',
      workType: 'Локальный ремонт покрытия',
      address: 'Республика Беларусь, г. Минск, Заводской район',
      latitude: 53.8743,
      longitude: 27.6516,
      workPeriodStart: new Date('2026-01-12T00:00:00.000Z'),
      workPeriodEnd: new Date('2026-08-28T00:00:00.000Z'),
      notes:
        'Работы выполняются малыми звеньями, требуется ежедневное распределение техники по адресам.',
    },
  });

  const eastBaseRoad = await prisma.constructionSite.create({
    data: {
      name: 'Дорога к промзоне Восток',
      workType: 'Устройство основания дорожной одежды',
      address: 'Республика Беларусь, г. Могилёв, промзона Восток',
      latitude: 53.9007,
      longitude: 30.3814,
      workPeriodStart: new Date('2026-03-10T00:00:00.000Z'),
      workPeriodEnd: new Date('2027-02-15T00:00:00.000Z'),
      notes:
        'Идёт отсыпка основания, критична доступность самосвалов и погрузчика.',
    },
  });

  type StageTemplateSeed = {
    type: Prisma.RoadWorkStageTemplateCreateInput['type'];
    name: string;
    durationDays: number;
    canOverlap?: boolean;
    notes?: string;
    equipmentRules: Prisma.RoadWorkStageEquipmentTemplateCreateWithoutStageTemplateInput[];
  };

  const createStageTemplate = (stage: StageTemplateSeed) =>
    prisma.roadWorkStageTemplate.create({
      data: {
        type: stage.type,
        name: stage.name,
        durationDays: stage.durationDays,
        canOverlap: stage.canOverlap ?? false,
        notes: stage.notes ?? '',
        equipmentRules: { create: stage.equipmentRules },
      },
    });

  const linkStagesToWorkType = async (
    workTypeId: string,
    stages: {
      stage: { id: string; durationDays: number };
      startOffsetDays?: number;
    }[],
  ) => {
    let cursor = 0;
    await prisma.roadWorkTypeStageTemplate.createMany({
      data: stages.map(({ stage, startOffsetDays }, index) => {
        const offset = startOffsetDays ?? cursor;
        cursor = offset + stage.durationDays;
        return {
          workTypeId,
          stageTemplateId: stage.id,
          sequence: index + 1,
          startOffsetDays: offset,
        };
      }),
    });
  };

  const createWorkTypeTemplate = async (
    data: Prisma.RoadWorkTypeTemplateCreateInput,
    stages: {
      stage: { id: string; durationDays: number };
      startOffsetDays?: number;
    }[],
  ) => {
    const workType = await prisma.roadWorkTypeTemplate.create({ data });
    await linkStagesToWorkType(workType.id, stages);
    return workType;
  };

  const trafficControlStage = await createStageTemplate({
    type: 'traffic_control',
    name: 'Организация движения и ограждение карты',
    durationDays: 1,
    notes: 'Временные знаки, конусы, схема объезда и допуск техники на карту работ.',
    equipmentRules: [
      {
        vehicleType: 'van',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'high',
        notes: 'Подвоз знаков, конусов, инструмента и освещения.',
      },
      {
        vehicleType: 'passenger_car',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'normal',
        notes: 'Мастер участка и контроль схемы движения.',
      },
    ],
  });

  const asphaltPreparationStage = await createStageTemplate({
    type: 'preparation',
    name: 'Очистка основания и подготовка к подгрунтовке',
    durationDays: 1,
    notes: 'Очистка основания, проверка кромок, подготовка стыков и оборудования.',
    equipmentRules: [
      {
        vehicleType: 'loader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'normal',
        notes: 'Подача инвентаря и вспомогательных материалов.',
      },
    ],
  });

  const tackCoatStage = await createStageTemplate({
    type: 'tack_coat',
    name: 'Подгрунтовка основания битумной эмульсией',
    durationDays: 1,
    notes: 'Подготовка сцепления перед укладкой слоя покрытия.',
    equipmentRules: [
      {
        vehicleType: 'flatbed_truck',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'normal',
        notes: 'Подвоз битумной эмульсии, шлангов и ручного оборудования.',
      },
    ],
  });

  const asphaltDeliveryStage = await createStageTemplate({
    type: 'material_delivery',
    name: 'Подвоз асфальтобетонной смеси',
    durationDays: 3,
    canOverlap: true,
    notes: 'Самосвалы должны работать синхронно с производительностью асфальтоукладчика.',
    equipmentRules: [
      {
        vehicleType: 'dump_truck',
        calculationKind: 'asphalt_delivery',
        baseCount: 4,
        minCount: 2,
        maxCount: 12,
        plannedHours: 8,
        priority: 'critical',
        notes: 'Количество зависит от плеча доставки и времени оборота самосвала.',
      },
    ],
  });

  const asphaltPavingStage = await createStageTemplate({
    type: 'asphalt_paving',
    name: 'Укладка слоя асфальтобетона',
    durationDays: 3,
    canOverlap: true,
    notes: 'Ведущая машина потока; простой из-за отсутствия смеси критичен.',
    equipmentRules: [
      {
        vehicleType: 'asphalt_paver',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
        notes: 'Один асфальтоукладчик на полосу 7-7,5 м при сменной захватке.',
      },
    ],
  });

  const compactionStage = await createStageTemplate({
    type: 'compaction',
    name: 'Уплотнение покрытия катками',
    durationDays: 3,
    canOverlap: true,
    notes: 'Катки идут сразу за асфальтоукладчиком, чтобы сохранить температурный режим.',
    equipmentRules: [
      {
        vehicleType: 'road_roller',
        calculationKind: 'fixed',
        baseCount: 2,
        minCount: 2,
        plannedHours: 8,
        priority: 'critical',
        notes: 'Типовое уплотняющее звено: лёгкий/средний и тяжёлый каток.',
      },
    ],
  });

  const qualityControlStage = await createStageTemplate({
    type: 'quality_control',
    name: 'Контроль ровности, плотности и закрытие смены',
    durationDays: 1,
    notes: 'Приёмка карты, контроль фактических часов и оформление исполнительных данных.',
    equipmentRules: [
      {
        vehicleType: 'passenger_car',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'high',
        notes: 'Выезд инженера и лаборатории на карту работ.',
      },
    ],
  });

  const coldMillingStage = await createStageTemplate({
    type: 'milling',
    name: 'Фрезерование старого покрытия',
    durationDays: 2,
    canOverlap: true,
    notes: 'Фреза является ведущей машиной, самосвалы должны подойти под конвейер без ожидания.',
    equipmentRules: [
      {
        vehicleType: 'road_milling_machine',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
        notes: 'Одна дорожная фреза на поток фрезерования.',
      },
      {
        vehicleType: 'dump_truck',
        calculationKind: 'per_km',
        baseCount: 2,
        countPerKm: 1.5,
        minCount: 2,
        maxCount: 8,
        plannedHours: 8,
        priority: 'critical',
        notes: 'Вывоз фрезерата зависит от длины карты и расстояния до площадки складирования.',
      },
    ],
  });

  const millingCleanupStage = await createStageTemplate({
    type: 'preparation',
    name: 'Очистка карты и подготовка основания',
    durationDays: 1,
    notes: 'Удаление остатков фрезерата, контроль кромок и подготовка к подгрунтовке.',
    equipmentRules: [
      {
        vehicleType: 'loader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'normal',
      },
      {
        vehicleType: 'passenger_car',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 4,
        priority: 'normal',
      },
    ],
  });

  const surveyStage = await createStageTemplate({
    type: 'survey',
    name: 'Разбивка оси и проектных отметок',
    durationDays: 1,
    notes: 'Инженерная подготовка карты до выхода тяжёлой техники.',
    equipmentRules: [
      {
        vehicleType: 'passenger_car',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'normal',
      },
    ],
  });

  const crushedStoneDeliveryStage = await createStageTemplate({
    type: 'material_delivery',
    name: 'Подвоз щебня и инертных материалов',
    durationDays: 4,
    canOverlap: true,
    notes: 'Самосвалы и погрузчик должны обеспечить непрерывную подачу материала на карту.',
    equipmentRules: [
      {
        vehicleType: 'dump_truck',
        calculationKind: 'per_km',
        baseCount: 2,
        countPerKm: 1,
        minCount: 2,
        maxCount: 8,
        plannedHours: 8,
        priority: 'critical',
      },
      {
        vehicleType: 'loader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'high',
      },
    ],
  });

  const baseProfilingStage = await createStageTemplate({
    type: 'base_layer',
    name: 'Распределение и профилирование основания',
    durationDays: 4,
    canOverlap: true,
    notes: 'Профилирование слоя по проектным отметкам перед уплотнением.',
    equipmentRules: [
      {
        vehicleType: 'motor_grader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
      },
      {
        vehicleType: 'bulldozer',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'high',
      },
    ],
  });

  const baseCompactionStage = await createStageTemplate({
    type: 'compaction',
    name: 'Послойное уплотнение основания',
    durationDays: 4,
    canOverlap: true,
    notes: 'Катки работают вслед за распределением материала.',
    equipmentRules: [
      {
        vehicleType: 'road_roller',
        calculationKind: 'fixed',
        baseCount: 2,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
      },
    ],
  });

  const earthworksStage = await createStageTemplate({
    type: 'earthworks',
    name: 'Разработка и перемещение грунта',
    durationDays: 5,
    notes: 'Экскаватор и бульдозер формируют фронт, самосвалы вывозят лишний грунт.',
    equipmentRules: [
      {
        vehicleType: 'excavator',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
      },
      {
        vehicleType: 'bulldozer',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'high',
      },
      {
        vehicleType: 'dump_truck',
        calculationKind: 'per_km',
        baseCount: 2,
        countPerKm: 1,
        minCount: 2,
        maxCount: 8,
        plannedHours: 8,
        priority: 'critical',
      },
    ],
  });

  const roadbedProfilingStage = await createStageTemplate({
    type: 'base_layer',
    name: 'Планировка и профилирование полотна',
    durationDays: 2,
    canOverlap: true,
    notes: 'Финишная планировка перед устройством основания.',
    equipmentRules: [
      {
        vehicleType: 'motor_grader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'critical',
      },
      {
        vehicleType: 'road_roller',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 8,
        priority: 'high',
      },
    ],
  });

  const potholePreparationStage = await createStageTemplate({
    type: 'preparation',
    name: 'Подготовка выбоин и кромок',
    durationDays: 1,
    notes: 'Очистка выбоин, обрубка кромок и подготовка малой карты ремонта.',
    equipmentRules: [
      {
        vehicleType: 'loader',
        calculationKind: 'fixed',
        baseCount: 1,
        minCount: 1,
        plannedHours: 6,
        priority: 'normal',
      },
    ],
  });

  const potholeDeliveryStage = await createStageTemplate({
    type: 'material_delivery',
    name: 'Подвоз смеси и материалов для ямочного ремонта',
    durationDays: 2,
    canOverlap: true,
    equipmentRules: [
      {
        vehicleType: 'dump_truck',
        calculationKind: 'per_km',
        baseCount: 1,
        countPerKm: 0.5,
        minCount: 1,
        maxCount: 4,
        plannedHours: 8,
        priority: 'high',
      },
    ],
  });

  await createWorkTypeTemplate(
    {
      code: 'asphalt_paving_hot_mix',
      name: 'Укладка горячей асфальтобетонной смеси',
      description:
        'Поточный комплекс: подготовка карты, подгрунтовка, подвоз смеси, укладка асфальтоукладчиком и уплотнение катками.',
      defaultLengthKm: 1.5,
      defaultWidthM: 7.5,
      defaultShiftHours: 8,
      defaultHaulDistanceKm: 18,
      productionRateMPerDay: 750,
      sourceNote:
        'Основано на технологических картах устройства асфальтобетонных покрытий: сменная захватка 750-830 м, асфальтоукладчик, самосвалы и звено катков.',
    },
    [
      { stage: trafficControlStage, startOffsetDays: 0 },
      { stage: asphaltPreparationStage, startOffsetDays: 0 },
      { stage: tackCoatStage, startOffsetDays: 1 },
      { stage: asphaltDeliveryStage, startOffsetDays: 1 },
      { stage: asphaltPavingStage, startOffsetDays: 1 },
      { stage: compactionStage, startOffsetDays: 1 },
      { stage: qualityControlStage, startOffsetDays: 4 },
    ],
  );

  await createWorkTypeTemplate(
    {
      code: 'cold_milling',
      name: 'Холодное фрезерование покрытия',
      description:
        'Снятие изношенного слоя дорожной фрезой, погрузка фрезерата в самосвалы и очистка карты перед дальнейшими работами.',
      defaultLengthKm: 1.2,
      defaultWidthM: 7,
      defaultShiftHours: 8,
      defaultHaulDistanceKm: 8,
      productionRateMPerDay: 900,
      sourceNote:
        'Опирается на технологические карты холодного фрезерования: дорожная фреза работает в потоке с самосвалами для вывоза фрезерата.',
    },
    [
      { stage: trafficControlStage, startOffsetDays: 0 },
      { stage: coldMillingStage, startOffsetDays: 0 },
      { stage: millingCleanupStage, startOffsetDays: 2 },
    ],
  );

  await createWorkTypeTemplate(
    {
      code: 'crushed_stone_base',
      name: 'Устройство щебёночного основания',
      description:
        'Доставка щебня, распределение, профилирование автогрейдером и послойное уплотнение катками.',
      defaultLengthKm: 1,
      defaultWidthM: 8,
      defaultShiftHours: 8,
      defaultHaulDistanceKm: 14,
      productionRateMPerDay: 500,
      sourceNote:
        'Типовой механизированный комплект: самосвалы, погрузчик, автогрейдер и катки для распределения и уплотнения основания.',
    },
    [
      { stage: surveyStage, startOffsetDays: 0 },
      { stage: crushedStoneDeliveryStage, startOffsetDays: 1 },
      { stage: baseProfilingStage, startOffsetDays: 1 },
      { stage: baseCompactionStage, startOffsetDays: 2 },
    ],
  );

  await createWorkTypeTemplate(
    {
      code: 'earthworks_roadbed',
      name: 'Земляные работы и планировка земляного полотна',
      description:
        'Разработка грунта, перемещение, планировка и подготовка земляного полотна под дорожную одежду.',
      defaultLengthKm: 1,
      defaultWidthM: 9,
      defaultShiftHours: 8,
      defaultHaulDistanceKm: 5,
      productionRateMPerDay: 450,
      sourceNote:
        'Механизированное звено для земляных работ: экскаватор, бульдозер, самосвалы и автогрейдер.',
    },
    [
      { stage: surveyStage, startOffsetDays: 0 },
      { stage: earthworksStage, startOffsetDays: 1 },
      { stage: roadbedProfilingStage, startOffsetDays: 4 },
    ],
  );

  await createWorkTypeTemplate(
    {
      code: 'pothole_repair',
      name: 'Ямочный ремонт покрытия',
      description:
        'Мобильное звено для локального ремонта карт: ограждение, подготовка, подвоз смеси, укладка и уплотнение.',
      defaultLengthKm: 0.3,
      defaultWidthM: 6,
      defaultShiftHours: 8,
      defaultHaulDistanceKm: 10,
      productionRateMPerDay: 250,
      sourceNote:
        'Малое звено с бортовым автомобилем/фургоном, самосвалом и катком; применяется для адресной программы ремонта.',
    },
    [
      { stage: trafficControlStage, startOffsetDays: 0 },
      { stage: potholePreparationStage, startOffsetDays: 0 },
      { stage: potholeDeliveryStage, startOffsetDays: 0 },
      { stage: compactionStage, startOffsetDays: 1 },
      { stage: qualityControlStage, startOffsetDays: 2 },
    ],
  );

  // Assign vehicles to sites
  await prisma.siteVehicle.createMany({
    data: [
      { siteId: m5Repair.id, vehicleId: kamazDump.id },
      { siteId: m5Repair.id, vehicleId: mazCrane.id },
      { siteId: m5Repair.id, vehicleId: jcbExcavator.id },
      { siteId: centralStreet.id, vehicleId: mazDump.id },
      { siteId: centralStreet.id, vehicleId: gazVan.id },
      { siteId: centralStreet.id, vehicleId: vogelePaver.id },
      { siteId: centralStreet.id, vehicleId: bomagRoller.id },
      { siteId: avenueMilling.id, vehicleId: wirtgenMilling.id },
      { siteId: potholeProgram.id, vehicleId: hyundaiTucson.id },
      { siteId: potholeProgram.id, vehicleId: gazFlatbed.id },
      { siteId: eastBaseRoad.id, vehicleId: hyundaiExcavator.id },
      { siteId: eastBaseRoad.id, vehicleId: shantuiBulldozer.id },
      { siteId: eastBaseRoad.id, vehicleId: amkodorLoader.id },
    ],
  });

  await prisma.constructionSiteAuditLog.createMany({
    data: [
      {
        timestamp: new Date('2026-04-06T17:40:00.000Z'),
        action: 'assign_vehicle',
        targetSiteId: m5Repair.id,
        siteLabel: 'Ремонт трассы М-5',
        performedById: petrov.id,
        details: 'Назначена техника: МАЗ 5337A2-340P (3098 AM-7)',
      },
      {
        timestamp: new Date('2026-04-06T10:20:00.000Z'),
        action: 'edit',
        targetSiteId: centralStreet.id,
        siteLabel: 'Асфальтирование ул. Центральная',
        performedById: admin.id,
        details: 'Изменены данные объекта: примечание',
      },
      {
        timestamp: new Date('2026-04-05T13:10:00.000Z'),
        action: 'edit',
        targetSiteId: potholeProgram.id,
        siteLabel: 'Ямочный ремонт городской сети',
        performedById: sidorova.id,
        details: 'Изменены данные объекта: примечание, вид работ',
      },
      {
        timestamp: new Date('2026-04-04T16:50:00.000Z'),
        action: 'assign_vehicle',
        targetSiteId: potholeProgram.id,
        siteLabel: 'Ямочный ремонт городской сети',
        performedById: admin.id,
        details: 'Назначена техника: Hyundai Tucson (7341 AO-7)',
      },
      {
        timestamp: new Date('2026-04-04T16:20:00.000Z'),
        action: 'create',
        targetSiteId: potholeProgram.id,
        siteLabel: 'Ямочный ремонт городской сети',
        performedById: admin.id,
        details: 'Создан объект «Ямочный ремонт городской сети»',
      },
      {
        timestamp: new Date('2026-04-03T12:45:00.000Z'),
        action: 'assign_vehicle',
        targetSiteId: m5Repair.id,
        siteLabel: 'Ремонт трассы М-5',
        performedById: admin.id,
        details: 'Назначена техника: КАМАЗ 65201-53 (1842 AB-7)',
      },
      {
        timestamp: new Date('2026-04-03T12:10:00.000Z'),
        action: 'create',
        targetSiteId: m5Repair.id,
        siteLabel: 'Ремонт трассы М-5',
        performedById: admin.id,
        details: 'Создан объект «Ремонт трассы М-5, км 34+200 — 42+600»',
      },
      {
        timestamp: new Date('2026-04-02T15:30:00.000Z'),
        action: 'complete',
        targetSiteId: avenueMilling.id,
        siteLabel: 'Фрезерование покрытия на проспекте Мира',
        performedById: admin.id,
        details: 'Объект «Фрезерование покрытия на проспекте Мира» завершён',
      },
      {
        timestamp: new Date('2026-04-02T15:00:00.000Z'),
        action: 'create',
        targetSiteId: centralStreet.id,
        siteLabel: 'Асфальтирование ул. Центральная',
        performedById: admin.id,
        details: 'Создан объект «Асфальтирование ул. Центральная»',
      },
      {
        timestamp: new Date('2026-04-01T11:10:00.000Z'),
        action: 'create',
        targetSiteId: eastBaseRoad.id,
        siteLabel: 'Дорога к промзоне Восток',
        performedById: admin.id,
        details: 'Создан объект «Дорога к промзоне Восток»',
      },
      {
        timestamp: new Date('2026-03-30T18:00:00.000Z'),
        action: 'create',
        targetSiteId: avenueMilling.id,
        siteLabel: 'Фрезерование покрытия на проспекте Мира',
        performedById: admin.id,
        details: 'Создан объект «Фрезерование покрытия на проспекте Мира»',
      },
    ],
  });

  console.log('Seeding notifications...');

  // System notifications (visible to all users)
  await prisma.notification.createMany({
    data: [
      {
        category: 'system',
        title: 'Обновление системы',
        description: 'Версия 2.4.1 успешно установлена',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 мин назад
      },
      {
        category: 'system',
        title: 'Резервное копирование',
        description: 'Автоматическое резервное копирование завершено',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа назад
      },
      {
        category: 'system',
        title: 'Техническое обслуживание',
        description: 'Плановые работы запланированы на 10 апреля',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // вчера
      },
      // Security notifications (visible to all users)
      {
        category: 'security',
        title: 'Новый вход в систему',
        description: 'Обнаружен вход с нового устройства: Windows • Chrome',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 час назад
      },
      {
        category: 'security',
        title: 'Неудачная попытка входа',
        description: '3 неудачные попытки входа в аккаунт petrov_sm',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 часа назад
      },
      {
        category: 'security',
        title: 'Смена пароля',
        description: 'Пароль пользователя sidorova_ek был изменён',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // вчера
      },
      {
        category: 'security',
        title: 'Блокировка аккаунта',
        description: 'Аккаунт kozlov_dv заблокирован администратором',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
      },
      // Action notifications (visible to admin/moderator only)
      {
        category: 'action',
        title: 'Новый пользователь',
        description: 'Создан аккаунт для пользователя novikov_av',
        createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 мин назад
      },
      {
        category: 'action',
        title: 'Назначение водителя',
        description: 'Водитель Кузнецов В.И. назначен на маршрут',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 часа назад
      },
      {
        category: 'action',
        title: 'Документы загружены',
        description: 'Медицинская справка водителя Петров С.М. обновлена',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // вчера
      },
      {
        category: 'action',
        title: 'Редактирование профиля',
        description: 'Профиль пользователя admin обновлён',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 дня назад
      },
      {
        category: 'action',
        title: 'Удаление пользователя',
        description: 'Аккаунт temporary_user удалён из системы',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 дней назад
      },
    ],
  });

  // Mark some older notifications as read for admin
  const allNotifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Mark older notifications (indices 1,2,5,6,8,9,10,11 = read) as read for admin
  const readIndices = [1, 2, 5, 6, 8, 9, 10, 11];
  const readData = readIndices
    .filter((i) => i < allNotifications.length)
    .map((i) => ({
      notificationId: allNotifications[i].id,
      userId: admin.id,
    }));

  if (readData.length > 0) {
    await prisma.notificationRead.createMany({ data: readData });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
