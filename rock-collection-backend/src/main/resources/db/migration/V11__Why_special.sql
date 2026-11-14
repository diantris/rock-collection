-- V11: why a stone is special to the owner: why they got it or keep it, whatever it really is or is worth
-- (often what it reminds them of). Published by default, so it's ticked in the saved publish settings too.

ALTER TABLE specimen ADD COLUMN why_special TEXT;

UPDATE publish_settings SET fields = array_append(fields, 'WHY_SPECIAL') WHERE NOT ('WHY_SPECIAL' = ANY (fields));
