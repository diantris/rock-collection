-- V10: specimens the owner pins to the top of the table (when it isn't sorted by a column).

ALTER TABLE specimen ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;
