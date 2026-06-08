UPDATE "ConstructionSite"
SET "city" = 'Борисов'
WHERE "city" = '' AND "address" ILIKE '%Борисов%';

UPDATE "ConstructionSite"
SET "city" = 'Гомель'
WHERE "city" = '' AND "address" ILIKE '%Гомель%';

UPDATE "ConstructionSite"
SET "city" = 'Могилёв'
WHERE "city" = '' AND "address" ILIKE '%Могилёв%';

UPDATE "ConstructionSite"
SET "city" = 'Минск'
WHERE "city" = '' AND (
  "address" ILIKE '%Минск%' OR
  "address" ILIKE '%Минская%'
);
