// SpecimenRepository.java - JPA repository for Specimen
package com.rockcollection.specimen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpecimenRepository extends JpaRepository<Specimen, Long> {
    /** Every tag used on any specimen, alphabetically (for autocomplete). */
    @Query(value = "SELECT DISTINCT t FROM specimen, unnest(tags) AS t ORDER BY t", nativeQuery = true)
    List<String> findAllTags();
}
