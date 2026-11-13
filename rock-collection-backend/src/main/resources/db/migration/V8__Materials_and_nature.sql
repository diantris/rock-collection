-- V8: materials are never rocks. A rock is a specimen (nature NATURAL_ROCK / TREATED_ROCK) made of several materials.
-- Material types become MINERAL, MINERALOID, ORGANIC, MAN_MADE, each with its own families;
-- specimen nature also says what kind of thing the piece is (mineral, rock, organic, mineraloid).

-- Specimen nature: the old values don't say mineral/rock/organic, so natural and treated become unknown (NULL)
UPDATE specimen SET nature = CASE nature
    WHEN 'MAN_MADE'  THEN 'ARTIFICIAL'
    WHEN 'SYNTHETIC' THEN 'SYNTHETIC'
    WHEN 'UNKNOWN'   THEN 'UNKNOWN'
    END
WHERE nature IS NOT NULL;

-- Rocks (and goldstone, which is glass + copper) stop being materials. Fails if a specimen still uses one,
-- rather than silently dropping its identity.
DELETE FROM material WHERE category = 'ROCK'
    OR LOWER(name) IN ('goldstone', 'nephrite'); -- nephrite is a rock of tremolite-actinolite

-- Old families that no longer exist
UPDATE material SET family = 'OXIDE_HYDROXIDE' WHERE family IN ('OXIDE', 'HYDROXIDE');
UPDATE material SET family = NULL WHERE family IN ('ORGANIC_COMPOUND', 'IGNEOUS', 'SEDIMENTARY', 'METAMORPHIC', 'OTHER');

-- Seeded materials that change type or family
UPDATE material SET category = 'MINERALOID', family = 'AMORPHOUS_SILICA', mineral_group = NULL, crystal_system = 'AMORPHOUS'
    WHERE LOWER(name) = 'opal';
UPDATE material SET family = 'FOSSIL_RESIN_HYDROCARBON', crystal_system = 'AMORPHOUS' WHERE LOWER(name) = 'amber';
UPDATE material SET family = 'FOSSIL_RESIN_HYDROCARBON' WHERE LOWER(name) = 'jet';
UPDATE material SET name = 'Nacre', family = 'BIOMINERAL', description = 'Pearl and mother-of-pearl: aragonite platelets bound by conchiolin.'
    WHERE LOWER(name) = 'pearl' AND NOT EXISTS (SELECT 1 FROM material WHERE LOWER(name) = 'nacre');
UPDATE material SET family = 'BIOMINERAL' WHERE LOWER(name) = 'coral';
UPDATE material SET family = 'GLASS', crystal_system = 'AMORPHOUS' WHERE LOWER(name) = 'glass';
UPDATE material SET name = 'Synthetic resin', family = 'POLYMER_RESIN', crystal_system = 'AMORPHOUS'
    WHERE LOWER(name) = 'resin' AND NOT EXISTS (SELECT 1 FROM material WHERE LOWER(name) = 'synthetic resin');

