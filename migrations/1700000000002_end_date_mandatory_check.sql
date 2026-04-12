-- Up Migration

DELETE FROM calendar_entries WHERE end_date IS NULL OR end_date < start_date;
ALTER TABLE calendar_entries ALTER COLUMN end_date SET NOT NULL;
ALTER TABLE calendar_entries ADD CONSTRAINT chk_end_date_gte_start_date CHECK (end_date >= start_date);

-- Down Migration

ALTER TABLE calendar_entries DROP CONSTRAINT IF EXISTS chk_end_date_gte_start_date;
ALTER TABLE calendar_entries ALTER COLUMN end_date DROP NOT NULL;
