// RockGroupPropertiesRepository.java - JPA repository for RockGroupProperties entity
package com.rockcollection.repository;

import com.rockcollection.model.RockGroupProperties;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * RockGroupPropertiesRepository interface for RockGroupProperties entity.
 * This interface extends JpaRepository to provide CRUD operations for RockGroupProperties entity.
 */
public interface RockGroupPropertiesRepository extends JpaRepository<RockGroupProperties, Long> {
    // Custom query methods can be added here if needed
}

