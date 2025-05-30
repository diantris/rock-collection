package com.rockcollection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class RockRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> fetchRocks(int page) {
        int pageSize = 10;
        int offset = page * pageSize;

        String query = "SELECT cr.rock_name AS name, cr.market_name AS market_name, rg.group_name AS group_name, cr.origin AS origin " +
                       "FROM collected_rocks cr " +
                       "JOIN rock_group_properties rg ON cr.group_id = rg.id " +
                       "LIMIT ? OFFSET ?";

        return jdbcTemplate.query(query, (rs, rowNum) -> {
            Map<String, Object> rock = new HashMap<>();
            rock.put("name", rs.getString("name"));
            rock.put("market_name", rs.getString("market_name"));
            rock.put("group_name", rs.getString("group_name"));
            rock.put("origin", rs.getString("origin"));
            return rock;
        }, pageSize, offset);
    }

    public Optional<Map<String, Object>> fetchRockById(Long id) {
        String query = "SELECT cr.rock_name AS name, cr.market_name AS market_name, rg.group_name AS group_name, cr.origin AS origin, cr.notes AS notes, " +
                       "rg.family AS family, rg.type AS type, rg.mohs_hardness AS mohs_hardness, rg.color AS color, rg.streak AS streak, rg.luster AS luster, " +
                       "rg.cleavage_fracture AS cleavage_fracture, rg.crystal_form AS crystal_form, rg.density AS density, rg.transparency AS transparency, rg.magnetism AS magnetism, rg.notable_characteristics AS notable_characteristics " +
                       "FROM collected_rocks cr " +
                       "JOIN rock_group_properties rg ON cr.group_id = rg.id " +
                       "WHERE cr.id = ?";

        return jdbcTemplate.query(query, (rs, rowNum) -> {
            Map<String, Object> rock = new HashMap<>();
            rock.put("name", rs.getString("name"));
            rock.put("market_name", rs.getString("market_name"));
            rock.put("origin", rs.getString("origin"));
            rock.put("notes", rs.getString("notes"));

            Map<String, Object> groupProperties = new HashMap<>();
            groupProperties.put("group_name", rs.getString("group_name"));
            groupProperties.put("family", rs.getString("family"));
            groupProperties.put("type", rs.getString("type"));
            groupProperties.put("mohs_hardness", rs.getString("mohs_hardness"));
            groupProperties.put("color", rs.getString("color"));
            groupProperties.put("streak", rs.getString("streak"));
            groupProperties.put("luster", rs.getString("luster"));
            groupProperties.put("cleavage_fracture", rs.getString("cleavage_fracture"));
            groupProperties.put("crystal_form", rs.getString("crystal_form"));
            groupProperties.put("density", rs.getString("density"));
            groupProperties.put("transparency", rs.getString("transparency"));
            groupProperties.put("magnetism", rs.getBoolean("magnetism"));
            groupProperties.put("notable_characteristics", rs.getString("notable_characteristics"));

            rock.put("group_properties", groupProperties);
            return rock;
        }, id).stream().findFirst();
    }
}
