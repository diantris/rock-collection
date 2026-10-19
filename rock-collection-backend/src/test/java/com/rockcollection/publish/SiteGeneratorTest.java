package com.rockcollection.publish;

import com.rockcollection.material.Material;
import com.rockcollection.material.MaterialCategory;
import com.rockcollection.material.MaterialFamily;
import com.rockcollection.photo.SpecimenPhoto;
import com.rockcollection.specimen.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class SiteGeneratorTest {
    private static final Set<PublishField> DEFAULTS = EnumSet.copyOf(
            Arrays.stream(PublishField.values()).filter(PublishField::includedByDefault).toList());

    private final SiteGenerator generator = new SiteGenerator();

    private static Specimen specimen(long id, String name) {
        Specimen s = new Specimen();
        ReflectionTestUtils.setField(s, "id", id);
        s.setName(name);
        return s;
    }

    /** A specimen with every field filled in, including the private ones. */
    private static Specimen fullSpecimen() {
        Specimen s = specimen(7, "Scrap-bin find");
        s.setMarketName("Unknown green");
        s.setForm(SpecimenForm.ROUGH);
        s.setColor("green");
        s.setSecondaryColor("purple");
        s.setHardnessMin(new BigDecimal("6.0"));
        s.setHardnessMax(new BigDecimal("6.5"));
        s.setSpecificGravity(new BigDecimal("2.550"));
        s.setWeightG(new BigDecimal("41.3"));
        s.setLengthMm(new BigDecimal("42"));
        s.setWidthMm(new BigDecimal("30"));
        s.setOpticalEffects(List.of("IRIDESCENCE"));
        s.setLocality("Lower Silesia");
        s.setCountry("Poland");
        s.setAcquisitionType(AcquisitionType.BOUGHT);
        s.setAcquiredFrom("Secret Seller Ltd");
        s.setAcquiredYear(2024);
        s.setAcquiredMonth(5);
        s.setPrice(new BigDecimal("1.00"));
        s.setCurrency("PLN");
        s.setTags(List.of("gift-from-mum"));
        s.setDescription("Found in a scrap box.\n\nHas a tiny geode.");
        s.setPrivateNotes("PRIVATE NOTE never to be published");
        Material rhyolite = new Material();
        rhyolite.setName("Rhyolite");
        rhyolite.setCategory(MaterialCategory.ROCK);
        rhyolite.setFamily(MaterialFamily.IGNEOUS);
        rhyolite.setMindatUrl("https://www.mindat.org/min-3417.html");
        s.replaceComponents(List.of(new SpecimenComponent(rhyolite, ComponentRole.HOST, IdentificationCertainty.TENTATIVE)));
        return s;
    }

    private static SpecimenPhoto photo(long specimenId, String name, int position) {
        return new SpecimenPhoto(specimenId, "photos/%d/%s.jpg".formatted(specimenId, name), position, 1600, 1200);
    }

    private Map<String, String> generate(Set<PublishField> fields, List<Specimen> specimens, Map<Long, List<SpecimenPhoto>> photos) {
        Map<String, String> pages = new TreeMap<>();
        generator.generate(new SiteGenerator.Content("Hello experts.\n\nSecond paragraph.", fields, specimens, photos))
                .forEach((path, bytes) -> pages.put(path, new String(bytes, StandardCharsets.UTF_8)));
        return pages;
    }

    @Test
    void defaultFields_publishTheEvidenceButNoPrivateOrAcquisitionDetails() {
        String page = generate(DEFAULTS, List.of(fullSpecimen()), Map.of()).get("specimens/7/index.html");

        assertThat(page).contains("Scrap-bin find", "Sold as “Unknown green”", "Rhyolite", "Tentative", "Igneous",
                "green, purple", "6–6.5", "2.55", "41.3 g", "42 × 30 mm", "Iridescence", "Lower Silesia, Poland",
                "<p>Found in a scrap box.</p>", "<p>Has a tiny geode.</p>", "specimen #7");
        assertThat(page).doesNotContain("Secret Seller", "Bought", "May 2024", "1 PLN", "gift-from-mum", "PRIVATE NOTE");
    }

    @Test
    void everyField_stillNeverPublishesPrivateNotes() {
        String page = generate(EnumSet.allOf(PublishField.class), List.of(fullSpecimen()), Map.of()).get("specimens/7/index.html");

        assertThat(page).contains("Secret Seller Ltd", "Bought", "May 2024", "1 PLN", "gift-from-mum");
        assertThat(page).doesNotContain("PRIVATE NOTE");
    }

    @Test
    void noFields_leavesOnlyNumberNameAndPhotos() {
        Map<String, String> site = generate(EnumSet.noneOf(PublishField.class), List.of(fullSpecimen()),
                Map.of(7L, List.of(photo(7, "a", 0))));
        String page = site.get("specimens/7/index.html");

        assertThat(page).contains("Specimen #7", "Scrap-bin find", "../../photos/7/a.jpg");
        assertThat(page).doesNotContain("Rhyolite", "Unknown green", "green", "Lower Silesia", "scrap box", "Scientific identity");
        assertThat(site.get("index.html")).doesNotContain("Rhyolite", "Unidentified only");
    }

    @Test
    void userText_isHtmlEscaped() {
        Specimen s = specimen(1, "<script>alert('x')</script> & co");
        String page = generate(DEFAULTS, List.of(s), Map.of()).get("specimens/1/index.html");

        assertThat(page).doesNotContain("<script>alert").contains("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; co");
    }

    @Test
    void onlyWebLinksBecomeMindatLinks() {
        Specimen s = fullSpecimen();
        s.getComponents().getFirst().getMaterial().setMindatUrl("javascript:alert(1)");

        assertThat(generate(DEFAULTS, List.of(s), Map.of()).get("specimens/7/index.html")).doesNotContain("javascript:");
        assertThat(generate(DEFAULTS, List.of(fullSpecimen()), Map.of()).get("specimens/7/index.html"))
                .contains("href=\"https://www.mindat.org/min-3417.html\"");
    }

    @Test
    void index_listsCardsWithSmallCoverPhotosAndFlagsUnidentified() {
        Specimen unidentified = specimen(3, "Piasek Pustyni");
        Map<String, String> site = generate(DEFAULTS, List.of(unidentified, fullSpecimen()),
                Map.of(7L, List.of(photo(7, "cover", 0), photo(7, "back", 1))));
        String index = site.get("index.html");

        assertThat(index).contains("2 specimens · 1 still unidentified", "<p class=\"intro\">Hello experts.</p>",
                "href=\"specimens/3/\"", "href=\"specimens/7/\"", "src=\"photos/7/cover-small.jpg\"",
                "Rhyolite (tentative)", "data-unidentified=\"true\"", "Unidentified only");
        assertThat(index.indexOf("Piasek Pustyni")).isLessThan(index.indexOf("Scrap-bin find")); // by number
        assertThat(index).doesNotContain("back");
    }

    @Test
    void specimenPage_galleryHasDotsOnlyForSeveralPhotos_andLinksToNeighbours() {
        Map<String, String> site = generate(DEFAULTS, List.of(specimen(3, "Three"), specimen(5, "Five"), specimen(9, "Nine")),
                Map.of(5L, List.of(photo(5, "a", 0), photo(5, "b", 1)), 9L, List.of(photo(9, "only", 0))));

        String five = site.get("specimens/5/index.html");
        assertThat(five).contains("aria-label=\"Photo 1\"", "aria-label=\"Photo 2\"", "Five, photo 2 of 2",
                "href=\"../3/\"", "href=\"../9/\"", "width=\"1600\" height=\"1200\"");
        String nine = site.get("specimens/9/index.html");
        assertThat(nine).contains("../../photos/9/only.jpg").doesNotContain("aria-label=\"Photo 1\"", "rel=\"next\"");
        assertThat(site.get("specimens/3/index.html")).contains("No photos yet").doesNotContain("rel=\"prev\"");
    }

    @Test
    void generate_containsAssetsAndIsDeterministic() {
        List<Specimen> specimens = List.of(fullSpecimen());
        Map<String, byte[]> first = generator.generate(new SiteGenerator.Content(null, DEFAULTS, specimens, Map.of()));
        Map<String, byte[]> second = generator.generate(new SiteGenerator.Content(null, DEFAULTS, specimens, Map.of()));

        assertThat(first.keySet()).containsExactly(".nojekyll", "assets/icon.svg", "assets/site.css", "assets/site.js",
                "index.html", "specimens/7/index.html");
        first.forEach((path, bytes) -> assertThat(second.get(path)).as(path).isEqualTo(bytes));
    }

    @Test
    void generatedPaths_leavePhotosAndReadmeAlone() {
        assertThat(SiteGenerator.isGenerated("index.html")).isTrue();
        assertThat(SiteGenerator.isGenerated("specimens/12/index.html")).isTrue();
        assertThat(SiteGenerator.isGenerated("photos/12/12-abc.jpg")).isFalse();
        assertThat(SiteGenerator.isGenerated("README.md")).isFalse();
    }

    @Test
    void formatting() {
        assertThat(SiteGenerator.hardness(new BigDecimal("7.0"), new BigDecimal("7"))).isEqualTo("7");
        assertThat(SiteGenerator.date(2015, null, null)).isEqualTo("2015");
        assertThat(SiteGenerator.date(2015, 6, 3)).isEqualTo("3 June 2015");
        assertThat(SiteGenerator.size(null, null, null)).isNull();
        assertThat(SiteGenerator.paragraphs("one\r\n\r\ntwo\nstill two")).containsExactly("one", "two\nstill two");
    }
}
