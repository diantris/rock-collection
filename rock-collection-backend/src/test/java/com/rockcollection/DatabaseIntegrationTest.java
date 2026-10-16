package com.rockcollection;

import com.rockcollection.common.ConflictException;
import com.rockcollection.common.PageResponse;
import com.rockcollection.material.MaterialDto;
import com.rockcollection.material.MaterialService;
import com.rockcollection.specimen.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Sort;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Boots the whole app against a real PostgreSQL 18: runs the Flyway migrations, lets Hibernate
 * validate the entity mappings against them, and exercises queries that mocks can't (arrays, native SQL).
 * Needs Docker running.
 */
@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18");

    @Autowired
    private SpecimenService specimenService;
    @Autowired
    private MaterialService materialService;

    private Long materialId(String name) {
        return materialService.findAll().stream().filter(m -> m.name().equals(name)).findFirst().orElseThrow().id();
    }

    @Test
    void seededMaterialsCarryClassification() {
        Map<String, MaterialDto.Response> byName = materialService.findAll().stream()
                .collect(Collectors.toMap(MaterialDto.Response::name, m -> m));
        assertThat(byName.get("Kosmochlor")).satisfies(m -> {
            assertThat(m.mineralGroup()).isEqualTo("Pyroxene");
            assertThat(m.crystalSystem()).hasToString("MONOCLINIC");
        });
        assertThat(byName.get("Rhyolite").family()).hasToString("IGNEOUS");
    }

    @Test
    void specimenWithEveryKindOfFieldRoundTrips() {
        SpecimenDto.Request request = JsonMapper.builder().build().readValue("""
                {"name": "Scrap-bin find", "marketName": "Unknown green", "form": "ROUGH",
                 "components": [{"materialId": %d, "role": "HOST"}, {"materialId": %d, "role": "ASSOCIATED"}],
                 "color": "green", "secondaryColor": "purple", "hardnessMin": 6, "hardnessMax": 6.5,
                 "specificGravity": 2.55, "weightG": 41.3, "lengthMm": 42.5,
                 "specialProperties": ["FLUORESCENT"], "opticalEffects": ["IRIDESCENCE"],
                 "acquisitionType": "BOUGHT", "acquiredFrom": "Mineral fair, Kraków", "acquiredCountry": "Poland",
                 "acquiredYear": 2024, "acquiredMonth": 5, "price": 1,
                 "tags": ["combo", "weird"], "privateNotes": "1 PLN from the scrap box"}
                """.formatted(materialId("Rhyolite"), materialId("Amethyst")), SpecimenDto.Request.class);

        SpecimenDto.Detail created = specimenService.create(request);
        SpecimenDto.Detail fetched = specimenService.findById(created.id());

        assertThat(fetched.weightG()).isEqualByComparingTo("41.3");
        assertThat(fetched.hardnessMax()).isEqualByComparingTo("6.5");
        assertThat(fetched.specialProperties()).containsExactly(SpecialProperty.FLUORESCENT);
        assertThat(fetched.opticalEffects()).containsExactly(OpticalEffect.IRIDESCENCE);
        assertThat(fetched.tags()).containsExactly("combo", "weird");
        assertThat(fetched.currency()).isEqualTo("PLN");
        assertThat(fetched.createdAt()).isNotNull();
        assertThat(fetched.components()).extracting(SpecimenDto.Component::materialName).containsExactly("Rhyolite", "Amethyst");
        assertThat(specimenService.findAllTags()).contains("combo", "weird");

        PageResponse<SpecimenDto.Summary> page = specimenService.findPage(0, 25, "acquiredFrom", Sort.Direction.ASC);
        SpecimenDto.Summary summary = page.content().stream().filter(s -> s.id().equals(created.id())).findFirst().orElseThrow();
        assertThat(summary.type()).hasToString("ROCK");
        assertThat(summary.family()).hasToString("IGNEOUS");

        // Materials in use can't be deleted; once the specimen is gone, they can
        assertThatThrownBy(() -> materialService.delete(materialId("Amethyst"))).isInstanceOf(ConflictException.class);
        specimenService.delete(created.id());
        assertThat(specimenService.findPage(0, 100, "id", Sort.Direction.ASC).content())
                .extracting(SpecimenDto.Summary::id).doesNotContain(created.id());
    }

    @Test
    void nameOnlySpecimenIsFine() {
        SpecimenDto.Detail created = specimenService.create(
                JsonMapper.builder().build().readValue("{\"name\": \"Piasek Pustyni\"}", SpecimenDto.Request.class));
        assertThat(created.components()).isEmpty();
        assertThat(created.tags()).isEqualTo(List.of());
        assertThat(created.specialProperties()).isEmpty();
    }
}
