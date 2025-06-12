package com.rockcollection.repository;

import com.rockcollection.model.RockGroupProperties;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RockGroupPropertiesRepository extends JpaRepository<RockGroupProperties, Long> {
    // Custom query methods can be added here if needed
}

