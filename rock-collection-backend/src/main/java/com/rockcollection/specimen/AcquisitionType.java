// AcquisitionType.java - How a specimen came into the collection
package com.rockcollection.specimen;

/**
 * How a specimen came into the collection
 */
public enum AcquisitionType {
    BOUGHT, // purchased
    FOUND, // collected in the field
    GIFT, // received as a gift
    TRADED, // swapped
    INHERITED, // inherited / family piece
    UNKNOWN // not remembered
}
