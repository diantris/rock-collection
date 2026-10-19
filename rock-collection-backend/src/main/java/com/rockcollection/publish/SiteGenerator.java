// SiteGenerator.java - Renders the public static site (HTML, CSS, JS) from specimens and the publish settings
package com.rockcollection.publish;

import com.rockcollection.material.Material;
import com.rockcollection.photo.SpecimenPhoto;
import com.rockcollection.specimen.*;
import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.StringReader;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Only fields ticked in the publish settings make it into the view models, so the templates can't leak anything
 * else. Private notes aren't a {@link PublishField} at all. Pages use relative links (the site lives under
 * /rock-collection-page/ on github.io) and contain no timestamps, so an unchanged specimen renders byte-for-byte
 * the same and isn't re-committed.
 */
@Component
public class SiteGenerator {

    /** Copied to the site unchanged, from src/main/resources/site/assets. */
    static final List<String> ASSETS = List.of("assets/site.css", "assets/site.js", "assets/icon.svg");

    private final Mustache.Compiler compiler;
    private final Template indexTemplate;
    private final Template specimenTemplate;

    public SiteGenerator() {
        // Partials ({{> head}}) come from site/_head.mustache; variables that are null render as empty text
        compiler = Mustache.compiler().nullValue("").withLoader(name -> new StringReader(text("site/_" + name + ".mustache")));
        indexTemplate = compiler.compile(text("site/index.mustache"));
        specimenTemplate = compiler.compile(text("site/specimen.mustache"));
    }

    /** What to publish; {@code photos} maps a specimen id to its photos, cover first. */
    public record Content(String intro, Set<PublishField> fields, List<Specimen> specimens, Map<Long, List<SpecimenPhoto>> photos) {}

    /** @return repo path → file content, for every generated file */
    public Map<String, byte[]> generate(Content content) {
        Map<String, byte[]> files = new TreeMap<>();
        files.put(".nojekyll", new byte[0]); // serve files as they are, without a Jekyll build
        for (String asset : ASSETS) files.put(asset, bytes("site/" + asset));

        List<Specimen> specimens = content.specimens();
        Set<PublishField> fields = content.fields();
        files.put("index.html", render(indexTemplate, index(content)));
        for (int i = 0; i < specimens.size(); i++) {
            Specimen s = specimens.get(i);
            SpecimenPage page = specimenPage(s, fields, content.photos().getOrDefault(s.getId(), List.of()),
                    i > 0 ? specimens.get(i - 1) : null, i < specimens.size() - 1 ? specimens.get(i + 1) : null);
            files.put(specimenPath(s.getId()) + "index.html", render(specimenTemplate, page));
        }
        return files;
    }

    /** Only these paths belong to the generated site; anything else in the repo (photos, README) is left alone. */
    public static boolean isGenerated(String path) {
        return !path.startsWith("photos/") && !path.equals("README.md");
    }

    static String specimenPath(Long id) {
        return "specimens/" + id + "/";
    }

    // ---- index ------------------------------------------------------------------------------------------------------

    record IndexPage(String root, String pageTitle, String pageDescription, List<String> intro, String countLabel,
                     long unidentifiedCount, boolean showIdentity, List<Card> cards, boolean hasCards) {}

    record Card(Long id, String name, String href, String image, String identity, boolean unidentified, String search) {}

    private IndexPage index(Content content) {
        boolean showIdentity = content.fields().contains(PublishField.IDENTITY);
        List<Card> cards = content.specimens().stream().map(s -> {
            List<SpecimenPhoto> photos = content.photos().getOrDefault(s.getId(), List.of());
            String identity = showIdentity ? identitySummary(s) : null;
            String marketName = content.fields().contains(PublishField.MARKET_NAME) ? s.getMarketName() : null;
            String tags = content.fields().contains(PublishField.TAGS) ? String.join(" ", s.getTags()) : null;
            String search = Stream.of("#" + s.getId(), s.getName(), marketName, identity, tags)
                    .filter(Objects::nonNull).collect(Collectors.joining(" ")).toLowerCase(Locale.ROOT);
            return new Card(s.getId(), s.getName(), specimenPath(s.getId()),
                    photos.isEmpty() ? null : photos.getFirst().getSmallFileName(),
                    identity, showIdentity && s.getComponents().isEmpty(), search);
        }).toList();
        long unidentified = content.specimens().stream().filter(s -> s.getComponents().isEmpty()).count();
        return new IndexPage("", "Rock Collection",
                "A personal collection of rocks, minerals and cabochons, many still waiting to be identified.",
                paragraphs(content.intro()), cards.size() == 1 ? "1 specimen" : cards.size() + " specimens",
                unidentified, showIdentity, cards, !cards.isEmpty());
    }

