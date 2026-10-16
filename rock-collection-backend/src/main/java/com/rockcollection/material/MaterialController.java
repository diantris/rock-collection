// MaterialController.java - REST endpoints for the reference list of materials
package com.rockcollection.material;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping
    public List<MaterialDto.Response> getAll() {
        return materialService.findAll();
    }

    @GetMapping("/{id}")
    public MaterialDto.Response getById(@PathVariable Long id) {
        return materialService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaterialDto.Response create(@Valid @RequestBody MaterialDto.Request request) {
        return materialService.create(request);
    }

    @PutMapping("/{id}")
    public MaterialDto.Response update(@PathVariable Long id, @Valid @RequestBody MaterialDto.Request request) {
        return materialService.update(id, request);
    }

    /** Returns 409 if the material is still used by a specimen. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        materialService.delete(id);
    }
}
