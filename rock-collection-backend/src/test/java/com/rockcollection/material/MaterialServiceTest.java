package com.rockcollection.material;

import com.rockcollection.common.ConflictException;
import com.rockcollection.specimen.SpecimenComponentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

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
    void delete_materialInUse_conflicts() {
        when(materialRepository.findById(1L)).thenReturn(Optional.of(material(1L, "Quartz")));
        when(componentRepository.countByMaterialId(1L)).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(1L)).isInstanceOf(ConflictException.class);
        verify(materialRepository, never()).delete(any());
    }

    @Test
    void delete_unusedMaterial_deletes() {
        Material quartz = material(1L, "Quartz");
        when(materialRepository.findById(1L)).thenReturn(Optional.of(quartz));
        when(componentRepository.countByMaterialId(1L)).thenReturn(0L);

        service.delete(1L);

        verify(materialRepository).delete(quartz);
    }

    private static Material material(Long id, String name) {
        Material m = new Material();
        m.setId(id);
        m.setName(name);
        m.setCategory(MaterialCategory.MINERAL);
        return m;
    }
}
