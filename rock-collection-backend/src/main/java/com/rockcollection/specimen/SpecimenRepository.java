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

    /** The specimens that appear on the public site, by number. */
    List<Specimen> findByPublishedTrueOrderByIdAsc();

    long countByPublishedTrue();

    /** Shows every specimen on the public site; returns how many changed. */
    @Modifying
    @Query("UPDATE Specimen s SET s.published = true WHERE s.published = false")
    int publishAll();
}
