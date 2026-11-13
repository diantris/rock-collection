// SiteLabels.java - English display names of enum values on the public site
package com.rockcollection.publish;

import com.rockcollection.material.CrystalSystem;
import com.rockcollection.material.MaterialCategory;
import com.rockcollection.material.MaterialFamily;
import com.rockcollection.specimen.*;

import java.util.Map;

/** Keep in sync with the *_LABELS maps in the frontend's specimens/types.ts, so the app and the site agree. */
final class SiteLabels {
    private SiteLabels() {}

    static final Map<MaterialCategory, String> CATEGORY = Map.of(
            MaterialCategory.MINERAL, "Mineral", MaterialCategory.MINERALOID, "Mineraloid",
            MaterialCategory.ORGANIC, "Organic", MaterialCategory.MAN_MADE, "Man-made");

    static final Map<MaterialFamily, String> FAMILY = Map.ofEntries(
            Map.entry(MaterialFamily.SILICATE, "Silicate"), Map.entry(MaterialFamily.OXIDE_HYDROXIDE, "Oxide / hydroxide"),
            Map.entry(MaterialFamily.CARBONATE, "Carbonate"), Map.entry(MaterialFamily.SULFATE, "Sulfate"),
            Map.entry(MaterialFamily.PHOSPHATE, "Phosphate"), Map.entry(MaterialFamily.SULFIDE, "Sulfide"),
            Map.entry(MaterialFamily.NATIVE_ELEMENT, "Native element"), Map.entry(MaterialFamily.HALIDE, "Halide"),
            Map.entry(MaterialFamily.BORATE, "Borate"),
            Map.entry(MaterialFamily.VOLCANIC_GLASS, "Volcanic glass"), Map.entry(MaterialFamily.IMPACT_GLASS, "Impact glass / tektite"),
            Map.entry(MaterialFamily.AMORPHOUS_SILICA, "Amorphous silica"),
            Map.entry(MaterialFamily.AMORPHOUS_OXIDE_HYDROXIDE, "Amorphous oxide / hydroxide"),
            Map.entry(MaterialFamily.FOSSIL_RESIN_HYDROCARBON, "Fossil resin / hydrocarbon"),
            Map.entry(MaterialFamily.BIOMINERAL, "Biomineral"),
            Map.entry(MaterialFamily.ORGANIC_TISSUE, "Organic tissue / fossil remains"),
            Map.entry(MaterialFamily.FAUNA_FLORA_INCLUSION, "Fauna / flora inclusion"),
            Map.entry(MaterialFamily.GLASS, "Glass / amorphous"), Map.entry(MaterialFamily.METAL_ALLOY, "Metal / alloy"),
            Map.entry(MaterialFamily.POLYMER_RESIN, "Polymer / resin"), Map.entry(MaterialFamily.MAN_MADE_CRYSTAL, "Man-made crystal"));

    static final Map<CrystalSystem, String> CRYSTAL_SYSTEM = Map.of(
            CrystalSystem.CUBIC, "Cubic", CrystalSystem.TETRAGONAL, "Tetragonal", CrystalSystem.ORTHORHOMBIC, "Orthorhombic",
            CrystalSystem.HEXAGONAL, "Hexagonal", CrystalSystem.TRIGONAL, "Trigonal", CrystalSystem.MONOCLINIC, "Monoclinic",
            CrystalSystem.TRICLINIC, "Triclinic", CrystalSystem.AMORPHOUS, "Amorphous (no crystal structure)");

    static final Map<SpecimenForm, String> FORM = Map.ofEntries(
            Map.entry(SpecimenForm.ROUGH, "Rough"), Map.entry(SpecimenForm.CRYSTAL, "Crystal / cluster"),
            Map.entry(SpecimenForm.TUMBLED, "Tumbled"), Map.entry(SpecimenForm.CABOCHON, "Cabochon"),
            Map.entry(SpecimenForm.SPHERE, "Sphere"), Map.entry(SpecimenForm.POINT, "Point / tower"),
            Map.entry(SpecimenForm.FACETED, "Faceted"), Map.entry(SpecimenForm.CARVED, "Carved"),
            Map.entry(SpecimenForm.SLAB, "Slab"), Map.entry(SpecimenForm.BEAD, "Bead"),
            Map.entry(SpecimenForm.JEWELRY, "Jewellery"), Map.entry(SpecimenForm.OTHER, "Other"));

