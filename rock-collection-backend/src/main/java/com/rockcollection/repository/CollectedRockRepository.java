// CollectedRockRepository.java - JPA repository for CollectedRock entity
package com.rockcollection.repository;

import com.rockcollection.model.CollectedRock;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CollectedRockRepository interface for CollectedRock entity.
 * This interface extends JpaRepository to provide CRUD operations for CollectedRock entity.
 */
public interface CollectedRockRepository extends JpaRepository<CollectedRock, Long> {
    // Custom query methods can be added here if needed
}
// End of CollectedRockRepository.java
