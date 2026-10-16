// suggestions.ts - Common values offered as suggestions for free-text observation fields (any other text is allowed)

export const LUSTER_SUGGESTIONS = [
  'Vitreous (glassy)', 'Subvitreous', 'Resinous', 'Waxy', 'Greasy', 'Pearly', 'Silky', 'Adamantine',
  'Metallic', 'Submetallic', 'Dull / earthy',
];

export const TRANSPARENCY_SUGGESTIONS = ['Transparent', 'Translucent', 'Translucent at edges', 'Opaque'];

export const STREAK_SUGGESTIONS = [
  'White', 'Colourless', 'Grey', 'Black', 'Brown', 'Reddish brown', 'Red', 'Yellow', 'Green', 'Blue', 'None (harder than streak plate)',
];

export const CLEAVAGE_SUGGESTIONS = ['None', 'Poor / indistinct', 'Fair', 'Good', 'Perfect', 'Perfect in one direction (basal)', 'Two directions', 'Three directions'];

export const FRACTURE_SUGGESTIONS = ['Conchoidal', 'Subconchoidal', 'Uneven', 'Hackly', 'Splintery', 'Fibrous', 'Earthy', 'Brittle'];

export const HABIT_SUGGESTIONS = [
  'Massive', 'Prismatic', 'Tabular', 'Bladed', 'Acicular (needles)', 'Fibrous', 'Botryoidal (bubbly)', 'Dendritic',
  'Druzy', 'Geode', 'Nodular', 'Banded', 'Granular', 'Cubic', 'Octahedral', 'Rhombohedral', 'Platy',
];

/** Everyday scratch tests, for estimating Mohs hardness at home. */
export const SCRATCH_TEST_HINT =
  'Fingernail ≈ 2.5 · copper coin ≈ 3.5 · steel knife / glass ≈ 5.5 · steel file ≈ 6.5 · quartz = 7. ' +
  'If it scratches X but not Y, enter X–Y.';
