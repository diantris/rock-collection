// MaterialFamily.java - Chemical class of a mineral, or class of a rock
package com.rockcollection.material;

/**
 * Chemical class of a mineral, or class of a rock
 */
public enum MaterialFamily {
    NATIVE_ELEMENT, // e.g. gold, sulfur
    SULFIDE, // e.g. pyrite
    HALIDE, // e.g. fluorite, halite
    OXIDE, // e.g. hematite, rutile
    HYDROXIDE, // e.g. goethite
    CARBONATE, // e.g. calcite, malachite
    BORATE, // e.g. ulexite
    SULFATE, // e.g. gypsum, baryte
    PHOSPHATE, // e.g. turquoise, apatite
    SILICATE, // e.g. quartz, feldspar, garnet
    ORGANIC_COMPOUND, // organic minerals, e.g. mellite
    IGNEOUS, // rock formed from magma or lava
    SEDIMENTARY, // rock formed from deposited material
    METAMORPHIC, // rock transformed by heat and pressure
    OTHER // anything else
}
