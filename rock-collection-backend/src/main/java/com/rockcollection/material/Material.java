// Material.java - Entity for a scientific identity (mineral, rock, organic or man-made material) specimens consist of
package com.rockcollection.material;

import jakarta.persistence.*;

/**
 * Classification (type, family, group, crystal system) lives here so it is entered once per material,
 * e.g. "Kosmochlor": mineral, silicate, pyroxene group, monoclinic.
 */
@Entity
@Table(name = "material")
public class Material {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Scientific name, unique ignoring case
    @Column(nullable = false)
    private String name;

    // The "type": mineral, rock, organic or man-made
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaterialCategory category;

    @Enumerated(EnumType.STRING)
    private MaterialFamily family;
    private String mineralGroup;
    @Enumerated(EnumType.STRING)
    private CrystalSystem crystalSystem;

    // Optional chemical formula, link to the mindat.org page and a description (e.g. mindat's definition)
    private String formula;
    private String mindatUrl;
    private String description;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public MaterialCategory getCategory() { return category; }
    public void setCategory(MaterialCategory category) { this.category = category; }
    public MaterialFamily getFamily() { return family; }
    public void setFamily(MaterialFamily family) { this.family = family; }
    public String getMineralGroup() { return mineralGroup; }
    public void setMineralGroup(String mineralGroup) { this.mineralGroup = mineralGroup; }
    public CrystalSystem getCrystalSystem() { return crystalSystem; }
    public void setCrystalSystem(CrystalSystem crystalSystem) { this.crystalSystem = crystalSystem; }
    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }
    public String getMindatUrl() { return mindatUrl; }
    public void setMindatUrl(String mindatUrl) { this.mindatUrl = mindatUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