    /** E.g. "Quartz, Garnet (tentative)"; null for an unidentified specimen. */
    private static String identitySummary(Specimen s) {
        if (s.getComponents().isEmpty()) return null;
        return s.getComponents().stream()
                .map(c -> c.getMaterial().getName() + (c.getCertainty() == IdentificationCertainty.CONFIRMED ? ""
                        : " (" + SiteLabels.CERTAINTY.get(c.getCertainty()).toLowerCase(Locale.ROOT) + ")"))
                .collect(Collectors.joining(", "));
    }

    // ---- specimen page ----------------------------------------------------------------------------------------------

    record SpecimenPage(String root, String pageTitle, String pageDescription, Long id, String name, String marketName,
                        List<String> tags, boolean hasTags, List<PagePhoto> photos, boolean hasPhotos, boolean manyPhotos,
                        Identity identity, List<Section> sections, List<String> description, boolean hasDescription,
                        Neighbour prev, Neighbour next) {}

    record PagePhoto(String src, Integer width, Integer height, String alt, String caption, int number, boolean first) {}

    record Identity(boolean unidentified, List<IdentityComponent> components) {}

    record IdentityComponent(String name, String mindatUrl, String role, String certainty, boolean confirmed, String details) {}

    record Section(String slug, String title, List<Row> rows) {}

    record Row(String label, String value) {}

    record Neighbour(Long id, String name, String href) {}

    private SpecimenPage specimenPage(Specimen s, Set<PublishField> fields, List<SpecimenPhoto> photos, Specimen prev, Specimen next) {
        String root = "../../";
        Predicate<PublishField> on = fields::contains;

        List<PagePhoto> pagePhotos = new ArrayList<>();
        for (int i = 0; i < photos.size(); i++) {
            SpecimenPhoto p = photos.get(i);
            pagePhotos.add(new PagePhoto(root + p.getFileName(), p.getWidth(), p.getHeight(),
                    "%s, photo %d of %d".formatted(s.getName(), i + 1, photos.size()), p.getCaption(), i + 1, i == 0));
        }

        Identity identity = on.test(PublishField.IDENTITY)
                ? new Identity(s.getComponents().isEmpty(), s.getComponents().stream().map(SiteGenerator::component).toList())
                : null;

        List<Section> sections = Stream.of(
                section("What it is", Arrays.asList(
                        row(on.test(PublishField.FORM), "Form", label(SiteLabels.FORM, s.getForm())),
                        row(on.test(PublishField.NATURE), "Nature", label(SiteLabels.NATURE, s.getNature())),
                        row(on.test(PublishField.TREATMENT), "Treatment", s.getTreatmentNotes()),
                        row(on.test(PublishField.INCLUSIONS), "Unidentified inclusions", s.getInclusions()))),
                section("Appearance", Arrays.asList(
                        row(on.test(PublishField.COLOR), "Colour", join(", ", s.getColor(), s.getSecondaryColor())),
                        row(on.test(PublishField.LUSTER), "Luster", s.getLuster()),
                        row(on.test(PublishField.TRANSPARENCY), "Transparency", s.getTransparency()),
                        row(on.test(PublishField.OPTICAL_EFFECTS), "Optical effects",
                                labels(s.opticalEffectValues(), SiteLabels.OPTICAL_EFFECT)))),
                section("Physical properties", Arrays.asList(
                        row(on.test(PublishField.HARDNESS), "Hardness (Mohs)", hardness(s.getHardnessMin(), s.getHardnessMax())),
                        row(on.test(PublishField.STREAK), "Streak", s.getStreak()),
                        row(on.test(PublishField.SPECIFIC_GRAVITY), "Specific gravity", number(s.getSpecificGravity())),
                        row(on.test(PublishField.CLEAVAGE), "Cleavage", s.getCleavage()),
                        row(on.test(PublishField.FRACTURE), "Fracture", s.getFracture()),
                        row(on.test(PublishField.CRYSTAL_HABIT), "Crystal habit", s.getCrystalHabit()),
                        row(on.test(PublishField.SPECIAL_PROPERTIES), "Special properties",
                                labels(s.specialPropertyValues(), SiteLabels.SPECIAL_PROPERTY)),
                        row(on.test(PublishField.OTHER_OBSERVATIONS), "Other observations", s.getOtherObservations()))),
                section("Size & weight", Arrays.asList(
                        row(on.test(PublishField.WEIGHT), "Weight", s.getWeightG() == null ? null : number(s.getWeightG()) + " g"),
                        row(on.test(PublishField.SIZE), "Size", size(s.getLengthMm(), s.getWidthMm(), s.getHeightMm())))),
                section("Origin & acquisition", Arrays.asList(
                        row(on.test(PublishField.LOCALITY), "Locality", join(", ", s.getLocality(), s.getCountry())),
                        row(on.test(PublishField.ACQUISITION_TYPE), "Source", label(SiteLabels.ACQUISITION, s.getAcquisitionType())),
                        row(on.test(PublishField.ACQUIRED_FROM), "Where I got it", join(", ", s.getAcquiredFrom(), s.getAcquiredCountry())),
                        row(on.test(PublishField.ACQUIRED_DATE), "Acquired", date(s.getAcquiredYear(), s.getAcquiredMonth(), s.getAcquiredDay())),
                        row(on.test(PublishField.PRICE), "Price", s.getPrice() == null ? null
                                : join(" ", number(s.getPrice()), s.getCurrency())))))
                .filter(Objects::nonNull).toList();

        List<String> tags = on.test(PublishField.TAGS) ? List.copyOf(s.getTags()) : List.of();
        List<String> description = on.test(PublishField.DESCRIPTION) ? paragraphs(s.getDescription()) : List.of();
        String marketName = on.test(PublishField.MARKET_NAME) ? s.getMarketName() : null;
        return new SpecimenPage(root, "#%d %s · Rock Collection".formatted(s.getId(), s.getName()),
                "Specimen #%d: %s. Photos and observations, for help with identification.".formatted(s.getId(), s.getName()),
                s.getId(), s.getName(), marketName, tags, !tags.isEmpty(),
                pagePhotos, !pagePhotos.isEmpty(), pagePhotos.size() > 1,
                identity, sections, description, !description.isEmpty(),
                neighbour(prev), neighbour(next));
    }

