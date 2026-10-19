-- V5: details the photo pipeline needs (roadmap step 3)

-- Lets the table request /thumbnail?v=<updated_at>, so browsers can cache it until it changes
ALTER TABLE specimen_thumbnail ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Pixel size of the published (resized) photo, so the public gallery can reserve space before it loads
ALTER TABLE specimen_photo ADD COLUMN width INT;
ALTER TABLE specimen_photo ADD COLUMN height INT;
CREATE UNIQUE INDEX specimen_photo_file_name_idx ON specimen_photo (file_name);
