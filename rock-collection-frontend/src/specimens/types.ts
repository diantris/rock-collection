// types.ts - Types mirroring the backend specimen / material API, plus display labels for enums

export type MaterialCategory = 'MINERAL' | 'ROCK' | 'ORGANIC' | 'MAN_MADE';
export type MaterialFamily =
  | 'NATIVE_ELEMENT' | 'SULFIDE' | 'HALIDE' | 'OXIDE' | 'HYDROXIDE' | 'CARBONATE' | 'BORATE' | 'SULFATE'
  | 'PHOSPHATE' | 'SILICATE' | 'ORGANIC_COMPOUND' | 'IGNEOUS' | 'SEDIMENTARY' | 'METAMORPHIC' | 'OTHER';
export type CrystalSystem = 'CUBIC' | 'TETRAGONAL' | 'ORTHORHOMBIC' | 'HEXAGONAL' | 'TRIGONAL' | 'MONOCLINIC' | 'TRICLINIC' | 'AMORPHOUS';
export type SpecimenForm =
  | 'ROUGH' | 'CRYSTAL' | 'TUMBLED' | 'CABOCHON' | 'SPHERE' | 'POINT' | 'FACETED' | 'CARVED' | 'SLAB' | 'BEAD' | 'JEWELRY' | 'OTHER';
export type SpecimenNature = 'NATURAL' | 'TREATED' | 'SYNTHETIC' | 'MAN_MADE' | 'UNKNOWN';
export type AcquisitionType = 'BOUGHT' | 'FOUND' | 'GIFT' | 'TRADED' | 'INHERITED' | 'UNKNOWN';
export type ComponentRole = 'HOST' | 'INCLUSION' | 'ASSOCIATED' | 'MATRIX';
export type IdentificationCertainty = 'CONFIRMED' | 'TENTATIVE' | 'SELLER_CLAIM';
export type SpecialProperty =
  | 'MAGNETIC' | 'FLUORESCENT' | 'PHOSPHORESCENT' | 'RADIOACTIVE' | 'EFFERVESCENT' | 'PIEZOELECTRIC'
  | 'PLEOCHROIC' | 'DOUBLE_REFRACTION' | 'TRIBOLUMINESCENT' | 'SOLUBLE' | 'TASTE';
export type OpticalEffect =
  | 'CHATOYANCY' | 'ASTERISM' | 'IRIDESCENCE' | 'LABRADORESCENCE' | 'ADULARESCENCE' | 'PLAY_OF_COLOR'
  | 'OPALESCENCE' | 'AVENTURESCENCE' | 'COLOR_CHANGE';

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  MINERAL: 'Mineral', ROCK: 'Rock', ORGANIC: 'Organic', MAN_MADE: 'Artificial / man-made',
};
export const FAMILY_LABELS: Record<MaterialFamily, string> = {
  NATIVE_ELEMENT: 'Native element', SULFIDE: 'Sulfide', HALIDE: 'Halide', OXIDE: 'Oxide', HYDROXIDE: 'Hydroxide',
  CARBONATE: 'Carbonate', BORATE: 'Borate', SULFATE: 'Sulfate', PHOSPHATE: 'Phosphate', SILICATE: 'Silicate',
  ORGANIC_COMPOUND: 'Organic compound', IGNEOUS: 'Igneous', SEDIMENTARY: 'Sedimentary', METAMORPHIC: 'Metamorphic',
  OTHER: 'Other',
};
export const CRYSTAL_SYSTEM_LABELS: Record<CrystalSystem, string> = {
  CUBIC: 'Cubic', TETRAGONAL: 'Tetragonal', ORTHORHOMBIC: 'Orthorhombic', HEXAGONAL: 'Hexagonal',
  TRIGONAL: 'Trigonal', MONOCLINIC: 'Monoclinic', TRICLINIC: 'Triclinic', AMORPHOUS: 'Amorphous',
};
export const FORM_LABELS: Record<SpecimenForm, string> = {
  ROUGH: 'Rough', CRYSTAL: 'Crystal / cluster', TUMBLED: 'Tumbled', CABOCHON: 'Cabochon', SPHERE: 'Sphere',
  POINT: 'Point / tower', FACETED: 'Faceted', CARVED: 'Carved', SLAB: 'Slab', BEAD: 'Bead', JEWELRY: 'Jewelry', OTHER: 'Other',
};
export const NATURE_LABELS: Record<SpecimenNature, string> = {
  NATURAL: 'Natural', TREATED: 'Treated', SYNTHETIC: 'Synthetic', MAN_MADE: 'Man-made', UNKNOWN: 'Unknown',
};
export const ACQUISITION_LABELS: Record<AcquisitionType, string> = {
  BOUGHT: 'Bought', FOUND: 'Found', GIFT: 'Gift', TRADED: 'Traded', INHERITED: 'Inherited', UNKNOWN: 'Unknown',
};
export const ROLE_LABELS: Record<ComponentRole, string> = {
  HOST: 'Host', INCLUSION: 'Inclusion', ASSOCIATED: 'Associated', MATRIX: 'Matrix',
};
export const CERTAINTY_LABELS: Record<IdentificationCertainty, string> = {
  CONFIRMED: 'Confirmed', TENTATIVE: 'Tentative', SELLER_CLAIM: "Seller's claim",
};
export const SPECIAL_PROPERTY_LABELS: Record<SpecialProperty, string> = {
  MAGNETIC: 'Magnetic', FLUORESCENT: 'Fluorescent', PHOSPHORESCENT: 'Phosphorescent', RADIOACTIVE: 'Radioactive',
  EFFERVESCENT: 'Fizzes in acid', PIEZOELECTRIC: 'Piezoelectric', PLEOCHROIC: 'Pleochroic',
  DOUBLE_REFRACTION: 'Double refraction', TRIBOLUMINESCENT: 'Triboluminescent', SOLUBLE: 'Water-soluble', TASTE: 'Distinctive taste',
};
export const OPTICAL_EFFECT_LABELS: Record<OpticalEffect, string> = {
  CHATOYANCY: 'Chatoyancy (cat’s eye)', ASTERISM: 'Asterism (star)', IRIDESCENCE: 'Iridescence',
  LABRADORESCENCE: 'Labradorescence', ADULARESCENCE: 'Adularescence', PLAY_OF_COLOR: 'Play of color',
  OPALESCENCE: 'Opalescence', AVENTURESCENCE: 'Aventurescence', COLOR_CHANGE: 'Color change',
};

