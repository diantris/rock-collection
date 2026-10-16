// MaterialService.java - Business logic for the reference list of materials
package com.rockcollection.material;

import com.rockcollection.common.ConflictException;
import com.rockcollection.common.NotFoundException;
import com.rockcollection.specimen.SpecimenComponentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MaterialService {

    private final MaterialRepository materialRepository;
    private final SpecimenComponentRepository componentRepository;

    public MaterialService(MaterialRepository materialRepository, SpecimenComponentRepository componentRepository) {
        this.materialRepository = materialRepository;
        this.componentRepository = componentRepository;
    }

    /** All materials, alphabetically. */
    @Transactional(readOnly = true)
    public List<MaterialDto.Response> findAll() {
        return materialRepository.findAll(Sort.by("name")).stream().map(MaterialDto.Response::from).toList();
    }

    @Transactional(readOnly = true)
    public MaterialDto.Response findById(Long id) {
        return MaterialDto.Response.from(get(id));
    }

    /** Creates a material; names must be unique ignoring case. */
    public MaterialDto.Response create(MaterialDto.Request request) {
        ensureNameFree(request.name(), null);
        Material material = new Material();
        apply(material, request);
        return MaterialDto.Response.from(materialRepository.save(material));
    }

    public MaterialDto.Response update(Long id, MaterialDto.Request request) {
        Material material = get(id);
        ensureNameFree(request.name(), id);
        apply(material, request);
        return MaterialDto.Response.from(material);
    }

    /** Deletes a material, refusing while any specimen still uses it. */
    public void delete(Long id) {
        Material material = get(id);
        long usages = componentRepository.countByMaterialId(id);
        if (usages > 0) {
            throw new ConflictException("Material '" + material.getName() + "' is used by " + usages + " specimen component(s)");
        }
        materialRepository.delete(material);
    }

    /** Loads a material entity or throws NotFoundException. */
    public Material get(Long id) {
        return materialRepository.findById(id).orElseThrow(() -> new NotFoundException("Material", id));
    }

    private void ensureNameFree(String name, Long ownId) {
        materialRepository.findByNameIgnoreCase(name.trim())
                .filter(existing -> !existing.getId().equals(ownId))
                .ifPresent(existing -> { throw new ConflictException("Material '" + existing.getName() + "' already exists"); });
    }

    private static void apply(Material material, MaterialDto.Request request) {
        material.setName(request.name().trim());
        material.setCategory(request.category());
        material.setFamily(request.family());
        material.setMineralGroup(blankToNull(request.mineralGroup()));
        material.setCrystalSystem(request.crystalSystem());
        material.setFormula(blankToNull(request.formula()));
        material.setMindatUrl(blankToNull(request.mindatUrl()));
        material.setDescription(blankToNull(request.description()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
