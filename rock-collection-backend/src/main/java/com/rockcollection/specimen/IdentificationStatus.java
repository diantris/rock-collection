// IdentificationStatus.java - How far the owner considers a specimen identified
package com.rockcollection.specimen;

/**
 * Set by the owner, never worked out from the components: listing materials (often tentative guesses) doesn't make
 * a specimen identified. In order of how sure the owner is; the database's {@code identification_rank} mirrors it.
 */
public enum IdentificationStatus {
    UNIDENTIFIED,         // no idea yet
    POSSIBLE_ID,          // an idea of what it is, but only speculation
    PARTIALLY_IDENTIFIED, // more or less known, but not fully identified
    IDENTIFIED
}
