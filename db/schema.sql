-- Run this against your MariaDB instance once to create the required table.
-- Example: mysql -u root -p calendar < db/schema.sql

CREATE DATABASE IF NOT EXISTS calendar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE calendar;

CREATE TABLE IF NOT EXISTS calendar_entries (
  id          INT            NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255)   NOT NULL,
  description VARCHAR(1000)      NULL,
  start_date  DATE           NOT NULL,
  start_time  TIME               NULL,
  end_date    DATE               NULL,
  end_time    TIME               NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
