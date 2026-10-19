// SpecimenThumbnailRepository.java - Spring Data repository for table thumbnails
package com.rockcollection.photo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface SpecimenThumbnailRepository extends JpaRepository<SpecimenThumbnail, Long> {

    /** Which of these specimens have a thumbnail, and since when, without loading the image bytes. */
    @Query("SELECT new com.rockcollection.photo.ThumbnailVersion(t.specimenId, t.updatedAt) "
            + "FROM SpecimenThumbnail t WHERE t.specimenId IN :specimenIds")
    List<ThumbnailVersion> findVersions(Collection<Long> specimenIds);
}
