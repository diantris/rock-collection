// MaterialFamily.java - Class of a material within its type (chemical class for minerals)
package com.rockcollection.material;

/**
 * Class of a material within its {@link MaterialCategory}; a family only goes with its own type.
 * Mineral families follow the Strunz classes, so vanadates sit with phosphates and tungstates with sulfates.
 */
public enum MaterialFamily {
    // Minerals
    SILICATE(MaterialCategory.MINERAL), // e.g. quartz, feldspar, garnet
    OXIDE_HYDROXIDE(MaterialCategory.MINERAL), // e.g. hematite, rutile, goethite
    CARBONATE(MaterialCategory.MINERAL), // e.g. calcite, malachite
    SULFATE(MaterialCategory.MINERAL), // also molybdates and tungstates, e.g. gypsum, baryte, scheelite
    PHOSPHATE(MaterialCategory.MINERAL), // also arsenates and vanadates, e.g. turquoise, vanadinite
    SULFIDE(MaterialCategory.MINERAL), // e.g. pyrite, galena
    NATIVE_ELEMENT(MaterialCategory.MINERAL), // e.g. copper, sulfur, mercury
    HALIDE(MaterialCategory.MINERAL), // e.g. fluorite, halite
    BORATE(MaterialCategory.MINERAL), // e.g. ulexite
    // Mineraloids
    VOLCANIC_GLASS(MaterialCategory.MINERALOID), // what obsidian, perlite and pumice are made of
    IMPACT_GLASS(MaterialCategory.MINERALOID), // tektites, e.g. moldavite, Libyan desert glass
    AMORPHOUS_SILICA(MaterialCategory.MINERALOID), // e.g. opal, geyserite
    AMORPHOUS_OXIDE_HYDROXIDE(MaterialCategory.MINERALOID), // field names for fine mixtures, e.g. limonite, psilomelane
    // Organic
    FOSSIL_RESIN_HYDROCARBON(MaterialCategory.ORGANIC), // e.g. amber, copal, jet
    BIOMINERAL(MaterialCategory.ORGANIC), // made by living things, e.g. nacre, coral
    ORGANIC_TISSUE(MaterialCategory.ORGANIC), // organic tissue or fossil remains, e.g. conchiolin
    FAUNA_FLORA_INCLUSION(MaterialCategory.ORGANIC), // e.g. an insect or plant in amber
    // Man-made
    GLASS(MaterialCategory.MAN_MADE), // glass and other amorphous man-made materials
    METAL_ALLOY(MaterialCategory.MAN_MADE), // metals and alloys, e.g. industrial silicon, brass
    POLYMER_RESIN(MaterialCategory.MAN_MADE), // polymers and synthetic resins, e.g. epoxy
    MAN_MADE_CRYSTAL(MaterialCategory.MAN_MADE); // crystals with no natural counterpart, e.g. silicon carbide, cubic zirconia

    private final MaterialCategory category;

    MaterialFamily(MaterialCategory category) {
        this.category = category;
    }

    /** The type this family belongs to. */
    public MaterialCategory category() {
        return category;
    }
}
