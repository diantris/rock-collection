// MaterialCategory.java - Broad type of a reference material (a component of specimens; never a rock)
package com.rockcollection.material;

/**
 * Broad type of a reference material. Materials are what specimens are made of, so there is no "rock":
 * a rock is a specimen (see SpecimenNature) made of several materials.
 */
public enum MaterialCategory {
    MINERAL, // a mineral species or variety, e.g. quartz, orthoclase
    MINERALOID, // natural, but without a crystal structure, e.g. opal, volcanic glass
    ORGANIC, // of biological origin, e.g. amber, nacre
    MAN_MADE // glass, resin, lab-made crystals and other artificial materials
}
