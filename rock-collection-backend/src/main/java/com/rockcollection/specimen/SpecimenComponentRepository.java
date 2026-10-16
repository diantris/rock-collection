// SpecimenComponentRepository.java - JPA repository for SpecimenComponent
package com.rockcollection.specimen;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecimenComponentRepository extends JpaRepository<SpecimenComponent, Long> {
    /** Number of specimen components that use the given material. */
    long countByMaterialId(Long materialId);
}
