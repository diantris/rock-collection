// SpecimenComponent.java - Entity linking a specimen to one material it consists of
package com.rockcollection.specimen;

import com.rockcollection.material.Material;
import jakarta.persistence.*;

/**
 * E.g. a "quartz with garnet" specimen has two components:
 * quartz (HOST, CONFIRMED) and garnet (INCLUSION, TENTATIVE).
 */
@Entity
@Table(name = "specimen_component")
public class SpecimenComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "specimen_id")
    private Specimen specimen;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IdentificationCertainty certainty;

    // Display order within the specimen
    @Column(nullable = false)
    private int position;

    public SpecimenComponent() {}

    public SpecimenComponent(Material material, ComponentRole role, IdentificationCertainty certainty) {
        this.material = material;
        this.role = role;
        this.certainty = certainty;
    }

    public Long getId() { return id; }
    public Specimen getSpecimen() { return specimen; }
    public void setSpecimen(Specimen specimen) { this.specimen = specimen; }
    public Material getMaterial() { return material; }
    public void setMaterial(Material material) { this.material = material; }
    public ComponentRole getRole() { return role; }
    public void setRole(ComponentRole role) { this.role = role; }
    public IdentificationCertainty getCertainty() { return certainty; }
    public void setCertainty(IdentificationCertainty certainty) { this.certainty = certainty; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
}
