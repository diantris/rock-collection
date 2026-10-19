// SpecimenPhoto.java - Entity for one full-size photo; the file itself lives in the GitHub Pages repo
package com.rockcollection.photo;

import jakarta.persistence.*;

/** The app only keeps the photo's path in the Pages repo and its place in the gallery, not the image itself. */
@Entity
@Table(name = "specimen_photo")
public class SpecimenPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long specimenId;
    /** Path inside the Pages repo, e.g. {@code photos/142/142-3f9a1c2e.jpg}. */
    @Column(nullable = false)
    private String fileName;
    private String caption;
    /** 0 is the cover photo, the one the thumbnail is made from. */
    @Column(nullable = false)
    private int position;
    private Integer width;
    private Integer height;

    protected SpecimenPhoto() {}

    public SpecimenPhoto(Long specimenId, String fileName, int position, int width, int height) {
        this.specimenId = specimenId;
        this.fileName = fileName;
        this.position = position;
        this.width = width;
        this.height = height;
    }

    public Long getId() { return id; }
    public Long getSpecimenId() { return specimenId; }
    public String getFileName() { return fileName; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
}
