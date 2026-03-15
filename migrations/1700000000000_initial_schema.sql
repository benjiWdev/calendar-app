-- Up Migration

CREATE TABLE IF NOT EXISTS calendar_entries (
  id          SERIAL         PRIMARY KEY,
  title       VARCHAR(255)   NOT NULL,
  description VARCHAR(1000),
  start_date  DATE           NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_start_date ON calendar_entries (start_date);

-- Down Migration

DROP INDEX IF EXISTS idx_start_date;
DROP TABLE IF EXISTS calendar_entries;
