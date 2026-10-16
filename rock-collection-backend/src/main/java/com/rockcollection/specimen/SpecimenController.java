// SpecimenController.java - REST endpoints for specimens
package com.rockcollection.specimen;

import com.rockcollection.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/specimens")
public class SpecimenController {

    private final SpecimenService specimenService;

    public SpecimenController(SpecimenService specimenService) {
        this.specimenService = specimenService;
    }

    /**
     * Paginated list for the table, e.g. {@code /api/specimens?page=0&size=25&sort=name&direction=asc}.
     * Accepted sort keys are listed in {@link SpecimenService#SORTABLE}.
     */
    @GetMapping
    public PageResponse<SpecimenDto.Summary> getPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "asc") String direction) {
        return specimenService.findPage(page, size, sort,
                Sort.Direction.fromOptionalString(direction).orElse(Sort.Direction.ASC));
    }

    /** All tags in use, alphabetically, for autocomplete. */
    @GetMapping("/tags")
    public List<String> getTags() {
        return specimenService.findAllTags();
    }

    @GetMapping("/{id}")
    public SpecimenDto.Detail getById(@PathVariable Long id) {
        return specimenService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SpecimenDto.Detail create(@Valid @RequestBody SpecimenDto.Request request) {
        return specimenService.create(request);
    }

    @PutMapping("/{id}")
    public SpecimenDto.Detail update(@PathVariable Long id, @Valid @RequestBody SpecimenDto.Request request) {
        return specimenService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        specimenService.delete(id);
    }
}
