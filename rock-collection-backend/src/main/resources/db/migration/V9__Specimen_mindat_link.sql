-- V9: a link per specimen (usually its mindat.org page), for stones whose name few people know, e.g. zarinite.
-- It's published by default, so it's ticked in the saved publish settings too.

ALTER TABLE specimen ADD COLUMN mindat_url VARCHAR(512);

UPDATE publish_settings SET fields = array_append(fields, 'MINDAT_LINK') WHERE NOT ('MINDAT_LINK' = ANY (fields));
