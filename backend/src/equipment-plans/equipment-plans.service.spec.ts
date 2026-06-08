import { ConflictException } from '@nestjs/common';
import { EquipmentPlansService } from './equipment-plans.service';

const baseSite = {
  id: 'site-1',
  name: 'Ремонт участка М-5',
  workType: '',
  isCompleted: false,
};

const baseTemplate = {
  id: 'work-type-1',
  code: 'asphalt',
  name: 'Укладка покрытия',
  description: '',
  defaultLengthKm: 1,
  defaultWidthM: 7,
  defaultShiftHours: 8,
  defaultHaulDistanceKm: 10,
  productionRateMPerDay: 750,
  sourceNote: '',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  stageTemplates: [],
};

const baseDto = {
  siteId: 'site-1',
  workTypeId: 'work-type-1',
  startDate: '2026-06-10',
  lengthKm: 1,
  widthM: 7,
  shiftHours: 8,
  haulDistanceKm: 10,
};

function fleetVehicle(id: string, type = 'dump_truck', status = 'active') {
  return {
    id,
    brand: 'МАЗ',
    model: id,
    plateNumber: `${id.toUpperCase()}-7`,
    type,
    status,
  };
}

function draftStage(overrides: Record<string, unknown>) {
  return {
    type: 'preparation',
    name: 'Этап',
    sequence: 1,
    startOffsetDays: 0,
    durationDays: 1,
    canOverlap: false,
    notes: '',
    equipmentRules: [],
    ...overrides,
  };
}

function equipmentRule(overrides: Record<string, unknown> = {}) {
  return {
    vehicleType: 'dump_truck',
    calculationKind: 'fixed',
    baseCount: 1,
    minCount: 1,
    maxCount: null,
    plannedHours: 8,
    priority: 'normal',
    notes: '',
    ...overrides,
  };
}

function createPrismaMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    equipmentPlanAssignment: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'plan-created' }),
    },
    equipmentDemand: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'demand-created' }),
    },
    roadWorkStage: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'stage-created' }),
    },
  };

  const prisma = {
    constructionSite: {
      findUnique: jest.fn().mockResolvedValue(baseSite),
    },
    roadWorkTypeTemplate: {
      findUnique: jest.fn().mockResolvedValue(baseTemplate),
    },
    fleetVehicle: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    equipmentPlanAssignment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    fleetServiceEvent: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
      callback(tx),
    ),
    __tx: tx,
    ...overrides,
  };

  return prisma;
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

