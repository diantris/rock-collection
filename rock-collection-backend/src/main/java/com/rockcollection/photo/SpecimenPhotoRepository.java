// SpecimenPhotoRepository.java - Spring Data repository for photo records
package com.rockcollection.photo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecimenPhotoRepository extends JpaRepository<SpecimenPhoto, Long> {

    /** Gallery order: cover first. */
    List<SpecimenPhoto> findBySpecimenIdOrderByPositionAscIdAsc(Long specimenId);
}