export interface Material {
  id: number;
  name: string; // scientific name
  category: MaterialCategory;
  family: MaterialFamily | null;
  mineralGroup: string | null;
  crystalSystem: CrystalSystem | null;
  formula: string | null;
  mindatUrl: string | null;
  description: string | null;
}

export interface Component {
  materialId: number;
  materialName: string;
  category: MaterialCategory;
  family: MaterialFamily | null;
  mineralGroup: string | null;
  crystalSystem: CrystalSystem | null;
  role: ComponentRole;
  certainty: IdentificationCertainty;
}

/** Row of the paginated specimen table. `type`/`family` come from the primary (host) material. */
export interface SpecimenSummary {
  id: number;
  name: string;
  marketName: string | null;
  components: Component[];
  type: MaterialCategory | null;
  family: MaterialFamily | null;
  form: SpecimenForm | null;
  nature: SpecimenNature | null;
  country: string | null;
  acquisitionType: AcquisitionType | null;
  acquiredFrom: string | null;
  acquiredCountry: string | null;
  acquiredYear: number | null;
  price: number | null;
  currency: string | null;
  tags: string[];
  published: boolean;
}

export interface Page<T> {
  content: T[];
  page: number; // zero-based
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Sort keys accepted by GET /api/specimens. */
export type SpecimenSortKey =
  | 'id' | 'name' | 'marketName' | 'form' | 'nature' | 'country' | 'acquisitionType'
  | 'acquiredFrom' | 'acquiredCountry' | 'acquiredYear' | 'price';
export type Order = 'asc' | 'desc';

/** Body for POST/PUT /api/specimens. Only `name` is required; omitted fields are stored as unknown. */
export interface SpecimenRequest {
  name: string;
  marketName?: string | null;
  form?: SpecimenForm | null;
  nature?: SpecimenNature | null;
  components?: { materialId: number; role: ComponentRole; certainty: IdentificationCertainty }[];
  acquisitionType?: AcquisitionType | null;
  acquiredFrom?: string | null;
  tags?: string[];
  [field: string]: unknown; // remaining optional fields are added by the full form (roadmap step 2)
}

export interface MaterialRequest {
  name: string;
  category: MaterialCategory;
  family?: MaterialFamily | null;
  mineralGroup?: string | null;
  crystalSystem?: CrystalSystem | null;
  formula?: string | null;
  mindatUrl?: string | null;
  description?: string | null;
}
