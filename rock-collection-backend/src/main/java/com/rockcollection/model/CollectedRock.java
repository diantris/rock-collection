package com.rockcollection.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.rockcollection.model.RockGroupProperties;

@Entity
@Table(name = "collected_rocks")
public class CollectedRock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "rockName is required")
    @Size(min = 1, message = "rockName cannot be empty")
    @Column(name = "rock_name", nullable = false)
    private String rockName;

    @Column(name = "market_name")
    private String marketName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @NotNull(message = "group is required")
    private RockGroupProperties group;

    private String origin;
    private String notes;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRockName() { return rockName; }
    public void setRockName(String rockName) { this.rockName = rockName; }
    public String getMarketName() { return marketName; }
    public void setMarketName(String marketName) { this.marketName = marketName; }
    public RockGroupProperties getGroup() { return group; }
    public void setGroup(RockGroupProperties group) { this.group = group; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
