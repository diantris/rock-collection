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
    private CollectedRockRepository collectedRockRepository;

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

    public Optional<Map<String, Object>> fetchRockById(Long id) {
        return collectedRockRepository.findById(id).map(rock -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", rock.getRockName());
            map.put("market_name", rock.getMarketName());
            map.put("origin", rock.getOrigin());
            map.put("notes", rock.getNotes());
            RockGroupProperties group = rock.getGroup();
            if (group != null) {
                Map<String, Object> groupProperties = new HashMap<>();
                groupProperties.put("group_name", group.getGroupName());
                groupProperties.put("family", group.getFamily());
                groupProperties.put("type", group.getType());
                groupProperties.put("mohs_hardness", group.getMohsHardness());
                groupProperties.put("color", group.getColor());
                groupProperties.put("streak", group.getStreak());
                groupProperties.put("luster", group.getLuster());
                groupProperties.put("cleavage_fracture", group.getCleavageFracture());
                groupProperties.put("crystal_form", group.getCrystalForm());
                groupProperties.put("density", group.getDensity());
                groupProperties.put("transparency", group.getTransparency());
                groupProperties.put("magnetism", group.getMagnetism());
                groupProperties.put("notable_characteristics", group.getNotableCharacteristics());
                map.put("group_properties", groupProperties);
            }
            return map;
        });
    }

    public CollectedRock createRock(CollectedRock rock) {
        return collectedRockRepository.save(rock);
    }

    public Optional<CollectedRock> updateRock(Long id, CollectedRock updatedRock) {
        return collectedRockRepository.findById(id).map(existing -> {
            existing.setRockName(updatedRock.getRockName());
            existing.setMarketName(updatedRock.getMarketName());
            existing.setOrigin(updatedRock.getOrigin());
            existing.setNotes(updatedRock.getNotes());
            existing.setGroup(updatedRock.getGroup());
            return collectedRockRepository.save(existing);
        });
    }

    public boolean deleteRock(Long id) {
        if (collectedRockRepository.existsById(id)) {
            collectedRockRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
