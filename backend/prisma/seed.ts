import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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
      name: 'КамАЗ 65115',
      brand: 'КамАЗ',
      model: '65115',
      plateNumber: 'А412МР 77',
      vin: 'XTC651150K1234501',
      type: 'dump_truck',
      status: 'active',
      year: 2022,
      odometerKm: 84210,
      fuelLevelPercent: 74,
      baseName: 'База Север',
      currentSite: 'Ремонт трассы М-5, км 34+200 — 42+600',
      assignedDriverUserId: driverKozlov.userId,
      nextMaintenanceAt: new Date('2026-04-18T08:00:00.000Z'),
      nextMaintenanceKm: 85000,
      insuranceExpiresAt: new Date('2026-05-02T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-06-16T00:00:00.000Z'),
      notes: 'Основной самосвал на вывозе инертных материалов.',
    },
  });

  const shacmanDump = await prisma.fleetVehicle.create({
    data: {
      name: 'Shacman X3000',
      brand: 'Shacman',
      model: 'X3000 6x4',
      plateNumber: 'Р918ОС 77',
      vin: 'LZGJKSDR7MX340278',
      type: 'dump_truck',
      status: 'repair',
      year: 2021,
      odometerKm: 126440,
      fuelLevelPercent: 38,
      baseName: 'База Север',
      currentSite: 'Асфальтирование ул. Центральная',
      assignedDriverUserId: driverSokolov.userId,
      nextMaintenanceAt: new Date('2026-04-09T09:00:00.000Z'),
      nextMaintenanceKm: 127000,
      insuranceExpiresAt: new Date('2026-05-21T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-04-27T00:00:00.000Z'),
      notes:
        'Стоит на плановом ТО, требуется замена фильтров и ревизия гидролинии.',
    },
  });

  const xcmgCrane = await prisma.fleetVehicle.create({
    data: {
      name: 'XCMG QY25K5D',
      brand: 'XCMG',
      model: 'QY25K5D',
      plateNumber: 'К341ТА 50',
      vin: 'LXGCPA2D0NA105611',
      type: 'crane',
      status: 'active',
      year: 2023,
      odometerKm: 48120,
      fuelLevelPercent: 61,
      baseName: 'База Южная',
      currentSite: 'Фрезерование покрытия на проспекте Мира',
      nextMaintenanceAt: new Date('2026-04-23T10:00:00.000Z'),
      nextMaintenanceKm: 50000,
      insuranceExpiresAt: new Date('2026-04-29T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-05-19T00:00:00.000Z'),
      notes: 'Работает в дневную смену на подъёме металлоконструкций.',
    },
  });

  const jcbExcavator = await prisma.fleetVehicle.create({
    data: {
      name: 'JCB JS205',
      brand: 'JCB',
      model: 'JS205',
      plateNumber: 'Е552ВХ 50',
      vin: 'JCBJS205VH2890041',
      type: 'excavator',
      status: 'repair',
      year: 2020,
      odometerKm: 158930,
      fuelLevelPercent: 19,
      baseName: 'База Восток',
      currentSite: 'Устройство основания дороги к промзоне Восток',
      nextMaintenanceAt: new Date('2026-04-05T07:30:00.000Z'),
      nextMaintenanceKm: 158500,
      insuranceExpiresAt: new Date('2026-04-14T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-04-11T00:00:00.000Z'),
      notes: 'Выведен в ремонт после жалобы на гидравлику стрелы.',
    },
  });

  const gazelleVan = await prisma.fleetVehicle.create({
    data: {
      name: 'ГАЗель Next',
      brand: 'ГАЗ',
      model: 'Next A31R32',
      plateNumber: 'С105НЕ 77',
      vin: 'X96310A0GM0871204',
      type: 'van',
      status: 'reserve',
      year: 2024,
      odometerKm: 19240,
      fuelLevelPercent: 52,
      baseName: 'База Север',
      currentSite: 'Резерв снабжения дорожных бригад',
      nextMaintenanceAt: new Date('2026-05-25T08:00:00.000Z'),
      nextMaintenanceKm: 25000,
      insuranceExpiresAt: new Date('2026-07-02T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-08-18T00:00:00.000Z'),
      notes: 'Резервная машина для выезда снабжения и доставки запчастей.',
    },
  });

  const hiluxPickup = await prisma.fleetVehicle.create({
    data: {
      name: 'Toyota Hilux',
      brand: 'Toyota',
      model: 'Hilux Double Cab',
      plateNumber: 'У770КК 77',
      vin: 'AHTBA3CD109875421',
      type: 'pickup',
      status: 'active',
      year: 2022,
      odometerKm: 56320,
      fuelLevelPercent: 83,
      baseName: 'База Южная',
      currentSite: 'Ямочный ремонт городской сети',
      nextMaintenanceAt: new Date('2026-05-06T08:00:00.000Z'),
      nextMaintenanceKm: 60000,
      insuranceExpiresAt: new Date('2026-06-12T00:00:00.000Z'),
      diagnosticsExpiresAt: new Date('2026-06-29T00:00:00.000Z'),
      notes: 'Используется для оперативных выездов прораба и логиста.',
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
        vehicleId: shacmanDump.id,
        type: 'maintenance',
        status: 'in_progress',
        title: 'ТО с ревизией гидролинии',
        dueAt: new Date('2026-04-09T09:00:00.000Z'),
        mileageKm: 127000,
        mechanicId: morozov.id,
        notes: 'Работы выполняются в ремонтной зоне №2.',
      },
      {
        vehicleId: shacmanDump.id,
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
        vehicleId: xcmgCrane.id,
        type: 'insurance',
        status: 'scheduled',
        title: 'Продление полиса ОСАГО',
        dueAt: new Date('2026-04-29T00:00:00.000Z'),
        notes: 'Документы подготовлены, ожидается подтверждение от страховой.',
      },
      {
        vehicleId: xcmgCrane.id,
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
        vehicleId: gazelleVan.id,
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
        vehicleId: hiluxPickup.id,
        type: 'maintenance',
        status: 'scheduled',
        title: 'Замена колодок и масла',
        dueAt: new Date('2026-05-06T08:00:00.000Z'),
        mileageKm: 60000,
        mechanicId: morozov.id,
        notes: 'Запланировано на окно после завершения выездов по объекту.',
      },
      {
        vehicleId: hiluxPickup.id,
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
        targetVehicleId: shacmanDump.id,
        vehicleLabel: 'Shacman X3000 6x4 · Р918ОС 77',
        performedById: admin.id,
        details: 'Статус изменён: В работе -> В ремонте',
      },
      {
        timestamp: new Date('2026-04-04T18:20:00.000Z'),
        action: 'assign_driver',
        targetVehicleId: kamazDump.id,
        vehicleLabel: 'КамАЗ 65115 · А412МР 77',
        performedById: admin.id,
        details: 'Закреплён водитель Козлов Дмитрий Владимирович',
      },
      {
        timestamp: new Date('2026-04-04T18:05:00.000Z'),
        action: 'create',
        targetVehicleId: kamazDump.id,
        vehicleLabel: 'КамАЗ 65115 · А412МР 77',
        performedById: admin.id,
        details: 'Создана единица техники КамАЗ 65115 · А412МР 77',
      },
      {
        timestamp: new Date('2026-04-03T15:40:00.000Z'),
        action: 'edit',
        targetVehicleId: jcbExcavator.id,
        vehicleLabel: 'JCB JS205 · Е552ВХ 50',
        performedById: admin.id,
        details: 'Изменены данные техники: примечание',
      },
      {
        timestamp: new Date('2026-04-03T11:30:00.000Z'),
        action: 'create',
        targetVehicleId: jcbExcavator.id,
        vehicleLabel: 'JCB JS205 · Е552ВХ 50',
        performedById: admin.id,
        details: 'Создана единица техники JCB JS205 · Е552ВХ 50',
      },
      {
        timestamp: new Date('2026-04-02T16:20:00.000Z'),
        action: 'create',
        targetVehicleId: gazelleVan.id,
        vehicleLabel: 'ГАЗ Next A31R32 · С105НЕ 77',
        performedById: admin.id,
        details: 'Создана единица техники ГАЗ Next A31R32 · С105НЕ 77',
      },
      {
        timestamp: new Date('2026-04-02T09:50:00.000Z'),
        action: 'assign_driver',
        targetVehicleId: shacmanDump.id,
        vehicleLabel: 'Shacman X3000 6x4 · Р918ОС 77',
        performedById: admin.id,
        details: 'Закреплён водитель Соколов Артём Романович',
      },
      {
        timestamp: new Date('2026-04-02T09:35:00.000Z'),
        action: 'create',
        targetVehicleId: shacmanDump.id,
        vehicleLabel: 'Shacman X3000 6x4 · Р918ОС 77',
        performedById: admin.id,
        details: 'Создана единица техники Shacman X3000 6x4 · Р918ОС 77',
      },
    ],
  });

  const m5Repair = await prisma.constructionSite.create({
    data: {
      name: 'Ремонт трассы М-5, км 34+200 — 42+600',
      workType: 'Капитальный ремонт дорожного покрытия',
      address: 'Московская обл., участок трассы М-5 Урал',
      latitude: 55.8515,
      longitude: 37.4965,
      workPeriodStart: new Date('2025-10-15T00:00:00.000Z'),
      workPeriodEnd: new Date('2026-04-24T00:00:00.000Z'),
      notes: 'Фрезерование старого покрытия завершено, идёт вывоз материала и подготовка основания.',
    },
  });

  const centralStreet = await prisma.constructionSite.create({
    data: {
      name: 'Асфальтирование ул. Центральная',
      workType: 'Укладка асфальтобетонного покрытия',
      address: 'Москва, ул. Центральная',
      latitude: 55.8547,
      longitude: 37.4734,
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
      address: 'Москва, проспект Мира, участок 112–128',
      latitude: 55.6128,
      longitude: 37.7440,
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
      address: 'Москва, Северный административный округ',
      latitude: 55.8234,
      longitude: 37.6152,
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
      address: 'Московская обл., Балашиха, промзона Восток',
      latitude: 55.7960,
      longitude: 37.9570,
      workPeriodStart: new Date('2026-03-10T00:00:00.000Z'),
      workPeriodEnd: new Date('2027-02-15T00:00:00.000Z'),
      notes:
        'Идёт отсыпка основания, критична доступность самосвалов и погрузчика.',
    },
  });

  // Assign vehicles to sites
  await prisma.siteVehicle.createMany({
    data: [
      { siteId: m5Repair.id, vehicleId: kamazDump.id },
      { siteId: m5Repair.id, vehicleId: xcmgCrane.id },
      { siteId: m5Repair.id, vehicleId: jcbExcavator.id },
      { siteId: potholeProgram.id, vehicleId: shacmanDump.id },
      { siteId: potholeProgram.id, vehicleId: gazelleVan.id },
      { siteId: eastBaseRoad.id, vehicleId: hiluxPickup.id },
    ],
  });

  const m5MaterialStage = await prisma.roadWorkStage.create({
    data: {
      siteId: m5Repair.id,
      type: 'material_delivery',
      name: 'Вывоз фрезерованного покрытия и подвоз щебня',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-07T00:00:00.000Z'),
      status: 'in_progress',
      notes:
        'Критична непрерывная работа самосвалов между картами ремонта и площадкой складирования.',
    },
  });

  const m5BarrierStage = await prisma.roadWorkStage.create({
    data: {
      siteId: m5Repair.id,
      type: 'preparation',
      name: 'Монтаж временных барьерных ограждений',
      startDate: new Date('2026-06-03T00:00:00.000Z'),
      endDate: new Date('2026-06-05T00:00:00.000Z'),
      status: 'planned',
      notes: 'Работы выполняются в ночное окно с частичным ограничением движения.',
    },
  });

  const centralSupplyStage = await prisma.roadWorkStage.create({
    data: {
      siteId: centralStreet.id,
      type: 'material_delivery',
      name: 'Подвоз асфальтобетонной смеси',
      startDate: new Date('2026-06-04T00:00:00.000Z'),
      endDate: new Date('2026-06-06T00:00:00.000Z'),
      status: 'planned',
      notes:
        'Нужно исключить простой укладочного звена из-за задержки смеси.',
    },
  });

  const centralAsphaltStage = await prisma.roadWorkStage.create({
    data: {
      siteId: centralStreet.id,
      type: 'asphalt_paving',
      name: 'Укладка верхнего слоя покрытия',
      startDate: new Date('2026-06-05T00:00:00.000Z'),
      endDate: new Date('2026-06-08T00:00:00.000Z'),
      status: 'planned',
      notes: 'Связать самосвалы, снабжение и контроль уплотнения.',
    },
  });

  const potholeControlStage = await prisma.roadWorkStage.create({
    data: {
      siteId: potholeProgram.id,
      type: 'maintenance',
      name: 'Контроль закрытия карт ямочного ремонта',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-14T00:00:00.000Z'),
      status: 'in_progress',
      notes:
        'Оперативные выезды прораба по адресной программе ремонта покрытия.',
    },
  });

  const eastBaseLayerStage = await prisma.roadWorkStage.create({
    data: {
      siteId: eastBaseRoad.id,
      type: 'base_layer',
      name: 'Отсыпка и планировка основания',
      startDate: new Date('2026-05-27T00:00:00.000Z'),
      endDate: new Date('2026-06-10T00:00:00.000Z'),
      status: 'delayed',
      notes:
        'Отставание из-за простоя экскаватора и нехватки самосвалов на подвозе щебня.',
    },
  });

  const m5DumpDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: m5Repair.id,
      stageId: m5MaterialStage.id,
      vehicleType: 'dump_truck',
      requiredCount: 2,
      plannedHours: 8,
      priority: 'critical',
      notes: 'Две единицы нужны для бесперебойного вывоза и подвоза материалов.',
    },
  });

  const m5CraneDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: m5Repair.id,
      stageId: m5BarrierStage.id,
      vehicleType: 'crane',
      requiredCount: 1,
      plannedHours: 6,
      priority: 'high',
      notes: 'Автокран нужен на ночное окно монтажа ограждений.',
    },
  });

  const centralDumpDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: centralStreet.id,
      stageId: centralSupplyStage.id,
      vehicleType: 'dump_truck',
      requiredCount: 2,
      plannedHours: 8,
      priority: 'critical',
      notes:
        'Самосвалы должны обеспечить непрерывный подвоз асфальтобетонной смеси.',
    },
  });

  const centralVanDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: centralStreet.id,
      stageId: centralSupplyStage.id,
      vehicleType: 'van',
      requiredCount: 1,
      plannedHours: 8,
      priority: 'normal',
      notes: 'Доставка знаков, конусов и ручного инструмента ночной бригаде.',
    },
  });

  const centralPickupDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: centralStreet.id,
      stageId: centralAsphaltStage.id,
      vehicleType: 'pickup',
      requiredCount: 1,
      plannedHours: 6,
      priority: 'high',
      notes: 'Контроль поставки смеси и качества уплотнения на участке.',
    },
  });

  const potholePickupDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: potholeProgram.id,
      stageId: potholeControlStage.id,
      vehicleType: 'pickup',
      requiredCount: 1,
      plannedHours: 8,
      priority: 'high',
      notes: 'Оперативный объезд адресов и приёмка карт ремонта.',
    },
  });

  const eastBaseDumpDemand = await prisma.equipmentDemand.create({
    data: {
      siteId: eastBaseRoad.id,
      stageId: eastBaseLayerStage.id,
      vehicleType: 'dump_truck',
      requiredCount: 2,
      plannedHours: 8,
      priority: 'critical',
      notes: 'Не хватает самосвалов для подвозки щебня под устройство основания.',
    },
  });

  await prisma.equipmentPlanAssignment.createMany({
    data: [
      {
        siteId: m5Repair.id,
        stageId: m5MaterialStage.id,
        demandId: m5DumpDemand.id,
        vehicleId: kamazDump.id,
        workDate: new Date('2026-06-03T00:00:00.000Z'),
        shift: 'day',
        plannedHours: 8,
        status: 'planned',
        notes: 'Вывоз фрезерованного покрытия с участка 34+200 — 36+000.',
        createdById: admin.id,
      },
      {
        siteId: m5Repair.id,
        stageId: m5BarrierStage.id,
        demandId: m5CraneDemand.id,
        vehicleId: xcmgCrane.id,
        workDate: new Date('2026-06-03T00:00:00.000Z'),
        shift: 'night',
        plannedHours: 6,
        status: 'planned',
        notes: 'Монтаж временных барьерных ограждений.',
        createdById: petrov.id,
      },
      {
        siteId: centralStreet.id,
        stageId: centralSupplyStage.id,
        demandId: centralVanDemand.id,
        vehicleId: gazelleVan.id,
        workDate: new Date('2026-06-04T00:00:00.000Z'),
        shift: 'night',
        plannedHours: 8,
        status: 'in_progress',
        notes: 'Снабжение ночной бригады и доставка знаков.',
        createdById: petrov.id,
      },
      {
        siteId: potholeProgram.id,
        stageId: potholeControlStage.id,
        demandId: potholePickupDemand.id,
        vehicleId: hiluxPickup.id,
        workDate: new Date('2026-06-04T00:00:00.000Z'),
        shift: 'day',
        plannedHours: 8,
        status: 'planned',
        notes: 'Объезд адресов и контроль закрытия карт ремонта.',
        createdById: sidorova.id,
      },
      {
        siteId: eastBaseRoad.id,
        stageId: eastBaseLayerStage.id,
        demandId: eastBaseDumpDemand.id,
        vehicleId: kamazDump.id,
        workDate: new Date('2026-05-29T00:00:00.000Z'),
        shift: 'day',
        plannedHours: 8,
        actualHours: 7,
        status: 'completed',
        notes: 'Доставка щебня для основания.',
        createdById: admin.id,
      },
      {
        siteId: centralStreet.id,
        stageId: centralAsphaltStage.id,
        demandId: centralPickupDemand.id,
        vehicleId: hiluxPickup.id,
        workDate: new Date('2026-05-30T00:00:00.000Z'),
        shift: 'night',
        plannedHours: 6,
        status: 'failed',
        notes: 'Смена сорвана из-за задержки поставки асфальтобетонной смеси.',
        createdById: petrov.id,
      },
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
        details: 'Назначена техника: XCMG XCA60 (К 789 АО 77)',
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
        details: 'Назначена техника: Shacman X3000 (Т 654 СА 50)',
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
        details: 'Назначена техника: КамАЗ 6520 (А 123 ВС 77)',
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