describe('EquipmentPlansService planning draft', () => {
  it('moves quality control after the latest physical stage end', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      stages: [
        draftStage({
          name: 'Подготовка основания',
          sequence: 1,
          type: 'preparation',
          durationDays: 4,
        }),
        draftStage({
          name: 'Подвоз смеси',
          sequence: 2,
          type: 'material_delivery',
          startOffsetDays: 0,
          durationDays: 7,
          canOverlap: true,
        }),
        draftStage({
          name: 'Уплотнение покрытия катками',
          sequence: 3,
          type: 'compaction',
          startOffsetDays: 3,
          durationDays: 10,
          canOverlap: true,
        }),
        draftStage({
          name: 'Контроль качества',
          sequence: 4,
          type: 'quality_control',
          startOffsetDays: 7,
          durationDays: 4,
        }),
      ],
    } as never);

    const compaction = result.stages.find(
      (stage) => stage.type === 'compaction',
    );
    const quality = result.stages.find(
      (stage) => stage.type === 'quality_control',
    );

    expect(compaction).toBeDefined();
    expect(quality).toBeDefined();
    expect(quality!.startOffsetDays).toBeGreaterThan(
      compaction!.startOffsetDays + compaction!.durationDays - 1,
    );
    expect(new Date(quality!.startDate).getTime()).toBeGreaterThan(
      new Date(compaction!.endDate).getTime(),
    );
  });

  it('keeps allowed asphalt flow stages overlapping after preparation gates', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      stages: [
        draftStage({
          name: 'Подготовка',
          sequence: 1,
          type: 'preparation',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подвоз смеси',
          sequence: 2,
          type: 'material_delivery',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Укладка',
          sequence: 3,
          type: 'asphalt_paving',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Уплотнение',
          sequence: 4,
          type: 'compaction',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
      ],
    } as never);

    expect(result.stages.map((stage) => stage.startOffsetDays)).toEqual([
      0, 1, 1, 1,
    ]);
  });

  it('moves non-overlap finishing stages after the production front', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      stages: [
        draftStage({
          name: 'Уплотнение',
          sequence: 1,
          type: 'compaction',
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Разметка после уплотнения',
          sequence: 2,
          type: 'marking',
          startOffsetDays: 1,
          durationDays: 1,
          canOverlap: false,
        }),
      ],
    } as never);

    expect(result.stages[1].startOffsetDays).toBe(3);
  });

  it.each([
    {
      name: 'асфальтирование горячей смесью',
      stages: [
        draftStage({
          name: 'Организация движения',
          sequence: 1,
          type: 'traffic_control',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подготовка основания',
          sequence: 2,
          type: 'preparation',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подгрунтовка',
          sequence: 3,
          type: 'tack_coat',
          startOffsetDays: 1,
          durationDays: 1,
        }),
        draftStage({
          name: 'Подвоз смеси',
          sequence: 4,
          type: 'material_delivery',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Укладка асфальта',
          sequence: 5,
          type: 'asphalt_paving',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Уплотнение катками',
          sequence: 6,
          type: 'compaction',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Контроль качества',
          sequence: 7,
          type: 'quality_control',
          startOffsetDays: 4,
          durationDays: 1,
        }),
      ],
      expectedOffsets: [0, 0, 1, 1, 1, 1, 4],
    },
    {
      name: 'холодное фрезерование',
      stages: [
        draftStage({
          name: 'Организация движения',
          sequence: 1,
          type: 'traffic_control',
          durationDays: 1,
        }),
        draftStage({
          name: 'Фрезерование',
          sequence: 2,
          type: 'milling',
          startOffsetDays: 0,
          durationDays: 2,
          canOverlap: true,
        }),
        draftStage({
          name: 'Очистка карты',
          sequence: 3,
          type: 'preparation',
          startOffsetDays: 2,
          durationDays: 1,
        }),
      ],
      expectedOffsets: [0, 0, 2],
    },
    {
      name: 'щебеночное основание',
      stages: [
        draftStage({
          name: 'Разбивка оси',
          sequence: 1,
          type: 'survey',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подвоз щебня',
          sequence: 2,
          type: 'material_delivery',
          startOffsetDays: 1,
          durationDays: 4,
          canOverlap: true,
        }),
        draftStage({
          name: 'Профилирование основания',
          sequence: 3,
          type: 'base_layer',
          startOffsetDays: 1,
          durationDays: 4,
          canOverlap: true,
        }),
        draftStage({
          name: 'Уплотнение основания',
          sequence: 4,
          type: 'compaction',
          startOffsetDays: 2,
          durationDays: 4,
          canOverlap: true,
        }),
      ],
      expectedOffsets: [0, 1, 1, 2],
    },
    {
      name: 'земляные работы',
      stages: [
        draftStage({
          name: 'Разбивка оси',
          sequence: 1,
          type: 'survey',
          durationDays: 1,
        }),
        draftStage({
          name: 'Разработка грунта',
          sequence: 2,
          type: 'earthworks',
          startOffsetDays: 1,
          durationDays: 5,
        }),
        draftStage({
          name: 'Планировка полотна',
          sequence: 3,
          type: 'base_layer',
          startOffsetDays: 4,
          durationDays: 2,
          canOverlap: true,
        }),
      ],
      expectedOffsets: [0, 1, 4],
    },
    {
      name: 'ямочный ремонт',
      stages: [
        draftStage({
          name: 'Организация движения',
          sequence: 1,
          type: 'traffic_control',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подготовка выбоин',
          sequence: 2,
          type: 'preparation',
          durationDays: 1,
        }),
        draftStage({
          name: 'Подвоз смеси',
          sequence: 3,
          type: 'material_delivery',
          startOffsetDays: 0,
          durationDays: 2,
          canOverlap: true,
        }),
        draftStage({
          name: 'Уплотнение',
          sequence: 4,
          type: 'compaction',
          startOffsetDays: 1,
          durationDays: 3,
          canOverlap: true,
        }),
        draftStage({
          name: 'Контроль качества',
          sequence: 5,
          type: 'quality_control',
          startOffsetDays: 2,
          durationDays: 1,
        }),
      ],
      expectedOffsets: [0, 0, 0, 1, 4],
    },
  ])(
    'keeps a valid technological schedule for $name',
    async ({ stages, expectedOffsets }) => {
      const prisma = createPrismaMock();
      const service = new EquipmentPlansService(prisma as never);

      const result = await service.generateDraft({
        ...baseDto,
        stages,
      } as never);

      expect(result.stages.map((stage) => stage.startOffsetDays)).toEqual(
        expectedOffsets,
      );
      const qualityStage = result.stages.find(
        (stage) => stage.type === 'quality_control',
      );
      if (qualityStage) {
        const latestPhysicalEnd = Math.max(
          ...result.stages
            .filter(
              (stage) =>
                stage.type !== 'traffic_control' &&
                stage.type !== 'quality_control' &&
                stage.type !== 'maintenance',
            )
            .map((stage) => stage.startOffsetDays + stage.durationDays - 1),
        );
        expect(qualityStage.startOffsetDays).toBeGreaterThan(latestPhysicalEnd);
      }
    },
  );

  it('uses cumulative offsets for custom stages without explicit offsets', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      stages: [
        draftStage({
          name: 'Первый этап',
          sequence: 1,
          startOffsetDays: undefined,
          durationDays: 2,
        }),
        draftStage({
          name: 'Второй этап',
          sequence: 2,
          startOffsetDays: undefined,
          durationDays: 3,
        }),
      ],
    } as never);

    expect(result.stages.map((stage) => stage.startOffsetDays)).toEqual([0, 2]);
  });

  it('auto-shifts a stage to the first date with free equipment', async () => {
    const busyVehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([busyVehicle]),
      },
      equipmentPlanAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            vehicleId: busyVehicle.id,
            workDate: new Date('2026-06-10T00:00:00.000Z'),
            shift: 'day',
            vehicle: { type: 'dump_truck' },
          },
        ]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      autoSchedule: true,
      stages: [
        draftStage({
          name: 'Подвоз смеси',
          sequence: 1,
          type: 'material_delivery',
          canOverlap: true,
          equipmentRules: [equipmentRule()],
        }),
        draftStage({
          name: 'Контроль качества',
          sequence: 2,
          type: 'quality_control',
          startOffsetDays: 1,
        }),
      ],
    } as never);

    expect(dateKey(result.stages[0].startDate)).toBe('2026-06-11');
    expect(dateKey(result.stages[1].startDate)).toBe('2026-06-12');
  });

  it('treats active service and repair windows as unavailable during auto-schedule', async () => {
    const vehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([vehicle]),
      },
      fleetServiceEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            vehicleId: vehicle.id,
            title: 'Ремонт гидросистемы',
            startDate: new Date('2026-06-10T00:00:00.000Z'),
            endDate: new Date('2026-06-11T00:00:00.000Z'),
            dueAt: null,
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            vehicle: { type: 'dump_truck' },
          },
        ]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      autoSchedule: true,
      stages: [
        draftStage({
          name: 'Подвоз смеси',
          sequence: 1,
          type: 'material_delivery',
          canOverlap: true,
          equipmentRules: [equipmentRule()],
        }),
      ],
    } as never);

    expect(dateKey(result.stages[0].startDate)).toBe('2026-06-12');
    expect(result.stages[0].demands[0].repairCount).toBe(0);
  });

  it('excludes already reserved draft equipment from overlapping later stages', async () => {
    const vehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([vehicle]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      stages: [
        draftStage({
          name: 'Подвоз на первый поток',
          sequence: 1,
          type: 'material_delivery',
          canOverlap: true,
          equipmentRules: [equipmentRule()],
        }),
        draftStage({
          name: 'Подвоз на второй поток',
          sequence: 2,
          type: 'material_delivery',
          startOffsetDays: 0,
          canOverlap: true,
          equipmentRules: [equipmentRule()],
        }),
      ],
    } as never);

    expect(result.stages[0].demands[0].availableVehicles).toHaveLength(1);
    expect(result.stages[1].demands[0].availableVehicles).toHaveLength(0);
    expect(result.stages[1].demands[0].conflictCount).toBe(1);
  });

  it('ignores assignments from the same site when recalculating with replaceExisting', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    await service.generateDraft({
      ...baseDto,
      replaceExisting: true,
      stages: [
        draftStage({
          name: 'Подвоз смеси',
          equipmentRules: [equipmentRule()],
        }),
      ],
    } as never);

    expect(prisma.equipmentPlanAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          siteId: { not: baseSite.id },
        }),
      }),
    );
  });

  it('bounds calculated demand counts by min and max limits', async () => {
    const prisma = createPrismaMock();
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.generateDraft({
      ...baseDto,
      lengthKm: 10,
      stages: [
        draftStage({
          name: 'Вывоз материала',
          equipmentRules: [
            equipmentRule({
              calculationKind: 'per_km',
              baseCount: 2,
              countPerKm: 1,
              minCount: 2,
              maxCount: 5,
            }),
          ],
        }),
      ],
    } as never);

    expect(result.stages[0].demands[0].requiredCount).toBe(5);
  });

  it('rejects planning for a completed road object', async () => {
    const prisma = createPrismaMock({
      constructionSite: {
        findUnique: jest.fn().mockResolvedValue({
          ...baseSite,
          isCompleted: true,
        }),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    await expect(
      service.generateDraft({
        ...baseDto,
        stages: [draftStage({ name: 'Этап' })],
      } as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('EquipmentPlansService applying draft', () => {
  it('rejects selected equipment that is busy in the same shift', async () => {
    const busyVehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([busyVehicle]),
      },
      equipmentPlanAssignment: {
        findMany: jest.fn().mockResolvedValue([
          {
            vehicleId: busyVehicle.id,
            workDate: new Date('2026-06-10T00:00:00.000Z'),
            shift: 'day',
            vehicle: { type: 'dump_truck' },
          },
        ]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    await expect(
      service.applyDraft(
        {
          ...baseDto,
          stages: [
            draftStage({
              name: 'Подвоз смеси',
              equipmentRules: [equipmentRule()],
            }),
          ],
          selectedAssignments: [
            {
              stageSequence: 1,
              vehicleType: 'dump_truck',
              vehicleIds: [busyVehicle.id],
            },
          ],
        } as never,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects selected equipment when fewer units are selected than required', async () => {
    const vehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([vehicle]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    await expect(
      service.applyDraft(
        {
          ...baseDto,
          stages: [
            draftStage({
              name: 'Подвоз смеси',
              equipmentRules: [
                equipmentRule({
                  baseCount: 2,
                  minCount: 2,
                }),
              ],
            }),
          ],
          selectedAssignments: [
            {
              stageSequence: 1,
              vehicleType: 'dump_truck',
              vehicleIds: [vehicle.id],
            },
          ],
        } as never,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not reuse the same vehicle across overlapping automatic assignments', async () => {
    const vehicle = fleetVehicle('dump-1');
    const prisma = createPrismaMock({
      fleetVehicle: {
        findMany: jest.fn().mockResolvedValue([vehicle]),
      },
    });
    const service = new EquipmentPlansService(prisma as never);

    const result = await service.applyDraft(
      {
        ...baseDto,
        stages: [
          draftStage({
            name: 'Подвоз на первый поток',
            sequence: 1,
            type: 'material_delivery',
            canOverlap: true,
            equipmentRules: [equipmentRule()],
          }),
          draftStage({
            name: 'Подвоз на второй поток',
            sequence: 2,
            type: 'material_delivery',
            startOffsetDays: 0,
            canOverlap: true,
            equipmentRules: [equipmentRule()],
          }),
        ],
      } as never,
      'user-1',
    );

    expect(result.createdAssignments).toBe(1);
    expect(result.skippedAssignments).toBe(1);
    expect(prisma.__tx.equipmentPlanAssignment.create).toHaveBeenCalledTimes(1);
  });
});
