// MaterialDto.java - API representations of a material
package com.rockcollection.material;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class MaterialDto {
    private MaterialDto() {}

    /** Material as returned by the API. */
    public record Response(
            Long id, String name, MaterialCategory category, MaterialFamily family, String mineralGroup,
            CrystalSystem crystalSystem, String formula, String mindatUrl, String description) {
        public static Response from(Material m) {
            return new Response(m.getId(), m.getName(), m.getCategory(), m.getFamily(), m.getMineralGroup(),
                    m.getCrystalSystem(), m.getFormula(), m.getMindatUrl(), m.getDescription());
        }
    }

    /** Body for creating or updating a material. Only name and category are required. */
    public record Request(
            @NotBlank(message = "name is required") @Size(max = 255) String name,
            @NotNull(message = "category is required") MaterialCategory category,
            MaterialFamily family,
            @Size(max = 255) String mineralGroup,
            CrystalSystem crystalSystem,
            @Size(max = 255) String formula,
            @Size(max = 512) String mindatUrl,
            String description) {
    }
}
