// Rock.java - Simple POJO representing a rock (not a JPA entity)
package com.rockcollection.model;

public class Rock {
    // Unique identifier for the rock
    private Long id;
    // Name of the rock
    private String name;
    // Type of the rock (e.g., igneous, sedimentary, metamorphic)
    private String type;
    // Description of the rock
    private String description;

    public Rock() {}

    public Rock(Long id, String name, String type, String description) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
// End of Rock.java
