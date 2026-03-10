-- Run this against your PostgreSQL instance once to create the required table.
-- Example: psql -U postgres -d calendar -f db/schema.sql

CREATE TABLE IF NOT EXISTS calendar_entries (
  id          SERIAL         PRIMARY KEY,
  title       VARCHAR(255)   NOT NULL,
  description VARCHAR(1000),
  start_date  DATE           NOT NULL,
  start_time  TIME,
  end_date    DATE,
  end_time    TIME,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_start_date ON calendar_entries (start_date);
