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
            MaterialCategory.MINERAL, "Mineral", MaterialCategory.ROCK, "Rock", MaterialCategory.ORGANIC, "Organic",
            MaterialCategory.MAN_MADE, "Artificial / man-made");

    static final Map<MaterialFamily, String> FAMILY = Map.ofEntries(
            Map.entry(MaterialFamily.NATIVE_ELEMENT, "Native element"), Map.entry(MaterialFamily.SULFIDE, "Sulfide"),
            Map.entry(MaterialFamily.HALIDE, "Halide"), Map.entry(MaterialFamily.OXIDE, "Oxide"),
            Map.entry(MaterialFamily.HYDROXIDE, "Hydroxide"), Map.entry(MaterialFamily.CARBONATE, "Carbonate"),
            Map.entry(MaterialFamily.BORATE, "Borate"), Map.entry(MaterialFamily.SULFATE, "Sulfate"),
            Map.entry(MaterialFamily.PHOSPHATE, "Phosphate"), Map.entry(MaterialFamily.SILICATE, "Silicate"),
            Map.entry(MaterialFamily.ORGANIC_COMPOUND, "Organic compound"), Map.entry(MaterialFamily.IGNEOUS, "Igneous"),
            Map.entry(MaterialFamily.SEDIMENTARY, "Sedimentary"), Map.entry(MaterialFamily.METAMORPHIC, "Metamorphic"),
            Map.entry(MaterialFamily.OTHER, "Other"));

    static final Map<CrystalSystem, String> CRYSTAL_SYSTEM = Map.of(
            CrystalSystem.CUBIC, "Cubic", CrystalSystem.TETRAGONAL, "Tetragonal", CrystalSystem.ORTHORHOMBIC, "Orthorhombic",
            CrystalSystem.HEXAGONAL, "Hexagonal", CrystalSystem.TRIGONAL, "Trigonal", CrystalSystem.MONOCLINIC, "Monoclinic",
            CrystalSystem.TRICLINIC, "Triclinic", CrystalSystem.AMORPHOUS, "Amorphous");

    static final Map<SpecimenForm, String> FORM = Map.ofEntries(
            Map.entry(SpecimenForm.ROUGH, "Rough"), Map.entry(SpecimenForm.CRYSTAL, "Crystal / cluster"),
            Map.entry(SpecimenForm.TUMBLED, "Tumbled"), Map.entry(SpecimenForm.CABOCHON, "Cabochon"),
            Map.entry(SpecimenForm.SPHERE, "Sphere"), Map.entry(SpecimenForm.POINT, "Point / tower"),
            Map.entry(SpecimenForm.FACETED, "Faceted"), Map.entry(SpecimenForm.CARVED, "Carved"),
            Map.entry(SpecimenForm.SLAB, "Slab"), Map.entry(SpecimenForm.BEAD, "Bead"),
            Map.entry(SpecimenForm.JEWELRY, "Jewelry"), Map.entry(SpecimenForm.OTHER, "Other"));

    static final Map<SpecimenNature, String> NATURE = Map.of(
            SpecimenNature.NATURAL, "Natural", SpecimenNature.TREATED, "Treated", SpecimenNature.SYNTHETIC, "Synthetic",
            SpecimenNature.MAN_MADE, "Man-made", SpecimenNature.UNKNOWN, "Unknown");

    static final Map<AcquisitionType, String> ACQUISITION = Map.of(
            AcquisitionType.BOUGHT, "Bought", AcquisitionType.FOUND, "Found", AcquisitionType.GIFT, "Gift",
            AcquisitionType.TRADED, "Traded", AcquisitionType.INHERITED, "Inherited", AcquisitionType.UNKNOWN, "Unknown");

    static final Map<ComponentRole, String> ROLE = Map.of(
            ComponentRole.HOST, "Host", ComponentRole.INCLUSION, "Inclusion", ComponentRole.ASSOCIATED, "Associated",
            ComponentRole.MATRIX, "Matrix");

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
            OpticalEffect.ADULARESCENCE, "Adularescence", OpticalEffect.PLAY_OF_COLOR, "Play of color",
            OpticalEffect.OPALESCENCE, "Opalescence", OpticalEffect.AVENTURESCENCE, "Aventurescence",
            OpticalEffect.COLOR_CHANGE, "Color change");
}
