// SpecimenRepository.java - JPA repository for Specimen
package com.rockcollection.specimen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpecimenRepository extends JpaRepository<Specimen, Long>, JpaSpecificationExecutor<Specimen> {
    /** Every tag used on any specimen, alphabetically (for autocomplete). */
    @Query(value = "SELECT DISTINCT t FROM specimen, unnest(tags) AS t ORDER BY t", nativeQuery = true)
    List<String> findAllTags();

    /** Every "where I got it" in use, the most recently saved first (for the form's suggestions). */
    @Query(value = """
            SELECT acquired_from FROM specimen WHERE acquired_from IS NOT NULL
            GROUP BY acquired_from ORDER BY max(coalesce(updated_at, created_at)) DESC, acquired_from""", nativeQuery = true)
    List<String> findAcquiredFromByMostRecent();

    /** What publishing exports, in the table's default order: pinned first, then by name. */
    List<Specimen> findByPublishedTrueAndGoneFalseOrderByPinnedDescNameAscIdAsc();

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
