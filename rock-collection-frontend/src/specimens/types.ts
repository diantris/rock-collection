// types.ts - Types mirroring the backend specimen / material API, plus display labels for enums

/** Type of a material. Materials are what specimens are made of, so never a rock (a rock is a specimen). */
export type MaterialCategory = 'MINERAL' | 'MINERALOID' | 'ORGANIC' | 'MAN_MADE';
export type MaterialFamily =
  | 'SILICATE' | 'OXIDE_HYDROXIDE' | 'CARBONATE' | 'SULFATE' | 'PHOSPHATE' | 'SULFIDE' | 'NATIVE_ELEMENT' | 'HALIDE' | 'BORATE'
  | 'VOLCANIC_GLASS' | 'IMPACT_GLASS' | 'AMORPHOUS_SILICA' | 'AMORPHOUS_OXIDE_HYDROXIDE'
  | 'FOSSIL_RESIN_HYDROCARBON' | 'BIOMINERAL' | 'ORGANIC_TISSUE' | 'FAUNA_FLORA_INCLUSION'
  | 'GLASS' | 'METAL_ALLOY' | 'POLYMER_RESIN' | 'MAN_MADE_CRYSTAL';
export type CrystalSystem = 'CUBIC' | 'TETRAGONAL' | 'ORTHORHOMBIC' | 'HEXAGONAL' | 'TRIGONAL' | 'MONOCLINIC' | 'TRICLINIC' | 'AMORPHOUS';
export type SpecimenForm =
  | 'ROUGH' | 'CRYSTAL' | 'TUMBLED' | 'CABOCHON' | 'SPHERE' | 'POINT' | 'FACETED' | 'CARVED' | 'SLAB' | 'BEAD' | 'JEWELRY' | 'OTHER';
