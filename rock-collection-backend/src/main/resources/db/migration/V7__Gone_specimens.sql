-- V7: specimens the owner no longer has (given away, sold, traded, lost). They keep their number and data,
-- show greyed out in the app, and are never published, whatever `published` says.

ALTER TABLE specimen ADD COLUMN gone BOOLEAN NOT NULL DEFAULT FALSE;
