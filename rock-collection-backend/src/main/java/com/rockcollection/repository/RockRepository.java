// RockRepository.java - Custom repository for advanced rock queries and data mapping
package com.rockcollection.repository;

import com.rockcollection.model.CollectedRock;
import com.rockcollection.model.RockGroupProperties;
import com.rockcollection.repository.CollectedRockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class RockRepository {

    @Autowired
    private CollectedRockRepository collectedRockRepository; // JPA repository for CollectedRock

    /**
     * Fetch a paginated list of rocks with selected fields mapped to a list of maps.
     * @param page Page number
     * @return List of rocks as maps
     */
    public List<Map<String, Object>> fetchRocks(int page) {
        int pageSize = 10;
        var rocks = collectedRockRepository.findAll(PageRequest.of(page, pageSize)).getContent();
        List<Map<String, Object>> result = new ArrayList<>();
        for (CollectedRock rock : rocks) {
            Map<String, Object> map = new HashMap<>();
            map.put("name", rock.getRockName());
            map.put("market_name", rock.getMarketName());
            map.put("group_name", rock.getGroup() != null ? rock.getGroup().getGroupName() : null);
            map.put("origin", rock.getOrigin());
            result.add(map);
        }
        return result;
    }

    /**
     * Fetch a single rock by ID with detailed mapping.
     * @param id Rock ID
     * @return Optional map of rock details
     */
    public Optional<Map<String, Object>> fetchRockById(Long id) {
