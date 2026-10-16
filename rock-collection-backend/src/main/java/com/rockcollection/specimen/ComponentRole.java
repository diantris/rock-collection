// ComponentRole.java - Role a material plays within a specimen
package com.rockcollection.specimen;

/**
 * Role a material plays within a specimen
 */
public enum ComponentRole {
    HOST, // main / host material
    INCLUSION, // included within the host
    ASSOCIATED, // grows alongside the host
    MATRIX // surrounding rock the specimen sits on
}