    private static IdentityComponent component(SpecimenComponent c) {
        Material m = c.getMaterial();
        String details = Stream.of(SiteLabels.CATEGORY.get(m.getCategory()), label(SiteLabels.FAMILY, m.getFamily()),
                        m.getMineralGroup() == null ? null : m.getMineralGroup() + " group",
                        label(SiteLabels.CRYSTAL_SYSTEM, m.getCrystalSystem()), m.getFormula())
                .filter(Objects::nonNull).collect(Collectors.joining(" · "));
        // Only web links become links on the public page (no "javascript:" and the like)
        String link = m.getMindatUrl() != null && m.getMindatUrl().matches("(?i)https?://\\S+") ? m.getMindatUrl() : null;
        return new IdentityComponent(m.getName(), link, SiteLabels.ROLE.get(c.getRole()),
                SiteLabels.CERTAINTY.get(c.getCertainty()), c.getCertainty() == IdentificationCertainty.CONFIRMED, details);
    }

    private static Neighbour neighbour(Specimen s) {
        return s == null ? null : new Neighbour(s.getId(), s.getName(), "../" + s.getId() + "/");
    }

    /** A section without any published, filled-in rows is left out; {@code rows} holds nulls for the others. */
    private static Section section(String title, List<Row> rows) {
        List<Row> filled = rows.stream().filter(Objects::nonNull).toList();
        if (filled.isEmpty()) return null;
        return new Section(title.toLowerCase(Locale.ROOT).replaceAll("[^a-z]+", "-"), title, filled);
    }

    private static Row row(boolean published, String label, String value) {
        return published && value != null && !value.isBlank() ? new Row(label, value) : null;
    }

    // ---- formatting -------------------------------------------------------------------------------------------------

    private static <E extends Enum<E>> String label(Map<E, String> labels, E value) {
        return value == null ? null : labels.get(value);
    }

    private static <E extends Enum<E>> String labels(Set<E> values, Map<E, String> labels) {
        return values.isEmpty() ? null : values.stream().map(labels::get).collect(Collectors.joining(", "));
    }

    /** "2.65", not "2.650". */
    static String number(BigDecimal value) {
        return value == null ? null : value.stripTrailingZeros().toPlainString();
    }

    static String hardness(BigDecimal min, BigDecimal max) {
        if (min == null) return null;
        return min.compareTo(max) == 0 ? number(min) : number(min) + "–" + number(max);
    }

    static String size(BigDecimal l, BigDecimal w, BigDecimal h) {
        String dimensions = Stream.of(l, w, h).filter(Objects::nonNull).map(SiteGenerator::number).collect(Collectors.joining(" × "));
        return dimensions.isEmpty() ? null : dimensions + " mm";
    }

    /** "12 May 2024", "May 2024" or "2024". */
    static String date(Integer year, Integer month, Integer day) {
        String monthName = month == null ? null : Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        return join(" ", day == null ? null : day.toString(), monthName, year == null ? null : year.toString());
    }

    private static String join(String separator, String... parts) {
        String joined = Arrays.stream(parts).filter(p -> p != null && !p.isBlank()).collect(Collectors.joining(separator));
        return joined.isEmpty() ? null : joined;
    }

    /** Blank lines separate paragraphs. */
    static List<String> paragraphs(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.trim().split("\\R\\s*\\R")).map(String::trim).filter(p -> !p.isEmpty()).toList();
    }

    // ---- resources --------------------------------------------------------------------------------------------------

    private static byte[] render(Template template, Object model) {
        return template.execute(model).getBytes(StandardCharsets.UTF_8);
    }

    private static String text(String path) {
        return new String(bytes(path), StandardCharsets.UTF_8);
    }

    private static byte[] bytes(String path) {
        try (var in = new ClassPathResource(path).getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Missing site resource " + path, e);
        }
    }
}
