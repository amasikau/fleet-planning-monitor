import { ServiceEventsService } from './service-events.service';

const baseVehicle = {
  id: 'vehicle-1',
  brand: 'МАЗ',
  model: '6501',
  plateNumber: '2468 AX-3',
  type: 'dump_truck',
  status: 'reserve',
  previousStatus: 'reserve',
};

function serviceEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    vehicleId: baseVehicle.id,
    vehicle: baseVehicle,
    repairTemplateId: null,
    repairTemplate: null,
    type: 'repair',
    status: 'scheduled',
    title: 'Ремонт гидросистемы',
    startDate: new Date('2026-06-10T00:00:00.000Z'),
    endDate: new Date('2026-06-12T00:00:00.000Z'),
    durationDays: 3,
    dueAt: new Date('2026-06-12T00:00:00.000Z'),
    completedAt: null,
    mileageKm: null,
    reportedById: null,
    reporter: null,
    defectDescription: '',
    notes: '',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    workLogs: [],
    ...overrides,
  };
}

function createPrismaMock(options?: {
  existingEvent?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  activeEvents?: Record<string, unknown>[];
}) {
  const existingEvent = options?.existingEvent ?? serviceEvent();
  const vehicle = options?.vehicle ?? baseVehicle;

  return {
    fleetRepairTemplate: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    fleetServiceEvent: {
      findUnique: jest.fn().mockResolvedValue(existingEvent),
      findMany: jest.fn().mockResolvedValue(options?.activeEvents ?? []),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          ...existingEvent,
          ...data,
          vehicle: existingEvent.vehicle,
          repairTemplate: existingEvent.repairTemplate,
          reporter: existingEvent.reporter,
          workLogs: existingEvent.workLogs,
        }),
      ),
    },
    fleetVehicle: {
      findUnique: jest.fn().mockResolvedValue(vehicle),
      update: jest.fn().mockResolvedValue(vehicle),
    },
  };
}

describe('ServiceEventsService vehicle status sync', () => {
  it('sets vehicle status to repair for an in-progress repair', async () => {
    const prisma = createPrismaMock({
      activeEvents: [{ type: 'repair' }],
      vehicle: {
        ...baseVehicle,
        status: 'reserve',
        previousStatus: 'reserve',
      },
    });
    const service = new ServiceEventsService(prisma as never);

    await service.update('event-1', { status: 'in_progress' } as never, {
      id: 'user-1',
      role: 'user',
    });

    expect(prisma.fleetVehicle.update).toHaveBeenCalledWith({
      where: { id: baseVehicle.id },
      data: {
        previousStatus: 'reserve',
        status: 'repair',
      },
    });
  });

  it('sets vehicle status to maintenance for an in-progress maintenance request', async () => {
    const prisma = createPrismaMock({
      existingEvent: serviceEvent({ type: 'maintenance' }),
      activeEvents: [{ type: 'maintenance' }],
      vehicle: {
        ...baseVehicle,
        status: 'active',
        previousStatus: 'active',
      },
    });
    const service = new ServiceEventsService(prisma as never);

    await service.update('event-1', { status: 'in_progress' } as never, {
      id: 'user-1',
      role: 'user',
    });

    expect(prisma.fleetVehicle.update).toHaveBeenCalledWith({
      where: { id: baseVehicle.id },
      data: {
        previousStatus: 'active',
        status: 'maintenance',
      },
    });
  });

  it('restores the previous operational status after the last repair is completed', async () => {
    const prisma = createPrismaMock({
      existingEvent: serviceEvent({ status: 'in_progress' }),
      activeEvents: [],
      vehicle: {
        ...baseVehicle,
        status: 'repair',
        previousStatus: 'reserve',
      },
    });
    const service = new ServiceEventsService(prisma as never);

    await service.update('event-1', { status: 'completed' } as never, {
      id: 'user-1',
      role: 'user',
    });

    expect(prisma.fleetVehicle.update).toHaveBeenCalledWith({
      where: { id: baseVehicle.id },
      data: {
        previousStatus: 'reserve',
        status: 'reserve',
      },
    });
  });

  it('keeps the original previous status when repair supersedes active maintenance', async () => {
    const prisma = createPrismaMock({
      activeEvents: [{ type: 'maintenance' }, { type: 'repair' }],
      vehicle: {
        ...baseVehicle,
        status: 'maintenance',
        previousStatus: 'active',
      },
    });
    const service = new ServiceEventsService(prisma as never);

    await service.update('event-1', { type: 'repair' } as never, {
      id: 'user-1',
      role: 'user',
    });

    expect(prisma.fleetVehicle.update).toHaveBeenCalledWith({
      where: { id: baseVehicle.id },
      data: {
        status: 'repair',
      },
    });
  });
});
