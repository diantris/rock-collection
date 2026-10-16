// SpecimenDto.java - API representations of specimens and their components
package com.rockcollection.specimen;

import com.rockcollection.material.CrystalSystem;
import com.rockcollection.material.Material;
import com.rockcollection.material.MaterialCategory;
import com.rockcollection.material.MaterialFamily;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class SpecimenDto {
    private SpecimenDto() {}

    /** One material within a specimen, with the material's classification, as returned by the API. */
    public record Component(
            Long materialId, String materialName, MaterialCategory category, MaterialFamily family,
            String mineralGroup, CrystalSystem crystalSystem, ComponentRole role, IdentificationCertainty certainty) {
        static Component from(SpecimenComponent c) {
            Material m = c.getMaterial();
            return new Component(m.getId(), m.getName(), m.getCategory(), m.getFamily(),
                    m.getMineralGroup(), m.getCrystalSystem(), c.getRole(), c.getCertainty());
        }
    }

    /** One material within a specimen, as sent by the client. Role defaults to HOST, certainty to TENTATIVE. */
    public record ComponentRequest(
            @NotNull(message = "materialId is required") Long materialId,
            ComponentRole role,
            IdentificationCertainty certainty) {
    }

    /**
     * Row in the paginated specimen table. {@code type} and {@code family} come from the primary component
     * (first HOST, else first component) and are null for unidentified specimens.
     */
    public record Summary(
            Long id, String name, String marketName, List<Component> components,
            MaterialCategory type, MaterialFamily family,
            SpecimenForm form, SpecimenNature nature, String country,
            AcquisitionType acquisitionType, String acquiredFrom, String acquiredCountry, Integer acquiredYear,
            BigDecimal price, String currency, List<String> tags, boolean published) {
        static Summary from(Specimen s) {
            SpecimenComponent primary = s.primaryComponent();
            return new Summary(s.getId(), s.getName(), s.getMarketName(),
                    s.getComponents().stream().map(Component::from).toList(),
                    primary != null ? primary.getMaterial().getCategory() : null,
                    primary != null ? primary.getMaterial().getFamily() : null,
                    s.getForm(), s.getNature(), s.getCountry(),
                    s.getAcquisitionType(), s.getAcquiredFrom(), s.getAcquiredCountry(), s.getAcquiredYear(),
                    s.getPrice(), s.getCurrency(), List.copyOf(s.getTags()), s.isPublished());
        }
    }

    /** Full specimen, including private fields. */
    public record Detail(
            Long id, String name, String marketName,
            SpecimenForm form, SpecimenNature nature, String treatmentNotes,
            List<Component> components,
            String color, String secondaryColor, String luster, String transparency, String streak,
            BigDecimal hardnessMin, BigDecimal hardnessMax, String cleavage, String fracture, String crystalHabit,
            BigDecimal specificGravity, Set<SpecialProperty> specialProperties, Set<OpticalEffect> opticalEffects,
            String inclusions, BigDecimal weightG, BigDecimal lengthMm, BigDecimal widthMm, BigDecimal heightMm,
            String otherObservations,
            String locality, String country,
            AcquisitionType acquisitionType, String acquiredFrom, String acquiredCountry,
            Integer acquiredYear, Integer acquiredMonth, Integer acquiredDay, BigDecimal price, String currency,
            List<String> tags, String description, String privateNotes,
            boolean published, Instant createdAt, Instant updatedAt) {
        static Detail from(Specimen s) {
            return new Detail(s.getId(), s.getName(), s.getMarketName(),
                    s.getForm(), s.getNature(), s.getTreatmentNotes(),
                    s.getComponents().stream().map(Component::from).toList(),
                    s.getColor(), s.getSecondaryColor(), s.getLuster(), s.getTransparency(), s.getStreak(),
                    s.getHardnessMin(), s.getHardnessMax(), s.getCleavage(), s.getFracture(), s.getCrystalHabit(),
                    s.getSpecificGravity(),
                    toEnumSet(s.getSpecialProperties(), SpecialProperty::valueOf),
                    toEnumSet(s.getOpticalEffects(), OpticalEffect::valueOf),
                    s.getInclusions(), s.getWeightG(), s.getLengthMm(), s.getWidthMm(), s.getHeightMm(),
                    s.getOtherObservations(),
                    s.getLocality(), s.getCountry(),
                    s.getAcquisitionType(), s.getAcquiredFrom(), s.getAcquiredCountry(),
                    s.getAcquiredYear(), s.getAcquiredMonth(), s.getAcquiredDay(), s.getPrice(), s.getCurrency(),
                    List.copyOf(s.getTags()), s.getDescription(), s.getPrivateNotes(),
                    s.isPublished(), s.getCreatedAt(), s.getUpdatedAt());
        }

        private static <E extends Enum<E>> Set<E> toEnumSet(List<String> names, Function<String, E> parse) {
            return names.stream().map(parse).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        }
    }

    /**
     * Body for creating or updating a specimen. Only the name is required.
     * A single hardness value may be sent as either hardnessMin or hardnessMax.
     */
    public record Request(
            @NotBlank(message = "name is required") @Size(max = 255) String name,
            @Size(max = 255) String marketName,
            SpecimenForm form, SpecimenNature nature, String treatmentNotes,
            List<@Valid ComponentRequest> components,
            @Size(max = 255) String color, @Size(max = 255) String secondaryColor,
            @Size(max = 255) String luster, @Size(max = 255) String transparency, @Size(max = 255) String streak,
            @DecimalMin("1") @DecimalMax("10") @Digits(integer = 2, fraction = 1) BigDecimal hardnessMin,
            @DecimalMin("1") @DecimalMax("10") @Digits(integer = 2, fraction = 1) BigDecimal hardnessMax,
            @Size(max = 255) String cleavage, @Size(max = 255) String fracture, @Size(max = 255) String crystalHabit,
            @Positive @Digits(integer = 3, fraction = 2) BigDecimal specificGravity,
            Set<SpecialProperty> specialProperties, Set<OpticalEffect> opticalEffects,
            String inclusions,
            @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal weightG,
            @PositiveOrZero @Digits(integer = 7, fraction = 1) BigDecimal lengthMm,
            @PositiveOrZero @Digits(integer = 7, fraction = 1) BigDecimal widthMm,
            @PositiveOrZero @Digits(integer = 7, fraction = 1) BigDecimal heightMm,
            String otherObservations,
            @Size(max = 512) String locality, @Size(max = 255) String country,
            AcquisitionType acquisitionType, @Size(max = 255) String acquiredFrom, @Size(max = 255) String acquiredCountry,
            @Min(1900) @Max(2100) Integer acquiredYear, @Min(1) @Max(12) Integer acquiredMonth, @Min(1) @Max(31) Integer acquiredDay,
            @PositiveOrZero @Digits(integer = 8, fraction = 2) BigDecimal price,
            @Pattern(regexp = "([A-Z]{3})?", message = "currency must be a 3-letter ISO code, e.g. PLN") String currency,
            List<@Size(max = 64) String> tags,
            String description, String privateNotes,
            Boolean published) {
    }
}