/** What kind of thing a specimen is, and whether it's natural, treated or man-made. */
export type SpecimenNature =
  | 'NATURAL_MINERAL' | 'NATURAL_ROCK' | 'NATURAL_ORGANIC' | 'NATURAL_MINERALOID'
  | 'TREATED_MINERAL' | 'TREATED_ROCK' | 'TREATED_ORGANIC' | 'TREATED_MINERALOID'
  | 'SYNTHETIC' | 'ARTIFICIAL' | 'UNKNOWN';
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
  MINERAL: 'Mineral', MINERALOID: 'Mineraloid', ORGANIC: 'Organic', MAN_MADE: 'Man-made',
};
export const FAMILY_LABELS: Record<MaterialFamily, string> = {
  SILICATE: 'Silicate', OXIDE_HYDROXIDE: 'Oxide / hydroxide', CARBONATE: 'Carbonate', SULFATE: 'Sulfate',
  PHOSPHATE: 'Phosphate', SULFIDE: 'Sulfide', NATIVE_ELEMENT: 'Native element', HALIDE: 'Halide', BORATE: 'Borate',
  VOLCANIC_GLASS: 'Volcanic glass', IMPACT_GLASS: 'Impact glass / tektite', AMORPHOUS_SILICA: 'Amorphous silica',
  AMORPHOUS_OXIDE_HYDROXIDE: 'Amorphous oxide / hydroxide',
  FOSSIL_RESIN_HYDROCARBON: 'Fossil resin / hydrocarbon', BIOMINERAL: 'Biomineral',
  ORGANIC_TISSUE: 'Organic tissue / fossil remains', FAUNA_FLORA_INCLUSION: 'Fauna / flora inclusion',
  GLASS: 'Glass / amorphous', METAL_ALLOY: 'Metal / alloy', POLYMER_RESIN: 'Polymer / resin', MAN_MADE_CRYSTAL: 'Man-made crystal',
};
/** The families each material type offers (MaterialFamily.category() on the backend). */
export const FAMILIES_BY_CATEGORY: Record<MaterialCategory, MaterialFamily[]> = {
  MINERAL: ['SILICATE', 'OXIDE_HYDROXIDE', 'CARBONATE', 'SULFATE', 'PHOSPHATE', 'SULFIDE', 'NATIVE_ELEMENT', 'HALIDE', 'BORATE'],
  MINERALOID: ['VOLCANIC_GLASS', 'IMPACT_GLASS', 'AMORPHOUS_SILICA', 'AMORPHOUS_OXIDE_HYDROXIDE'],
  ORGANIC: ['FOSSIL_RESIN_HYDROCARBON', 'BIOMINERAL', 'ORGANIC_TISSUE', 'FAUNA_FLORA_INCLUSION'],
  MAN_MADE: ['GLASS', 'METAL_ALLOY', 'POLYMER_RESIN', 'MAN_MADE_CRYSTAL'],
};
export const CRYSTAL_SYSTEM_LABELS: Record<CrystalSystem, string> = {
  CUBIC: 'Cubic', TETRAGONAL: 'Tetragonal', ORTHORHOMBIC: 'Orthorhombic', HEXAGONAL: 'Hexagonal',
  TRIGONAL: 'Trigonal', MONOCLINIC: 'Monoclinic', TRICLINIC: 'Triclinic', AMORPHOUS: 'Amorphous (no crystal structure)',
};
export const FORM_LABELS: Record<SpecimenForm, string> = {
  ROUGH: 'Rough', CRYSTAL: 'Crystal / cluster', TUMBLED: 'Tumbled', CABOCHON: 'Cabochon', SPHERE: 'Sphere',
  POINT: 'Point / tower', FACETED: 'Faceted', CARVED: 'Carved', SLAB: 'Slab', BEAD: 'Bead', JEWELRY: 'Jewellery', OTHER: 'Other',
};
export const NATURE_LABELS: Record<SpecimenNature, string> = {
  NATURAL_MINERAL: 'Natural mineral', NATURAL_ROCK: 'Natural rock', NATURAL_ORGANIC: 'Natural organic',
  NATURAL_MINERALOID: 'Natural mineraloid', TREATED_MINERAL: 'Treated mineral', TREATED_ROCK: 'Treated rock',
  TREATED_ORGANIC: 'Treated organic', TREATED_MINERALOID: 'Treated mineraloid', SYNTHETIC: 'Synthetic (lab-grown)',
  ARTIFICIAL: 'Artificial', UNKNOWN: 'Unknown',
};
/** The table's Type column: what kind of thing the specimen is, from its nature (natural or treated alike). */
export const NATURE_TYPE_LABELS: Record<SpecimenNature, string | null> = {
  NATURAL_MINERAL: 'Mineral', NATURAL_ROCK: 'Rock', NATURAL_ORGANIC: 'Organic', NATURAL_MINERALOID: 'Mineraloid',
  TREATED_MINERAL: 'Mineral', TREATED_ROCK: 'Rock', TREATED_ORGANIC: 'Organic', TREATED_MINERALOID: 'Mineraloid',
  SYNTHETIC: 'Synthetic', ARTIFICIAL: 'Artificial', UNKNOWN: null,
};
export const ACQUISITION_LABELS: Record<AcquisitionType, string> = {
  BOUGHT: 'Bought', FOUND: 'Found', GIFT: 'Gift', TRADED: 'Traded', INHERITED: 'Inherited', UNKNOWN: 'Unknown',
};
export const ROLE_LABELS: Record<ComponentRole, string> = {
  HOST: 'Host', INCLUSION: 'Inclusion', ASSOCIATED: 'Associated (grows alongside)', MATRIX: 'Matrix component',
};
/** Shorter role names for chips; the role dropdown uses ROLE_LABELS, which explain "associated". */
export const ROLE_SHORT_LABELS: Record<ComponentRole, string> = {
  HOST: 'Host', INCLUSION: 'Inclusion', ASSOCIATED: 'Associated', MATRIX: 'Matrix component',
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
  LABRADORESCENCE: 'Labradorescence', ADULARESCENCE: 'Adularescence', PLAY_OF_COLOR: 'Play of colour',
  OPALESCENCE: 'Opalescence', AVENTURESCENCE: 'Aventurescence', COLOR_CHANGE: 'Colour change',
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

/** Row of the paginated specimen table. `family` comes from the primary (host) material; the Type column from `nature`. */
export interface SpecimenSummary {
  id: number;
  name: string;
  marketName: string | null;
  components: Component[];
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
  /** No longer in the collection: greyed out in the app and never published, whatever `published` says. */
  gone: boolean;
  /** Shown at the top of the table while it isn't sorted by a column. */
  pinned: boolean;
  /** Changes whenever the thumbnail does; null when the specimen has no photos. */
  thumbnailVersion: number | null;
}

/** A full-size photo; the file lives in the public GitHub Pages repo. */
export interface Photo {
  id: number;
  /** Path inside the Pages repo. */
  fileName: string;
  url: string;
  /** Small copy (480px), for tiles and the public site's index. */
  smallUrl: string;
  caption: string | null;
  /** 0 is the cover, which the table thumbnail is made from. */
  position: number;
  width: number | null;
  height: number | null;
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

/** Full specimen as returned by GET /api/specimens/{id} (includes private fields). */
export interface SpecimenDetail {
  id: number;
  name: string;
  marketName: string | null;
  form: SpecimenForm | null;
  nature: SpecimenNature | null;
  treatmentNotes: string | null;
  components: Component[];
  color: string | null;
  secondaryColor: string | null;
  luster: string | null;
  transparency: string | null;
  streak: string | null;
  hardnessMin: number | null;
  hardnessMax: number | null;
  cleavage: string | null;
  fracture: string | null;
  crystalHabit: string | null;
  specificGravity: number | null;
  specialProperties: SpecialProperty[];
  opticalEffects: OpticalEffect[];
  inclusions: string | null;
  weightG: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  otherObservations: string | null;
  locality: string | null;
  country: string | null;
  acquisitionType: AcquisitionType | null;
  acquiredFrom: string | null;
  acquiredCountry: string | null;
  acquiredYear: number | null;
  acquiredMonth: number | null;
  acquiredDay: number | null;
  price: number | null;
  currency: string | null;
  tags: string[];
  description: string | null;
  /** A web page about this stone, usually on mindat.org; published as a link. */
  mindatUrl: string | null;
  privateNotes: string | null;
  published: boolean;
  /** No longer in the collection: never published, whatever `published` says. */
  gone: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Keys of the global publish checkboxes (PublishField on the backend). */
export type PublishFieldKey = string;

export interface PublishFieldSetting {
  key: PublishFieldKey;
  label: string;
  /** Heading the checkbox is grouped under. */
  group: string;
  included: boolean;
}

export interface PublishSettings {
  fields: PublishFieldSetting[];
  intro: string | null;
  lastPublishedAt: string | null;
  /** Address of the public site; null when GitHub isn't set up. */
  siteUrl: string | null;
  /** Specimens that will show on the site: marked public and not gone. */
  publicCount: number;
  /** Specimens no longer in the collection, which are never published. */
  goneCount: number;
  totalCount: number;
  gitHubConfigured: boolean;
}

export interface PublishResult {
  /** False when the site was already up to date. */
  changed: boolean;
  specimenCount: number;
  siteUrl: string;
  publishedAt: string;
}
