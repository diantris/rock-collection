-- V4__Specimen_model.sql - Replaces the early rock/group model with the specimen model.
-- The old tables only ever held example data, so they are dropped without migrating rows.

DROP TABLE IF EXISTS collected_rocks;
DROP TABLE IF EXISTS rock_group_properties;

-- Reference list of scientific identities (mineral species/varieties, rock types, organic and man-made materials).
-- Classification lives here so it is entered once per material, not once per specimen.
CREATE TABLE material (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,      -- scientific name, e.g. "Kosmochlor"
    category        VARCHAR(32)  NOT NULL,      -- MaterialCategory enum: the "type" (mineral, rock, ...)
    family          VARCHAR(32),                -- MaterialFamily enum: chemical class or rock class
    mineral_group   VARCHAR(255),               -- e.g. "Quartz", "Feldspar", "Garnet"
    crystal_system  VARCHAR(32),                -- CrystalSystem enum
    formula         VARCHAR(255),
    mindat_url      VARCHAR(512),
    description     TEXT                        -- e.g. the mindat definition
);
CREATE UNIQUE INDEX material_name_uq ON material (LOWER(name));

-- One physical item in the collection. The id is the public, stable specimen number ("#142").
-- Everything except the name is optional: much of it is unknown, and measurements are the evidence for identifying it.
CREATE TABLE specimen (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,  -- what the owner calls it, e.g. "Dalmatian Stone"
    market_name         VARCHAR(255),           -- what it was sold as, e.g. "Dalmatian Jasper"

    -- What it is
    form                VARCHAR(32),            -- SpecimenForm enum
    nature              VARCHAR(32),            -- SpecimenNature enum
    treatment_notes     TEXT,

    -- Observed / measured properties of this particular specimen
    color               VARCHAR(255),
    secondary_color     VARCHAR(255),
    luster              VARCHAR(255),
    transparency        VARCHAR(255),
    streak              VARCHAR(255),
    hardness_min        NUMERIC(3, 1) CHECK (hardness_min BETWEEN 1 AND 10),  -- Mohs; min = max for a single value
    hardness_max        NUMERIC(3, 1) CHECK (hardness_max BETWEEN 1 AND 10),
    cleavage            VARCHAR(255),
    fracture            VARCHAR(255),
    crystal_habit       VARCHAR(255),
    specific_gravity    NUMERIC(5, 2),
    special_properties  VARCHAR(32)[] NOT NULL DEFAULT '{}',   -- SpecialProperty enum values
    optical_effects     VARCHAR(32)[] NOT NULL DEFAULT '{}',   -- OpticalEffect enum values
    inclusions          TEXT,                   -- unidentified inclusions; identified ones are components
    weight_g            NUMERIC(10, 2),
    length_mm           NUMERIC(8, 1),
    width_mm            NUMERIC(8, 1),
    height_mm           NUMERIC(8, 1),
    other_observations  TEXT,

    -- Provenance
    locality            VARCHAR(512),           -- where it was (likely) mined / formed
    country             VARCHAR(255),
    acquisition_type    VARCHAR(32),            -- AcquisitionType enum ("source")
    acquired_from       VARCHAR(255),           -- where the owner got it: shop, fair, place, person
    acquired_country    VARCHAR(255),
    acquired_year       INT,
    acquired_month      INT CHECK (acquired_month BETWEEN 1 AND 12),
    acquired_day        INT CHECK (acquired_day BETWEEN 1 AND 31),
    price               NUMERIC(10, 2),
    currency            VARCHAR(3),

    -- Free text and tags
    tags                VARCHAR(64)[] NOT NULL DEFAULT '{}',
    description         TEXT,                   -- public description
    private_notes       TEXT,                   -- never exported

    -- Admin
    published           BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materials a specimen consists of, each with a role and identification certainty
-- (e.g. rhyolite = HOST/TENTATIVE, amethyst = ASSOCIATED/TENTATIVE). No rows = unidentified.
CREATE TABLE specimen_component (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    specimen_id  BIGINT      NOT NULL REFERENCES specimen (id) ON DELETE CASCADE,
    material_id  BIGINT      NOT NULL REFERENCES material (id),
    role         VARCHAR(32) NOT NULL,          -- ComponentRole enum
    certainty    VARCHAR(32) NOT NULL,          -- IdentificationCertainty enum
    position     INT         NOT NULL DEFAULT 0
);
CREATE INDEX specimen_component_specimen_idx ON specimen_component (specimen_id);
CREATE INDEX specimen_component_material_idx ON specimen_component (material_id);

-- Full-size photos; the files themselves live in the GitHub Pages repo (roadmap step 3)
CREATE TABLE specimen_photo (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    specimen_id  BIGINT       NOT NULL REFERENCES specimen (id) ON DELETE CASCADE,
    file_name    VARCHAR(512) NOT NULL,
    caption      VARCHAR(512),
    position     INT          NOT NULL DEFAULT 0
);
CREATE INDEX specimen_photo_specimen_idx ON specimen_photo (specimen_id);

-- Small thumbnail shown in the private table, kept apart so list queries don't load image bytes
CREATE TABLE specimen_thumbnail (
    specimen_id   BIGINT PRIMARY KEY REFERENCES specimen (id) ON DELETE CASCADE,
    content_type  VARCHAR(64) NOT NULL,
    data          BYTEA       NOT NULL
);

-- Starter reference list of common materials (more can be added from the UI/API).
-- Only well-established classifications are filled in; anything uncertain is left NULL.
INSERT INTO material (name, category, family, mineral_group, crystal_system, formula) VALUES
    -- Silica minerals
    ('Quartz',            'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Amethyst',          'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Rose quartz',       'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Smoky quartz',      'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Citrine',           'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Tiger''s eye',      'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Chalcedony',        'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Agate',             'MINERAL', 'SILICATE', 'Quartz', 'TRIGONAL', 'SiO₂'),
    ('Opal',              'MINERAL', 'SILICATE', NULL,     'AMORPHOUS', 'SiO₂·nH₂O'),
    ('Jasper',            'ROCK',    NULL,       NULL,     NULL,       NULL),
    -- Other silicates
    ('Garnet',            'MINERAL', 'SILICATE', 'Garnet',     'CUBIC',      NULL),
    ('Tourmaline',        'MINERAL', 'SILICATE', 'Tourmaline', 'TRIGONAL',   NULL),
    ('Schorl',            'MINERAL', 'SILICATE', 'Tourmaline', 'TRIGONAL',   NULL),
    ('Beryl',             'MINERAL', 'SILICATE', 'Beryl',      'HEXAGONAL',  'Be₃Al₂Si₆O₁₈'),
    ('Feldspar',          'MINERAL', 'SILICATE', 'Feldspar',   NULL,         NULL),
    ('Labradorite',       'MINERAL', 'SILICATE', 'Feldspar',   'TRICLINIC',  NULL),
    ('Moonstone',         'MINERAL', 'SILICATE', 'Feldspar',   NULL,         NULL),
    ('Mica',              'MINERAL', 'SILICATE', 'Mica',       'MONOCLINIC', NULL),
    ('Muscovite',         'MINERAL', 'SILICATE', 'Mica',       'MONOCLINIC', NULL),
    ('Biotite',           'MINERAL', 'SILICATE', 'Mica',       'MONOCLINIC', NULL),
    ('Chlorite',          'MINERAL', 'SILICATE', 'Chlorite',   NULL,         NULL),
    ('Epidote',           'MINERAL', 'SILICATE', 'Epidote',    'MONOCLINIC', NULL),
    ('Kyanite',           'MINERAL', 'SILICATE', NULL,         'TRICLINIC',  'Al₂SiO₅'),
    ('Olivine',           'MINERAL', 'SILICATE', 'Olivine',    'ORTHORHOMBIC', NULL),
    ('Sodalite',          'MINERAL', 'SILICATE', 'Sodalite',   'CUBIC',      NULL),
    ('Rhodonite',         'MINERAL', 'SILICATE', NULL,         'TRICLINIC',  NULL),
    ('Nephrite',          'MINERAL', 'SILICATE', 'Amphibole',  'MONOCLINIC', NULL),
    ('Arfvedsonite',      'MINERAL', 'SILICATE', 'Amphibole',  'MONOCLINIC', NULL),
    ('Jadeite',           'MINERAL', 'SILICATE', 'Pyroxene',   'MONOCLINIC', NULL),
    ('Kosmochlor',        'MINERAL', 'SILICATE', 'Pyroxene',   'MONOCLINIC', NULL),
    ('Serpentine',        'MINERAL', 'SILICATE', 'Serpentine', NULL,         NULL),
    -- Carbonates
    ('Calcite',           'MINERAL', 'CARBONATE', 'Calcite', 'TRIGONAL',     'CaCO₃'),
    ('Rhodochrosite',     'MINERAL', 'CARBONATE', 'Calcite', 'TRIGONAL',     'MnCO₃'),
    ('Aragonite',         'MINERAL', 'CARBONATE', NULL,      'ORTHORHOMBIC', 'CaCO₃'),
    ('Malachite',         'MINERAL', 'CARBONATE', NULL,      'MONOCLINIC',   'Cu₂CO₃(OH)₂'),
    ('Azurite',           'MINERAL', 'CARBONATE', NULL,      'MONOCLINIC',   'Cu₃(CO₃)₂(OH)₂'),
    -- Sulfates
    ('Gypsum',            'MINERAL', 'SULFATE', NULL,     'MONOCLINIC',   'CaSO₄·2H₂O'),
    ('Selenite',          'MINERAL', 'SULFATE', NULL,     'MONOCLINIC',   'CaSO₄·2H₂O'),
    ('Baryte',            'MINERAL', 'SULFATE', 'Baryte', 'ORTHORHOMBIC', 'BaSO₄'),
    ('Celestine',         'MINERAL', 'SULFATE', 'Baryte', 'ORTHORHOMBIC', 'SrSO₄'),
    -- Oxides, sulfides, halides, phosphates
    ('Hematite',          'MINERAL', 'OXIDE',     NULL,     'TRIGONAL',   'Fe₂O₃'),
    ('Magnetite',         'MINERAL', 'OXIDE',     'Spinel', 'CUBIC',      'Fe₃O₄'),
    ('Rutile',            'MINERAL', 'OXIDE',     NULL,     'TETRAGONAL', 'TiO₂'),
    ('Pyrite',            'MINERAL', 'SULFIDE',   NULL,     'CUBIC',      'FeS₂'),
    ('Fluorite',          'MINERAL', 'HALIDE',    NULL,     'CUBIC',      'CaF₂'),
    ('Turquoise',         'MINERAL', 'PHOSPHATE', NULL,     'TRICLINIC',  'CuAl₆(PO₄)₄(OH)₈·4H₂O'),
    -- Rocks
    ('Granite',           'ROCK', 'IGNEOUS',     NULL, NULL, NULL),
    ('Rhyolite',          'ROCK', 'IGNEOUS',     NULL, NULL, NULL),
    ('Basalt',            'ROCK', 'IGNEOUS',     NULL, NULL, NULL),
    ('Obsidian',          'ROCK', 'IGNEOUS',     NULL, NULL, NULL),
    ('Sandstone',         'ROCK', 'SEDIMENTARY', NULL, NULL, NULL),
    ('Limestone',         'ROCK', 'SEDIMENTARY', NULL, NULL, NULL),
    ('Flint',             'ROCK', 'SEDIMENTARY', NULL, NULL, NULL),
    ('Marble',            'ROCK', 'METAMORPHIC', NULL, NULL, NULL),
    ('Lapis lazuli',      'ROCK', 'METAMORPHIC', NULL, NULL, NULL),
    ('Petrified wood',    'ROCK', NULL,          NULL, NULL, NULL),
    -- Organic and man-made
    ('Amber',             'ORGANIC',  NULL, NULL, NULL, NULL),
    ('Jet',               'ORGANIC',  NULL, NULL, NULL, NULL),
    ('Pearl',             'ORGANIC',  NULL, NULL, NULL, NULL),
    ('Coral',             'ORGANIC',  NULL, NULL, NULL, NULL),
    ('Glass',             'MAN_MADE', NULL, NULL, NULL, NULL),
    ('Goldstone',         'MAN_MADE', NULL, NULL, NULL, NULL),
    ('Resin',             'MAN_MADE', NULL, NULL, NULL, NULL);
