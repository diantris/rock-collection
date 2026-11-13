// SpecimenNature.java - What kind of thing a specimen is, and whether it is natural, treated or man-made
package com.rockcollection.specimen;

/**
 * What kind of thing a specimen is (mineral, rock, organic, mineraloid) and whether it is natural, treated or
 * man-made. Only specimens can be rocks; their materials never are.
 */
public enum SpecimenNature {
    NATURAL_MINERAL, // e.g. a quartz crystal
    NATURAL_ROCK, // e.g. jasper, obsidian, unakite
    NATURAL_ORGANIC, // e.g. amber, a shell
    NATURAL_MINERALOID, // e.g. opal, moldavite
    TREATED_MINERAL, // natural but dyed, heated, stabilised, etc.
    TREATED_ROCK,
    TREATED_ORGANIC,
    TREATED_MINERALOID,
    SYNTHETIC, // lab-grown, with a natural counterpart, e.g. a lab-grown ruby
    ARTIFICIAL, // no natural counterpart, e.g. goldstone (glass)
    UNKNOWN // not known
}