    static final Map<SpecimenNature, String> NATURE = Map.ofEntries(
            Map.entry(SpecimenNature.NATURAL_MINERAL, "Natural mineral"), Map.entry(SpecimenNature.NATURAL_ROCK, "Natural rock"),
            Map.entry(SpecimenNature.NATURAL_ORGANIC, "Natural organic"), Map.entry(SpecimenNature.NATURAL_MINERALOID, "Natural mineraloid"),
            Map.entry(SpecimenNature.TREATED_MINERAL, "Treated mineral"), Map.entry(SpecimenNature.TREATED_ROCK, "Treated rock"),
            Map.entry(SpecimenNature.TREATED_ORGANIC, "Treated organic"), Map.entry(SpecimenNature.TREATED_MINERALOID, "Treated mineraloid"),
            Map.entry(SpecimenNature.SYNTHETIC, "Synthetic (lab-grown)"), Map.entry(SpecimenNature.ARTIFICIAL, "Artificial"),
            Map.entry(SpecimenNature.UNKNOWN, "Unknown"));

    static final Map<AcquisitionType, String> ACQUISITION = Map.of(
            AcquisitionType.BOUGHT, "Bought", AcquisitionType.FOUND, "Found", AcquisitionType.GIFT, "Gift",
            AcquisitionType.TRADED, "Traded", AcquisitionType.INHERITED, "Inherited", AcquisitionType.UNKNOWN, "Unknown");

    static final Map<ComponentRole, String> ROLE = Map.of(
            ComponentRole.HOST, "Host", ComponentRole.INCLUSION, "Inclusion", ComponentRole.ASSOCIATED, "Associated",
            ComponentRole.MATRIX, "Matrix component");

    static final Map<IdentificationCertainty, String> CERTAINTY = Map.of(
            IdentificationCertainty.CONFIRMED, "Confirmed", IdentificationCertainty.TENTATIVE, "Tentative",
            IdentificationCertainty.SELLER_CLAIM, "Seller's claim");

    static final Map<SpecialProperty, String> SPECIAL_PROPERTY = Map.ofEntries(
            Map.entry(SpecialProperty.MAGNETIC, "Magnetic"), Map.entry(SpecialProperty.FLUORESCENT, "Fluorescent"),
            Map.entry(SpecialProperty.PHOSPHORESCENT, "Phosphorescent"), Map.entry(SpecialProperty.RADIOACTIVE, "Radioactive"),
            Map.entry(SpecialProperty.EFFERVESCENT, "Fizzes in acid"), Map.entry(SpecialProperty.PIEZOELECTRIC, "Piezoelectric"),
            Map.entry(SpecialProperty.PLEOCHROIC, "Pleochroic"), Map.entry(SpecialProperty.DOUBLE_REFRACTION, "Double refraction"),
            Map.entry(SpecialProperty.TRIBOLUMINESCENT, "Triboluminescent"), Map.entry(SpecialProperty.SOLUBLE, "Water-soluble"),
            Map.entry(SpecialProperty.TASTE, "Distinctive taste"));

    static final Map<OpticalEffect, String> OPTICAL_EFFECT = Map.of(
            OpticalEffect.CHATOYANCY, "Chatoyancy (cat’s eye)", OpticalEffect.ASTERISM, "Asterism (star)",
            OpticalEffect.IRIDESCENCE, "Iridescence", OpticalEffect.LABRADORESCENCE, "Labradorescence",
            OpticalEffect.ADULARESCENCE, "Adularescence", OpticalEffect.PLAY_OF_COLOR, "Play of colour",
            OpticalEffect.OPALESCENCE, "Opalescence", OpticalEffect.AVENTURESCENCE, "Aventurescence",
            OpticalEffect.COLOR_CHANGE, "Colour change");
}
