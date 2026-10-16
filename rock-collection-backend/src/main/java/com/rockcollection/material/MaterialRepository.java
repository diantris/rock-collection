// MaterialRepository.java - JPA repository for Material
package com.rockcollection.material;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findAll(Sort sort);

    Optional<Material> findByNameIgnoreCase(String name);
}
