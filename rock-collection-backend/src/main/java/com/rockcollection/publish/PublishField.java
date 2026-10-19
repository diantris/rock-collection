// PublishField.java - The specimen fields the owner can choose to show on the public site
package com.rockcollection.publish;

/**
 * One global checkbox each, in the Publish dialog (never per specimen). The number, name and photos are always
 * published; private notes never are, so they're not listed. The defaults are the identification evidence;
 * acquisition details, price and tags start unticked.
 */
public enum PublishField {
    MARKET_NAME("Market name (what it was sold as)", Group.IDENTITY, true),
    IDENTITY("Scientific identity (materials)", Group.IDENTITY, true),
    FORM("Form", Group.IDENTITY, true),
    NATURE("Nature (natural, treated…)", Group.IDENTITY, true),
    TREATMENT("Treatment notes", Group.IDENTITY, true),
    INCLUSIONS("Unidentified inclusions", Group.IDENTITY, true),

    COLOR("Colour", Group.APPEARANCE, true),
    LUSTER("Luster", Group.APPEARANCE, true),
    TRANSPARENCY("Transparency", Group.APPEARANCE, true),
    OPTICAL_EFFECTS("Optical effects", Group.APPEARANCE, true),

    HARDNESS("Hardness (Mohs)", Group.PHYSICAL, true),
    STREAK("Streak", Group.PHYSICAL, true),
    SPECIFIC_GRAVITY("Specific gravity", Group.PHYSICAL, true),
    CLEAVAGE("Cleavage", Group.PHYSICAL, true),
    FRACTURE("Fracture", Group.PHYSICAL, true),
    CRYSTAL_HABIT("Crystal habit", Group.PHYSICAL, true),
    SPECIAL_PROPERTIES("Special properties", Group.PHYSICAL, true),
    OTHER_OBSERVATIONS("Other observations", Group.PHYSICAL, true),

    WEIGHT("Weight", Group.SIZE, true),
    SIZE("Size", Group.SIZE, true),

    LOCALITY("Locality (where it was mined)", Group.ORIGIN, true),
    ACQUISITION_TYPE("Source (bought, found…)", Group.ORIGIN, false),
    ACQUIRED_FROM("Where I got it", Group.ORIGIN, false),
    ACQUIRED_DATE("When I got it", Group.ORIGIN, false),
    PRICE("Price", Group.ORIGIN, false),

    DESCRIPTION("Public description", Group.NOTES, true),
    TAGS("Tags", Group.NOTES, false);

    /** Headings the checkboxes are grouped under; they match the sections of a specimen page. */
    public enum Group {
        IDENTITY("What it is"), APPEARANCE("Appearance"), PHYSICAL("Physical properties"), SIZE("Size & weight"),
        ORIGIN("Origin & acquisition"), NOTES("Notes");

        private final String label;

        Group(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    private final String label;
    private final Group group;
    private final boolean includedByDefault;

    PublishField(String label, Group group, boolean includedByDefault) {
        this.label = label;
        this.group = group;
        this.includedByDefault = includedByDefault;
    }

    public String label() { return label; }
    public Group group() { return group; }
    public boolean includedByDefault() { return includedByDefault; }
}
