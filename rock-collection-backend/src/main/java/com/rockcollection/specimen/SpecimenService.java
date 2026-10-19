// SpecimenService.java - Business logic for specimens
package com.rockcollection.specimen;

import com.rockcollection.common.BadRequestException;
import com.rockcollection.common.NotFoundException;
import com.rockcollection.common.PageResponse;
import com.rockcollection.material.MaterialService;
import com.rockcollection.photo.PhotoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class SpecimenService {

    /** Page size limit, so a single request can't load the whole collection at once. */
    static final int MAX_PAGE_SIZE = 100;

    /** Currency assumed when a price is given without one. */
    static final String DEFAULT_CURRENCY = "PLN";

    /** Sort keys accepted by the API, mapped to entity properties. */
    static final Map<String, String> SORTABLE = Map.ofEntries(
            Map.entry("id", "id"),
            Map.entry("name", "name"),
            Map.entry("marketName", "marketName"),
            Map.entry("form", "form"),
            Map.entry("nature", "nature"),
            Map.entry("country", "country"),
            Map.entry("acquisitionType", "acquisitionType"),
            Map.entry("acquiredFrom", "acquiredFrom"),
            Map.entry("acquiredCountry", "acquiredCountry"),
            Map.entry("acquiredYear", "acquiredYear"),
            Map.entry("price", "price"),
            Map.entry("createdAt", "createdAt"),
            Map.entry("updatedAt", "updatedAt"));

    private final SpecimenRepository specimenRepository;
    private final MaterialService materialService;
    private final PhotoService photoService;

    public SpecimenService(SpecimenRepository specimenRepository, MaterialService materialService, PhotoService photoService) {
        this.specimenRepository = specimenRepository;
        this.materialService = materialService;
        this.photoService = photoService;
    }

    /**
     * One page of specimens.
     * @param sortKey one of {@link #SORTABLE}; unknown keys fall back to id
     */
    @Transactional(readOnly = true)
    public PageResponse<SpecimenDto.Summary> findPage(int page, int size, String sortKey, Sort.Direction direction) {
        String property = SORTABLE.getOrDefault(sortKey, "id");
        // Secondary sort on id keeps paging stable when many rows share a value (or are null)
        Sort sort = Sort.by(new Sort.Order(direction, property).nullsLast(), Sort.Order.asc("id"));
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE), sort);
        Page<Specimen> result = specimenRepository.findAll(pageRequest);
        Map<Long, Long> thumbnails = photoService.thumbnailVersions(result.getContent().stream().map(Specimen::getId).toList());
        return PageResponse.from(result, s -> SpecimenDto.Summary.from(s, thumbnails.get(s.getId())));
    }

    @Transactional(readOnly = true)
    public SpecimenDto.Detail findById(Long id) {
        return SpecimenDto.Detail.from(get(id));
    }

    /** All tags in use, for autocomplete. */
    @Transactional(readOnly = true)
    public List<String> findAllTags() {
        return specimenRepository.findAllTags();
    }

    public SpecimenDto.Detail create(SpecimenDto.Request request) {
        Specimen specimen = new Specimen();
        apply(specimen, request);
        return SpecimenDto.Detail.from(specimenRepository.saveAndFlush(specimen));
    }

    public SpecimenDto.Detail update(Long id, SpecimenDto.Request request) {
        Specimen specimen = get(id);
        apply(specimen, request);
        return SpecimenDto.Detail.from(specimenRepository.saveAndFlush(specimen));
    }

    /** Also removes the specimen's photo files from the Pages repo. */
    public void delete(Long id) {
        Specimen specimen = get(id);
        photoService.deleteAllFiles(id);
        specimenRepository.delete(specimen);
    }

    private Specimen get(Long id) {
        return specimenRepository.findById(id).orElseThrow(() -> new NotFoundException("Specimen", id));
    }

    /** Copies request fields onto the entity. Blank strings are stored as null so they show as "unknown". */
    private void apply(Specimen s, SpecimenDto.Request r) {
        validateAcquiredDate(r.acquiredYear(), r.acquiredMonth(), r.acquiredDay());

        s.setName(r.name().trim());
        s.setMarketName(blankToNull(r.marketName()));
        s.setForm(r.form());
        s.setNature(r.nature());
        s.setTreatmentNotes(blankToNull(r.treatmentNotes()));

        s.setColor(blankToNull(r.color()));
        s.setSecondaryColor(blankToNull(r.secondaryColor()));
        s.setLuster(blankToNull(r.luster()));
        s.setTransparency(blankToNull(r.transparency()));
        s.setStreak(blankToNull(r.streak()));
        applyHardness(s, r.hardnessMin(), r.hardnessMax());
        s.setCleavage(blankToNull(r.cleavage()));
        s.setFracture(blankToNull(r.fracture()));
        s.setCrystalHabit(blankToNull(r.crystalHabit()));
        s.setSpecificGravity(r.specificGravity());
        s.setSpecialProperties(enumNames(r.specialProperties()));
        s.setOpticalEffects(enumNames(r.opticalEffects()));
        s.setInclusions(blankToNull(r.inclusions()));
        s.setWeightG(r.weightG());
        s.setLengthMm(r.lengthMm());
        s.setWidthMm(r.widthMm());
        s.setHeightMm(r.heightMm());
        s.setOtherObservations(blankToNull(r.otherObservations()));

        s.setLocality(blankToNull(r.locality()));
        s.setCountry(blankToNull(r.country()));
        s.setAcquisitionType(r.acquisitionType());
        s.setAcquiredFrom(blankToNull(r.acquiredFrom()));
        s.setAcquiredCountry(blankToNull(r.acquiredCountry()));
        s.setAcquiredYear(r.acquiredYear());
        s.setAcquiredMonth(r.acquiredMonth());
        s.setAcquiredDay(r.acquiredDay());
        s.setPrice(r.price());
        String currency = blankToNull(r.currency());
        s.setCurrency(currency == null && r.price() != null ? DEFAULT_CURRENCY : currency);

        s.setTags(normalizeTags(r.tags()));
        s.setDescription(blankToNull(r.description()));
        s.setPrivateNotes(blankToNull(r.privateNotes()));
        s.setPublished(r.published() == null || r.published()); // shown on the public site unless switched off
        s.replaceComponents(toComponents(r.components()));
    }

    /** A single value fills both ends of the range; a reversed range is swapped. */
    private static void applyHardness(Specimen s, BigDecimal min, BigDecimal max) {
        if (min == null) min = max;
        if (max == null) max = min;
        if (min != null && min.compareTo(max) > 0) {
            BigDecimal tmp = min; min = max; max = tmp;
        }
        s.setHardnessMin(min);
        s.setHardnessMax(max);
    }

    /** Partial dates are fine ("2015", "June 2015"), but a full date must exist (no 31 February). */
    private static void validateAcquiredDate(Integer year, Integer month, Integer day) {
        if (day != null && month == null) throw new BadRequestException("acquiredDay requires acquiredMonth");
        if (year != null && month != null && day != null) {
            try {
                LocalDate.of(year, month, day);
            } catch (DateTimeException e) {
                throw new BadRequestException("acquired date " + year + "-" + month + "-" + day + " does not exist");
            }
        }
    }

    /** Trims tags, drops blanks and case-insensitive duplicates, keeping the first spelling. */
    static List<String> normalizeTags(List<String> tags) {
        if (tags == null) return new ArrayList<>();
        Map<String, String> unique = new LinkedHashMap<>();
        for (String tag : tags) {
            if (tag == null || tag.isBlank()) continue;
            String trimmed = tag.trim();
            unique.putIfAbsent(trimmed.toLowerCase(Locale.ROOT), trimmed);
        }
        return new ArrayList<>(unique.values());
    }

    private static <E extends Enum<E>> List<String> enumNames(Set<E> values) {
        if (values == null) return new ArrayList<>();
        return values.stream().map(Enum::name).sorted().collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    private List<SpecimenComponent> toComponents(List<SpecimenDto.ComponentRequest> requests) {
        if (requests == null) return List.of();
        return requests.stream()
                .map(c -> new SpecimenComponent(
                        materialService.get(c.materialId()),
                        c.role() != null ? c.role() : ComponentRole.HOST,
                        c.certainty() != null ? c.certainty() : IdentificationCertainty.TENTATIVE))
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
