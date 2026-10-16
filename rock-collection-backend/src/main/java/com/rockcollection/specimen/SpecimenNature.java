// SpecimenNature.java - Whether a specimen is natural, altered or artificial
package com.rockcollection.specimen;

/**
 * Whether a specimen is natural, altered or artificial
 */
public enum SpecimenNature {
    NATURAL, // untreated natural material
    TREATED, // natural but dyed, heated, stabilised, etc.
    SYNTHETIC, // lab-grown equivalent of a natural material
    MAN_MADE, // imitation or artificial material, e.g. glass
    UNKNOWN // not known
}
