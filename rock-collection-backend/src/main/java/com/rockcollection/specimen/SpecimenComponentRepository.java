// SpecimenComponentRepository.java - JPA repository for SpecimenComponent
package com.rockcollection.specimen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SpecimenComponentRepository extends JpaRepository<SpecimenComponent, Long> {
    /** How many specimens use a material (a specimen listing it twice, e.g. as host and inclusion, counts once). */
    interface MaterialUsage {
        Long getMaterialId();
        long getSpecimens();
    }

    /** Specimens per material, for every material that's in use. */
    @Query("select c.material.id as materialId, count(distinct c.specimen.id) as specimens from SpecimenComponent c group by c.material.id")
    List<MaterialUsage> countSpecimensPerMaterial();

    /** Number of specimens that use the given material. */
    @Query("select count(distinct c.specimen.id) from SpecimenComponent c where c.material.id = :materialId")
    long countSpecimensUsing(Long materialId);
}
