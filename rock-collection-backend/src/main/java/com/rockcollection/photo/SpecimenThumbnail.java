// SpecimenThumbnail.java - Entity for the small table photo, stored in the database
package com.rockcollection.photo;

import jakarta.persistence.*;

import java.time.Instant;

/** In its own table, so loading specimens never loads image bytes. */
@Entity
@Table(name = "specimen_thumbnail")
public class SpecimenThumbnail {
    @Id
    private Long specimenId;

    @Column(nullable = false)
    private String contentType;
    @Column(nullable = false)
    private byte[] data; // bytea
    @Column(nullable = false)
    private Instant updatedAt;

    protected SpecimenThumbnail() {}

    public SpecimenThumbnail(Long specimenId) {
        this.specimenId = specimenId;
    }

    /** Replaces the image; the new timestamp changes the thumbnail URL, so browsers fetch it again. */
    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }

    public Long getSpecimenId() { return specimenId; }
    public String getContentType() { return contentType; }
    public byte[] getData() { return data; }
    public Instant getUpdatedAt() { return updatedAt; }
}
