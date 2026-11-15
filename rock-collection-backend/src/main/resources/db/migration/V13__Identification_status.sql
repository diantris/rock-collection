-- V13: how far the owner considers a specimen identified. They set it themselves; it's no longer worked out from the
-- components, which are often tentative guesses. Every existing specimen starts as unidentified (the owner's choice).
-- identification_rank orders the statuses by certainty, so the table can sort by it.

ALTER TABLE specimen ADD COLUMN identification_status VARCHAR(32) NOT NULL DEFAULT 'UNIDENTIFIED';
ALTER TABLE specimen ADD COLUMN identification_rank SMALLINT GENERATED ALWAYS AS (
    CASE identification_status
        WHEN 'UNIDENTIFIED' THEN 0
        WHEN 'POSSIBLE_ID' THEN 1
        WHEN 'PARTIALLY_IDENTIFIED' THEN 2
        WHEN 'IDENTIFIED' THEN 3
    END) STORED;

-- Published by default, so it's ticked in the saved publish settings too
UPDATE publish_settings SET fields = array_append(fields, 'IDENTIFICATION_STATUS')
WHERE NOT ('IDENTIFICATION_STATUS' = ANY (fields));
