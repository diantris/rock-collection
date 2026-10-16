// Specimen.java - Entity for one physical item in the collection
package com.rockcollection.specimen;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A specimen's id doubles as its public, stable number ("#142").
 * Apart from the name every field is optional. The observed / measured properties are the
 * evidence used to identify the specimen, so they belong to the specimen rather than to its materials.
 */
@Entity
@Table(name = "specimen")
public class Specimen {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // What the owner calls it, and what it was sold as
    @Column(nullable = false)
    private String name;
    private String marketName;

    // What it is
    @Enumerated(EnumType.STRING)
    private SpecimenForm form;
    @Enumerated(EnumType.STRING)
    private SpecimenNature nature;
    private String treatmentNotes;

    // Observed / measured properties of this particular specimen
    private String color;
    private String secondaryColor;
    private String luster;
    private String transparency;
    private String streak;
    private BigDecimal hardnessMin; // Mohs; equal to hardnessMax for a single value
    private BigDecimal hardnessMax;
    private String cleavage;
    private String fracture;
    private String crystalHabit;
    private BigDecimal specificGravity;
    // SpecialProperty / OpticalEffect enum names, stored as PostgreSQL arrays
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false)
    private List<String> specialProperties = new ArrayList<>();
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false)
    private List<String> opticalEffects = new ArrayList<>();
    private String inclusions;
    @Column(name = "weight_g") // the naming strategy doesn't split a trailing single capital ("weightg")
    private BigDecimal weightG;
    private BigDecimal lengthMm;
    private BigDecimal widthMm;
    private BigDecimal heightMm;
    private String otherObservations;

    // Provenance: where it formed, and how / where the owner got it
    private String locality;
    private String country;
    @Enumerated(EnumType.STRING)
    private AcquisitionType acquisitionType;
    private String acquiredFrom;
    private String acquiredCountry;
    private Integer acquiredYear;
    private Integer acquiredMonth;
    private Integer acquiredDay;
    private BigDecimal price;
    private String currency;

    // Free text and tags
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(nullable = false)
    private List<String> tags = new ArrayList<>();
    private String description;
    private String privateNotes;

    // Admin
    @Column(nullable = false)
    private boolean published;
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    // Materials this specimen consists of, in display order. Batch-fetched to avoid N+1 queries on list pages.
    @OneToMany(mappedBy = "specimen", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position")
    @BatchSize(size = 100)
    private List<SpecimenComponent> components = new ArrayList<>();

    /** Replaces all components, keeping the given order. */
    public void replaceComponents(List<SpecimenComponent> newComponents) {
        components.clear();
        for (int i = 0; i < newComponents.size(); i++) {
            SpecimenComponent component = newComponents.get(i);
            component.setSpecimen(this);
            component.setPosition(i);
            components.add(component);
        }
    }

    /** The component that defines the specimen's type and family: the first HOST, else the first component. */
    public SpecimenComponent primaryComponent() {
        return components.stream().filter(c -> c.getRole() == ComponentRole.HOST).findFirst()
                .orElse(components.isEmpty() ? null : components.getFirst());
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMarketName() { return marketName; }
    public void setMarketName(String marketName) { this.marketName = marketName; }
    public SpecimenForm getForm() { return form; }
    public void setForm(SpecimenForm form) { this.form = form; }
    public SpecimenNature getNature() { return nature; }
    public void setNature(SpecimenNature nature) { this.nature = nature; }
    public String getTreatmentNotes() { return treatmentNotes; }
    public void setTreatmentNotes(String treatmentNotes) { this.treatmentNotes = treatmentNotes; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }
    public String getLuster() { return luster; }
    public void setLuster(String luster) { this.luster = luster; }
    public String getTransparency() { return transparency; }
    public void setTransparency(String transparency) { this.transparency = transparency; }
    public String getStreak() { return streak; }
    public void setStreak(String streak) { this.streak = streak; }
    public BigDecimal getHardnessMin() { return hardnessMin; }
    public void setHardnessMin(BigDecimal hardnessMin) { this.hardnessMin = hardnessMin; }
    public BigDecimal getHardnessMax() { return hardnessMax; }
    public void setHardnessMax(BigDecimal hardnessMax) { this.hardnessMax = hardnessMax; }
    public String getCleavage() { return cleavage; }
    public void setCleavage(String cleavage) { this.cleavage = cleavage; }
    public String getFracture() { return fracture; }
    public void setFracture(String fracture) { this.fracture = fracture; }
    public String getCrystalHabit() { return crystalHabit; }
    public void setCrystalHabit(String crystalHabit) { this.crystalHabit = crystalHabit; }
    public BigDecimal getSpecificGravity() { return specificGravity; }
    public void setSpecificGravity(BigDecimal specificGravity) { this.specificGravity = specificGravity; }
    public List<String> getSpecialProperties() { return specialProperties; }
    public void setSpecialProperties(List<String> specialProperties) { this.specialProperties = specialProperties; }
    public List<String> getOpticalEffects() { return opticalEffects; }
    public void setOpticalEffects(List<String> opticalEffects) { this.opticalEffects = opticalEffects; }
    public String getInclusions() { return inclusions; }
    public void setInclusions(String inclusions) { this.inclusions = inclusions; }
    public BigDecimal getWeightG() { return weightG; }
    public void setWeightG(BigDecimal weightG) { this.weightG = weightG; }
    public BigDecimal getLengthMm() { return lengthMm; }
    public void setLengthMm(BigDecimal lengthMm) { this.lengthMm = lengthMm; }
    public BigDecimal getWidthMm() { return widthMm; }
    public void setWidthMm(BigDecimal widthMm) { this.widthMm = widthMm; }
    public BigDecimal getHeightMm() { return heightMm; }
    public void setHeightMm(BigDecimal heightMm) { this.heightMm = heightMm; }
    public String getOtherObservations() { return otherObservations; }
    public void setOtherObservations(String otherObservations) { this.otherObservations = otherObservations; }
    public String getLocality() { return locality; }
    public void setLocality(String locality) { this.locality = locality; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public AcquisitionType getAcquisitionType() { return acquisitionType; }
    public void setAcquisitionType(AcquisitionType acquisitionType) { this.acquisitionType = acquisitionType; }
    public String getAcquiredFrom() { return acquiredFrom; }
    public void setAcquiredFrom(String acquiredFrom) { this.acquiredFrom = acquiredFrom; }
    public String getAcquiredCountry() { return acquiredCountry; }
    public void setAcquiredCountry(String acquiredCountry) { this.acquiredCountry = acquiredCountry; }
    public Integer getAcquiredYear() { return acquiredYear; }
    public void setAcquiredYear(Integer acquiredYear) { this.acquiredYear = acquiredYear; }
    public Integer getAcquiredMonth() { return acquiredMonth; }
    public void setAcquiredMonth(Integer acquiredMonth) { this.acquiredMonth = acquiredMonth; }
    public Integer getAcquiredDay() { return acquiredDay; }
    public void setAcquiredDay(Integer acquiredDay) { this.acquiredDay = acquiredDay; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPrivateNotes() { return privateNotes; }
    public void setPrivateNotes(String privateNotes) { this.privateNotes = privateNotes; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<SpecimenComponent> getComponents() { return components; }
}
