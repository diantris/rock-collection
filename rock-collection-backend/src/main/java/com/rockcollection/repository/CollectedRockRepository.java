package com.rockcollection.repository;

import com.rockcollection.model.CollectedRock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectedRockRepository extends JpaRepository<CollectedRock, Long> {
    // Custom query methods can be added here if needed
}

