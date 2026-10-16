package com.rockcollection.specimen;

import com.rockcollection.common.BadRequestException;
import com.rockcollection.common.NotFoundException;
import com.rockcollection.common.PageResponse;
import com.rockcollection.material.Material;
import com.rockcollection.material.MaterialCategory;
import com.rockcollection.material.MaterialFamily;
import com.rockcollection.material.MaterialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpecimenServiceTest {
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Mock
    private SpecimenRepository specimenRepository;
    @Mock
    private MaterialService materialService;

    private SpecimenService service;

    @BeforeEach
    void setUp() {
        service = new SpecimenService(specimenRepository, materialService);
    }

    /** Builds a request from JSON so tests only mention the fields they care about. */
    private static SpecimenDto.Request request(String json) {
        return JSON.readValue(json, SpecimenDto.Request.class);
    }

    private void saveReturnsArgument() {
        when(specimenRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void create_storesBlankStringsAsNullAndAppliesComponentDefaults() {
        when(materialService.get(1L)).thenReturn(material(1L, "Quartz", MaterialCategory.MINERAL, MaterialFamily.SILICATE));
        saveReturnsArgument();

        SpecimenDto.Detail created = service.create(request("""
                {"name": "  Quartz with garnet ", "color": "  ", "components": [{"materialId": 1}]}"""));

        assertThat(created.name()).isEqualTo("Quartz with garnet");
        assertThat(created.color()).isNull();
        assertThat(created.published()).isFalse();
        assertThat(created.specialProperties()).isEmpty();
        assertThat(created.components()).singleElement().satisfies(c -> {
            assertThat(c.materialName()).isEqualTo("Quartz");
            assertThat(c.role()).isEqualTo(ComponentRole.HOST);
            assertThat(c.certainty()).isEqualTo(IdentificationCertainty.TENTATIVE);
        });
    }

    @Test
    void create_singleHardnessFillsBothEndsAndReversedRangeIsSwapped() {
        saveReturnsArgument();

        SpecimenDto.Detail single = service.create(request("{\"name\": \"A\", \"hardnessMax\": 6.5}"));
        SpecimenDto.Detail reversed = service.create(request("{\"name\": \"B\", \"hardnessMin\": 7, \"hardnessMax\": 5.5}"));

        assertThat(single.hardnessMin()).isEqualByComparingTo("6.5");
        assertThat(single.hardnessMax()).isEqualByComparingTo("6.5");
        assertThat(reversed.hardnessMin()).isEqualByComparingTo("5.5");
        assertThat(reversed.hardnessMax()).isEqualByComparingTo("7");
    }

    @Test
    void create_priceWithoutCurrencyDefaultsToPln() {
        saveReturnsArgument();

        assertThat(service.create(request("{\"name\": \"A\", \"price\": 1}")).currency()).isEqualTo("PLN");
        assertThat(service.create(request("{\"name\": \"B\", \"price\": 5, \"currency\": \"EUR\"}")).currency()).isEqualTo("EUR");
        assertThat(service.create(request("{\"name\": \"C\"}")).currency()).isNull();
    }

    @Test
    void create_keepsPropertySetsAndNormalizesTags() {
        saveReturnsArgument();

        SpecimenDto.Detail created = service.create(request("""
                {"name": "Fire agate", "specialProperties": ["FLUORESCENT", "MAGNETIC"],
                 "opticalEffects": ["IRIDESCENCE"], "tags": [" combo ", "Combo", "", "weird"]}"""));

        assertThat(created.specialProperties()).containsExactly(SpecialProperty.FLUORESCENT, SpecialProperty.MAGNETIC);
        assertThat(created.opticalEffects()).containsExactly(OpticalEffect.IRIDESCENCE);
        assertThat(created.tags()).containsExactly("combo", "weird");
    }

    @Test
    void create_rejectsImpossibleDateButAcceptsPartialDates() {
        saveReturnsArgument();

        assertThatThrownBy(() -> service.create(request("{\"name\": \"A\", \"acquiredYear\": 2023, \"acquiredMonth\": 2, \"acquiredDay\": 30}")))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.create(request("{\"name\": \"A\", \"acquiredDay\": 3}")))
                .isInstanceOf(BadRequestException.class);
        assertThat(service.create(request("{\"name\": \"B\", \"acquiredYear\": 2015}")).acquiredYear()).isEqualTo(2015);
        assertThat(service.create(request("{\"name\": \"C\", \"acquiredMonth\": 6, \"acquiredDay\": 1}")).acquiredDay()).isEqualTo(1);
    }

    @Test
    void update_replacesComponentsInGivenOrder() {
        Specimen existing = new Specimen();
        existing.setName("Old");
        existing.replaceComponents(List.of(new SpecimenComponent(
                material(9L, "Calcite", MaterialCategory.MINERAL, MaterialFamily.CARBONATE), ComponentRole.HOST, IdentificationCertainty.CONFIRMED)));
        when(specimenRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(materialService.get(1L)).thenReturn(material(1L, "Rhyolite", MaterialCategory.ROCK, MaterialFamily.IGNEOUS));
        when(materialService.get(2L)).thenReturn(material(2L, "Amethyst", MaterialCategory.MINERAL, MaterialFamily.SILICATE));
        when(specimenRepository.saveAndFlush(existing)).thenReturn(existing);

        service.update(5L, request("""
                {"name": "Scrap-bin find", "components": [
                  {"materialId": 1, "role": "HOST"}, {"materialId": 2, "role": "ASSOCIATED"}]}"""));

        assertThat(existing.getComponents()).extracting(c -> c.getMaterial().getName(), SpecimenComponent::getPosition)
                .containsExactly(tuple("Rhyolite", 0), tuple("Amethyst", 1));
    }

    @Test
    void summary_takesTypeAndFamilyFromFirstHostComponent() {
        Specimen s = new Specimen();
        s.setName("Dalmatian Stone");
        s.replaceComponents(List.of(
                new SpecimenComponent(material(1L, "Arfvedsonite", MaterialCategory.MINERAL, MaterialFamily.SILICATE), ComponentRole.ASSOCIATED, IdentificationCertainty.TENTATIVE),
                new SpecimenComponent(material(2L, "Rhyolite", MaterialCategory.ROCK, MaterialFamily.IGNEOUS), ComponentRole.HOST, IdentificationCertainty.TENTATIVE)));
        Specimen unidentified = new Specimen();
        unidentified.setName("Piasek Pustyni");

        assertThat(SpecimenDto.Summary.from(s)).extracting(SpecimenDto.Summary::type, SpecimenDto.Summary::family)
                .containsExactly(MaterialCategory.ROCK, MaterialFamily.IGNEOUS);
        assertThat(SpecimenDto.Summary.from(unidentified).type()).isNull();
    }

    @Test
    void findById_missing_throwsNotFound() {
        when(specimenRepository.findById(42L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.findById(42L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void findPage_clampsSizeAndFallsBackToIdForUnknownSortKey() {
        Page<Specimen> empty = new PageImpl<>(List.of());
        when(specimenRepository.findAll(any(Pageable.class))).thenReturn(empty);

        PageResponse<SpecimenDto.Summary> result = service.findPage(-1, 10_000, "privateNotes", Sort.Direction.DESC);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(specimenRepository).findAll(captor.capture());
        Pageable used = captor.getValue();
        assertThat(used.getPageNumber()).isZero();
        assertThat(used.getPageSize()).isEqualTo(SpecimenService.MAX_PAGE_SIZE);
        assertThat(used.getSort().getOrderFor("id")).isNotNull();
        assertThat(used.getSort().getOrderFor("privateNotes")).isNull();
        assertThat(result.content()).isEmpty();
    }

    private static Material material(Long id, String name, MaterialCategory category, MaterialFamily family) {
        Material m = new Material();
        m.setId(id);
        m.setName(name);
        m.setCategory(category);
        m.setFamily(family);
        return m;
    }
}
