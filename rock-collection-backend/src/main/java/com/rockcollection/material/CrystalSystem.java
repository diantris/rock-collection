// CrystalSystem.java - Crystal system of a material
package com.rockcollection.material;

/**
 * Crystal system of a material; unknown or not applicable is null
 */
public enum CrystalSystem {
    CUBIC, // isometric
    TETRAGONAL,
    ORTHORHOMBIC,
    HEXAGONAL,
    TRIGONAL,
    MONOCLINIC,
    TRICLINIC,
    AMORPHOUS // no crystal structure, e.g. opal, volcanic glass (always the case for mineraloids)
}
