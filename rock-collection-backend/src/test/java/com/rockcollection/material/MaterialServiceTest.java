package com.rockcollection.material;

import com.rockcollection.common.BadRequestException;
import com.rockcollection.common.ConflictException;
import com.rockcollection.specimen.SpecimenComponentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaterialServiceTest {
    @Mock
    private MaterialRepository materialRepository;
    @Mock
    private SpecimenComponentRepository componentRepository;

    private MaterialService service;

    @BeforeEach
    void setUp() {
        service = new MaterialService(materialRepository, componentRepository);
    }

    @Test
    void create_duplicateNameIgnoringCase_conflicts() {
        Material existing = material(1L, "Quartz");
        when(materialRepository.findByNameIgnoreCase("quartz")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create(new MaterialDto.Request(" quartz ", MaterialCategory.MINERAL, null, null, null, null, null, null)))
                .isInstanceOf(ConflictException.class);
        verify(materialRepository, never()).save(any());
    }

    @Test
    void create_familyOfAnotherType_isRejected() {
        assertThatThrownBy(() -> service.create(new MaterialDto.Request(
                "Moldavite glass", MaterialCategory.MINERAL, MaterialFamily.IMPACT_GLASS, null, null, null, null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void delete_materialInUse_conflicts() {
        when(materialRepository.findById(1L)).thenReturn(Optional.of(material(1L, "Quartz")));
        when(componentRepository.countSpecimensUsing(1L)).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(1L)).isInstanceOf(ConflictException.class)
                .hasMessage("“Quartz” is still used by 3 specimens. Remove it from them first.");
        verify(materialRepository, never()).delete(any());
    }

    @Test
    void delete_unusedMaterial_deletes() {
        Material quartz = material(1L, "Quartz");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(quartz));
        when(componentRepository.countSpecimensUsing(1L)).thenReturn(0L);

        service.delete(1L);

        verify(materialRepository).delete(quartz);
    }

    @Test
    void findAll_saysHowManySpecimensUseEachMaterial() {
        when(materialRepository.findAll(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of(material(1L, "Quartz"), material(2L, "Zarinite")));
        when(componentRepository.countSpecimensPerMaterial()).thenReturn(List.of(usage(1L, 12)));

        assertThat(service.findAll()).extracting(MaterialDto.Response::name, MaterialDto.Response::specimenCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Quartz", 12L), org.assertj.core.groups.Tuple.tuple("Zarinite", 0L));
    }

    @Test
    void update_changesEverythingButKeepsTheId_andMayKeepItsOwnName() {
        Material quartz = material(1L, "Quartz");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(quartz));
        when(materialRepository.findByNameIgnoreCase("Quartz")).thenReturn(Optional.of(quartz));
        when(componentRepository.countSpecimensUsing(1L)).thenReturn(4L);

        MaterialDto.Response updated = service.update(1L, new MaterialDto.Request(" Quartz ", MaterialCategory.MINERAL,
                MaterialFamily.SILICATE, "Quartz", CrystalSystem.TRIGONAL, "SiO₂", "https://www.mindat.org/min-3337.html", " "));

        assertThat(updated).extracting(MaterialDto.Response::id, MaterialDto.Response::formula, MaterialDto.Response::specimenCount)
                .containsExactly(1L, "SiO₂", 4L);
        assertThat(quartz.getFamily()).isEqualTo(MaterialFamily.SILICATE);
        assertThat(quartz.getDescription()).isNull();
    }

    private static SpecimenComponentRepository.MaterialUsage usage(Long materialId, long specimens) {
        return new SpecimenComponentRepository.MaterialUsage() {
            public Long getMaterialId() { return materialId; }
            public long getSpecimens() { return specimens; }
        };
    }

    private static Material material(Long id, String name) {
        Material m = new Material();
        m.setId(id);
        m.setName(name);
        m.setCategory(MaterialCategory.MINERAL);
        return m;
    }
}
