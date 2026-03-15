-- Up Migration

ALTER TABLE calendar_entries ADD COLUMN IF NOT EXISTS elements TEXT[] NOT NULL DEFAULT '{}';

-- Down Migration

ALTER TABLE calendar_entries DROP COLUMN IF EXISTS elements;
