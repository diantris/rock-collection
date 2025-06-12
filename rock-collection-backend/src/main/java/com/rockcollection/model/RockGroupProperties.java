package com.rockcollection.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

@Entity
@Table(name = "rock_group_properties")
public class RockGroupProperties {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "groupName is required")
    @Size(min = 1, message = "groupName cannot be empty")
    @Column(name = "group_name", nullable = false)
    private String groupName;
    private String family;
    private String type;
    @Column(name = "mohs_hardness")
    private String mohsHardness;
    private String color;
    private String streak;
    private String luster;
    @Column(name = "cleavage_fracture")
    private String cleavageFracture;
    @Column(name = "crystal_form")
    private String crystalForm;
    private String density;
    private String transparency;
    private String magnetism;
    @Column(name = "notable_characteristics")
    private String notableCharacteristics;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getFamily() { return family; }
    public void setFamily(String family) { this.family = family; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMohsHardness() { return mohsHardness; }
    public void setMohsHardness(String mohsHardness) { this.mohsHardness = mohsHardness; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getStreak() { return streak; }
    public void setStreak(String streak) { this.streak = streak; }
    public String getLuster() { return luster; }
    public void setLuster(String luster) { this.luster = luster; }
    public String getCleavageFracture() { return cleavageFracture; }
    public void setCleavageFracture(String cleavageFracture) { this.cleavageFracture = cleavageFracture; }
    public String getCrystalForm() { return crystalForm; }
    public void setCrystalForm(String crystalForm) { this.crystalForm = crystalForm; }
    public String getDensity() { return density; }
    public void setDensity(String density) { this.density = density; }
    public String getTransparency() { return transparency; }
    public void setTransparency(String transparency) { this.transparency = transparency; }
    public String getMagnetism() { return magnetism; }
    public void setMagnetism(String magnetism) { this.magnetism = magnetism; }
    public String getNotableCharacteristics() { return notableCharacteristics; }
    public void setNotableCharacteristics(String notableCharacteristics) { this.notableCharacteristics = notableCharacteristics; }
}
