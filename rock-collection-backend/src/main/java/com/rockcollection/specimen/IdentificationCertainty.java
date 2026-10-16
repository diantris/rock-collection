// IdentificationCertainty.java - How sure the identification of a component is
package com.rockcollection.specimen;

/**
 * How sure the identification of a component is
 */
public enum IdentificationCertainty {
    CONFIRMED, // confirmed, e.g. by an expert or a test
    TENTATIVE, // best guess, not confirmed
    SELLER_CLAIM // only the seller's word for it
}
