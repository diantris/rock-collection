// SpecimenRepository.java - JPA repository for Specimen
package com.rockcollection.specimen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpecimenRepository extends JpaRepository<Specimen, Long> {
    /** Every tag used on any specimen, alphabetically (for autocomplete). */
    @Query(value = "SELECT DISTINCT t FROM specimen, unnest(tags) AS t ORDER BY t", nativeQuery = true)
    List<String> findAllTags();

    /** The specimens that appear on the public site, by number: marked public and still in the collection. */
    List<Specimen> findByPublishedTrueAndGoneFalseOrderByIdAsc();

    long countByPublishedTrueAndGoneFalse();

    /** Specimens no longer in the collection (never published). */
    long countByGoneTrue();

    /**
     * Shows every specimen on the public site; returns how many changed. Gone ones keep their switch as it was,
     * so unmarking one restores it unchanged.
     */
    @Modifying
    @Query("UPDATE Specimen s SET s.published = true WHERE s.published = false AND s.gone = false")
    int publishAll();
}