-- Components of the owner's rocks and other common collection pieces. Skips names that already exist.
INSERT INTO material (name, category, family, mineral_group, crystal_system, formula)
SELECT v.name, v.category, v.family, v.mineral_group, v.crystal_system, v.formula
FROM (VALUES
    -- Silicates
    ('Orthoclase',      'MINERAL', 'SILICATE', 'Feldspar',      'MONOCLINIC',   'KAlSi₃O₈'),
    ('Microcline',      'MINERAL', 'SILICATE', 'Feldspar',      'TRICLINIC',    'KAlSi₃O₈'),
    ('Amazonite',       'MINERAL', 'SILICATE', 'Feldspar',      'TRICLINIC',    'KAlSi₃O₈'),
    ('Albite',          'MINERAL', 'SILICATE', 'Feldspar',      'TRICLINIC',    'NaAlSi₃O₈'),
    ('Lazurite',        'MINERAL', 'SILICATE', 'Sodalite',      NULL,           NULL),
    ('Tremolite',       'MINERAL', 'SILICATE', 'Amphibole',     'MONOCLINIC',   NULL),
    ('Actinolite',      'MINERAL', 'SILICATE', 'Amphibole',     'MONOCLINIC',   NULL),
    ('Enstatite',       'MINERAL', 'SILICATE', 'Pyroxene',      'ORTHORHOMBIC', 'MgSiO₃'),
    ('Fuchsite',        'MINERAL', 'SILICATE', 'Mica',          'MONOCLINIC',   NULL),
    ('Lepidolite',      'MINERAL', 'SILICATE', 'Mica',          'MONOCLINIC',   NULL),
    ('Clinochlore',     'MINERAL', 'SILICATE', 'Chlorite',      'MONOCLINIC',   NULL),
    ('Andalusite',      'MINERAL', 'SILICATE', NULL,            'ORTHORHOMBIC', 'Al₂SiO₅'),
    ('Dumortierite',    'MINERAL', 'SILICATE', NULL,            'ORTHORHOMBIC', NULL),
    ('Chrysocolla',     'MINERAL', 'SILICATE', NULL,            NULL,           NULL),
    ('Dioptase',        'MINERAL', 'SILICATE', NULL,            'TRIGONAL',     'CuSiO₃·H₂O'),
    ('Shattuckite',     'MINERAL', 'SILICATE', NULL,            'ORTHORHOMBIC', 'Cu₅(SiO₃)₄(OH)₂'),
    ('Charoite',        'MINERAL', 'SILICATE', NULL,            'MONOCLINIC',   NULL),
    ('Eudialyte',       'MINERAL', 'SILICATE', 'Eudialyte',     'TRIGONAL',     NULL),
    ('Astrophyllite',   'MINERAL', 'SILICATE', 'Astrophyllite', 'TRICLINIC',    NULL),
    ('Sugilite',        'MINERAL', 'SILICATE', 'Milarite',      'HEXAGONAL',    NULL),
    ('Pectolite',       'MINERAL', 'SILICATE', NULL,            'TRICLINIC',    'NaCa₂Si₃O₈(OH)'),
    ('Okenite',         'MINERAL', 'SILICATE', NULL,            'TRICLINIC',    NULL),
    ('Stilbite',        'MINERAL', 'SILICATE', 'Zeolite',       'MONOCLINIC',   NULL),
    ('Apophyllite',     'MINERAL', 'SILICATE', 'Apophyllite',   NULL,           NULL),
    -- Carbonates
    ('Dolomite',        'MINERAL', 'CARBONATE', 'Dolomite',     'TRIGONAL',     'CaMg(CO₃)₂'),
    ('Magnesite',       'MINERAL', 'CARBONATE', 'Calcite',      'TRIGONAL',     'MgCO₃'),
    ('Stichtite',       'MINERAL', 'CARBONATE', 'Hydrotalcite', 'TRIGONAL',     NULL),
    -- Sulfates (with tungstates)
    ('Scheelite',       'MINERAL', 'SULFATE',   NULL,           'TETRAGONAL',   'CaWO₄'),
    -- Phosphates (with vanadates)
    ('Vanadinite',      'MINERAL', 'PHOSPHATE', 'Apatite',      'HEXAGONAL',    'Pb₅(VO₄)₃Cl'),
    ('Pyromorphite',    'MINERAL', 'PHOSPHATE', 'Apatite',      'HEXAGONAL',    'Pb₅(PO₄)₃Cl'),
    ('Variscite',       'MINERAL', 'PHOSPHATE', NULL,           'ORTHORHOMBIC', 'AlPO₄·2H₂O'),
    ('Wavellite',       'MINERAL', 'PHOSPHATE', NULL,           'ORTHORHOMBIC', NULL),
    ('Vivianite',       'MINERAL', 'PHOSPHATE', 'Vivianite',    'MONOCLINIC',   'Fe₃(PO₄)₂·8H₂O'),
    ('Ludlamite',       'MINERAL', 'PHOSPHATE', NULL,           'MONOCLINIC',   NULL),
    ('Phosphosiderite', 'MINERAL', 'PHOSPHATE', NULL,           'MONOCLINIC',   'FePO₄·2H₂O'),
    -- Oxides and hydroxides
    ('Goethite',        'MINERAL', 'OXIDE_HYDROXIDE', NULL,     'ORTHORHOMBIC', 'FeO(OH)'),
    ('Corundum',        'MINERAL', 'OXIDE_HYDROXIDE', NULL,     'TRIGONAL',     'Al₂O₃'),
    -- Sulfides
    ('Sphalerite',      'MINERAL', 'SULFIDE',   NULL,           'CUBIC',        'ZnS'),
    ('Galena',          'MINERAL', 'SULFIDE',   NULL,           'CUBIC',        'PbS'),
    ('Marcasite',       'MINERAL', 'SULFIDE',   NULL,           'ORTHORHOMBIC', 'FeS₂'),
    -- Native elements
    ('Copper',          'MINERAL', 'NATIVE_ELEMENT', NULL,      'CUBIC',        'Cu'),
    ('Silver',          'MINERAL', 'NATIVE_ELEMENT', NULL,      'CUBIC',        'Ag'),
    ('Bismuth',         'MINERAL', 'NATIVE_ELEMENT', NULL,      'TRIGONAL',     'Bi'),
    ('Sulfur',          'MINERAL', 'NATIVE_ELEMENT', NULL,      'ORTHORHOMBIC', 'S'),
    ('Mercury',         'MINERAL', 'NATIVE_ELEMENT', NULL,      NULL,           'Hg'),
    -- Halides
    ('Halite',          'MINERAL', 'HALIDE',    NULL,           'CUBIC',        'NaCl'),
    -- Mineraloids
    ('Volcanic glass',  'MINERALOID', 'VOLCANIC_GLASS',            NULL, 'AMORPHOUS', NULL),
    ('Impact glass',    'MINERALOID', 'IMPACT_GLASS',              NULL, 'AMORPHOUS', NULL),
    ('Limonite',        'MINERALOID', 'AMORPHOUS_OXIDE_HYDROXIDE', NULL, 'AMORPHOUS', NULL),
    ('Psilomelane',     'MINERALOID', 'AMORPHOUS_OXIDE_HYDROXIDE', NULL, 'AMORPHOUS', NULL),
    -- Organic
    ('Copal',           'ORGANIC', 'FOSSIL_RESIN_HYDROCARBON', NULL, 'AMORPHOUS', NULL),
    ('Conchiolin',      'ORGANIC', 'ORGANIC_TISSUE',           NULL, NULL,        NULL),
    -- Man-made
    ('Silicon carbide', 'MAN_MADE', 'MAN_MADE_CRYSTAL', NULL, NULL,    'SiC'),
    ('Cubic zirconia',  'MAN_MADE', 'MAN_MADE_CRYSTAL', NULL, 'CUBIC', 'ZrO₂'),
    ('Silicon',         'MAN_MADE', 'METAL_ALLOY',      NULL, 'CUBIC', 'Si')
) AS v(name, category, family, mineral_group, crystal_system, formula)
WHERE NOT EXISTS (SELECT 1 FROM material m WHERE LOWER(m.name) = LOWER(v.name));
